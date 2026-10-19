import {hostedHTTP} from '../src/server/hosted-http.ts';
export function GET(request:Request){return hostedHTTP(request,'providers',{apiKey:process.env.GEMINI_API_KEY});}
