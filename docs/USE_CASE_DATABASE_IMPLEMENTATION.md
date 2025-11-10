# USE CASE DATABASE IMPLEMENTATION GUIDE

## Overview

This implementation creates a scalable, single source of truth for use case calculations and configurations by migrating from static TypeScript templates to a dynamic Supabase database. This enables configuration changes without code deployments and provides better data consistency and management capabilities.

## Architecture Summary

```
Static useCaseTemplates.ts  →  Dynamic Supabase Database
     ↓                              ↓
Frontend Components        →  useCaseService.ts API
     ↓                              ↓
Wizard/Calculations        →  Database-driven Logic
     ↓                              ↓
Admin Changes (Code)       →  Admin Dashboard (UI)
```

## Database Schema

### Core Tables

1. **`use_cases`** - Master use case definitions (Car Wash, Hospital, etc.)
2. **`use_case_configurations`** - Multiple scenarios per use case (Small Car Wash, Large Car Wash)
3. **`equipment_templates`** - Reusable equipment definitions with industry standards
4. **`configuration_equipment`** - Links configurations to equipment with quantities/overrides
5. **`pricing_scenarios`** - Multiple pricing/utility rate scenarios per configuration
6. **`custom_questions`** - Dynamic form fields for capturing use case parameters
7. **`recommended_applications`** - BESS applications recommended for each use case
8. **`use_case_analytics`** - Tracks user interactions and performance metrics

### Key Benefits

- **Multiple Configurations**: Each use case can have multiple size/type variants
- **Reusable Equipment**: Equipment templates shared across use cases
- **Multiple Pricing Scenarios**: Different utility rates per configuration
- **Dynamic Questions**: Custom form fields defined in database
- **Analytics Tracking**: Usage patterns and performance metrics
- **Admin Management**: UI-based configuration without code changes

## Implementation Steps

### Phase 1: Database Setup

1. **Execute Schema Creation**
   ```sql
   -- Run the schema creation script
   \i docs/USE_CASE_SCHEMA.sql
   ```

2. **Execute Data Migration**
   ```sql
   -- Migrate existing template data
   \i docs/USE_CASE_DATA_MIGRATION.sql
   ```

3. **Verify Data Integrity**
   ```sql
   -- Check migration results
   SELECT * FROM use_cases_with_defaults;
   SELECT * FROM configuration_equipment_summary;
   ```

### Phase 2: Service Layer Integration

1. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Update Supabase Client**
   ```typescript
   // Add database types to supabaseClient.ts
   import type { Database } from '../types/database.types';
   
   export const supabase = createClient<Database>(
     process.env.VITE_SUPABASE_URL!,
     process.env.VITE_SUPABASE_ANON_KEY!
   );
   ```

3. **Implement Service Layer**
   - Copy `src/services/useCaseService.ts`
   - Copy `src/types/database.types.ts`

### Phase 3: Component Migration

1. **Update Existing Components**
   ```typescript
   // Before: Static import
   import { USE_CASE_TEMPLATES } from '../data/useCaseTemplates';
   
   // After: Dynamic service
   import { useCaseService } from '../services/useCaseService';
   const useCases = await useCaseService.getAllUseCases();
   ```

2. **Add Error Handling & Loading States**
   ```typescript
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   
   try {
     const data = await useCaseService.getAllUseCases();
     // Handle success
   } catch (err) {
     setError('Failed to load use cases');
     // Fallback to static templates if needed
   }
   ```

3. **Implement Analytics Tracking**
   ```typescript
   await useCaseService.logAnalyticsEvent({
     use_case_id: useCaseId,
     event_type: 'selected',
     event_data: { component: 'UseCaseSelector' }
   });
   ```

### Phase 4: Admin Dashboard

1. **Add Admin Routes**
   ```typescript
   // In router configuration
   {
     path: '/admin/use-cases',
     element: <UseCaseAdminDashboard isAdmin={user?.role === 'admin'} />
   }
   ```

2. **Implement Role-Based Access**
   ```typescript
   // Add to auth context or user profile
   interface UserProfile {
     role: 'user' | 'admin' | 'super_admin';
   }
   ```

3. **Configure RLS Policies**
   ```sql
   -- Admins can manage use cases
   CREATE POLICY "Admins can manage use cases"
   ON use_cases FOR ALL
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM user_profiles 
       WHERE user_profiles.id = auth.uid() 
       AND user_profiles.role = 'admin'
     )
   );
   ```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

1. **Phase 1**: Run database setup, keep existing code
2. **Phase 2**: Add service layer alongside existing templates
3. **Phase 3**: Update components one by one with fallback to static templates
4. **Phase 4**: Remove static templates once all components migrated
5. **Phase 5**: Add admin dashboard and advanced features

### Option 2: Complete Migration

1. Execute all database scripts
2. Replace all static template usage at once
3. Add comprehensive error handling
4. Deploy with feature flag for rollback capability

## Component Update Examples

