/**
 * Wizard Flow Profiler
 * =====================
 * Step-by-step profiling of the complete wizard flow
 * Identifies EXACTLY where time is spent
 */

import { performance } from 'perf_hooks';

interface ProfileStep {
  stepName: string;
  startTime: number;
  endTime: number;
  duration: number;
  subSteps?: ProfileStep[];
}

class WizardProfiler {
  private currentStep: ProfileStep | null = null;
  private steps: ProfileStep[] = [];
  
  startStep(stepName: string): void {
    const step: ProfileStep = {
      stepName,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      subSteps: []
    };
    
    if (this.currentStep) {
      this.currentStep.subSteps!.push(step);
    } else {
      this.steps.push(step);
    }
    
    this.currentStep = step;
  }
  
  endStep(): void {
    if (this.currentStep) {
      this.currentStep.endTime = performance.now();
      this.currentStep.duration = Math.round((this.currentStep.endTime - this.currentStep.startTime) * 100) / 100;
      this.currentStep = null;
    }
  }
  
  printProfile(): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           WIZARD FLOW DETAILED PROFILE                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    let totalTime = 0;
    
    this.steps.forEach((step, index) => {
      this.printStep(step, 0, index + 1);
      totalTime += step.duration;
    });
    
    console.log('\n═════════════════════════════════════════════════════════════');
    console.log(`⏱️  TOTAL WIZARD FLOW TIME: ${totalTime.toFixed(2)}ms`);
    console.log('═════════════════════════════════════════════════════════════\n');
    
    // Identify bottlenecks
    const bottlenecks = this.findBottlenecks(this.steps, totalTime);
    if (bottlenecks.length > 0) {
      console.log('🔴 BOTTLENECKS (>20% of total time):');
      bottlenecks.forEach(b => {
        const percentage = (b.duration / totalTime * 100).toFixed(1);
        console.log(`   ${b.stepName}: ${b.duration}ms (${percentage}%)`);
      });
      console.log('');
    }
  }
  
  private printStep(step: ProfileStep, indent: number, index: number): void {
    const prefix = '  '.repeat(indent);
    const icon = step.duration < 100 ? '🟢' :
                 step.duration < 300 ? '🟡' : '🔴';
    
    console.log(`${prefix}${icon} Step ${index}: ${step.stepName}`);
    console.log(`${prefix}   Duration: ${step.duration}ms`);
    
    if (step.subSteps && step.subSteps.length > 0) {
      step.subSteps.forEach((subStep, subIndex) => {
        this.printStep(subStep, indent + 1, subIndex + 1);
      });
    }
  }
  
  private findBottlenecks(steps: ProfileStep[], totalTime: number): ProfileStep[] {
    const bottlenecks: ProfileStep[] = [];
    
    for (const step of steps) {
      const percentage = step.duration / totalTime;
      if (percentage > 0.2) { // >20% of total time
        bottlenecks.push(step);
      }
      
      if (step.subSteps) {
        bottlenecks.push(...this.findBottlenecks(step.subSteps, totalTime));
      }
    }
    
    return bottlenecks;
  }
}

async function profileWizardFlow() {
  const profiler = new WizardProfiler();
  
  console.log('🔍 Profiling Complete Wizard Flow...\n');
  
  try {
    // Step 1: Initialize
    profiler.startStep('Wizard Initialization');
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate
    profiler.endStep();
    
    // Step 2: Load Use Cases
    profiler.startStep('Load Available Use Cases');
    const { getUseCasesForSelection } = await import('../src/services/useCaseService');
    const useCases = await getUseCasesForSelection();
    profiler.endStep();
    
    // Step 3: User Selects Template
    profiler.startStep('Template Selection (office)');
    const selectedTemplate = 'office';
    profiler.endStep();
    
    // Step 4: Load Use Case Details
    profiler.startStep('Load Use Case Details');
    const { getUseCaseDetails } = await import('../src/services/useCaseService');
    const details = await getUseCaseDetails(selectedTemplate);
    profiler.endStep();
    
    // Step 5: User Fills Form
    profiler.startStep('User Form Input (simulated)');
    const answers = {
      squareFootage: 50000,
      facilityType: 'medical_office',
      hasRestaurant: true,
      operatingHours: 12
    };
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate user input
    profiler.endStep();
    
    // Step 6: Calculate Baseline
    profiler.startStep('Calculate BESS Baseline');
    const { calculateDatabaseBaseline } = await import('../src/services/baselineService');
    const baseline = await calculateDatabaseBaseline(selectedTemplate, 1, answers);
    profiler.endStep();
    
    // Step 7: Get Equipment Pricing
    profiler.startStep('Get Equipment Pricing');
    const { getBatteryPricing } = await import('../src/services/unifiedPricingService');
    const pricing = await getBatteryPricing(baseline.bessKwh || 400);
    profiler.endStep();
    
    // Step 8: Calculate Financials
    profiler.startStep('Calculate Financial Metrics');
    const { calculateFinancialMetrics } = await import('../src/services/centralizedCalculations');
    const financials = await calculateFinancialMetrics({
      storageSizeMW: baseline.powerMW,
      durationHours: baseline.durationHrs,
      electricityRate: 0.15,
      solarMW: 0,
      location: 'California',
      includeNPV: true
    });
    profiler.endStep();
    
    // Step 9: Render Quote Summary
    profiler.startStep('Render Quote Summary');
    await new Promise(resolve => setTimeout(resolve, 30)); // Simulate render
    profiler.endStep();
    
    // Step 10: Generate Export
    profiler.startStep('Generate Word Export');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate export
    profiler.endStep();
    
  } catch (error) {
    console.error('❌ Profiling failed:', error);
  }
  
  profiler.printProfile();
}

if (require.main === module) {
  profileWizardFlow().catch(console.error);
}

export { profileWizardFlow };
