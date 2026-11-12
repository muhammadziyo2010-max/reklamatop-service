const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const worker=(await import('data:text/javascript;base64,'+fs.readFileSync('dist/server/index.js').toString('base64'))).default;
 const trusted='https://reklamatop-service.vercel.app',legacy='https://reklamatop-service.zippypoppy41.chatgpt.site';
 const env={DB:{prepare(){throw new Error('Invalid fields must be rejected before any data access')}},ALLOWED_FRONTEND_ORIGINS:trusted+',https://second.vercel.app'};
 async function call(origin,path='/api/auth/login',body={},settings=env){const r=await worker.fetch(new Request(legacy+path,{method:'POST',headers:{'Content-Type':'application/json',...(origin===null?{}:{Origin:origin})},body:JSON.stringify(body)}),settings);return{status:r.status,body:await r.json()}}
 for(const origin of [legacy,trusted,'https://second.vercel.app',null])assert.equal((await call(origin)).status,400);
 for(const origin of ['https://evil.test',trusted+'.evil.test','https://sub.reklamatop-service.vercel.app','null','http://reklamatop-service.vercel.app'])assert.equal((await call(origin)).status,403);
 assert.equal((await call(trusted,'/api/auth/login',{}, {DB:env.DB})).status,403);
 assert.equal((await call(trusted,'/api/auth/login',{}, {DB:env.DB,ALLOWED_FRONTEND_ORIGINS:'https://*.vercel.app'})).status,403);
 const message={messages:[{role:'user',content:'How do I post?'}]};
 assert.equal((await call(trusted,'/api/help',message)).body.error,'AI_NOT_CONFIGURED');
 assert.equal((await call('https://evil.test','/api/help',message)).status,403);
 assert.equal((await call(null,'/api/help',message)).status,403);
 console.log('Passed: exact trusted origins, original site, no wildcard or lookalike origins, unchanged credential validation and help protection.');
})().catch(e=>{console.error(e);process.exit(1)});
