// tests/e2e/debug.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';

test('debug search page structure', async ({ page }) => {
  // Navigate to the search page
  await page.goto('/search');
  
  // Take a screenshot
  await page.screenshot({ path: 'search-page-debug.png' });
  
  // Get the HTML content
  const html = await page.content();
  fs.writeFileSync('search-page.html', html);
  
  // Log all buttons on the page
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons on the page`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const type = await button.getAttribute('type');
    const classes = await button.getAttribute('class');
    console.log(`Button ${i+1}: Text="${text}", Type="${type}", Class="${classes}"`);
  }
  
  // Log all form elements
  const forms = await page.locator('form').all();
  console.log(`Found ${forms.length} forms on the page`);
  
  // Log all textareas
  const textareas = await page.locator('textarea').all();
  console.log(`Found ${textareas.length} textareas on the page`);
  
  // Test passes if we reach this point
  expect(true).toBeTruthy();
});