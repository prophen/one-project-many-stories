import {hostedHTTP} from '../src/server/hosted-http.js';
export function GET(request:Request){return hostedHTTP(request,'models',{apiKey:process.env.GEMINI_API_KEY});}
