/**
 * DASHBOARD PAGE OBJECT
 * 
 * Page object for user dashboard with saved quotes
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface SavedQuote {
  id: string;
  name: string;
  facilityType: string;
  systemSize: string;
  totalCost: string;
  createdAt: string;
}

export class DashboardPage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  private get savedQuotesContainer() {
    return this.getByTestId('saved-quotes-container');
  }

  private get createNewQuoteButton() {
    return this.getByTestId('create-new-quote-btn');
  }

  private get searchInput() {
    return this.getByTestId('search-quotes-input');
  }

  private get filterDropdown() {
    return this.getByTestId('filter-quotes-dropdown');
  }

  private get sortDropdown() {
    return this.getByTestId('sort-quotes-dropdown');
  }

  private get emptyStateMessage() {
    return this.getByTestId('empty-state-message');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async navigateTo(): Promise<void> {
    await this.goto('/dashboard');
    await this.waitForPageLoad();
  }

  // ============================================================================
  // QUOTE MANAGEMENT
  // ============================================================================

  async getQuoteCount(): Promise<number> {
    return await this.page.locator('[data-testid^="quote-card-"]').count();
  }

  async getQuoteCards(): Promise<SavedQuote[]> {
    const cards = await this.page.locator('[data-testid^="quote-card-"]').all();
    const quotes: SavedQuote[] = [];

    for (const card of cards) {
      const id = (await card.getAttribute('data-testid'))?.replace('quote-card-', '') || '';
      const name = (await card.locator('[data-testid="quote-name"]').textContent()) || '';
      const facilityType = (await card.locator('[data-testid="facility-type"]').textContent()) || '';
      const systemSize = (await card.locator('[data-testid="system-size"]').textContent()) || '';
      const totalCost = (await card.locator('[data-testid="total-cost"]').textContent()) || '';
      const createdAt = (await card.locator('[data-testid="created-at"]').textContent()) || '';

      quotes.push({ id, name, facilityType, systemSize, totalCost, createdAt });
    }

    return quotes;
  }

  async openQuote(quoteId: string): Promise<void> {
    const quoteCard = this.getByTestId(`quote-card-${quoteId}`);
    await quoteCard.click();
    await this.waitForPageLoad();
  }

  async deleteQuote(quoteId: string): Promise<void> {
    const deleteButton = this.getByTestId(`delete-quote-${quoteId}`);
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.getByTestId('confirm-delete-btn');
    await confirmButton.click();

    // Wait for quote to be removed
    await this.page.waitForTimeout(1000);
  }

  async duplicateQuote(quoteId: string): Promise<void> {
    const duplicateButton = this.getByTestId(`duplicate-quote-${quoteId}`);
    await duplicateButton.click();
    await this.page.waitForTimeout(1000);
  }

  async exportQuote(quoteId: string, format: 'pdf' | 'word' | 'excel'): Promise<void> {
    const exportButton = this.getByTestId(`export-quote-${quoteId}`);
    await exportButton.click();

    const formatButton = this.getByTestId(`export-format-${format}`);
    await formatButton.click();

    await this.page.waitForTimeout(2000);
  }

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================

  async searchQuotes(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByFacilityType(facilityType: string): Promise<void> {
    await this.filterDropdown.selectOption(facilityType);
    await this.page.waitForTimeout(500);
  }

  async sortQuotes(sortBy: 'name' | 'date' | 'cost' | 'size'): Promise<void> {
    await this.sortDropdown.selectOption(sortBy);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  // ============================================================================
  // CREATE NEW QUOTE
  // ============================================================================

  async createNewQuote(): Promise<void> {
    await this.createNewQuoteButton.click();
    await this.waitForPageLoad();
  }

  // ============================================================================
  // VALIDATIONS
  // ============================================================================

  async expectQuotesVisible(): Promise<void> {
    await expect(this.savedQuotesContainer).toBeVisible();
  }

  async expectQuoteCount(count: number): Promise<void> {
    const actualCount = await this.getQuoteCount();
    expect(actualCount).toBe(count);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyStateMessage).toBeVisible();
  }

  async expectQuoteExists(quoteId: string): Promise<void> {
    const quoteCard = this.getByTestId(`quote-card-${quoteId}`);
    await expect(quoteCard).toBeVisible();
  }

  async expectQuoteNotExists(quoteId: string): Promise<void> {
    const quoteCard = this.getByTestId(`quote-card-${quoteId}`);
    await expect(quoteCard).not.toBeVisible();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async hasQuotes(): Promise<boolean> {
    const count = await this.getQuoteCount();
    return count > 0;
  }

  async findQuoteByName(name: string): Promise<string | null> {
    const quotes = await this.getQuoteCards();
    const quote = quotes.find(q => q.name === name);
    return quote?.id || null;
  }
}
