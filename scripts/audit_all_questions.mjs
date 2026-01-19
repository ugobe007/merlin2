import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

async function auditHotel() {
  const { data: hotelCase, error: caseError } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'hotel')
    .single();

  if (caseError || !hotelCase) {
    console.error('Error fetching hotel case:', caseError);
    return 0;
  }

  const { data: questions, error: qError } = await supabase
    .from('custom_questions')
    .select('field_name, question_text, question_type, display_order, section_name')
    .eq('use_case_id', hotelCase.id)
    .order('display_order');

  console.log('\n=== HOTEL QUESTIONS BY ORDER ===\n');
  questions.forEach((q) => {
    const order = String(q.display_order || 'N/A').padStart(3);
    const field = q.field_name.padEnd(28);
    const type = q.question_type.padEnd(15);
    const section = (q.section_name || 'N/A').padEnd(15);
    console.log(`${order} | ${field} | ${type} | ${section} | ${q.question_text}`);
  });
  
  console.log('\n=== POTENTIAL SEMANTIC DUPLICATES ===\n');
  
  // Check amenities vs guestServices
  const amenities = questions.find(q => q.field_name === 'amenities');
  const guestServices = questions.find(q => q.field_name === 'guestServices');
  
  if (amenities && guestServices) {
    console.log('⚠️  OVERLAP: amenities vs guestServices');
    console.log(`   - amenities: "${amenities.question_text}"`);
    console.log(`   - guestServices: "${guestServices.question_text}"`);
  }
  
  // Check for similar field patterns
  const fieldGroups = {
    'Pool/Recreation': questions.filter(q => /pool|swim|recreation/i.test(q.field_name)),
    'Food/Beverage': questions.filter(q => /food|fb|beverage|dining|restaurant/i.test(q.field_name)),
    'Laundry': questions.filter(q => /laundry/i.test(q.field_name)),
    'Fitness/Spa': questions.filter(q => /fitness|gym|spa|wellness/i.test(q.field_name)),
    'Parking': questions.filter(q => /parking/i.test(q.field_name)),
    'Solar/Energy': questions.filter(q => /solar|rooftop|roof/i.test(q.field_name)),
    'Size/Capacity': questions.filter(q => /sqft|square|room|floor/i.test(q.field_name)),
  };
  
  Object.entries(fieldGroups).forEach(([group, fields]) => {
    if (fields.length > 1) {
      console.log(`\n[${group}] - ${fields.length} related questions:`);
      fields.forEach(f => console.log(`   ${f.display_order}: ${f.field_name} - "${f.question_text}"`));
    }
  });
  
  // Group by section
  console.log('\n=== QUESTIONS GROUPED BY SECTION ===\n');
  const bySection = {};
  questions.forEach(q => {
    const section = q.section_name || 'Uncategorized';
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(q);
  });
  
  Object.entries(bySection).forEach(([section, qs]) => {
    console.log(`\n[${section}] - ${qs.length} questions`);
    qs.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    qs.forEach(q => console.log(`  ${String(q.display_order || '?').padStart(2)}: ${q.field_name.padEnd(25)} - ${q.question_text}`));
  });
  
  console.log('\n=== SUGGESTED LOGICAL ORDER ===\n');
  console.log(`
RECOMMENDED HOTEL QUESTION FLOW:

Section 1: PROPERTY BASICS (display_order 1-10)
  1. hotelCategory - Hotel Category (select)
  2. propertyLayout - Property Layout (select)  
  3. roomCount - Number of Guest Rooms (range_buttons)
  4. floorCount - Number of Floors (range_buttons)
  5. squareFeet - Total Property Square Footage (slider)
  6. occupancyRate - Average Annual Occupancy Rate (slider)

Section 2: ENERGY & INFRASTRUCTURE (display_order 11-20)
  11. monthlyElectricBill - Monthly electricity bill (select)
  12. peakDemand - Peak power demand (select)
  13. gridCapacity - Current grid connection capacity (select)
  14. operatingHours - Operating hours per day (slider)
  15. hvacType - Primary HVAC System (select)
  16. equipmentTier - Equipment efficiency tier (select)
  17. elevatorCount - Number of Elevators (range_buttons)
  18. efficientElevators - Energy Efficient Elevators? (range_buttons)

Section 3: GUEST AMENITIES (display_order 21-30) - MERGE amenities + guestServices
  21. guestAmenities - Guest Amenities & Services (multiselect) ← MERGE
  22. fbOperations - Food & Beverage Operations (multiselect)
  23. poolType - Pool & Recreation Facilities (multiselect)
  24. fitnessCenter - Fitness & Wellness Facilities (multiselect)
  25. spaServices - Spa Services (multiselect)
  26. meetingSpace - Meeting & Event Spaces (multiselect)
  27. laundryOperations - Laundry Operations (multiselect)
  28. parkingType - Parking Facilities (multiselect)

Section 4: EXISTING INFRASTRUCTURE (display_order 31-40)
  31. hasExistingSolar - Do you have existing solar? (toggle)
  32. existingSolarKW - Existing solar capacity (slider)
  33. hasExistingEV - Do you have EV charging stations? (toggle)
  34. existingEVChargers - Number of existing EV chargers (range_buttons)
  35. existingInfrastructure - Existing On-Site Infrastructure (multiselect)
  36. needsBackupPower - Do you need backup power? (toggle)
  37. exteriorLoads - Exterior Electrical Loads (multiselect)

Section 5: SOLAR POTENTIAL (display_order 41-50)
  41. solarInterest - Interest in Solar (select)
  42. solarSpace - Available Space for Solar (multiselect)
  43. rooftopSqFt - Available Rooftop Square Footage (slider)
  44. roofCharacteristics - Roof Characteristics (multiselect)

Section 6: ENERGY GOALS (display_order 51-55)
  51. primaryBESSApplication - Primary energy goal (select)
`);

  return questions.length;
}

auditHotel().then(count => {
  console.log(`\nTotal hotel questions: ${count}`);
  return auditOtherIndustries();
});

async function auditOtherIndustries() {
  const slugs = ['car-wash', 'ev-charging', 'data-center'];
  
  for (const slug of slugs) {
    const { data: useCase } = await supabase
      .from('use_cases')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!useCase) continue;
    
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('field_name, question_text, question_type, display_order, section_name')
      .eq('use_case_id', useCase.id)
      .order('display_order');
    
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`=== ${slug.toUpperCase()} QUESTIONS (${questions.length} total) ===`);
    console.log('='.repeat(60));
    
    // Check for duplicate display_orders
    const orderCounts = {};
    questions.forEach(q => {
      orderCounts[q.display_order] = (orderCounts[q.display_order] || 0) + 1;
    });
    const dupes = Object.entries(orderCounts).filter(([k, v]) => v > 1);
    if (dupes.length > 0) {
      console.log('\n⚠️  DUPLICATE DISPLAY_ORDER VALUES:');
      dupes.forEach(([order, count]) => {
        console.log(`   Order ${order}: ${count} questions`);
        questions.filter(q => q.display_order == order).forEach(q => 
          console.log(`      - ${q.field_name}: "${q.question_text}"`)
        );
      });
    }
    
    // Group by section
    const bySection = {};
    questions.forEach(q => {
      const section = q.section_name || 'Uncategorized';
      if (!bySection[section]) bySection[section] = [];
      bySection[section].push(q);
    });
    
    console.log('\nBy Section:');
    Object.entries(bySection).forEach(([section, qs]) => {
      console.log(`  [${section}] - ${qs.length} questions`);
    });
  }
}
