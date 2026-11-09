async function adminRecord(env,userId){return first(env.DB,"SELECT user_id FROM site_admin WHERE id='primary' AND user_id=?",userId)}
function adminAuditStatement(env,actor,action,target,detail){return env.DB.prepare('INSERT INTO admin_audit (id,actor_id,action,target_id,detail,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,target,String(detail).slice(0,250),Date.now())}
async function adminAudit(env,...args){await adminAuditStatement(env,...args).run()}
async function adminHandler(request,env,u){
 if(!u.pathname.startsWith('/api/admin/'))return null;
 const user=await currentUser(request,env);if(!user)return json({error:'AUTH_REQUIRED'},401);
 const isAdmin=!!await adminRecord(env,user.id),primary=await first(env.DB,"SELECT id FROM site_admin WHERE id='primary'");
 if(u.pathname==='/api/admin/session'&&request.method==='GET')return json({is_admin:isAdmin,claimed:!!primary,setup_available:!primary&&!!env.ADMIN_SETUP_TOKEN_HASH});
 if(u.pathname==='/api/admin/claim'&&request.method==='POST'){
  if(primary)return json({error:'ADMIN_ALREADY_CLAIMED'},409);
  if(!env.ADMIN_SETUP_TOKEN_HASH)return json({error:'ADMIN_SETUP_UNAVAILABLE'},503);
  const start=Math.floor(Date.now()/600000)*600000,key='admin-setup:'+await hash((request.headers.get('CF-Connecting-IP')||'local')+'|'+start);
  await env.DB.prepare('INSERT INTO auth_limits (key,window_start,attempts) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key,start).run();
  if((await first(env.DB,'SELECT attempts FROM auth_limits WHERE key=?',key)).attempts>5)return json({error:'RATE_LIMITED'},429);
  let body;try{if(!request.headers.get('Content-Type')?.includes('application/json'))throw Error();body=await smallJson(request)}catch{return json({error:'INVALID_SETUP_CODE'},400)}
  const token=typeof body.token==='string'?body.token.trim():'';if(token.length<20||token.length>160||!safeEqual(await hash(token),env.ADMIN_SETUP_TOKEN_HASH))return json({error:'INVALID_SETUP_CODE'},403);
  const result=await env.DB.prepare("INSERT INTO site_admin (id,user_id,created_at) VALUES ('primary',?,?) ON CONFLICT(id) DO NOTHING").bind(user.id,Date.now()).run();
  if(!result.meta?.changes)return json({error:'ADMIN_ALREADY_CLAIMED'},409);
  await adminAudit(env,user.id,'admin_claimed',user.id,user.name);return json({ok:true,is_admin:true});
 }
 if(!isAdmin)return json({error:'ADMIN_REQUIRED'},403);
 if(request.method==='GET'&&u.pathname==='/api/admin/stats'){
  const stats=await first(env.DB,`SELECT (SELECT COUNT(*) FROM ads) AS ads,(SELECT COUNT(*) FROM users) AS users,(SELECT COUNT(*) FROM ad_comments) AS comments,(SELECT COUNT(*) FROM conversations) AS conversations,(SELECT COUNT(*) FROM ads WHERE created_at>=?) AS new_ads,(SELECT COALESCE(SUM(video_size),0) FROM ads) AS video_bytes`,Date.now()-7*86400000);
  const categoryRows=(await env.DB.prepare('SELECT category,COUNT(*) AS count FROM ads GROUP BY category ORDER BY count DESC').all()).results||[];
  return json({stats,categories:categoryRows});
 }
 const kind=u.pathname.split('/')[3],offset=Number(u.searchParams.get('offset')||0),q=(u.searchParams.get('q')||'').trim();
 if(request.method==='GET'&&['ads','users','comments','audit'].includes(kind)&&u.pathname==='/api/admin/'+kind){
  if(!Number.isSafeInteger(offset)||offset<0||offset>1000000||q.length>100)return json({error:'INVALID_FIELDS'},400);
  const like='%'+q.replace(/[\\%_]/g,'\\$&')+'%';let sql,args,countSql;
  if(kind==='ads'){sql="SELECT a.id,a.title,a.description,a.category,a.city,a.district,a.phone,a.created_at,a.image_key,a.video_key,u.name AS owner_name FROM ads a LEFT JOIN users u ON u.id=a.owner_id WHERE (a.title LIKE ? ESCAPE '\\' OR a.city LIKE ? ESCAPE '\\')";args=[like,like];countSql="SELECT COUNT(*) AS total FROM ads a WHERE (a.title LIKE ? ESCAPE '\\' OR a.city LIKE ? ESCAPE '\\')"}
  if(kind==='users'){sql="SELECT u.id,u.name,u.email,u.created_at,(SELECT COUNT(*) FROM ads a WHERE a.owner_id=u.id) AS ads_count,CASE WHEN EXISTS(SELECT 1 FROM site_admin sa WHERE sa.user_id=u.id) THEN 1 ELSE 0 END AS is_admin FROM users u WHERE (u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')";args=[like,like];countSql="SELECT COUNT(*) AS total FROM users u WHERE (u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')"}
  if(kind==='comments'){sql="SELECT c.id,c.ad_id,c.body,c.created_at,u.name AS author_name,a.title AS ad_title FROM ad_comments c JOIN users u ON u.id=c.author_id JOIN ads a ON a.id=c.ad_id WHERE c.body LIKE ? ESCAPE '\\'";args=[like];countSql="SELECT COUNT(*) AS total FROM ad_comments c JOIN users u ON u.id=c.author_id JOIN ads a ON a.id=c.ad_id WHERE c.body LIKE ? ESCAPE '\\'"}
  if(kind==='audit'){sql="SELECT l.id,l.action,l.target_id,l.detail,l.created_at,u.name AS actor_name FROM admin_audit l LEFT JOIN users u ON u.id=l.actor_id WHERE l.detail LIKE ? ESCAPE '\\'";args=[like];countSql="SELECT COUNT(*) AS total FROM admin_audit l WHERE l.detail LIKE ? ESCAPE '\\'"}
  const alias={ads:'a',users:'u',comments:'c',audit:'l'}[kind];const rows=(await env.DB.prepare(sql+' ORDER BY '+alias+'.created_at DESC,'+alias+'.id DESC LIMIT 25 OFFSET ?').bind(...args,offset).all()).results||[];
  const count=await first(env.DB,countSql,...args);
  return json({items:rows.map(row=>{if(kind!=='ads')return row;const {image_key,video_key,...a}=row;return{...a,image_url:imageUrl(a.id,image_key),has_video:!!video_key}}),total:count.total,offset,has_more:offset+rows.length<count.total});
 }
 const deletion=/^\/api\/admin\/(ads|comments)\/([a-z0-9-]+)$/.exec(u.pathname);
 if(deletion&&request.method==='DELETE'){
  const [,type,id]=deletion;
  if(type==='comments'){const record=await first(env.DB,'SELECT body FROM ad_comments WHERE id=?',id);if(!record)return json({error:'NOT_FOUND'},404);await env.DB.batch([adminAuditStatement(env,user.id,'comment_deleted',id,record.body),env.DB.prepare('DELETE FROM ad_comments WHERE id=?').bind(id)]);return json({ok:true})}
  const record=await first(env.DB,'SELECT title,image_key,video_key FROM ads WHERE id=?',id);if(!record)return json({error:'NOT_FOUND'},404);
  const uploads=(await env.DB.prepare('SELECT * FROM video_uploads WHERE ad_id=?').bind(id).all()).results||[];
  await env.DB.batch([adminAuditStatement(env,user.id,'ad_deleted',id,record.title),env.DB.prepare('DELETE FROM ads WHERE id=?').bind(id)]);
  if(env.BUCKET){await cleanupVideoUploads(env,uploads);for(const key of [record.image_key,record.video_key])if(key)await env.BUCKET.delete(key)}
  return json({ok:true});
 }
 return json({error:'NOT_FOUND'},404);
}
