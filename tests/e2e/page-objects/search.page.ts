// tests/e2e/page-objects/search-page.ts
import { Page, Locator, expect } from '@playwright/test';

export class SearchPage {
  readonly page: Page;
  readonly textarea: Locator;
  readonly sendButton: Locator;
  readonly responseContainer: Locator;
  readonly modelSelector: Locator;
  readonly regionSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textarea = page.locator('textarea');
    this.sendButton = page.locator('button.bg-indigo-800');
    this.responseContainer = page.locator('.response, .message, .answer, .result, [data-testid="response"]');
    this.modelSelector = page.locator('button:has-text("Model:")');
    this.regionSelector = page.locator('button:has-text("Region:")');
  }

  async goto() {
    await this.page.goto('/search');
  }

  async search(query: string) {
    await this.textarea.fill(query);
    await this.sendButton.click();
    await expect(this.responseContainer).toBeVisible({ timeout: 60000 });
  }

  async selectModel(model: string) {
    await this.modelSelector.click();
    await this.page.locator(`text="${model}"`).click();
  }

  async selectRegion(region: string) {
    await this.regionSelector.click();
    await this.page.locator(`text="${region}"`).click();
  }

  async clickSuggestion(suggestionText: string) {
    await this.page.locator(`button:has-text("${suggestionText}")`).click();
  }

  async getResponseText() {
    return this.responseContainer.textContent();
  }
}