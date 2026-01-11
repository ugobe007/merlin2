/**
 * Component Unit Tests
 * 
 * Tests individual components in isolation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionRenderer } from '@/components/wizard/QuestionRenderer';
import { SolarPreviewCard } from '@/components/wizard/SolarPreviewCard';
import { CAR_WASH_QUESTIONS } from '@/data/carwash-questions.config';

// ============================================================================
// QUESTION RENDERER TESTS
// ============================================================================

describe('QuestionRenderer', () => {
  
  describe('Buttons Question Type', () => {
    const facilityTypeQuestion = CAR_WASH_QUESTIONS[0]; // Question 1

    it('should render all button options', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={facilityTypeQuestion}
          value={null}
          onChange={onChange}
        />
      );

      // Should show 4 facility types
      expect(screen.getByText('Express Tunnel')).toBeInTheDocument();
      expect(screen.getByText('Flex Serve')).toBeInTheDocument();
      expect(screen.getByText('In-Bay Automatic')).toBeInTheDocument();
      expect(screen.getByText('Self-Serve')).toBeInTheDocument();
    });

    it('should highlight selected option', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={facilityTypeQuestion}
          value="express_tunnel"
          onChange={onChange}
        />
      );

      const selectedButton = screen.getByText('Express Tunnel').closest('button');
      expect(selectedButton).toHaveClass('bg-purple-500/20', 'border-purple-500');
    });

    it('should call onChange when button clicked', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={facilityTypeQuestion}
          value={null}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByText('Express Tunnel'));
      expect(onChange).toHaveBeenCalledWith('express_tunnel');
    });

    it('should show icons for options with icons', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={facilityTypeQuestion}
          value={null}
          onChange={onChange}
        />
      );

      // Check that emoji icons are rendered
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.textContent).toMatch(/[🚗🎯🏪💪]/u); // Contains at least one icon
      });
    });
  });

  describe('Slider Question Type', () => {
    const operatingHoursQuestion = CAR_WASH_QUESTIONS[2]; // Question 3

    it('should display current value', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={operatingHoursQuestion}
          value={14}
          onChange={onChange}
        />
      );

      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('hours')).toBeInTheDocument();
    });

    it('should show min and max labels', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={operatingHoursQuestion}
          value={12}
          onChange={onChange}
        />
      );

      expect(screen.getByText('6')).toBeInTheDocument(); // min
      expect(screen.getByText('24')).toBeInTheDocument(); // max
    });

    it('should call onChange when slider moved', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={operatingHoursQuestion}
          value={12}
          onChange={onChange}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '16' } });
      
      expect(onChange).toHaveBeenCalledWith(16);
    });

    it('should use smart default if no value provided', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={operatingHoursQuestion}
          value={null}
          onChange={onChange}
        />
      );

      // Smart default is 12
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  describe('Toggle Question Type', () => {
    const gasLineQuestion = CAR_WASH_QUESTIONS[5]; // Question 6

    it('should render toggle options', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={gasLineQuestion}
          value={null}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('Not Sure')).toBeInTheDocument();
    });

    it('should highlight selected toggle', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={gasLineQuestion}
          value="yes"
          onChange={onChange}
        />
      );

      const yesButton = screen.getByText('Yes').closest('button');
      // Toggle buttons use bg-purple-500/20 with border-purple-500 for selected state
      expect(yesButton).toHaveClass('bg-purple-500/20', 'border-purple-500');
    });
  });

  describe('Area Input Question Type', () => {
    const roofAreaQuestion = CAR_WASH_QUESTIONS[15]; // Question 16

    it('should render number input and unit toggle', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={roofAreaQuestion}
          value={{ value: '5000', unit: 'sqft' }}
          onChange={onChange}
        />
      );

      expect(screen.getByPlaceholderText('Enter area')).toBeInTheDocument();
      expect(screen.getByText('Square Feet (sq ft)')).toBeInTheDocument();
      expect(screen.getByText('Square Meters (sq m)')).toBeInTheDocument();
    });

    it('should call onChange when number changes', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={roofAreaQuestion}
          value={{ value: '', unit: 'sqft' }}
          onChange={onChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter area');
      fireEvent.change(input, { target: { value: '5000' } });
      
      expect(onChange).toHaveBeenCalledWith({ value: '5000', unit: 'sqft' });
    });

    it('should call onChange when unit toggled', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={roofAreaQuestion}
          value={{ value: '5000', unit: 'sqft' }}
          onChange={onChange}
        />
      );

      const sqmButton = screen.getByText('Square Meters (sq m)');
      fireEvent.click(sqmButton);
      
      expect(onChange).toHaveBeenCalledWith({ value: '5000', unit: 'sqm' });
    });

    it('should show conversion helper', () => {
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={roofAreaQuestion}
          value={{ value: '5000', unit: 'sqft' }}
          onChange={onChange}
        />
      );

      // 5000 sqft = ~465 sqm
      expect(screen.getByText(/≈ 465 sq m/)).toBeInTheDocument();
    });
  });

  describe('Help Text and Merlin Tips', () => {
    it('should display help text when present', () => {
      const question = CAR_WASH_QUESTIONS[2]; // Has helpText
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={question}
          value={null}
          onChange={onChange}
        />
      );

      expect(screen.getByText(question.helpText!)).toBeInTheDocument();
    });

    // Note: Merlin tips are now displayed in MerlinEnergyAdvisor (left sidebar), not in QuestionRenderer
    it.skip('should display Merlin tip when present', () => {
      // This test is skipped because Merlin tips are handled by MerlinEnergyAdvisor component
      // in the left sidebar, not in QuestionRenderer
    });
  });

  describe('Validation', () => {
    it('should show validation error when showValidation=true and no value', () => {
      const question = CAR_WASH_QUESTIONS[0];
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={question}
          value={null}
          onChange={onChange}
          showValidation={true}
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not show validation error when value present', () => {
      const question = CAR_WASH_QUESTIONS[0];
      const onChange = vi.fn();
      
      render(
        <QuestionRenderer
          question={question}
          value="express_tunnel"
          onChange={onChange}
          showValidation={true}
        />
      );

      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// SOLAR PREVIEW CARD TESTS
// ============================================================================

describe('SolarPreviewCard', () => {
  
  describe('Basic Display', () => {
    it('should not render if no roof area provided', () => {
      const { container } = render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={undefined}
          roofUnit="sqft"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render if roof area is 0', () => {
      const { container } = render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={0}
          roofUnit="sqft"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render with valid roof area', () => {
      render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={5000}
          roofUnit="sqft"
        />
      );

      expect(screen.getByText('Solar Capacity')).toBeInTheDocument();
      expect(screen.getByText('TrueQuote™')).toBeInTheDocument();
    });
  });

  describe('Roof Solar Calculations', () => {
    it('should display correct roof solar kW', () => {
      render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={5000}
          roofUnit="sqft"
          carportInterest="no"
        />
      );

      // 5000 × 0.65 × 0.020 = 65 kW
      // Text is split across spans, so use flexible matcher
      const roofSolarElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('65.0') && element?.textContent?.includes('kW') || false;
      });
      expect(roofSolarElements.length).toBeGreaterThan(0);
    });

    it('should display annual generation', () => {
      render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={5000}
          roofUnit="sqft"
          carportInterest="no"
        />
      );

      // 65 kW × 1200 = 78,000 kWh = 78k kWh/year
      // Text is split across spans, so use flexible matcher
      const annualGenElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('78') && element?.textContent?.includes('k kWh/year') || false;
      });
      expect(annualGenElements.length).toBeGreaterThan(0);
    });
  });

  describe('Carport Solar Calculations', () => {
    it('should not show carport section when interest is "no"', () => {
      render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={5000}
          roofUnit="sqft"
          carportInterest="no"
          carportArea={1500}
        />
      );

      expect(screen.queryByText(/Carport Solar/)).not.toBeInTheDocument();
    });

    it('should show carport section when interest is "yes"', () => {
      render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={5000}
          roofUnit="sqft"
          carportInterest="yes"
          carportArea={1500}
          carportUnit="sqft"
        />
      );

      // Text might be split across elements, use flexible matcher
      const carportLabelElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Carport Solar') || false;
      });
      expect(carportLabelElements.length).toBeGreaterThan(0);
      
      // 1500 × 1.0 × 0.020 = 30 kW
      // Text is split across spans, so use flexible matcher
      const carportElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('30.0') && element?.textContent?.includes('kW') || false;
      });
      expect(carportElements.length).toBeGreaterThan(0);
    });

    it('should show correct total with carport', () => {
      render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={5000}
          roofUnit="sqft"
          carportInterest="yes"
          carportArea={1500}
          carportUnit="sqft"
        />
      );

      // Total: 65 + 30 = 95 kW
      // Text is split across spans, so use flexible matcher
      const totalElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('95.0') && element?.textContent?.includes('kW') || false;
      });
      expect(totalElements.length).toBeGreaterThan(0);
      
      // Annual: 95 × 1200 = 114,000 kWh = 114k kWh/year
      const annualElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('114') && element?.textContent?.includes('k kWh/year') || false;
      });
      expect(annualElements.length).toBeGreaterThan(0);
    });
  });

  // Note: Savings Estimates and Expandable Assumptions were removed in the simplified component

  describe('Industry Template Variations', () => {
    it('should use car wash template (65% usable)', () => {
      render(
        <SolarPreviewCard
          industry="car_wash"
          roofArea={5000}
          roofUnit="sqft"
        />
      );

      // 5000 × 0.65 × 0.020 = 65 kW
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('65.0') && element?.textContent?.includes('kW') || false;
      });
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should use hotel template (55% usable)', () => {
      render(
        <SolarPreviewCard
          industry="hotel_hospitality"
          roofArea={5000}
          roofUnit="sqft"
        />
      );

      // 5000 × 0.55 × 0.020 = 55 kW
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('55.0') && element?.textContent?.includes('kW') || false;
      });
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should use retail template (75% usable)', () => {
      render(
        <SolarPreviewCard
          industry="retail"
          roofArea={5000}
          roofUnit="sqft"
        />
      );

      // 5000 × 0.75 × 0.020 = 75 kW
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('75.0') && element?.textContent?.includes('kW') || false;
      });
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
