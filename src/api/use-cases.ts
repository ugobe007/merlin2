/**
 * Use Cases API Route
 * 
 * ✅ ONLY place that touches Supabase schema for use_cases
 * ✅ Step3 calls this, never touches DB directly
 * ✅ Schema immunity: UI doesn't care about DB field names
 */

import { supabase } from '@/services/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('use_cases')
      .select('slug, name, description, display_order, category, image_url')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ Supabase error fetching use cases:', error);
      throw error;
    }

    // Normalize to UseCase interface (schema immunity)
    const useCases = (data || []).map((row) => ({
      slug: row.slug,
      title: row.name || row.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: row.description || '',
      imageKey: row.image_url || null,
      category: row.category || 'commercial',
    }));

    return Response.json({
      useCases,
      count: useCases.length,
      source: 'database',
    });

  } catch (error) {
    console.error('❌ Failed to fetch use cases:', error);
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to load use cases',
        useCases: [], 
      },
      { status: 500 }
    );
  }
}
