/**
 * QUOTE BUILDER PAGE OBJECT
 * 
 * Page object for BESS Quote Builder main interface
 * Provides methods for interacting with quote generation flow
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface FacilityDetails {
  squareFootage: string;
  facilityType: string;
  operatingHours?: string;
  gridConnection?: string;
  hasRestaurant?: boolean;
}

export interface QuoteResults {
  systemSize: string;
  totalCost: string;
  annualSavings: string;
  paybackPeriod: string;
  roi: string;
}

export class QuoteBuilderPage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  private get facilityTypeDropdown() {
    return this.getByTestId('facility-type-select');
  }

  private get squareFootageInput() {
    return this.getByTestId('square-footage-input');
  }

  private get operatingHoursInput() {
    return this.getByTestId('operating-hours-input');
  }

  private get gridConnectionSelect() {
    return this.getByTestId('grid-connection-select');
  }

  private get hasRestaurantCheckbox() {
    return this.getByTestId('has-restaurant-checkbox');
  }

  private get generateQuoteButton() {
    return this.getByTestId('generate-quote-btn');
  }

  private get quoteResults() {
    return this.getByTestId('quote-results');
  }

  private get systemSizeDisplay() {
    return this.getByTestId('system-size-display');
  }

  private get totalCostDisplay() {
    return this.getByTestId('total-cost-display');
  }

  private get annualSavingsDisplay() {
    return this.getByTestId('annual-savings-display');
  }

  private get paybackPeriodDisplay() {
    return this.getByTestId('payback-period-display');
  }

  private get roiDisplay() {
    return this.getByTestId('roi-display');
  }

  private get saveQuoteButton() {
    return this.getByTestId('save-quote-btn');
  }

  private get exportQuoteButton() {
    return this.getByTestId('export-quote-btn');
  }

  private get loadingSpinner() {
    return this.getByTestId('loading-spinner');
  }

  private get errorMessage() {
    return this.getByTestId('error-message');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async navigateTo(): Promise<void> {
    await this.goto('/quote-builder');
    await this.waitForPageLoad();
  }

  async navigateToSmartWizard(): Promise<void> {
    await this.goto('/smart-wizard');
    await this.waitForPageLoad();
  }

  // ============================================================================
  // FORM INTERACTIONS
  // ============================================================================

  async selectFacilityType(facilityType: string): Promise<void> {
    await this.facilityTypeDropdown.selectOption(facilityType);
    await this.page.waitForTimeout(300); // Wait for dependent fields to update
  }

  async enterSquareFootage(squareFootage: string): Promise<void> {
    await this.squareFootageInput.fill(squareFootage);
  }

  async enterOperatingHours(hours: string): Promise<void> {
    await this.operatingHoursInput.fill(hours);
  }

  async selectGridConnection(connection: string): Promise<void> {
    await this.gridConnectionSelect.selectOption(connection);
  }

  async toggleRestaurant(hasRestaurant: boolean): Promise<void> {
    const isChecked = await this.hasRestaurantCheckbox.isChecked();
    if (hasRestaurant && !isChecked) {
      await this.hasRestaurantCheckbox.check();
    } else if (!hasRestaurant && isChecked) {
      await this.hasRestaurantCheckbox.uncheck();
    }
  }

  async fillFacilityDetails(details: FacilityDetails): Promise<void> {
    await this.selectFacilityType(details.facilityType);
    await this.enterSquareFootage(details.squareFootage);

    if (details.operatingHours) {
      await this.enterOperatingHours(details.operatingHours);
    }

    if (details.gridConnection) {
      await this.selectGridConnection(details.gridConnection);
    }

    if (details.hasRestaurant !== undefined) {
      await this.toggleRestaurant(details.hasRestaurant);
    }
  }

  // ============================================================================
  // QUOTE GENERATION
  // ============================================================================

  async generateQuote(): Promise<void> {
    await this.generateQuoteButton.click();
    await this.waitForQuoteResults();
  }

  async waitForQuoteResults(): Promise<void> {
    // Wait for loading spinner to disappear
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
    
    // Wait for results to appear
    await this.quoteResults.waitFor({ state: 'visible', timeout: 5000 });
  }

  async getQuoteResults(): Promise<QuoteResults> {
    await this.waitForQuoteResults();

    return {
      systemSize: (await this.systemSizeDisplay.textContent()) || '',
      totalCost: (await this.totalCostDisplay.textContent()) || '',
      annualSavings: (await this.annualSavingsDisplay.textContent()) || '',
      paybackPeriod: (await this.paybackPeriodDisplay.textContent()) || '',
      roi: (await this.roiDisplay.textContent()) || ''
    };
  }

  // ============================================================================
  // QUOTE ACTIONS
  // ============================================================================

  async saveQuote(quoteName?: string): Promise<void> {
    await this.saveQuoteButton.click();

    if (quoteName) {
      const nameInput = this.getByTestId('quote-name-input');
      await nameInput.fill(quoteName);
    }

    const confirmButton = this.getByTestId('confirm-save-btn');
    await confirmButton.click();

    // Wait for success message
    await this.getByText(/Quote saved successfully/i).waitFor({ timeout: 5000 });
  }

  async exportQuote(format: 'pdf' | 'word' | 'excel'): Promise<void> {
    await this.exportQuoteButton.click();

    const formatButton = this.getByTestId(`export-${format}-btn`);
    await formatButton.click();

    // Wait for download
    await this.page.waitForTimeout(2000);
  }

  // ============================================================================
  // VALIDATIONS
  // ============================================================================

  async expectQuoteResultsVisible(): Promise<void> {
    await expect(this.quoteResults).toBeVisible();
  }

  async expectErrorMessage(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }

  async expectSystemSize(expectedSize: string | RegExp): Promise<void> {
    await expect(this.systemSizeDisplay).toHaveText(expectedSize);
  }

  async expectTotalCost(expectedCost: string | RegExp): Promise<void> {
    await expect(this.totalCostDisplay).toHaveText(expectedCost);
  }

  async expectPaybackPeriod(expectedPeriod: string | RegExp): Promise<void> {
    await expect(this.paybackPeriodDisplay).toHaveText(expectedPeriod);
  }

  async expectFieldError(fieldName: string): Promise<void> {
    const errorLocator = this.getByTestId(`${fieldName}-error`);
    await expect(errorLocator).toBeVisible();
  }

  async expectNoErrors(): Promise<void> {
    const errorCount = await this.page.locator('[data-testid$="-error"]').count();
    expect(errorCount).toBe(0);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async isQuoteGenerateButtonEnabled(): Promise<boolean> {
    return await this.generateQuoteButton.isEnabled();
  }

  async hasQuoteResults(): Promise<boolean> {
    return await this.quoteResults.isVisible();
  }

  async getErrorMessages(): Promise<string[]> {
    const errors = await this.page.locator('[data-testid$="-error"]').allTextContents();
    return errors;
  }

  async clearForm(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }
}
