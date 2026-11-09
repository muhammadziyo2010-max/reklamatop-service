'use strict';
const {timingSafeEqual}=require('node:crypto');
function authorized(value,secret){if(!secret||typeof value!=='string')return false;const a=Buffer.from(value),b=Buffer.from('Bearer '+secret);return a.length===b.length&&timingSafeEqual(a,b)}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 const send=(status,data)=>res.status(status).json(data);
 if(!authorized(req.headers.authorization,process.env.AI_RELAY_TOKEN))return send(401,{error:'UNAUTHORIZED'});
 const credential=process.env.AI_GATEWAY_API_KEY||req.headers['x-vercel-oidc-token']||process.env.VERCEL_OIDC_TOKEN;
 if(!credential||!process.env.AI_MODEL)return send(503,{error:'AI_NOT_CONFIGURED'});
 if(req.method==='GET')return send(200,{ready:true});
 if(req.method!=='POST')return send(405,{error:'METHOD_NOT_ALLOWED'});
 if(!req.headers['content-type']?.includes('application/json'))return send(415,{error:'INVALID_REQUEST'});
 let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return send(400,{error:'INVALID_REQUEST'})}
 if(!body||JSON.stringify(body).length>30000||!Array.isArray(body.messages)||body.messages.length<2||body.messages.length>11||body.messages[0]?.role!=='system'||!body.messages.every((m,i)=>m&&typeof m.content==='string'&&m.content.length<=(i===0?18000:1200)&&(i===0?m.role==='system':['user','assistant'].includes(m.role))))return send(400,{error:'INVALID_MESSAGES'});
 try{
  const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.AI_MODEL,messages:body.messages,max_tokens:600,reasoning_effort:'none'}),signal:AbortSignal.timeout(18000)});
  const data=await r.json();
  if(!r.ok){const code=data.error?.type||data.error?.code;const setup=r.status===402||code==='customer_verification_required'||r.status===401;console.error('AI_GATEWAY_FAILURE',{status:r.status,code:typeof code==='string'?code:'unknown'});return send(503,{error:setup?'AI_SETUP_REQUIRED':'AI_UNAVAILABLE'})}
  const answer=data.choices?.[0]?.message?.content;
  if(typeof answer!=='string'||!answer.trim())return send(503,{error:'AI_UNAVAILABLE'});
  return send(200,{choices:[{message:{content:answer.trim().slice(0,5000)}}]});
 }catch{console.error('AI_GATEWAY_FAILURE',{code:'NETWORK_OR_TIMEOUT'});return send(503,{error:'AI_UNAVAILABLE'})}
};
