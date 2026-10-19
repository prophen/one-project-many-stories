import {test,expect} from '@playwright/test';
import {sample} from '../../src/domain';

test('landing introduces drafts and enters the workspace without sending facts',async({page})=>{
 let generations=0;await page.route('**/api/generate',r=>{generations++;return r.abort();});
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('You built the project');await expect(page.getByLabel('Project name')).toHaveCount(0);
 await page.getByRole('button',{name:'Start with your project',exact:true}).click();await expect(page.getByRole('heading',{name:'Your facts',exact:true})).toBeFocused();await expect(page.getByLabel('Project name')).toHaveValue('');
 await page.getByLabel('Project name').fill('My project');await page.getByRole('button',{name:'Home',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toBeFocused();
 await page.getByRole('button',{name:'Continue your project',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('My project');
 await page.goBack();await expect(page.getByRole('heading',{level:1})).toContainText('You built the project');expect(generations).toBe(0);
});
test('landing synthetic sample requires no automatic generation or provider consent',async({page})=>{
 await page.route('**/api/providers',r=>r.fulfill({json:{google:{configured:true},local:{available:false}}}));
 await page.goto('/');await page.getByRole('button',{name:'Explore a synthetic sample',exact:true}).click();
 await expect(page.getByLabel('Project name')).toHaveValue(sample.name);await expect(page.getByRole('heading',{name:'Your facts',exact:true})).toBeFocused();
 await expect(page.getByRole('checkbox',{name:'I approve sending'})).not.toBeChecked();await expect(page.getByRole('button',{name:'Send to Google'})).toBeDisabled();
});
test('landing supports light, dark, mobile reflow and keyboard entry',async({page})=>{
 await page.goto('/');await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to main content'})).toBeFocused();
 await page.screenshot({path:'screenshots/landing-desktop.png',fullPage:true});
 await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:'screenshots/landing-dark.png',fullPage:true});
 await page.setViewportSize({width:320,height:800});await expect(page.locator('html')).toHaveJSProperty('scrollWidth',320);await page.screenshot({path:'screenshots/landing-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Open the workspace',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Your facts',exact:true})).toBeFocused();
});
