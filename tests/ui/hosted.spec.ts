import {test,expect} from '@playwright/test';
import {storyFixture as plan} from '../story-fixture';
test('real server missing-key status renders without blanking the UI',async({page,request})=>{
 const r=await request.get('/api/providers');expect(r.ok()).toBe(true);expect((await r.json()).google.configured).toBe(false);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await page.getByLabel('Generation provider').selectOption('google');await expect(page.getByText('Google hosted Gemma is not configured',{exact:true})).toBeVisible();
 await expect(page.getByText('Free-tier prompts and responses may be used',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Send to Google'})).toBeDisabled();
 await expect(page.locator('input[type=password]')).toHaveCount(0);expect(errors).toEqual([]);
 const missing=await request.post('/api/generate',{data:{provider:'google',googleConsent:true,facts:{}}});expect((await missing.json()).error).toContain('not configured');
});
test('mocked hosted flow requires consent, resets it after edits, and submits no key',async({page})=>{
 await page.route('**/api/providers',r=>r.fulfill({json:{google:{configured:true,model:'gemma-4-26b-a4b-it',realModelTested:false}}}));let submitted:any;let calls=0;
 await page.route('**/api/generate',r=>{calls++;submitted=r.request().postDataJSON();return r.fulfill({json:{stories:plan}});});
 await page.goto('/');await page.getByRole('button',{name:'Try sample'}).click();await page.getByLabel('Generation provider').selectOption('google');
 const send=page.getByRole('button',{name:'Send to Google'}),consent=page.getByRole('checkbox',{name:'I approve sending'});
 await expect(send).toBeDisabled();await consent.check();await expect(send).toBeEnabled();await page.getByLabel('Project name').fill('Synthetic test project');await expect(consent).not.toBeChecked();
 await consent.check();await send.click();await page.getByRole('button',{name:'Edit text'}).click();await expect(page.locator('#draft')).toBeVisible();expect(submitted.provider).toBe('google');expect(submitted.googleConsent).toBe(true);expect(submitted.apiKey).toBeUndefined();expect(submitted.GEMINI_API_KEY).toBeUndefined();expect(calls).toBe(1);await expect(consent).not.toBeChecked();
 await page.getByLabel('Generation provider').selectOption('ollama');await expect(page.getByRole('button',{name:'Check connection',exact:true})).toBeVisible();
});
test('mocked quota error remains visible and does not blank UI or retry',async({page})=>{
 await page.route('**/api/providers',r=>r.fulfill({json:{google:{configured:true}}}));let calls=0;await page.route('**/api/generate',r=>{calls++;return r.fulfill({status:400,json:{error:'Google project quota or rate limit reached. No fallback was attempted.'}});});
 await page.goto('/');await page.getByRole('button',{name:'Try sample'}).click();await page.getByLabel('Generation provider').selectOption('google');await page.getByRole('checkbox',{name:'I approve sending'}).check();await page.getByRole('button',{name:'Send to Google'}).click();await expect(page.getByRole('status')).toContainText('quota');await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(calls).toBe(1);
});

test('hosted setup check shows progress and a visible ready or missing result',async({page})=>{
 let configured=true;let release:()=>void=()=>{};let hold=false;
 await page.route('**/api/providers',async r=>{if(hold)await new Promise<void>(resolve=>{release=resolve;});await r.fulfill({json:{google:{configured}}});});
 await page.goto('/');await page.getByLabel('Generation provider').selectOption('google');
 await expect(page.getByText('Server key configured — not yet model-tested',{exact:true})).toBeVisible();
 hold=true;await page.getByRole('button',{name:'Check hosted setup',exact:true}).click();
 await expect(page.getByRole('button',{name:'Checking hosted setup…',exact:true})).toBeDisabled();await expect(page.getByRole('status')).toContainText('Checking hosted setup');
 release();hold=false;await expect(page.getByRole('status')).toContainText('Hosted setup ready');await expect(page.locator('.hosted-feedback')).toContainText('Hosted setup ready');
 configured=false;await page.getByRole('button',{name:'Check hosted setup',exact:true}).click();await expect(page.getByRole('status')).toContainText('no server key');
});
test('hosted setup failure is visible',async({page})=>{
 await page.goto('/');await page.getByLabel('Generation provider').selectOption('google');
 await page.route('**/api/providers',r=>r.abort());await page.getByRole('button',{name:'Check hosted setup',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Hosted setup check failed');
});
