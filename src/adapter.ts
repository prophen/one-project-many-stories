import {parseStories,prompt,validateFacts} from './domain.ts';
const BASE='http://127.0.0.1:11434';
export async function models(fetcher:typeof fetch=fetch):Promise<string[]> {
 const r=await fetcher(`${BASE}/api/tags`,{signal:AbortSignal.timeout(3000),redirect:'error'});
 if(!r.ok) throw Error('Ollama is unavailable.');
 const body=await r.json();
 return (body.models||[]).filter((m:{name?:string;remote_host?:string})=>typeof m.name==='string'&&!m.remote_host&&!m.name.includes('cloud')).map((m:{name:string})=>m.name);
}
export async function generate(input:unknown,model:unknown,fetcher:typeof fetch=fetch){
 const facts=validateFacts(input);
 if(typeof model!=='string'||!(await models(fetcher)).includes(model)) throw Error('Select an installed local model. Cloud models are not supported.');
 const info=await fetcher(`${BASE}/api/show`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model}),signal:AbortSignal.timeout(3000),redirect:'error'});
 if(!info.ok) throw Error('Could not verify that the model is local.');
 const metadata=await info.json();
 if(metadata.remote_host||metadata.remote_model) throw Error('Remote models are not supported. Choose a locally installed open-weight model.');
 const r=await fetcher(`${BASE}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages:prompt(facts),format:'json',stream:false,options:{temperature:0,num_predict:2500},keep_alive:0}),signal:AbortSignal.timeout(180000),redirect:'error'});
 if(!r.ok) throw Error('Local generation failed. Check Ollama and try again.');
 const body=await r.json();
 if(typeof body.message?.content!=='string') throw Error('Missing model response.');
 return parseStories(body.message.content,facts);
}
