import {test,expect} from '@playwright/test';
import {sample,formatStory,type Stories} from '../../src/domain';
import {storyFixture as fixture} from '../story-fixture';
test('offline state, synthetic sample, tabs, responsive layout',async({page})=>{
 await page.route('**/api/models',r=>r.fulfill({status:400,json:{error:'offline'}}));
 await page.goto('/');await expect(page.getByText('Local model not connected')).toBeVisible();
 await expect(page.getByRole('button',{name:'Shape three stories'})).toBeDisabled();await expect(page.locator('#generate-why')).toContainText('Add project name, problem, contribution.');
 await page.getByRole('button',{name:'Try sample'}).click();await expect(page.getByLabel('Project name')).toHaveValue(sample.name);
 await page.getByRole('button',{name:'Demo outline'}).click();await expect(page.getByRole('heading',{name:'Demo outline',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Case study'}).click();
 await page.screenshot({path:'screenshots/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);await page.screenshot({path:'screenshots/mobile.png',fullPage:true});
});
test('mock transport: generated output, edits, stale sources, download',async({page})=>{
 await page.route('**/api/models',r=>r.fulfill({json:{models:['test-fixture-model']}}));
 await page.route('**/api/generate',r=>r.fulfill({json:{stories:fixture}}));
 await page.goto('/');await page.getByRole('button',{name:'Try sample'}).click();await page.getByRole('button',{name:'Shape three stories'}).click();
 await expect(page.locator('.source-review .passage').first()).toContainText(fixture.caseStudy[0].text);await expect(page.locator('.source-review .passage').first().locator('.chip')).toHaveText(['Problem','Contribution','Features']);
 await page.getByRole('button',{name:'Edit text'}).click();await expect(page.getByLabel('Portfolio case study',{exact:true})).toContainText('');await expect(page.locator('#draft')).toHaveValue(formatStory('caseStudy',fixture,sample));
 await page.locator('#draft').fill('My edited draft');await expect(page.getByText('Edited by you',{exact:false})).toBeVisible();
 await page.getByLabel('Project name').fill('Changed source');await expect(page.getByText('Notes have changed.',{exact:false})).toBeVisible();
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Download text'}).click();expect((await dl).suggestedFilename()).toBe('one-project-many-stories.txt');
 await page.getByRole('button',{name:'Hiring summary'}).click();await expect(page.locator('#draft')).toHaveValue(formatStory('summary',fixture,sample));
});
test('generation errors never produce a fake success',async({page})=>{
 await page.route('**/api/models',r=>r.fulfill({json:{models:['test-fixture-model']}}));await page.route('**/api/generate',r=>r.fulfill({status:400,json:{error:'Unsupported claim rejected'}}));
 await page.goto('/');await page.getByRole('button',{name:'Try sample'}).click();await page.getByRole('button',{name:'Shape three stories'}).click();await expect(page.getByRole('status')).toHaveText('Unsupported claim rejected');await expect(page.locator('#draft')).toHaveCount(0);
});
test('real local API rejects cross-origin generation and invalid facts',async({request})=>{
 const cross=await request.post('/api/generate',{headers:{Origin:'https://untrusted.example'},data:{facts:sample,model:'none'}});expect(cross.status()).toBe(403);
 const invalid=await request.post('/api/generate',{data:{facts:{},model:'none'}});expect(invalid.status()).toBe(400);expect((await invalid.json()).error).toContain('Each fact');
});
test('untrusted markup stays text and keyboard skip link works',async({page})=>{
 await page.route('**/api/models',r=>r.fulfill({json:{models:[]}}));await page.goto('/');
 await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to project notes'})).toBeFocused();await page.keyboard.press('Enter');
 await page.getByLabel('Project name').fill('<img src=x onerror=alert(1)>');await expect(page.locator('img')).toHaveCount(0);await expect(page.getByLabel('Project name')).toHaveValue('<img src=x onerror=alert(1)>');
 await expect(page.getByText('No installed local models found.')).toBeVisible();
});

test('confirmed demo actions require reconfirmation after source edits',async({page})=>{
 await page.route('**/api/models',r=>r.fulfill({json:{models:[]}}));await page.goto('/');await page.getByRole('button',{name:'Try sample'}).click();
 await page.getByRole('button',{name:'Add screen action'}).click();await page.getByLabel('Screen action 1',{exact:true}).fill('Show the synthetic board');
 const confirm=page.getByRole('checkbox',{name:'I confirm I can show action 1'});await confirm.check();await expect(confirm).toBeChecked();
 await page.getByLabel('Implemented features',{exact:false}).fill('The prototype includes a board. No export exists.');await expect(confirm).not.toBeChecked();
 await confirm.check();await page.getByLabel('Screen action 1',{exact:true}).fill('Show a filter');await expect(confirm).not.toBeChecked();
});

test('separate source review, clean clipboard and download, edited mapping warning',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.route('**/api/models',r=>r.fulfill({json:{models:['test-fixture-model']}}));
 await page.route('**/api/generate',r=>r.fulfill({json:{stories:fixture}}));
 await page.goto('/');await page.getByRole('button',{name:'Try sample'}).click();await page.getByRole('button',{name:'Shape three stories'}).click();
 const review=page.locator('.source-review');await page.getByText('All notes these drafts were built from',{exact:true}).click();await expect(review).toContainText(sample.tradeoffs);await expect(review).toContainText(fixture.caseStudy[0].text);await page.screenshot({path:'screenshots/generated-review.png',fullPage:true});
 await page.getByRole('button',{name:'Copy stories',exact:true}).click();
 const clipboard=await page.evaluate(()=>navigator.clipboard.readText());expect(clipboard).toContain(fixture.summary[0].text);expect(clipboard).not.toMatch(/source snapshot|\[contribution\]|sourceIds|review before sharing/);
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download text'}).click();
 const stream=await (await downloaded).createReadStream();let text='';for await(const chunk of stream!)text+=chunk.toString();expect(text).toBe(clipboard);
 await page.getByRole('button',{name:'Edit text'}).click();await expect(page.locator('#draft')).toHaveValue(formatStory('caseStudy',fixture,sample));await page.locator('#draft').fill('My revision');await page.getByRole('button',{name:'Sources'}).click();await expect(review).toContainText('may no longer match your edits');
 await page.getByLabel('Project name').fill('New notes');await expect(review).toContainText('earlier source snapshot');
 await page.setViewportSize({width:390,height:844});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);
});
