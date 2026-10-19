import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hostedHTTP} from '../src/server/hosted-http.ts';
import {sample} from '../src/domain.ts';
import {storyFixture} from './story-fixture.ts';
import {GET as statusGET} from '../api/providers.ts';
import {GET as modelsGET} from '../api/models.ts';
import {POST} from '../api/generate.ts';
const request=(body:unknown,headers:Record<string,string>={})=>new Request('https://stories.example/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const input={provider:'google',googleConsent:true,facts:sample};
const forbidden:typeof fetch=async()=>{throw Error('Unexpected upstream call');};
test('Vercel entry points return no-cache status and models without exposing keys',async()=>{
 const response=await statusGET(new Request('https://stories.example/api/providers'));const data=await response.json();assert.equal(typeof data.google.configured,'boolean');assert.deepEqual(data.local,{available:false});assert.equal(response.headers.get('cache-control'),'no-store');
 const configured=await hostedHTTP(new Request('https://stories.example/api/providers'),'providers',{apiKey:'fixture-secret'});assert.doesNotMatch(await configured.text(),/fixture-secret/);
 assert.deepEqual(await (await modelsGET(new Request('https://stories.example/api/models'))).json(),{models:[],localAvailable:false});
 assert.equal((await POST(request({...input,googleConsent:false}))).status,400);
});
test('rejects wrong methods, cross-origin requests and non-JSON or oversized bodies before inference',async()=>{
 assert.equal((await hostedHTTP(new Request('https://stories.example/api/generate'),'generate')).status,405);
 for(const [req,status] of [[request(input,{Origin:'https://elsewhere.example'}),403],[request(input,{'Content-Type':'text/plain'}),415],[request({...input,padding:'x'.repeat(40001)}),413]] as const)assert.equal((await hostedHTTP(req,'generate',{apiKey:'fixture-secret',fetcher:forbidden})).status,status);
 const malformed=new Request('https://stories.example/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'});assert.equal((await hostedHTTP(malformed,'generate')).status,400);
});
test('hosted deployment rejects Ollama, missing consent, missing key, and invalid facts without upstream calls',async()=>{
 for(const body of [{...input,provider:'ollama'},{...input,googleConsent:false},{...input,facts:{}},null])assert.equal((await hostedHTTP(request(body),'generate',{apiKey:'fixture-secret',fetcher:forbidden})).status,400);
 assert.match(await (await hostedHTTP(request(input),'generate',{fetcher:forbidden})).text(),/not configured/);
});
test('synthetic request traverses hosted handler, Google adapter and draft validation',async()=>{
 let calls=0;
 const fetcher:typeof fetch=async(url,options)=>{calls++;assert.match(String(url),/gemma-4-26b-a4b-it:generateContent$/);assert.equal((options?.headers as Record<string,string>)['x-goog-api-key'],'fixture-secret');return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(storyFixture)}]}}]});};
 const response=await hostedHTTP(request(input,{Origin:'https://stories.example'}),'generate',{apiKey:'fixture-secret',fetcher});assert.equal(response.status,200);assert.deepEqual(await response.json(),{stories:storyFixture});assert.equal(calls,1);
});
test('provider failures are sanitized and invalid source mappings remain rejected',async()=>{
 const failure=await hostedHTTP(request(input),'generate',{apiKey:'fixture-secret',fetcher:async()=>new Response('PRIVATE fixture-secret',{status:429})});assert.match(await failure.text(),/quota/);
 const invalid=await hostedHTTP(request(input),'generate',{apiKey:'fixture-secret',fetcher:async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...storyFixture,summary:[{text:'Invented',sourceIds:['revenue']}]})}]}}]})});assert.equal(invalid.status,400);assert.doesNotMatch(await invalid.text(),/fixture-secret/);
});
