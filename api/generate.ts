import {hostedHTTP} from '../src/server/hosted-http.ts';
export function POST(request:Request){return hostedHTTP(request,'generate',{apiKey:process.env.GEMINI_API_KEY});}
