import {defineConfig} from 'vite';
import {generateForProvider,providerStatus} from './src/server/provider-router';
import {generate,models} from './src/adapter';
export default defineConfig({server:{host:'127.0.0.1',port:5188,strictPort:true},plugins:[{name:'local-model-api',configureServer(server){server.middlewares.use('/api',async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 res.setHeader('Cache-Control','no-store');
 try {
 const origin=req.headers.origin;
 if(origin && origin!==`http://127.0.0.1:${server.config.server.port}` && origin!==`http://localhost:${server.config.server.port}`) {res.statusCode=403;res.end(JSON.stringify({error:'Cross-origin requests are blocked.'}));return;}
 if(req.url==='/providers'&&req.method==='GET'){res.end(JSON.stringify(providerStatus(process.env.GEMINI_API_KEY)));return;}
 if(req.url==='/models'&&req.method==='GET'){res.end(JSON.stringify({models:await models()}));return;}
 if(req.url!=='/generate'||req.method!=='POST'){res.statusCode=404;res.end('{}');return;}
 if(!req.headers['content-type']?.startsWith('application/json')) throw Error('JSON is required.');
 let body='';for await(const chunk of req){body+=chunk;if(body.length>40000)throw Error('Notes are too large.');}
 const request=JSON.parse(body);
 res.end(JSON.stringify({stories:await generateForProvider(request,{apiKey:process.env.GEMINI_API_KEY,localGenerate:generate})}));
 }catch(error){res.statusCode=400;res.end(JSON.stringify({error:error instanceof Error && !/fetch|connect|abort|timeout/i.test(error.message)?error.message:'Local model unavailable. Start Ollama with an installed model, then check connection.'}));}
 });}}]});