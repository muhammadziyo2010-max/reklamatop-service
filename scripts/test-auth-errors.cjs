const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
const start=source.indexOf('async function api('),end=source.indexOf('\n}',start)+2;
let response,request;
const context=vm.createContext({location:{protocol:'https:'},FormData,Error,fetch:async(...args)=>{request=args;if(response instanceof Error)throw response;return response}});
vm.runInContext(source.slice(start,end),context);
(async()=>{
 response=new Response(JSON.stringify({user:{id:'test'}}),{status:200});
 assert.equal((await context.api('auth/me')).user.id,'test');
 assert.equal(request[1].credentials,'same-origin');assert.equal(request[1].cache,'no-store');
 for(const [status,body,code]of [[401,'{"error":"INVALID_CREDENTIALS"}','INVALID_CREDENTIALS'],[403,'{"error":"INVALID_ORIGIN"}','INVALID_ORIGIN'],[403,'<html>Forbidden</html>','ACCESS_BLOCKED'],[429,'<html>Too many requests</html>','RATE_LIMITED'],[502,'<html>Bad gateway</html>','SERVER_ERROR'],[200,'<html>Unexpected document</html>','INVALID_SERVER_RESPONSE']]){
  response=new Response(body,{status});await assert.rejects(context.api('auth/login'),{message:code});
 }
 response=new TypeError('Failed to fetch');await assert.rejects(context.api('auth/login'),{message:'NETWORK_ERROR'});
 console.log('Passed: JSON auth errors, proxy HTML responses, network failure, same-origin cookies and no-store.');
})().catch(e=>{console.error(e);process.exitCode=1});
