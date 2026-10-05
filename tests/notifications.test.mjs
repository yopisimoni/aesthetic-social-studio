import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHandler } from '../supabase/functions/notify-new-lead/handler.ts';
const config={supabaseUrl:'https://example.invalid',serviceKey:'test',resendKey:'test',webhookSecret:'test',from:'test@example.invalid'};
const id='00000000-0000-4000-8000-000000000001';
const request=()=>new Request('https://example.invalid',{method:'POST',headers:{'x-webhook-secret':'test'},body:JSON.stringify({record:{id,email:'forged'}})});
test('unauthorized requests cannot read leads or send email',async()=>{
 let called=false;
 const response=await makeHandler(config,async()=>{called=true})(new Request('https://example.invalid',{method:'POST'}));
 assert.equal(response.status,401);assert.equal(called,false);
});
test('uses canonical database row, escapes HTML, forces recipient and stores delivery state',async()=>{
 const calls=[];
 const handler=makeHandler(config,async(url,options)=>{
  calls.push({url,options});
  if(url.includes('rpc/'))return Response.json({claim_token:id,lead:{id,name:'<script>x</script>',email:'real@example.invalid',form_type:'trial',source:'site',created_at:'today'}});
  if(url.includes('resend.com'))return Response.json({id:'provider-id'});
  return new Response(null,{status:204});
 });
 assert.equal((await handler(request())).status,200);
 const sent=JSON.parse(calls[1].options.body);
 assert.deepEqual(sent.to,['aestheticsocialstudio.co@gmail.com']);
 assert.ok(sent.html.includes('&lt;script&gt;'));assert.ok(sent.text.includes('real@example.invalid'));assert.ok(!sent.text.includes('forged'));
 assert.equal(calls[1].options.headers['Idempotency-Key'],'aesthetic-lead/'+id);
 assert.equal(JSON.parse(calls[2].options.body).status,'sent');
});
test('an already sent or leased job does not send again',async()=>{
 let called=0;
 const handler=makeHandler(config,async()=>{called++;return Response.json(null)});
 assert.equal((await handler(request())).status,200);assert.equal(called,1);
});
test('provider failure records a safe retry without exposing provider response',async()=>{
 const bodies=[];
 const handler=makeHandler(config,async(url,options)=>{
  if(url.includes('rpc/'))return Response.json({claim_token:id,lead:{id}});
  if(url.includes('resend.com'))return new Response('sensitive provider body',{status:429});
  bodies.push(JSON.parse(options.body));return new Response(null,{status:204});
 });
 const response=await handler(request());assert.equal(response.status,503);assert.equal(bodies[0].status,'failed');assert.equal(bodies[0].error_code,'email_provider_429');assert.ok(!(await response.text()).includes('sensitive'));
});
