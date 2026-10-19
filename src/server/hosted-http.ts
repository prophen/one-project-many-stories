import {generateGoogle} from './google.js';
import {providerStatus} from './provider-router.js';

const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
class RequestError extends Error {
 constructor(message:string,readonly status:number){super(message);}
}
async function readJSON(request:Request):Promise<unknown>{
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new RequestError('JSON is required.',415);
 const reader=request.body?.getReader();
 if(!reader)throw new RequestError('Project request is required.',400);
 let size=0;const chunks:Uint8Array[]=[];
 try{
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>40000){await reader.cancel();throw new RequestError('Notes are too large.',413);}chunks.push(value);}
 }finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new RequestError('Invalid request JSON.',400);}
}
// Shared by the Vercel entry points and transport tests. No secrets or inputs are logged.
export async function hostedHTTP(request:Request,route:'providers'|'models'|'generate',options:{apiKey?:string;fetcher?:typeof fetch}={}){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return json({error:'Cross-origin requests are blocked.'},403);
 const method=route==='generate'?'POST':'GET';
 if(request.method!==method)return new Response(JSON.stringify({error:'Method not allowed.'}),{status:405,headers:{...headers,Allow:method}});
 if(route==='providers')return json({...providerStatus(options.apiKey),local:{available:false}});
 if(route==='models')return json({models:[],localAvailable:false});
 try{
  const body=await readJSON(request);
  if(!body||typeof body!=='object'||Array.isArray(body))throw new RequestError('Project request must be an object.',400);
  const input=body as Record<string,unknown>;
  if(input.provider!=='google')throw new RequestError('This deployment supports Google hosted Gemma only. Run the app on your computer to use Ollama.',400);
  const stories=await generateGoogle(input.facts,{apiKey:options.apiKey,consent:input.googleConsent===true,fetcher:options.fetcher});
  return json({stories});
 }catch(error){
  // Adapter/domain errors are deliberately sanitized at their source.
  return json({error:error instanceof Error?error.message:'Hosted generation failed. No draft was accepted.'},error instanceof RequestError?error.status:400);
 }
}
