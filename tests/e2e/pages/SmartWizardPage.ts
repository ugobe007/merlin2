/**
 * SMART WIZARD PAGE OBJECT
 * 
 * Page object for Smart Wizard multi-step quote generation
 * Handles step-by-step navigation and form completion
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface WizardStep1Data {
  industryCategory: string;
  useCase: string;
}

export interface WizardStep2Data {
  answers: Record<string, string | number | boolean>;
}

export interface WizardStep3Data {
  solarMWp?: number;
  region?: string;
  includeInstallation?: boolean;
}

export class SmartWizardPage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  private get wizardContainer() {
    return this.getByTestId('smart-wizard-container');
  }

  private get stepIndicator() {
    return this.getByTestId('step-indicator');
  }

  private get nextButton() {
    return this.getByTestId('wizard-next-btn');
  }

  private get backButton() {
    return this.getByTestId('wizard-back-btn');
  }

  private get submitButton() {
    return this.getByTestId('wizard-submit-btn');
  }

  // Step 1: Use Case Selection
  private get industryCategorySelect() {
    return this.getByTestId('industry-category-select');
  }

  private get useCaseSelect() {
    return this.getByTestId('use-case-select');
  }

  // Step 2: Custom Questions
  private get customQuestionsForm() {
    return this.getByTestId('custom-questions-form');
  }

  // Step 3: Equipment & Pricing
  private get equipmentBreakdown() {
    return this.getByTestId('equipment-breakdown');
  }

  private get solarInput() {
    return this.getByTestId('solar-mwp-input');
  }

  private get regionSelect() {
    return this.getByTestId('region-select');
  }

  // Results
  private get resultsPanel() {
    return this.getByTestId('wizard-results-panel');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async navigateTo(): Promise<void> {
    await this.goto('/smart-wizard');
    await this.waitForPageLoad();
  }

  async expectOnStep(stepNumber: number): Promise<void> {
    const stepText = await this.stepIndicator.textContent();
    expect(stepText).toContain(`Step ${stepNumber}`);
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForTimeout(500); // Wait for step transition
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async isNextButtonEnabled(): Promise<boolean> {
    return await this.nextButton.isEnabled();
  }

  async isBackButtonVisible(): Promise<boolean> {
    return await this.backButton.isVisible();
  }

  // ============================================================================
  // STEP 1: USE CASE SELECTION
  // ============================================================================

  async selectIndustryCategory(category: string): Promise<void> {
    await this.industryCategorySelect.selectOption(category);
    await this.page.waitForTimeout(500); // Wait for use cases to load
  }

  async selectUseCase(useCase: string): Promise<void> {
    await this.useCaseSelect.selectOption(useCase);
    await this.page.waitForTimeout(500);
  }

  async getAvailableUseCases(): Promise<string[]> {
    const options = await this.useCaseSelect.locator('option').allTextContents();
    return options.filter(opt => opt.trim() !== '');
  }

  async completeStep1(data: WizardStep1Data): Promise<void> {
    await this.selectIndustryCategory(data.industryCategory);
    await this.selectUseCase(data.useCase);
    await this.clickNext();
  }

  // ============================================================================
  // STEP 2: CUSTOM QUESTIONS
  // ============================================================================

  async answerQuestion(questionId: string, answer: string | number | boolean): Promise<void> {
    const input = this.getByTestId(`question-${questionId}`);
    
    const inputType = await input.getAttribute('type');
    
    if (inputType === 'checkbox') {
      if (answer === true) {
        await input.check();
      } else {
        await input.uncheck();
      }
    } else if (inputType === 'select') {
      await input.selectOption(String(answer));
    } else {
      await input.fill(String(answer));
    }
  }

  async answerAllQuestions(answers: Record<string, string | number | boolean>): Promise<void> {
    for (const [questionId, answer] of Object.entries(answers)) {
      await this.answerQuestion(questionId, answer);
    }
  }

  async getQuestionCount(): Promise<number> {
    const questions = await this.customQuestionsForm.locator('[data-testid^="question-"]').count();
    return questions;
  }

  async completeStep2(data: WizardStep2Data): Promise<void> {
    await this.answerAllQuestions(data.answers);
    await this.clickNext();
  }

  // ============================================================================
  // STEP 3: EQUIPMENT & PRICING
  // ============================================================================

  async enterSolarCapacity(mwp: number): Promise<void> {
    await this.solarInput.fill(String(mwp));
    await this.page.waitForTimeout(500); // Wait for calculation update
  }

  async selectRegion(region: string): Promise<void> {
    await this.regionSelect.selectOption(region);
    await this.page.waitForTimeout(500);
  }

  async getEquipmentItems(): Promise<string[]> {
    const items = await this.equipmentBreakdown.locator('[data-testid^="equipment-"]').allTextContents();
    return items;
  }

  async getEquipmentItemCount(): Promise<number> {
    return await this.equipmentBreakdown.locator('[data-testid^="equipment-"]').count();
  }

  async expectEquipmentVisible(): Promise<void> {
    await expect(this.equipmentBreakdown).toBeVisible();
    const count = await this.getEquipmentItemCount();
    expect(count).toBeGreaterThan(0);
  }

  async completeStep3(data?: WizardStep3Data): Promise<void> {
    if (data?.solarMWp) {
      await this.enterSolarCapacity(data.solarMWp);
    }

    if (data?.region) {
      await this.selectRegion(data.region);
    }

    await this.clickSubmit();
  }

  // ============================================================================
  // RESULTS
  // ============================================================================

  async waitForResults(): Promise<void> {
    await this.resultsPanel.waitFor({ state: 'visible', timeout: 30000 });
  }

  async getResultValue(metricName: string): Promise<string> {
    const metric = this.getByTestId(`result-${metricName}`);
    return (await metric.textContent()) || '';
  }

  async expectResultsVisible(): Promise<void> {
    await expect(this.resultsPanel).toBeVisible();
  }

  async expectMetricPresent(metricName: string): Promise<void> {
    const metric = this.getByTestId(`result-${metricName}`);
    await expect(metric).toBeVisible();
  }

  // ============================================================================
  // COMPLETE WORKFLOW
  // ============================================================================

  async completeFullWizard(
    step1: WizardStep1Data,
    step2: WizardStep2Data,
    step3?: WizardStep3Data
  ): Promise<void> {
    // Step 1: Use Case Selection
    await this.completeStep1(step1);
    await this.expectOnStep(2);

    // Step 2: Custom Questions
    await this.completeStep2(step2);
    await this.expectOnStep(3);

    // Step 3: Equipment & Pricing
    await this.completeStep3(step3);

    // Wait for results
    await this.waitForResults();
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  async expectValidationError(fieldId: string): Promise<void> {
    const error = this.getByTestId(`${fieldId}-error`);
    await expect(error).toBeVisible();
  }

  async expectNoValidationErrors(): Promise<void> {
    const errorCount = await this.page.locator('[data-testid$="-error"]').count();
    expect(errorCount).toBe(0);
  }

  async expectStepComplete(stepNumber: number): Promise<void> {
    const stepIndicator = this.getByTestId(`step-${stepNumber}-indicator`);
    await expect(stepIndicator).toHaveClass(/complete|success/i);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getCurrentStep(): Promise<number> {
    const stepText = await this.stepIndicator.textContent();
    const match = stepText?.match(/Step (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  async restartWizard(): Promise<void> {
    const restartButton = this.getByTestId('wizard-restart-btn');
    await restartButton.click();
    await this.expectOnStep(1);
  }

  async saveProgress(): Promise<void> {
    const saveButton = this.getByTestId('wizard-save-progress-btn');
    await saveButton.click();
    
    // Wait for save confirmation
    await this.getByText(/Progress saved/i).waitFor({ timeout: 5000 });
  }
}