### Smart Wizard Integration
```typescript
// Load use case details
const useCase = await useCaseService.getUseCaseBySlug(slug);
const questions = useCase.custom_questions;

// Process user responses
const calculation = await useCaseService.calculateConfiguration(
  useCaseId,
  configurationId,
  userResponses,
  userId
);
```

### Front Page UseCaseROI Integration
```typescript
// Replace static use case data
const [useCases, setUseCases] = useState([]);

useEffect(() => {
  const loadUseCases = async () => {
    const data = await useCaseService.getPopularUseCases(10);
    setUseCases(data);
  };
  loadUseCases();
}, []);
```

## Data Management Benefits

### Before (Static Templates)
- ❌ Code changes required for new use cases
- ❌ Single configuration per use case
- ❌ No usage analytics
- ❌ No pricing variations
- ❌ Manual equipment management

### After (Database-Driven)
- ✅ Admin UI for use case management
- ✅ Multiple configurations per use case
- ✅ Real-time usage analytics
- ✅ Multiple pricing scenarios
- ✅ Reusable equipment templates
- ✅ Dynamic custom questions
- ✅ Geographic pricing variations
- ✅ A/B testing capabilities
- ✅ Performance optimization
- ✅ Data consistency validation

## Performance Considerations

### Caching Strategy
```typescript
// Implement Redis or in-memory caching
const cacheKey = `use-cases:${category}:${tier}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const data = await supabase.from('use_cases').select('*');
await cache.set(cacheKey, data, 300); // 5 minute cache
```

### Query Optimization
```sql
-- Use database views for common queries
CREATE VIEW use_cases_with_defaults AS
SELECT uc.*, ucc.typical_load_kw, ucc.typical_savings_percent
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON (uc.id = ucc.use_case_id AND ucc.is_default = true);
```

### Batch Loading
```typescript
// Load related data in parallel
const [useCase, configurations, questions] = await Promise.all([
  useCaseService.getUseCaseBySlug(slug),
  useCaseService.getConfigurationsByUseCaseId(id),
  useCaseService.getCustomQuestionsByUseCaseId(id)
]);
```

## Testing Strategy

### Unit Tests
```typescript
describe('UseCaseService', () => {
  test('should load all active use cases', async () => {
    const useCases = await useCaseService.getAllUseCases();
    expect(useCases.length).toBeGreaterThan(0);
    expect(useCases.every(uc => uc.is_active)).toBe(true);
  });
});
```

### Integration Tests
```typescript
test('should calculate configuration correctly', async () => {
  const result = await useCaseService.calculateConfiguration(
    'use-case-id',
    'config-id',
    { num_bays: 4, cars_per_day: 100 }
  );
  
  expect(result.calculated_load_kw).toBeGreaterThan(0);
  expect(result.payback_years).toBeGreaterThan(0);
});
```

### End-to-End Tests
```typescript
test('admin can create new use case', async () => {
  await loginAsAdmin();
  await createUseCase({
    name: 'Test Use Case',
    category: 'commercial',
    // ... other fields
  });
  
  const useCases = await getAllUseCases();
  expect(useCases.find(uc => uc.name === 'Test Use Case')).toBeTruthy();
});
```

## Rollback Plan

### Emergency Rollback
1. **Feature Flag**: Toggle database vs. static templates
   ```typescript
   const USE_DATABASE = process.env.VITE_USE_DATABASE === 'true';
   const useCases = USE_DATABASE 
     ? await useCaseService.getAllUseCases()
     : USE_CASE_TEMPLATES;
   ```

2. **Graceful Degradation**: Service layer falls back to static data
   ```typescript
   try {
     return await useCaseService.getAllUseCases();
   } catch (error) {
     console.warn('Database unavailable, using static templates');
     return USE_CASE_TEMPLATES.map(transformToDbFormat);
   }
   ```

## Monitoring & Analytics

### Key Metrics
- Use case selection rates
- Configuration completion rates
- Popular equipment combinations
- Regional pricing effectiveness
- Admin dashboard usage
- Database query performance

### Alerts
- High database error rates
- Slow query performance
- Failed use case calculations
- Admin action anomalies

## Security Considerations

### Row Level Security (RLS)
- Public read access to active use cases
- Authenticated users can create analytics events
- Admin users can manage all data
- User isolation for private data

### Data Validation
- Input sanitization in service layer
- Database constraints for data integrity
- Custom validation rules for business logic
- Audit logging for admin actions

## Future Enhancements

1. **Multi-tenancy**: Organization-specific use cases
2. **Versioning**: Use case template versioning
3. **Workflow**: Approval process for use case changes
4. **Machine Learning**: Optimize calculations based on usage patterns
5. **API**: External API for third-party integrations
6. **Import/Export**: Bulk use case management
7. **Templates**: Use case template marketplace
8. **Localization**: Multi-language support

## Conclusion

This database-driven approach provides a scalable foundation for expanding use cases while maintaining data consistency and enabling real-time management without code deployments. The comprehensive service layer ensures backward compatibility during migration and provides robust error handling for production reliability.