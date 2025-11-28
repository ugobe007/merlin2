/**
 * MSW HANDLERS - BASELINE API
 * 
 * Mock Service Worker handlers for baseline calculations API
 */

import { rest } from 'msw';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

export const baselineHandlers = [
  // Mock baseline configuration endpoint
  rest.post(`${SUPABASE_URL}/rest/v1/rpc/get_use_case_with_equipment`, (req, res, ctx) => {
    const { template_slug } = req.body as any;

    const mockConfigurations: Record<string, any> = {
      'medical-office': {
        template_id: '1',
        template_name: 'Medical Office',
        template_data: {
          slug: 'medical-office',
          name: 'Medical Office',
          power_profile: {
            typicalLoadKw: 1000,
            peakLoadKw: 1500
          }
        },
        equipment: [
          { name: 'HVAC System', powerKw: 500, dutyCycle: 0.7 },
          { name: 'Medical Equipment', powerKw: 300, dutyCycle: 0.8 }
        ]
      },
      'retail': {
        template_id: '2',
        template_name: 'Retail Store',
        template_data: {
          slug: 'retail',
          name: 'Retail Store',
          power_profile: {
            typicalLoadKw: 800,
            peakLoadKw: 1200
          }
        },
        equipment: [
          { name: 'Lighting', powerKw: 400, dutyCycle: 0.9 },
          { name: 'HVAC', powerKw: 300, dutyCycle: 0.6 }
        ]
      }
    };

    const config = mockConfigurations[template_slug] || mockConfigurations['medical-office'];

    return res(
      ctx.status(200),
      ctx.json(config)
    );
  }),

  // Mock use case templates list
  rest.get(`${SUPABASE_URL}/rest/v1/use_case_templates`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          slug: 'medical-office',
          name: 'Medical Office',
          category: 'commercial',
          required_tier: 'free',
          is_active: true
        },
        {
          slug: 'retail',
          name: 'Retail Store',
          category: 'commercial',
          required_tier: 'free',
          is_active: true
        },
        {
          slug: 'datacenter',
          name: 'Data Center',
          category: 'technology',
          required_tier: 'premium',
          is_active: true
        }
      ])
    );
  }),

  // Mock calculation cache endpoint
  rest.get(`${SUPABASE_URL}/rest/v1/calculation_cache`, (req, res, ctx) => {
    const cacheKey = req.url.searchParams.get('cache_key');
    
    // Return empty for cache miss
    if (!cacheKey) {
      return res(ctx.status(200), ctx.json([]));
    }

    // Simulate cache hit
    return res(
      ctx.status(200),
      ctx.json([
        {
          cache_key: cacheKey,
          result: { peakLoad: 1000, averageLoad: 650 },
          created_at: new Date().toISOString()
        }
      ])
    );
  })
];
