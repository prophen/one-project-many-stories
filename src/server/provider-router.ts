import { generateGoogle } from './google.js';
import { GOOGLE_MODEL } from '../providers.js';
import type { Stories } from '../domain.js';
export function providerStatus(apiKey?:string) {
  return {google:{configured:Boolean(apiKey?.trim()),model:GOOGLE_MODEL,realModelTested:false}};
}
export async function generateForProvider(request:{facts:unknown;model?:unknown;provider?:unknown;googleConsent?:unknown},dependencies:{
  apiKey?:string;fetcher?:typeof fetch;localGenerate:(facts:unknown,model:unknown)=>Promise<Stories>;
}){
  if(request.provider==='google')return generateGoogle(request.facts,{apiKey:dependencies.apiKey,consent:request.googleConsent===true,fetcher:dependencies.fetcher});
  if(request.provider===undefined||request.provider==='ollama')return dependencies.localGenerate(request.facts,request.model);
  throw Error('Unknown provider. Select local Ollama or Google hosted Gemma.');
}
