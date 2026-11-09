async function messageText(request,max){
 if(!request.headers.get('Content-Type')?.includes('application/json'))throw new Error('MESSAGE_INVALID');
 const raw=await limitedBody(request,10000);let data;try{data=JSON.parse(new TextDecoder().decode(raw))}catch{throw new Error('MESSAGE_INVALID')}
 const body=typeof data?.body==='string'?data.body.trim():'';
 if(!body||body.length>max)throw new Error('MESSAGE_INVALID');return body;
}
async function allowMessage(env,userId,kind){
 await env.DB.prepare('DELETE FROM auth_limits WHERE window_start<?').bind(Date.now()-3600000).run();
 const start=Math.floor(Date.now()/60000)*60000,key='messaging:'+kind+':'+userId+':'+start;
 await env.DB.prepare('INSERT INTO auth_limits (key,window_start,attempts) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key,start).run();
 return (await first(env.DB,'SELECT attempts FROM auth_limits WHERE key=?',key)).attempts<=(kind==='comment'?10:30);
}
function historyCursor(value){
 if(!value)return null;const match=/^(\d{1,16}):([a-z0-9-]{1,80})$/.exec(value);if(!match||!Number.isSafeInteger(Number(match[1])))throw new Error('MESSAGE_INVALID');return [Number(match[1]),match[2]];
}
async function participant(request,env,id){const user=await currentUser(request,env);if(!user)return{error:json({error:'AUTH_REQUIRED'},401)};const conversation=await first(env.DB,'SELECT c.*,a.title AS ad_title FROM conversations c JOIN ads a ON a.id=c.ad_id WHERE c.id=? AND (c.buyer_id=? OR c.seller_id=?)',id,user.id,user.id);return conversation?{user,conversation}:{error:json({error:'NOT_FOUND'},404)}}
async function messagingHandler(request,env,u){
 const commentRoute=/^\/api\/ads\/([a-z0-9-]+)\/comments(?:\/([a-z0-9-]+))?$/.exec(u.pathname);
 const startRoute=/^\/api\/ads\/([a-z0-9-]+)\/conversations$/.exec(u.pathname);
 const conversationRoute=/^\/api\/conversations\/([a-z0-9-]+)(?:\/(messages|read))?$/.exec(u.pathname);
 if(!commentRoute&&!startRoute&&!conversationRoute&&u.pathname!=='/api/conversations')return null;
 try{
  if(commentRoute){
   const [,adId,commentId]=commentRoute,ad=await first(env.DB,'SELECT id,owner_id FROM ads WHERE id=?',adId);if(!ad)return json({error:'NOT_FOUND'},404);
   if(request.method==='GET'&&!commentId){
    const user=await currentUser(request,env),before=historyCursor(u.searchParams.get('before'));
    const rows=(await env.DB.prepare('SELECT c.id,c.body,c.created_at,c.author_id,u.name AS author_name FROM ad_comments c JOIN users u ON u.id=c.author_id WHERE c.ad_id=?'+(before?' AND (c.created_at<? OR (c.created_at=? AND c.id<?))':'')+' ORDER BY c.created_at DESC,c.id DESC LIMIT 31').bind(adId,...(before?[before[0],before[0],before[1]]:[])).all()).results||[];
    const count=await first(env.DB,'SELECT COUNT(*) AS count FROM ad_comments WHERE ad_id=?',adId),page=rows.slice(0,30),last=page.at(-1);
    return json({comments:page.map(({author_id,...row})=>({...row,owned:!!user&&author_id===user.id,is_owner:author_id===ad.owner_id})),total:count.count,has_more:rows.length>30,next_cursor:rows.length>30?last.created_at+':'+last.id:null});
   }
   const user=await currentUser(request,env);if(!user)return json({error:'AUTH_REQUIRED'},401);
   if(request.method==='POST'&&!commentId){
    const body=await messageText(request,1000);if(!await allowMessage(env,user.id,'comment'))return json({error:'MESSAGE_RATE_LIMITED'},429);
    const id=crypto.randomUUID(),created_at=Date.now();await env.DB.prepare('INSERT INTO ad_comments (id,ad_id,author_id,body,created_at) VALUES (?,?,?,?,?)').bind(id,adId,user.id,body,created_at).run();
    return json({comment:{id,body,created_at,author_name:user.name,owned:true,is_owner:user.id===ad.owner_id}},201);
   }
   if(request.method==='DELETE'&&commentId){const r=await env.DB.prepare('DELETE FROM ad_comments WHERE id=? AND ad_id=? AND author_id=?').bind(commentId,adId,user.id).run();return r.meta?.changes?json({ok:true}):json({error:'FORBIDDEN'},403)}
   return json({error:'NOT_FOUND'},404);
  }
  if(startRoute){
   if(request.method!=='POST')return json({error:'NOT_FOUND'},404);
   const user=await currentUser(request,env);if(!user)return json({error:'AUTH_REQUIRED'},401);
   const ad=await first(env.DB,'SELECT id,owner_id FROM ads WHERE id=?',startRoute[1]);if(!ad)return json({error:'NOT_FOUND'},404);
   if(!ad.owner_id)return json({error:'OWNER_UNAVAILABLE'},409);if(ad.owner_id===user.id)return json({error:'SELF_MESSAGE'},400);
   const body=await messageText(request,2000);if(!await allowMessage(env,user.id,'chat'))return json({error:'MESSAGE_RATE_LIMITED'},429);
   const proposed=crypto.randomUUID(),now=Date.now();
   await env.DB.prepare('INSERT INTO conversations (id,ad_id,buyer_id,seller_id,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(ad_id,buyer_id) DO NOTHING').bind(proposed,ad.id,user.id,ad.owner_id,now,now).run();
   const c=await first(env.DB,'SELECT id FROM conversations WHERE ad_id=? AND buyer_id=? AND seller_id=?',ad.id,user.id,ad.owner_id);if(!c)return json({error:'NOT_FOUND'},404);
   await env.DB.prepare('INSERT INTO messages (id,conversation_id,author_id,body,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),c.id,user.id,body,now).run();
   await env.DB.prepare('UPDATE conversations SET updated_at=? WHERE id=?').bind(now,c.id).run();return json({conversation_id:c.id},201);
  }
  if(u.pathname==='/api/conversations'){
   if(request.method!=='GET')return json({error:'NOT_FOUND'},404);
   const user=await currentUser(request,env);if(!user)return json({error:'AUTH_REQUIRED'},401);
   const rows=(await env.DB.prepare(`SELECT c.id,c.ad_id,a.title AS ad_title,c.updated_at,CASE WHEN c.buyer_id=? THEN seller.name ELSE buyer.name END AS peer_name,(SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) AS last_message,(SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id AND m.author_id<>? AND m.read_at IS NULL) AS unread_count FROM conversations c JOIN ads a ON a.id=c.ad_id JOIN users buyer ON buyer.id=c.buyer_id JOIN users seller ON seller.id=c.seller_id WHERE c.buyer_id=? OR c.seller_id=? ORDER BY c.updated_at DESC,c.id DESC LIMIT 100`).bind(user.id,user.id,user.id,user.id).all()).results||[];
   return json({conversations:rows});
  }
  const access=await participant(request,env,conversationRoute[1]);if(access.error)return access.error;const {user,conversation:c}=access,action=conversationRoute[2];
  if(request.method==='GET'&&action==='messages'){
   const before=historyCursor(u.searchParams.get('before'));
   const rows=(await env.DB.prepare('SELECT m.id,m.body,m.created_at,m.read_at,m.author_id,u.name AS author_name FROM messages m JOIN users u ON u.id=m.author_id WHERE m.conversation_id=?'+(before?' AND (m.created_at<? OR (m.created_at=? AND m.id<?))':'')+' ORDER BY m.created_at DESC,m.id DESC LIMIT 51').bind(c.id,...(before?[before[0],before[0],before[1]]:[])).all()).results||[],page=rows.slice(0,50),oldest=page.at(-1);
   const peer=await first(env.DB,'SELECT name FROM users WHERE id=?',c.buyer_id===user.id?c.seller_id:c.buyer_id);
   return json({conversation:{id:c.id,ad_id:c.ad_id,ad_title:c.ad_title,peer_name:peer?.name||''},messages:page.reverse().map(({author_id,...m})=>({...m,mine:author_id===user.id})),has_more:rows.length>50,next_cursor:rows.length>50?oldest.created_at+':'+oldest.id:null});
  }
  if(request.method==='POST'&&action==='messages'){
   const body=await messageText(request,2000);if(!await allowMessage(env,user.id,'chat'))return json({error:'MESSAGE_RATE_LIMITED'},429);
   const id=crypto.randomUUID(),created_at=Date.now();await env.DB.prepare('INSERT INTO messages (id,conversation_id,author_id,body,created_at) VALUES (?,?,?,?,?)').bind(id,c.id,user.id,body,created_at).run();await env.DB.prepare('UPDATE conversations SET updated_at=? WHERE id=?').bind(created_at,c.id).run();
   return json({message:{id,body,created_at,read_at:null,author_name:user.name,mine:true}},201);
  }
  if(request.method==='POST'&&action==='read'){await env.DB.prepare('UPDATE messages SET read_at=? WHERE conversation_id=? AND author_id<>? AND read_at IS NULL').bind(Date.now(),c.id,user.id).run();return json({ok:true})}
  return json({error:'NOT_FOUND'},404);
 }catch(error){if(['MESSAGE_INVALID','UPLOAD_TOO_LARGE'].includes(error.message))return json({error:'MESSAGE_INVALID'},400);throw error}
}
