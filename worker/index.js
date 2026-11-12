// HTML, CSS and JS responses are embedded by scripts/build.mjs.
const assets = __ASSETS__;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function allowedSiteOrigin(request,env,u){
 const origin=request.headers.get('Origin');
 if(origin===u.origin)return true;
 return String(env.ALLOWED_FRONTEND_ORIGINS||'').split(',').map(x=>x.trim()).some(value=>{
  try{const candidate=new URL(value);return candidate.protocol==='https:'&&candidate.origin===value&&origin===value}catch{return false}
 });
}
const hash=async str=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const publicColumns='id,title,description,category,city,district,phone,lat,lng,created_at,street,house,owner_id,image_key,video_key,video_type,video_size';
const areaCache=new Map();
const tashkentAreas=__AREAS__;
const areaKey=v=>v.toLowerCase().replace(/[‘’ʻʼ`']/g,'').replace(/\b(tumani|tuman|district|rayon|shahri|shahar)\b/gi,'').replace(/\s+/g,' ').trim();

const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const randomToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const passwordHash=async(password,salt)=>{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256)))};
const safeEqual=(a,b)=>{if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0};
async function first(db,sql,...params){return (await db.prepare(sql).bind(...params).all()).results?.[0]||null}
function sessionToken(request){return (request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('rt_session='))?.slice(11)||''}
async function currentUser(request,env){const token=sessionToken(request);if(!/^[a-f0-9]{64}$/.test(token))return null;return first(env.DB,'SELECT users.id,users.name,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?',await hash(token),Date.now())}
function sessionCookie(token,u,clear=false){return 'rt_session='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+(clear?0:2592000)+(u.protocol==='https:'?'; Secure':'')}
function withCookie(data,cookie){const r=json(data);r.headers.set('Set-Cookie',cookie);return r}
async function createSession(user,env,u){const token=randomToken();await env.DB.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await hash(token),user.id,Date.now()+2592000000).run();return withCookie({user},sessionCookie(token,u))}
async function authHandler(request,env,u){
 if(u.pathname==='/api/auth/me'&&request.method==='GET')return json({user:await currentUser(request,env)});
 if(u.pathname==='/api/auth/logout'&&request.method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(sessionToken(request))).run();return withCookie({ok:true},sessionCookie('',u,true))}
 if(!['/api/auth/register','/api/auth/login'].includes(u.pathname)||request.method!=='POST')return null;
 if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'INVALID_REQUEST'},415);
 const raw=await request.text();if(raw.length>3000)return json({error:'INVALID_FIELDS'},400);let b;try{b=JSON.parse(raw)}catch{return json({error:'INVALID_FIELDS'},400)}
 const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200||password.length<8||password.length>128)return json({error:'INVALID_AUTH_FIELDS'},400);
 const windowStart=Math.floor(Date.now()/600000)*600000,key=await hash(email+'|'+(request.headers.get('CF-Connecting-IP')||'local')+'|'+windowStart);
 await env.DB.prepare('INSERT INTO auth_limits (key,window_start,attempts) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key,windowStart).run();
 const limit=await first(env.DB,'SELECT attempts FROM auth_limits WHERE key=?',key);if(limit.attempts>10)return json({error:'RATE_LIMITED'},429);
 await env.DB.prepare('DELETE FROM auth_limits WHERE window_start<? AND key NOT LIKE \'help:%\'').bind(Date.now()-3600000).run();
 let user=await first(env.DB,'SELECT * FROM users WHERE email=?',email);
 if(u.pathname==='/api/auth/register'){
  const name=String(b.name||'').trim();if(name.length<2||name.length>80)return json({error:'INVALID_AUTH_FIELDS'},400);if(user)return json({error:'EMAIL_EXISTS'},409);
  const salt=randomToken(),id=crypto.randomUUID(),digest=await passwordHash(password,salt);
  try{await env.DB.prepare('INSERT INTO users (id,name,email,password_hash,salt,created_at) VALUES (?,?,?,?,?,?)').bind(id,name,email,digest,salt,Date.now()).run()}catch(err){if(/unique/i.test(err.message))return json({error:'EMAIL_EXISTS'},409);throw err}
  return createSession({id,name,email},env,u);
 }
 const digest=await passwordHash(password,user?.salt||'invalid-user-salt');if(!user||!safeEqual(digest,user.password_hash))return json({error:'INVALID_CREDENTIALS'},401);
 return createSession({id:user.id,name:user.name,email:user.email},env,u);
}

async function limitedBody(request,max){const reader=request.body?.getReader();if(!reader)return new Uint8Array();let size=0;const chunks=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('UPLOAD_TOO_LARGE')}chunks.push(value)}const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}return body}
async function photoData(file){if(!file||typeof file.arrayBuffer!=='function'||!file.size)return null;if(file.size>5*1024*1024)throw new Error('UPLOAD_TOO_LARGE');const bytes=new Uint8Array(await file.arrayBuffer());let type,ext;if(file.type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255){type='image/jpeg';ext='jpg'}else if(file.type==='image/png'&&bytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){type='image/png';ext='png'}else if(file.type==='image/webp'&&bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'){type='image/webp';ext='webp'}else throw new Error('INVALID_PHOTO');return{bytes,type,ext}}
async function adPayload(request){const type=request.headers.get('Content-Type')||'';if(type.includes('multipart/form-data')){const raw=await limitedBody(request,6*1024*1024);const form=await new Response(raw,{headers:{'Content-Type':type}}).formData();const body=Object.fromEntries(form);body.lat=Number(body.lat);body.lng=Number(body.lng);return{body,photo:await photoData(form.get('photo'))}}if(!type.includes('application/json'))throw new Error('INVALID_REQUEST');const raw=await limitedBody(request,12000);try{return{body:JSON.parse(new TextDecoder().decode(raw)),photo:null}}catch{throw new Error('INVALID_FIELDS')}}
function imageUrl(id,key){return key?'/api/ads/'+id+'/image?v='+encodeURIComponent(key.split('/').pop()):null}
const MAX_VIDEO=1_000_000_000,VIDEO_CHUNK=8*1024*1024;
function videoUrl(id,key){return key?'/api/ads/'+id+'/video?v='+encodeURIComponent(key.split('/').pop()):null}
async function smallJson(request){const raw=await limitedBody(request,2000);try{return JSON.parse(new TextDecoder().decode(raw))}catch{throw new Error('INVALID_FIELDS')}}
async function cleanupVideoUploads(env,rows){for(const row of rows){if(row.status==='uploading')try{await env.BUCKET.resumeMultipartUpload(row.storage_key,row.r2_id).abort()}catch{}await env.DB.prepare('DELETE FROM video_uploads WHERE id=?').bind(row.id).run()}}
async function videoHandler(request,env,u){
 const match=u.pathname.match(/^\/api\/ads\/([a-z0-9-]+)\/video(?:\/uploads(?:\/([a-z0-9-]+)(?:\/(part|complete))?)?)?$/);if(!match)return null;
 const [,adId,uploadId,action]=match,ad=await first(env.DB,'SELECT owner_id,video_key,video_type,video_size FROM ads WHERE id=?',adId);if(!ad)return json({error:'NOT_FOUND'},404);
 if(!env.BUCKET)return json({error:'UPLOAD_UNAVAILABLE'},503);
 if(u.pathname.endsWith('/video')&&['GET','HEAD'].includes(request.method)){
  if(!ad.video_key)return json({error:'NOT_FOUND'},404);const size=ad.video_size;let offset=0,length=size,status=200;const range=request.headers.get('Range');
  if(range){const m=range.match(/^bytes=(\d*)-(\d*)$/);if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});if(!m[1]){length=Math.min(size,Number(m[2]));offset=size-length}else{offset=Number(m[1]);const end=m[2]?Math.min(size-1,Number(m[2])):size-1;length=end-offset+1}if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||offset>=size||length<=0)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});status=206}
  const headers={'Content-Type':ad.video_type,'Content-Length':String(length),'Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'};if(status===206)headers['Content-Range']=`bytes ${offset}-${offset+length-1}/${size}`;if(request.method==='HEAD')return new Response(null,{status,headers});
  const object=await env.BUCKET.get(ad.video_key,status===206?{range:{offset,length}}:undefined);if(!object)return json({error:'NOT_FOUND'},404);return new Response(object.body,{status,headers});
 }
 const user=await currentUser(request,env);if(!user)return json({error:'AUTH_REQUIRED'},401);if(ad.owner_id!==user.id)return json({error:'FORBIDDEN'},403);
 if(u.pathname.endsWith('/video/uploads')&&request.method==='POST'){
  let b;try{b=await smallJson(request)}catch{return json({error:'INVALID_FIELDS'},400)}
  if(!Number.isSafeInteger(b.size)||b.size<12||b.size>MAX_VIDEO)return json({error:'VIDEO_TOO_LARGE'},413);if(!['video/mp4','video/webm'].includes(b.type))return json({error:'INVALID_VIDEO'},400);
  const stale=(await env.DB.prepare('SELECT * FROM video_uploads WHERE owner_id=? AND (ad_id=? OR expires_at<?) LIMIT 20').bind(user.id,adId,Date.now()).all()).results||[];await cleanupVideoUploads(env,stale);
  const id=crypto.randomUUID(),key='ads/'+adId+'/'+crypto.randomUUID()+(b.type==='video/webm'?'.webm':'.mp4'),upload=await env.BUCKET.createMultipartUpload(key,{httpMetadata:{contentType:b.type}});
  try{await env.DB.prepare('INSERT INTO video_uploads (id,ad_id,owner_id,storage_key,r2_id,mime,size,received,parts,status,expires_at) VALUES (?,?,?,?,?,?,?,0,?,?,?)').bind(id,adId,user.id,key,upload.uploadId,b.type,b.size,'[]','uploading',Date.now()+86400000).run()}catch(err){await upload.abort();throw err}return json({id,chunk_size:VIDEO_CHUNK,received:0},201);
 }
 if(!uploadId)return json({error:'NOT_FOUND'},404);
 const upload=await first(env.DB,'SELECT * FROM video_uploads WHERE id=? AND ad_id=? AND owner_id=?',uploadId,adId,user.id);if(!upload)return json({error:'NOT_FOUND'},404);
 if(request.method==='DELETE'&&!action){await cleanupVideoUploads(env,[upload]);return json({ok:true})}
 if(upload.expires_at<Date.now())return json({error:'UPLOAD_EXPIRED'},410);
 if(request.method==='GET'&&!action)return json({id:upload.id,received:upload.received,chunk_size:VIDEO_CHUNK,status:upload.status});
 if(action==='part'&&request.method==='PUT'){
  if(upload.status!=='uploading')return json({error:'UPLOAD_CLOSED'},409);const n=Number(u.searchParams.get('number')),parts=JSON.parse(upload.parts);if(!Number.isInteger(n)||n<1||n>Math.ceil(upload.size/VIDEO_CHUNK))return json({error:'INVALID_PART'},400);
  if(n<=parts.length)return json({received:Math.min(n*VIDEO_CHUNK,upload.size),part:n});if(n!==parts.length+1)return json({error:'INVALID_PART_ORDER'},409);
  const expected=Math.min(VIDEO_CHUNK,upload.size-upload.received);let bytes;try{bytes=await limitedBody(request,VIDEO_CHUNK)}catch{return json({error:'UPLOAD_TOO_LARGE'},413)}if(bytes.length!==expected)return json({error:'INVALID_PART_SIZE'},400);
  if(n===1){const valid=upload.mime==='video/mp4'?String.fromCharCode(...bytes.slice(4,8))==='ftyp':[26,69,223,163].every((v,i)=>bytes[i]===v);if(!valid)return json({error:'INVALID_VIDEO'},400)}
  const part=await env.BUCKET.resumeMultipartUpload(upload.storage_key,upload.r2_id).uploadPart(n,bytes);parts.push(part);const received=upload.received+bytes.length;
  const updated=await env.DB.prepare('UPDATE video_uploads SET parts=?,received=? WHERE id=? AND received=? AND status=?').bind(JSON.stringify(parts),received,upload.id,upload.received,'uploading').run();if(!updated.meta.changes)return json({error:'UPLOAD_CONFLICT'},409);return json({received,part:n});
 }
 if(action==='complete'&&request.method==='POST'){
  if(upload.status==='completed')return json({video_url:videoUrl(adId,upload.storage_key)});if(upload.received!==upload.size)return json({error:'UPLOAD_INCOMPLETE'},409);
  try{await env.BUCKET.resumeMultipartUpload(upload.storage_key,upload.r2_id).complete(JSON.parse(upload.parts))}catch(err){const object=await env.BUCKET.head(upload.storage_key);if(!object||object.size!==upload.size)throw err}
  const updated=await env.DB.prepare('UPDATE ads SET video_key=?,video_type=?,video_size=? WHERE id=? AND owner_id=?').bind(upload.storage_key,upload.mime,upload.size,adId,user.id).run();if(!updated.meta.changes){await env.BUCKET.delete(upload.storage_key);return json({error:'NOT_FOUND'},404)}
  await env.DB.prepare('UPDATE video_uploads SET status=? WHERE id=?').bind('completed',upload.id).run();if(ad.video_key&&ad.video_key!==upload.storage_key)await env.BUCKET.delete(ad.video_key);return json({video_url:videoUrl(adId,upload.storage_key)});
 }
 return json({error:'NOT_FOUND'},404);
}

__MESSAGING__
__ADMIN__
__HELP__

export default {async fetch(request,env){
 const u=new URL(request.url);
 try {
  if(u.pathname.startsWith('/api/')){
   if(u.pathname==='/api/maps/config'&&request.method==='GET')return json({google_maps_key:typeof env.GOOGLE_MAPS_API_KEY==='string'?env.GOOGLE_MAPS_API_KEY.trim():''});
   if(request.method==='GET'&&u.pathname==='/api/geocode'){
    const city=(u.searchParams.get('city')||'').trim();
    const district=(u.searchParams.get('district')||'').trim(),street=(u.searchParams.get('street')||'').trim(),house=(u.searchParams.get('house')||'').trim();
    if(city.length<2||city.length>80||district.length>80||street.length>150||house.length>30)return json({error:'INVALID_FIELDS'},400);
    const key=[city,district,street,house].map(v=>v.toLowerCase()).join('|');
    if(!street&&['toshkent','tashkent','ташкент'].includes(areaKey(city))){const local=Object.entries(tashkentAreas).find(([name])=>areaKey(name)===areaKey(district));if(local)return json({...local[1],attribution:'© OpenStreetMap contributors'})}
    const cached=areaCache.get(key);if(cached&&Date.now()-cached.time<86400000)return json(cached.value);
    const cleanCity=city.replace(/\b(shahri|shahar|viloyati|viloyat)\b/gi,'').trim();
    const cleanDistrict=district.replace(/\b(tumani|tuman|district|rayon)\b/gi,'').trim();
    const q=[street?[street,house].filter(Boolean).join(' '):'',cleanDistrict?cleanDistrict+' tumani':'',cleanCity,'Uzbekistan'].filter(Boolean).join(', ');
    const remote=new URL('https://photon.komoot.io/api/');remote.searchParams.set('q',q);remote.searchParams.set('limit',street?'6':'3');remote.searchParams.set('lang','en');
    const biasLat=Number(u.searchParams.get('lat')),biasLng=Number(u.searchParams.get('lng'));
    if(u.searchParams.has('lat')&&Number.isFinite(biasLat)&&Number.isFinite(biasLng)&&biasLat>37&&biasLat<46&&biasLng>55&&biasLng<74){remote.searchParams.set('lat',String(biasLat));remote.searchParams.set('lon',String(biasLng));remote.searchParams.set('bbox',[biasLng-.3,biasLat-.3,biasLng+.3,biasLat+.3].join(','))}
    let response;try{response=await fetch(remote,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}})}catch{return json({error:'GEOCODE_UNAVAILABLE'},503)}
    if(!response.ok)return json({error:'GEOCODE_UNAVAILABLE'},503);
    const body=await response.json();
    const features=(body.features||[]).filter(f=>f.properties?.countrycode?.toUpperCase()==='UZ'&&f.geometry?.type==='Point');
    const isDistrict=f=>['district','county'].includes(f.properties?.type)||/district|tumani|район/i.test(f.properties?.name||'');
    const roadKey=v=>areaKey(v).replace(/ko‘chasi|ko'chasi|koʻchasi|kochasi|kocha|street|avenue|улица|проспект|koʻcha/gi,'').replace(/[^\p{L}\p{N}]/gu,'').replace(/timur/g,'temur');
    const streetRows=features.filter(f=>f.properties?.type==='street'||f.properties?.osm_key==='highway'||f.properties?.street);
    const exactHouse=street&&house?streetRows.find(f=>areaKey(f.properties.housenumber||'')===areaKey(house)&&roadKey(f.properties.street||f.properties.name||'').includes(roadKey(street))):null;
    const preferred=street?(exactHouse||streetRows.find(f=>f.properties?.type==='street'||f.properties?.osm_key==='highway')||streetRows[0]):district?features.find(isDistrict):features.find(f=>['city','county','state','locality'].includes(f.properties?.type))||features.find(f=>f.properties?.osm_key==='place');
    if(!preferred)return json({error:'AREA_NOT_FOUND'},404);
    const [lng,lat]=preferred.geometry.coordinates;
    const value={lat,lng,name:preferred.properties.name||district||city,attribution:'© OpenStreetMap contributors',zoom:exactHouse?18:street?16:district?13:11,precision:exactHouse?'house':street?'street':'area'};
    if(areaCache.size>=128)areaCache.delete(areaCache.keys().next().value);areaCache.set(key,{time:Date.now(),value});return json(value);
   }
   const helpResponse=await helpHandler(request,env,u);if(helpResponse)return helpResponse;
   if(!env.DB)return json({error:'DATABASE_UNAVAILABLE'},503);
   const origin=request.headers.get('Origin');if(!['GET','HEAD'].includes(request.method)&&origin&&!allowedSiteOrigin(request,env,u))return json({error:'INVALID_ORIGIN'},403);
   if(u.pathname.startsWith('/api/auth/')){const result=await authHandler(request,env,u);return result||json({error:'NOT_FOUND'},404)}
   const adminResponse=await adminHandler(request,env,u);if(adminResponse)return adminResponse;
   const messageResponse=await messagingHandler(request,env,u);if(messageResponse)return messageResponse;
   const videoResponse=await videoHandler(request,env,u);if(videoResponse)return videoResponse;
   if(request.method==='GET'&&u.pathname==='/api/ads'){
    const user=await currentUser(request,env);const result=await env.DB.prepare(`SELECT ${publicColumns} FROM ads ORDER BY created_at DESC LIMIT 200`).all();return json({ads:(result.results||[]).map(({owner_id,image_key,video_key,video_type,video_size,...ad})=>({...ad,image_url:imageUrl(ad.id,image_key),video_url:videoUrl(ad.id,video_key),video_type,video_size,owned:!!user&&owner_id===user.id,can_message:!!owner_id}))});
   }

   if(/^\/api\/ads\/[a-z0-9-]+\/image$/.test(u.pathname)){
    const id=u.pathname.split('/')[3],record=await first(env.DB,'SELECT image_key,owner_id FROM ads WHERE id=?',id);
    if(!record)return json({error:'NOT_FOUND'},404);
    if(request.method==='GET'||request.method==='HEAD'){
     if(!record.image_key||!env.BUCKET)return json({error:'NOT_FOUND'},404);const object=await env.BUCKET.get(record.image_key);if(!object)return json({error:'NOT_FOUND'},404);
     return new Response(request.method==='HEAD'?null:object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
    }
    if(request.method==='POST'){
     const user=await currentUser(request,env);if(!user)return json({error:'AUTH_REQUIRED'},401);if(record.owner_id!==user.id)return json({error:'FORBIDDEN'},403);if(!env.BUCKET)return json({error:'UPLOAD_UNAVAILABLE'},503);
     let payload;try{payload=await adPayload(request)}catch(err){return json({error:err.message},err.message==='UPLOAD_TOO_LARGE'?413:400)}if(!payload.photo)return json({error:'INVALID_PHOTO'},400);
     const image=payload.photo,key='ads/'+id+'/'+crypto.randomUUID()+'.'+image.ext;await env.BUCKET.put(key,image.bytes,{httpMetadata:{contentType:image.type}});
     try{await env.DB.prepare('UPDATE ads SET image_key=? WHERE id=? AND owner_id=?').bind(key,id,user.id).run()}catch(err){await env.BUCKET.delete(key);throw err}
     if(record.image_key)await env.BUCKET.delete(record.image_key);return json({image_url:imageUrl(id,key)});
    }
    return json({error:'NOT_FOUND'},404);
   }
   if(request.method==='POST'&&u.pathname==='/api/ads'){
    const user=await currentUser(request,env);if(!user)return json({error:'AUTH_REQUIRED'},401);
    let payload;try{payload=await adPayload(request)}catch(err){return json({error:err.message},err.message==='UPLOAD_TOO_LARGE'?413:400)}const body=payload.body;
    const values={};for(const [key,min,max]of [['title',3,100],['description',10,3000],['city',2,80],['district',2,80]]){const v=String(body[key]||'').trim();if(v.length<min||v.length>max)return json({error:'INVALID_FIELDS'},400);values[key]=v}
    for(const [key,max]of [['street',150],['house',30]]){const v=String(body[key]||'').trim();if(v.length>max)return json({error:'INVALID_FIELDS'},400);values[key]=v}
    if(values.street.length<3)return json({error:'INVALID_FIELDS'},400);
    if(!['it','design','marketing','education','home','business'].includes(body.category))return json({error:'INVALID_FIELDS'},400);
    const phone=String(body.phone||'').replace(/[\s()-]/g,'');if(!/^\+998\d{9}$/.test(phone))return json({error:'INVALID_PHONE'},400);
    if(typeof body.lat!=='number'||typeof body.lng!=='number'||!Number.isFinite(body.lat)||!Number.isFinite(body.lng)||body.lat< -85||body.lat>85||body.lng< -180||body.lng>180)return json({error:'INVALID_LOCATION'},400);
    const ad={id:crypto.randomUUID(),...values,category:body.category,phone,lat:body.lat,lng:body.lng,created_at:Date.now()};const deleteToken=crypto.randomUUID()+crypto.randomUUID();
    let imageKey=null;if(payload.photo){if(!env.BUCKET)return json({error:'UPLOAD_UNAVAILABLE'},503);imageKey='ads/'+ad.id+'/'+crypto.randomUUID()+'.'+payload.photo.ext;await env.BUCKET.put(imageKey,payload.photo.bytes,{httpMetadata:{contentType:payload.photo.type}})}
    try{await env.DB.prepare('INSERT INTO ads (id,title,description,category,city,district,phone,lat,lng,created_at,delete_hash,street,house,owner_id,image_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(ad.id,ad.title,ad.description,ad.category,ad.city,ad.district,ad.phone,ad.lat,ad.lng,ad.created_at,await hash(deleteToken),ad.street,ad.house,user.id,imageKey).run()}catch(err){if(imageKey)await env.BUCKET.delete(imageKey);throw err}return json({ad:{...ad,image_url:imageUrl(ad.id,imageKey),owned:true}},201);
   }
   if(request.method==='DELETE'&&/^\/api\/ads\/[a-z0-9-]+$/.test(u.pathname)){
    const id=u.pathname.split('/').pop(),existing=await first(env.DB,'SELECT image_key,video_key FROM ads WHERE id=?',id),user=await currentUser(request,env),token=request.headers.get('X-Delete-Token')||'';let r;if(user)r=await env.DB.prepare('DELETE FROM ads WHERE id=? AND owner_id=?').bind(id,user.id).run();if(!r?.meta?.changes&&token&&token.length<=200)r=await env.DB.prepare('DELETE FROM ads WHERE id=? AND owner_id IS NULL AND delete_hash=?').bind(id,await hash(token)).run();if(r?.meta?.changes){if(env.BUCKET){if(existing?.video_key)await env.BUCKET.delete(existing.video_key);const uploads=(await env.DB.prepare('SELECT * FROM video_uploads WHERE ad_id=?').bind(id).all()).results||[];await cleanupVideoUploads(env,uploads)}if(existing?.image_key&&env.BUCKET)await env.BUCKET.delete(existing.image_key);return json({ok:true})}return json({error:'FORBIDDEN'},403);
   }
   return json({error:'NOT_FOUND'},404);
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  if(u.pathname==='/admin/')return Response.redirect(u.origin+'/admin',302);
  const asset=assets[['/','/admin','/admin/'].includes(u.pathname)?'/index.html':u.pathname];if(!asset)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-cache'}});
 }catch(err){console.error('Request failed',err?.message);return json({error:'SERVER_ERROR'},500)}
}};
