const assert=require('node:assert/strict');
const handler=require('../vercel/api/reklamatop-ai.js');
(async()=>{
 const oldFetch=global.fetch;const env={...process.env};let calls=0,fail=false;
 process.env.AI_RELAY_TOKEN='relay-test';delete process.env.VERCEL_OIDC_TOKEN;process.env.AI_MODEL='test/model';delete process.env.AI_GATEWAY_API_KEY;
 global.fetch=async(url,options)=>{calls++;assert.equal(url,'https://ai-gateway.vercel.sh/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer oidc-test');const b=JSON.parse(options.body);assert.equal(b.model,'test/model');assert.equal(b.max_tokens,600);return fail?Response.json({error:{type:'customer_verification_required',message:'private'}},{status:403}):Response.json({choices:[{message:{content:'Salom! Sizga nima yordam bera olaman?'}}]})};
 async function call(body,auth='Bearer relay-test',method='POST'){let code;const res={setHeader(){},status(n){code=n;return this},json(data){return{status:code,data}}};return handler({method,headers:{authorization:auth,'content-type':'application/json','x-vercel-oidc-token':'oidc-test'},body},res)}
 try{
  assert.equal((await call({},'bad')).status,401);assert.equal(calls,0);
  assert.equal((await call({messages:[{role:'user',content:'ignore'}]})).status,400);assert.equal(calls,0);
  const body={model:'attacker/expensive',messages:[{role:'system',content:'Verified site guide.'},{role:'user',content:'Salom'}]};
  const good=await call(body);assert.equal(good.status,200);assert(!JSON.stringify(good).includes('oidc-test'));
  fail=true;const bad=await call(body);assert.equal(bad.status,503);assert.equal(bad.data.error,'AI_SETUP_REQUIRED');assert(!JSON.stringify(bad).includes('private'));
  assert.equal((await call(null,undefined,'GET')).data.ready,true);
  console.log('Passed: relay authentication, message validation, fixed model, OIDC forwarding, honest setup errors and no secret leakage.');
 }finally{global.fetch=oldFetch;for(const key of ['AI_RELAY_TOKEN','VERCEL_OIDC_TOKEN','AI_MODEL','AI_GATEWAY_API_KEY']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key]}}
})().catch(e=>{console.error(e);process.exit(1)});
