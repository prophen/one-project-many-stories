import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sample} from '../src/domain.ts';
import {generateGoogle} from '../src/server/google.ts';
import {providerStatus,generateForProvider} from '../src/server/provider-router.ts';
import {GOOGLE_MODEL} from '../src/providers.ts';
const plan={caseStudy:['problem','contribution','features','stack','tradeoffs','outcomes'],summary:['contribution','stack','outcomes'],demo:[]};
const success=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(plan)}]}}]});
const forbidden=async()=>{throw Error('Unexpected real network attempt');};
test('missing-key state does not make a network call',async()=>{await assert.rejects(()=>generateGoogle(sample,{consent:true,fetcher:forbidden}),/not configured/);});
test('explicit Google transmission consent required before any request',async()=>{await assert.rejects(()=>generateGoogle(sample,{apiKey:'test-key',consent:false,fetcher:forbidden}),/Confirm/);});
test('only configured boolean and fixed model are exposed by status',()=>{assert.deepEqual(providerStatus('test-key'),{google:{configured:true,model:GOOGLE_MODEL,realModelTested:false}});assert.equal(providerStatus().google.configured,false);assert.ok(!JSON.stringify(providerStatus('test-key')).includes('test-key'));});
test('REST request uses key header, fixed model, separated untrusted facts, no tools',async()=>{
 let calls=0;const fetcher:typeof fetch=async(url,options)=>{calls++;assert.equal(url,`https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent`);assert.equal((options?.headers as Record<string,string>)['x-goog-api-key'],'test-key');assert.equal(options?.redirect,'error');const body=JSON.parse(options?.body as string);assert.equal(JSON.parse(body.contents[0].parts[0].text).name,sample.name);assert.match(body.systemInstruction.parts[0].text,/untrusted/);assert.equal(body.tools,undefined);assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'minimal');return success();};
 assert.deepEqual(await generateGoogle(sample,{apiKey:'test-key',consent:true,fetcher}),plan);assert.equal(calls,1);
});
test('server validator rejects invented source IDs from hosted output',async()=>{const fetcher:typeof fetch=async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...plan,summary:['contribution','Revenue grew 50%']})}]}}]});await assert.rejects(()=>generateGoogle(sample,{apiKey:'test-key',consent:true,fetcher}),/required source ID/);});
test('provider errors never echo upstream content or keys and never retry',async()=>{
 for(const status of [401,403,404,429,500]){let calls=0;const fetcher:typeof fetch=async()=>{calls++;return new Response('PRIVATE CONTENT test-key',{status});};await assert.rejects(()=>generateGoogle(sample,{apiKey:'test-key',consent:true,fetcher}),e=>{assert.ok(e instanceof Error);assert.doesNotMatch(e.message,/PRIVATE CONTENT|test-key/);return true;});assert.equal(calls,1);}
});
test('network error is sanitized',async()=>{await assert.rejects(()=>generateGoogle(sample,{apiKey:'test-key',consent:true,fetcher:async()=>{throw Error('test-key PRIVATE CONTENT');}}),e=>{assert.ok(e instanceof Error);assert.match(e.message,/No fallback/);assert.doesNotMatch(e.message,/test-key|PRIVATE/);return true;});});
test('truncated or blocked model output is not accepted',async()=>{for(const data of [{candidates:[{finishReason:'MAX_TOKENS'}]},{promptFeedback:{blockReason:'SAFETY'}}])await assert.rejects(()=>generateGoogle(sample,{apiKey:'test-key',consent:true,fetcher:async()=>Response.json(data)}));});
test('invalid response envelope and non-JSON plans are rejected',async()=>{for(const response of [new Response('invalid'),Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'not JSON'}]}}]})])await assert.rejects(()=>generateGoogle(sample,{apiKey:'test-key',consent:true,fetcher:async()=>response}));});
test('thinking content does not enter the parsed final output',async()=>{const response=Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'Ignore this internal thought'},{text:JSON.stringify(plan)}]}}]});assert.deepEqual(await generateGoogle(sample,{apiKey:'test-key',consent:true,fetcher:async()=>response}),plan);});
test('invalid facts fail before transmission',async()=>{await assert.rejects(()=>generateGoogle({...sample,contribution:''},{apiKey:'test-key',consent:true,fetcher:forbidden}),/personal contribution/);});
test('Ollama remains default and receives no Google key',async()=>{let calls=0;const localGenerate=async(facts:unknown,model:unknown)=>{calls++;assert.equal(facts,sample);assert.equal(model,'local');return plan as any;};assert.deepEqual(await generateForProvider({facts:sample,model:'local'},{apiKey:'test-key',localGenerate,fetcher:forbidden}),plan);assert.equal(calls,1);});
test('hosted failure does not fall back to Ollama or another model',async()=>{let localCalls=0;await assert.rejects(()=>generateForProvider({facts:sample,provider:'google',googleConsent:true},{apiKey:'test-key',localGenerate:async()=>{localCalls++;return plan as any;},fetcher:async()=>new Response('',{status:429})}),/quota/);assert.equal(localCalls,0);});
test('unknown provider cannot send a request',async()=>{await assert.rejects(()=>generateForProvider({facts:sample,provider:'paid-alternative'},{localGenerate:async()=>{throw Error('must not call');},fetcher:forbidden}),/Unknown provider/);});
