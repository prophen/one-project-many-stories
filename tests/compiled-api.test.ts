import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

test('compiled Node ESM functions load and respond without the TypeScript runner',async()=>{
 const output=await mkdtemp(join(tmpdir(),'many-stories-api-'));
 try{
  execFileSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--outDir',output,'--rootDir','.', '--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','--strict','api/providers.ts','api/models.ts','api/generate.ts'],{stdio:'pipe'});
  await writeFile(join(output,'package.json'),JSON.stringify({type:'module'}));
  const entry=(name:string)=>JSON.stringify(pathToFileURL(join(output,'api',name+'.js')).href);
  const script=`
   const providers=await import(${entry('providers')});
   const models=await import(${entry('models')});
   const generate=await import(${entry('generate')});
   const status=await providers.GET(new Request('https://example.com/api/providers'));
   const available=await models.GET(new Request('https://example.com/api/models'));
   const rejected=await generate.POST(new Request('https://example.com/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'google',googleConsent:false})}));
   console.log(JSON.stringify({status:await status.json(),models:await available.json(),rejected:rejected.status}));
  `;
  const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',env:{...process.env,GEMINI_API_KEY:'',NODE_OPTIONS:''}}));
  assert.equal(result.status.google.configured,false);assert.equal(result.status.local.available,false);assert.deepEqual(result.models.models,[]);assert.equal(result.rejected,400);
 }finally{await rm(output,{recursive:true,force:true});}
});
