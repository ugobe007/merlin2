/**
 * Database Query Performance Test
 * ================================
 * Identifies slow Supabase queries that might bottleneck the wizard
 */

import { performance } from 'perf_hooks';
import { supabase } from '../../src/lib/supabaseClient';

interface QueryResult {
  queryName: string;
  duration: number;
  rowCount: number;
  status: 'FAST' | 'SLOW' | 'CRITICAL';
}

class DatabasePerformanceTester {
  private results: QueryResult[] = [];
  
  async measureQuery(
    queryName: string,
    query: () => Promise<any>,
    fastThreshold: number = 100,
    slowThreshold: number = 300
  ): Promise<QueryResult> {
    const start = performance.now();
    
    try {
      const result = await query();
      const duration = Math.round((performance.now() - start) * 100) / 100;
      
      const status = duration < fastThreshold ? 'FAST' :
                     duration < slowThreshold ? 'SLOW' : 'CRITICAL';
      
      const queryResult: QueryResult = {
        queryName,
        duration,
        rowCount: Array.isArray(result?.data) ? result.data.length : 1,
        status
      };
      
      this.results.push(queryResult);
      return queryResult;
      
    } catch (error) {
      const duration = Math.round((performance.now() - start) * 100) / 100;
      const queryResult: QueryResult = {
        queryName: `${queryName} (ERROR)`,
        duration,
        rowCount: 0,
        status: 'CRITICAL'
      };
      
      this.results.push(queryResult);
      return queryResult;
    }
  }
  
  printReport() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           DATABASE QUERY PERFORMANCE REPORT               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    this.results.forEach((result, index) => {
      const icon = result.status === 'FAST' ? '🟢' :
                   result.status === 'SLOW' ? '🟡' : '🔴';
      
      console.log(`${icon} Query ${index + 1}: ${result.queryName}`);
      console.log(`   Duration: ${result.duration}ms | Rows: ${result.rowCount} | Status: ${result.status}`);
      console.log('');
    });
    
    const critical = this.results.filter(r => r.status === 'CRITICAL');
    const slow = this.results.filter(r => r.status === 'SLOW');
    
    if (critical.length > 0) {
      console.log('🔴 CRITICAL BOTTLENECKS FOUND:');
      critical.forEach(r => console.log(`   - ${r.queryName}: ${r.duration}ms`));
      console.log('');
    }
    
    if (slow.length > 0) {
      console.log('🟡 SLOW QUERIES:');
      slow.forEach(r => console.log(`   - ${r.queryName}: ${r.duration}ms`));
      console.log('');
    }
    
    console.log('═════════════════════════════════════════════════════════════\n');
  }
}

async function runDatabaseTests() {
  const tester = new DatabasePerformanceTester();
  
  console.log('🔍 Testing Database Query Performance...\n');
  
  // Test 1: Get all use cases
  await tester.measureQuery(
    'Get All Use Cases',
    () => supabase.from('use_cases').select('*')
  );
  
  // Test 2: Get specific use case with configurations
  await tester.measureQuery(
    'Get Use Case with Configurations',
    () => supabase
      .from('use_cases')
      .select(`
        *,
        use_case_configurations (*)
      `)
      .eq('slug', 'office')
      .single()
  );
  
  // Test 3: Get equipment templates
  await tester.measureQuery(
    'Get Equipment Templates',
    () => supabase.from('equipment_templates').select('*')
  );
  
  // Test 4: Get pricing by region
  await tester.measureQuery(
    'Get Regional Pricing',
    () => supabase
      .from('equipment_templates')
      .select('*')
      .eq('region', 'North America')
  );
  
  // Test 5: Get user's saved quotes
  await tester.measureQuery(
    'Get User Saved Quotes',
    () => supabase
      .from('saved_quotes')
      .select('*')
      .limit(10)
  );
  
  // Test 6: Complex join query
  await tester.measureQuery(
    'Complex Join (Use Case + Equipment)',
    () => supabase
      .from('use_cases')
      .select(`
        *,
        use_case_configurations (*),
        equipment_templates (*)
      `)
      .eq('slug', 'office')
  );
  
  // Test 7: Filter by tier
  await tester.measureQuery(
    'Filter Use Cases by Tier',
    () => supabase
      .from('use_cases')
      .select('*')
      .contains('allowed_tiers', ['FREE'])
  );
  
  // Test 8: Get calculation constants
  await tester.measureQuery(
    'Get Calculation Constants',
    () => supabase.from('calculation_constants').select('*')
  );
  
  tester.printReport();
}

if (require.main === module) {
  runDatabaseTests().catch(console.error);
}

export { runDatabaseTests };
