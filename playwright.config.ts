import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/ui',use:{baseURL:'http://127.0.0.1:5189',launchOptions:{channel:'chrome'}},webServer:{command:'npm run dev -- --port 5189',env:{GEMINI_API_KEY:''},url:'http://127.0.0.1:5189',reuseExistingServer:false},reporter:'list'});
