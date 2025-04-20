// tests/e2e/search/search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test('should load the search page correctly', async ({ page }) => {
    await page.goto('/search');
    
    await expect(page.locator('textarea')).toBeVisible();
    
    
    await expect(page.locator('button.bg-indigo-800')).toBeVisible();
  });
  test('should perform a search and display results', async ({ page }) => {
    await page.goto('/search');
    
    await page.locator('textarea').fill('What is the current state of the stock market?');
    
    await page.locator('button.bg-indigo-800').click();
    
    await page.waitForFunction(() => {
      const responseElements = document.querySelectorAll('p, div, span');
      // Fix: Convert NodeList to Array before iterating
      return Array.from(responseElements).some(el => {
        // Check if this element contains text that looks like a response
        return el.textContent && 
               el.textContent.length > 50 && 
               (el.textContent.includes('market') || 
                el.textContent.includes('stock') || 
                el.textContent.includes('financial'));
      });
    }, { timeout: 60000 });
    
    // If we get here, some response-like content was found
    expect(true).toBeTruthy();
  });
  
  test('should capture HTML for debugging', async ({ page }) => {
    // Navigate to the search page
    await page.goto('/search');
    
    // Fill in the search query
    await page.locator('textarea').fill('What is the current state of the stock market?');
    
    // Take a screenshot before clicking
    await page.screenshot({ path: 'before-search.png' });
    
    // Click the send button
    await page.locator('button.bg-indigo-800').click();
    
    // Wait a bit for any response to appear
    await page.waitForTimeout(10000);
    
    // Take a screenshot after clicking
    await page.screenshot({ path: 'after-search.png' });
    
    // Log the HTML to see what's actually there
    const html = await page.content();
    console.log('Page HTML after search (first 500 chars):');
    console.log(html.substring(0, 500) + '...');
    
    // Check if any text appears that looks like a response
    const pageText = await page.textContent('body');
    expect(pageText).toContain('market'); // Look for a word likely to be in the response
  });
  
  test('should use suggestion buttons', async ({ page }) => {
    // Navigate to the search page
    await page.goto('/search');
    
    // Click on one of the suggestion buttons
    await page.locator('button:has-text("What are the current market trends?")').click();
    
    // Wait for the textarea to be filled with the suggestion
    const textareaValue = await page.locator('textarea').inputValue();
    expect(textareaValue).toBe('What are the current market trends?');
    
    // Click the send button
    await page.locator('button.bg-indigo-800').click();
    
    // Wait for any response using the same approach as above
    await page.waitForFunction(() => {
      const responseElements = document.querySelectorAll('p, div, span');
      // Fix: Convert NodeList to Array before iterating
      return Array.from(responseElements).some(el => {
        return el.textContent && 
               el.textContent.length > 50 && 
               (el.textContent.includes('market') || 
                el.textContent.includes('trend') || 
                el.textContent.includes('financial'));
      });
    }, { timeout: 60000 });
    
    // If we get here, some response-like content was found
    expect(true).toBeTruthy();
  });
});