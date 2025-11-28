/**
 * API CONTRACT TESTS
 * 
 * Validates API contracts remain stable across changes
 */

import { test, expect } from '@playwright/test';

test.describe('Baseline API Contract', () => {
  test('baseline configuration response has required fields', async ({ request }) => {
    const response = await request.post('/api/baseline/configuration', {
      data: {
        useCase: 'medical_office',
        useCaseData: {
          squareFootage: 50000,
          operatingHours: 12
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Validate response structure
    expect(data).toHaveProperty('peakLoad');
    expect(data).toHaveProperty('averageLoad');
    expect(data).toHaveProperty('duration');
    expect(data).toHaveProperty('recommendedCapacity');
    
    // Validate types
    expect(typeof data.peakLoad).toBe('number');
    expect(typeof data.averageLoad).toBe('number');
    expect(data.peakLoad).toBeGreaterThan(0);
    expect(data.averageLoad).toBeGreaterThan(0);
  });

  test('use case templates list has required fields', async ({ request }) => {
    const response = await request.get('/api/use-cases/templates');

    expect(response.ok()).toBeTruthy();
    const templates = await response.json();

    expect(Array.isArray(templates)).toBeTruthy();
    expect(templates.length).toBeGreaterThan(0);

    // Validate first template structure
    const firstTemplate = templates[0];
    expect(firstTemplate).toHaveProperty('slug');
    expect(firstTemplate).toHaveProperty('name');
    expect(firstTemplate).toHaveProperty('category');
    expect(firstTemplate).toHaveProperty('required_tier');
  });

  test('pricing endpoint returns valid structure', async ({ request }) => {
    const response = await request.post('/api/pricing/calculate', {
      data: {
        powerMW: 2,
        durationHours: 4,
        region: 'North America'
      }
    });

    expect(response.ok()).toBeTruthy();
    const pricing = await response.json();

    expect(pricing).toHaveProperty('equipmentCost');
    expect(pricing).toHaveProperty('installationCost');
    expect(pricing).toHaveProperty('totalCost');
    expect(typeof pricing.equipmentCost).toBe('number');
    expect(pricing.totalCost).toBeGreaterThan(pricing.equipmentCost);
  });
});

test.describe('Supabase RPC Contract', () => {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  test.skip('get_use_case_with_equipment RPC has correct schema', async ({ request }) => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn('Skipping: SUPABASE credentials not configured');
      return;
    }

    const response = await request.post(`${SUPABASE_URL}/rest/v1/rpc/get_use_case_with_equipment`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        template_slug: 'medical-office'
      }
    });

    expect(response.status()).toBeLessThan(500);
    
    if (response.ok()) {
      const data = await response.json();
      
      expect(data).toHaveProperty('template_id');
      expect(data).toHaveProperty('template_name');
      expect(data).toHaveProperty('template_data');
      expect(data).toHaveProperty('equipment');
      
      // Validate equipment array structure
      if (Array.isArray(data.equipment) && data.equipment.length > 0) {
        const firstEquipment = data.equipment[0];
        expect(firstEquipment).toHaveProperty('name');
        expect(firstEquipment).toHaveProperty('powerKw');
        expect(firstEquipment).toHaveProperty('dutyCycle');
      }
    }
  });
});

test.describe('Response Time Contract', () => {
  test('baseline calculation completes within 5 seconds', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post('/api/baseline/configuration', {
      data: {
        useCase: 'datacenter',
        useCaseData: {
          squareFootage: 100000,
          coolingType: 'precision'
        }
      }
    });

    const duration = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(5000);
  });

  test('pricing calculation completes within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post('/api/pricing/calculate', {
      data: {
        powerMW: 5,
        durationHours: 6,
        region: 'North America'
      }
    });

    const duration = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(2000);
  });
});

test.describe('Error Handling Contract', () => {
  test('invalid use case returns 400', async ({ request }) => {
    const response = await request.post('/api/baseline/configuration', {
      data: {
        useCase: 'invalid_use_case_slug',
        useCaseData: {}
      }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('message');
  });

  test('missing required fields returns 400', async ({ request }) => {
    const response = await request.post('/api/baseline/configuration', {
      data: {
        // Missing useCase
        useCaseData: { squareFootage: 50000 }
      }
    });

    expect(response.status()).toBe(400);
  });

  test('malformed request returns 400', async ({ request }) => {
    const response = await request.post('/api/baseline/configuration', {
      data: 'invalid json string'
    });

    expect(response.status()).toBe(400);
  });
});
