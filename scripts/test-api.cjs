const fs=require('fs'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
(async()=>{
 const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
 const DB={prepare(sql){return{args:[],bind(...args){this.args=args;return this},async all(){return{results:db.prepare(sql).all(...this.args)}},async run(){const r=db.prepare(sql).run(...this.args);return{meta:{changes:Number(r.changes)}}}}}};
 const files=new Map(),multipart=new Map();
 const BUCKET={async put(key,bytes,options){files.set(key,{body:new Uint8Array(bytes),httpMetadata:options.httpMetadata,size:bytes.byteLength})},async head(key){return files.get(key)||null},async get(key,options){const file=files.get(key);if(!file)return null;return options?.range?{...file,body:file.body.slice(options.range.offset,options.range.offset+options.range.length)}:file},async delete(key){files.delete(key)},async createMultipartUpload(key,options){const uploadId=crypto.randomUUID();multipart.set(uploadId,{key,options,parts:new Map()});return this.resumeMultipartUpload(key,uploadId)},resumeMultipartUpload(key,uploadId){return{key,uploadId,async uploadPart(n,bytes){const u=multipart.get(uploadId);assert.equal(u.key,key);u.parts.set(n,new Uint8Array(bytes));return{partNumber:n,etag:'etag-'+n}},async complete(parts){const u=multipart.get(uploadId);if(!u)throw new Error('UPLOAD_MISSING');assert.equal(u.key,key);const body=Buffer.concat(parts.map(p=>Buffer.from(u.parts.get(p.partNumber))));files.set(key,{body,httpMetadata:u.options.httpMetadata,size:body.length});multipart.delete(uploadId);return{key,size:body.length}},async abort(){multipart.delete(uploadId)}}}};
 const {default:worker}=await import('data:text/javascript;base64,'+fs.readFileSync('dist/server/index.js').toString('base64'));
 async function call(path,method='GET',body,cookie=''){const response=await worker.fetch(new Request('https://local.test/api/'+path,{method,headers:{...(!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})}),{DB,BUCKET});return{status:response.status,body:await response.json(),cookie:response.headers.get('Set-Cookie')?.split(';')[0],headers:response.headers}}
 const alice={name:'Alice Test',email:'alice@example.test',password:'local-test-password-123'};const bob={name:'Bob Test',email:'bob@example.test',password:'local-other-password-456'};
 let r=await call('auth/register','POST',alice);assert.equal(r.status,200);const aliceCookie=r.cookie;assert(r.headers.get('Set-Cookie').includes('HttpOnly'));assert(r.headers.get('Set-Cookie').includes('Secure'));assert(!JSON.stringify(r.body).includes('password'));const record=db.prepare('SELECT password_hash,salt FROM users WHERE email=?').get(alice.email);assert.notEqual(record.password_hash,alice.password);assert(record.salt.length===64);
 assert.equal((await call('auth/me','GET',null,aliceCookie)).body.user.email,alice.email);assert.equal((await call('auth/me')).body.user,null);
 assert.equal((await call('auth/register','POST',alice)).status,409);assert.equal((await call('auth/login','POST',{email:alice.email,password:'incorrect-password'})).status,401);
 const ad={title:'Test ad',description:'A detailed ad for local validation.',category:'it',city:'Toshkent shahri',district:'Yunusobod',street:'Amir Temur ko‘chasi',house:'12A',phone:'+998000000000',lat:41.36,lng:69.28};
 assert.equal((await call('ads','POST',ad)).status,401);r=await call('ads','POST',ad,aliceCookie);assert.equal(r.status,201);const id=r.body.ad.id;assert(r.body.ad.owned);assert.equal(r.body.ad.street,ad.street);assert.equal(r.body.ad.house,'12A');
 const publicList=(await call('ads')).body.ads;assert.equal(publicList.find(a=>a.id===id).owned,false);assert(!('owner_id'in publicList[0]));assert(!('delete_hash'in publicList[0]));
 const secondLogin=await call('auth/login','POST',{email:alice.email,password:alice.password});assert.equal(secondLogin.status,200);assert((await call('ads','GET',null,secondLogin.cookie)).body.ads.find(a=>a.id===id).owned);
 const bobCookie=(await call('auth/register','POST',bob)).cookie;assert.equal((await call('ads/'+id,'DELETE',null,bobCookie)).status,403);assert.equal((await call('ads/'+id,'DELETE')).status,403);
 assert.equal((await call('ads','POST',{...ad,phone:'bad'},aliceCookie)).status,400);assert.equal((await call('ads','POST',{...ad,lat:999},aliceCookie)).status,400);

 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQ0AAAAASUVORK5CYII=','base64');
 const photoForm=()=>{const f=new FormData();for(const [k,v]of Object.entries(ad))f.set(k,String(v));f.set('photo',new Blob([png],{type:'image/png'}),'photo.png');return f};
 const created=await call('ads','POST',photoForm(),aliceCookie);assert.equal(created.status,201);assert(created.body.ad.image_url);assert.equal(files.size,1);const photoId=created.body.ad.id;
 const image=await worker.fetch(new Request('https://local.test'+created.body.ad.image_url),{DB,BUCKET});assert.equal(image.status,200);assert.equal(image.headers.get('Content-Type'),'image/png');assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
 assert.equal((await call('ads/'+photoId+'/image','POST',photoForm(),bobCookie)).status,403);
 const replaced=await call('ads/'+photoId+'/image','POST',photoForm(),aliceCookie);assert.equal(replaced.status,200);assert.notEqual(replaced.body.image_url,created.body.ad.image_url);assert.equal(files.size,1);
 const invalid=photoForm();invalid.set('photo',new Blob(['<svg></svg>'],{type:'image/svg+xml'}),'invalid.svg');assert.equal((await call('ads','POST',invalid,aliceCookie)).status,400);
 const large=photoForm();large.set('photo',new Blob([new Uint8Array(5*1024*1024+1)],{type:'image/jpeg'}),'large.jpg');assert.equal((await call('ads','POST',large,aliceCookie)).status,413);
 assert.equal((await call('ads/'+photoId,'DELETE',null,aliceCookie)).status,200);assert.equal(files.size,0);assert.equal((await worker.fetch(new Request('https://local.test'+replaced.body.image_url),{DB,BUCKET})).status,404);
 // Multipart video: the boundary uses decimal GB; no 1 GB allocation is needed to verify it.
 const CHUNK=8*1024*1024,mp4=new Uint8Array(CHUNK+64);mp4.set([0,0,0,24,102,116,121,112,105,115,111,109]);mp4[mp4.length-1]=77;
 const base='ads/'+id+'/video/uploads';
 assert.equal((await call(base,'POST',{size:1_000_000_001,type:'video/mp4'},aliceCookie)).status,413);
 assert.equal((await call(base,'POST',{size:64,type:'text/html'},aliceCookie)).status,400);
 assert.equal((await call(base,'POST',{size:64,type:'video/mp4'},bobCookie)).status,403);
 let vr=await call(base,'POST',{size:mp4.length,type:'video/mp4'},aliceCookie);assert.equal(vr.status,201);assert.equal(vr.body.chunk_size,CHUNK);const videoSession=base+'/'+vr.body.id;
 async function part(path,bytes,cookie=aliceCookie){const r=await worker.fetch(new Request('https://local.test/api/'+path,{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/octet-stream'},body:bytes}),{DB,BUCKET});return{status:r.status,body:await r.json()}}
 assert.equal((await part(videoSession+'/part?number=2',mp4.slice(CHUNK))).status,409);
 assert.equal((await part(videoSession+'/part?number=1',new Uint8Array(CHUNK))).status,400);
 assert.equal((await part(videoSession+'/part?number=1',mp4.slice(0,CHUNK),bobCookie)).status,403);
 assert.equal((await part(videoSession+'/part?number=1',mp4.slice(0,CHUNK))).body.received,CHUNK);
 assert.equal((await part(videoSession+'/part?number=1',mp4.slice(0,CHUNK))).body.received,CHUNK);
 assert.equal((await call(videoSession,'GET',null,aliceCookie)).body.received,CHUNK);
 assert.equal((await call(videoSession+'/complete','POST',{},aliceCookie)).status,409);
 assert.equal((await part(videoSession+'/part?number=2',new Uint8Array(65))).status,400);
 assert.equal((await part(videoSession+'/part?number=2',mp4.slice(CHUNK))).body.received,mp4.length);
 vr=await call(videoSession+'/complete','POST',{},aliceCookie);assert.equal(vr.status,200);const originalVideo=vr.body.video_url;
 assert.equal((await call(videoSession+'/complete','POST',{},aliceCookie)).body.video_url,originalVideo);
 const listing=(await call('ads')).body.ads.find(a=>a.id===id);assert.equal(listing.video_url,originalVideo);assert(!('video_key'in listing));assert.equal(listing.video_size,mp4.length);
 let playback=await worker.fetch(new Request('https://local.test'+originalVideo,{headers:{Range:'bytes=8-15'}}),{DB,BUCKET});assert.equal(playback.status,206);assert.equal(playback.headers.get('Content-Range'),'bytes 8-15/'+mp4.length);assert.equal(playback.headers.get('Content-Type'),'video/mp4');assert.deepEqual(new Uint8Array(await playback.arrayBuffer()),mp4.slice(8,16));
 playback=await worker.fetch(new Request('https://local.test'+originalVideo,{headers:{Range:'bytes=-16'}}),{DB,BUCKET});assert.equal(playback.status,206);assert.equal(new Uint8Array(await playback.arrayBuffer())[15],77);
 playback=await worker.fetch(new Request('https://local.test'+originalVideo,{method:'HEAD'}),{DB,BUCKET});assert.equal(playback.headers.get('Content-Length'),String(mp4.length));assert.equal((await playback.arrayBuffer()).byteLength,0);
 assert.equal((await worker.fetch(new Request('https://local.test'+originalVideo,{headers:{Range:'bytes=9999999999-'}}),{DB,BUCKET})).status,416);
 vr=await call(base,'POST',{size:1_000_000_000,type:'video/mp4'},aliceCookie);assert.equal(vr.status,201);assert.equal((await call(base+'/'+vr.body.id,'DELETE',null,aliceCookie)).status,200);assert.equal(files.size,1);
 // Replacing video releases the old object only after the new video is complete.
 vr=await call(base,'POST',{size:64,type:'video/mp4'},aliceCookie);const replacementSession=base+'/'+vr.body.id;assert.equal((await part(replacementSession+'/part?number=1',mp4.slice(0,64))).status,200);assert.equal(files.size,1);const replacementVideo=await call(replacementSession+'/complete','POST',{},aliceCookie);assert.equal(replacementVideo.status,200);assert.notEqual(replacementVideo.body.video_url,originalVideo);assert.equal(files.size,1);
 assert.equal((await call('ads/'+id,'DELETE',null,secondLogin.cookie)).status,200);assert.equal(files.size,0);assert.equal(multipart.size,0);await call('auth/logout','POST',null,aliceCookie);assert.equal((await call('auth/me','GET',null,aliceCookie)).body.user,null);
 // Fixed geocoder responses verify address precision without depending on provider uptime.
 const originalFetch=global.fetch;global.fetch=async url=>{assert(new URL(url).searchParams.get('q').includes('Amir Temur'));return new Response(JSON.stringify({features:[{properties:{countrycode:'UZ',type:'house',street:'Amir Timur Avenue',housenumber:'12A'},geometry:{type:'Point',coordinates:[69.29,41.36]}}]}))};
 r=await call('geocode?'+new URLSearchParams({city:'Toshkent shahri',district:'Yunusobod',street:'Amir Temur ko‘chasi',house:'12A'}));assert.equal(r.status,200);assert.equal(r.body.precision,'house');assert.equal(r.body.zoom,18);
 r=await call('geocode?'+new URLSearchParams({city:'Toshkent shahri',district:'Yunusobod',street:'Amir Temur ko‘chasi',house:'999'}));assert.equal(r.body.precision,'street');assert.equal(r.body.zoom,16);global.fetch=originalFetch;
 console.log('Passed: account registration/login/logout, password hashing, secure cookies, account-owned ads across sessions, access control, address storage, image uploads/replacement/deletion, video multipart uploads/retry/ownership/replacement/deletion, 1 GB size boundaries, Range playback, file validation and house/street geocoding precision.');
})();
