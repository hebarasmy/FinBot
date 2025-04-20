// tests/e2e/search/search-with-po.spec.ts
import { test, expect } from '@playwright/test';
import { SearchPage } from '@/tests/e2e/page-objects/search.page';

test.describe('Search Page with Page Object', () => {
  test('should perform a search and display results', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto();
    await searchPage.search('What is the current state of the stock market?');
    
    const responseText = await searchPage.getResponseText();
    expect(responseText).not.toBeNull();
    if (responseText) {
      expect(responseText.length).toBeGreaterThan(10);
    }
  });
  
  test('should use suggestion buttons', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto();
    await searchPage.clickSuggestion('What are the current market trends?');
    await searchPage.sendButton.click();
    
    await expect(searchPage.responseContainer).toBeVisible({ timeout: 60000 });
  });
});