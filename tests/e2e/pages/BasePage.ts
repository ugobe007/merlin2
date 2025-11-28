/**
 * BASE PAGE OBJECT
 * 
 * Base class for all page objects
 * Provides common functionality and utilities
 */

import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  // ============================================================================
  // ELEMENT INTERACTIONS
  // ============================================================================

  protected getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  protected getByRole(role: string, options?: { name?: string }): Locator {
    return this.page.getByRole(role as any, options);
  }

  protected getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  protected getByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  protected getByPlaceholder(placeholder: string | RegExp): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  // ============================================================================
  // FORM INTERACTIONS
  // ============================================================================

  async fillField(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async fillFieldByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).fill(value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  async selectOptionByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).selectOption(value);
  }

  async clickButton(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async clickButtonByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  async checkCheckbox(selector: string): Promise<void> {
    await this.page.check(selector);
  }

  async uncheckCheckbox(selector: string): Promise<void> {
    await this.page.uncheck(selector);
  }

  // ============================================================================
  // WAIT HELPERS
  // ============================================================================

  async waitForSelector(selector: string, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForSelector(selector, options);
  }

  async waitForTestId(testId: string, options?: { timeout?: number }): Promise<void> {
    await this.getByTestId(testId).waitFor(options);
  }

  async waitForText(text: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForSelector(`text=${text}`, options);
  }

  async waitForNavigation(options?: { timeout?: number }): Promise<void> {
    await this.page.waitForURL('**', options);
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  async expectVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectHidden(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async expectText(selector: string, text: string | RegExp): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  async expectValue(selector: string, value: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  async expectCount(selector: string, count: number): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  // ============================================================================
  // SCREENSHOT HELPERS
  // ============================================================================

  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async takeElementScreenshot(selector: string, name: string): Promise<Buffer> {
    const element = this.page.locator(selector);
    return await element.screenshot({ path: `screenshots/${name}.png` });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  async getTextContent(selector: string): Promise<string | null> {
    return await this.page.textContent(selector);
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  async isEnabled(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isEnabled();
  }

  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  // ============================================================================
  // SCROLL HELPERS
  // ============================================================================

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  // ============================================================================
  // ALERT/DIALOG HANDLING
  // ============================================================================

  async acceptDialog(): Promise<void> {
    this.page.once('dialog', dialog => dialog.accept());
  }

  async dismissDialog(): Promise<void> {
    this.page.once('dialog', dialog => dialog.dismiss());
  }

  // ============================================================================
  // STORAGE HELPERS
  // ============================================================================

  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((storageKey) => {
      return localStorage.getItem(storageKey);
    }, key);
  }

  async setLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ storageKey, storageValue }) => {
        localStorage.setItem(storageKey, storageValue);
      },
      { storageKey: key, storageValue: value }
    );
  }

  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }
}
