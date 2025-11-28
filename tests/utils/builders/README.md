# Test Builders

## Overview

This directory contains builder pattern classes for creating test data. Builders provide a fluent API for constructing complex test objects with sensible defaults and preset configurations.

## Available Builders

### FacilityBuilder
Creates facility configuration data:

```typescript
import { FacilityBuilder, medicalOffice } from '@/tests/utils/builders/FacilityBuilder';

// Using preset
const facility = medicalOffice();

// Using builder
const customFacility = new FacilityBuilder()
  .asMedicalOffice()
  .withSquareFootage(75000)
  .large()
  .withUnreliableGrid()
  .build();

// Chaining methods
const hospital = new FacilityBuilder()
  .asHospital()
  .withNumberOfBeds(500)
  .withRestaurant(true)
  .offGrid()
  .build();
```

**Available Presets:**
- `medicalOffice()`, `corporateOffice()`
- `retailStore()`, `groceryStore()`, `restaurant()`
- `manufacturing()`, `warehouse()`, `datacenter()`
- `hotel()`, `casino()`, `hospital()`
- `school()`, `university()`
- `evCharging()`, `farm()`, `miningCamp()`, `microgrid()`
- `residential()`, `multifamily()`

**Size Modifiers:**
- `.small()` - 50% of default size
- `.medium()` - Default size
- `.large()` - 200% of default size
- `.extraLarge()` - 300% of default size

### QuoteBuilder
Creates complete quote data with financial calculations:

```typescript
import { QuoteBuilder, mediumCommercialQuote } from '@/tests/utils/builders/QuoteBuilder';

// Using preset
const quote = mediumCommercialQuote();

// Building custom quote
const customQuote = new QuoteBuilder()
  .withName('My Test Quote')
  .withFacility('datacenter', 100000, 24)
  .withSystem(5, 6) // 5MW, 6 hours
  .withSolar(10, 12000000) // 10 MWp, $12M
  .withFinancials(6000000, 1800000, 900000, 8.67)
  .withNPV(2500000)
  .withIRR(0.15)
  .withRegion('North America')
  .build();

// Using preset then modifying
const quote = new QuoteBuilder()
  .largeCommercial()
  .withSolar(5)
  .createdDaysAgo(7)
  .build();
```

**Available Presets:**
- `smallCommercialQuote()`
- `mediumCommercialQuote()`
- `largeCommercialQuote()`
- `industrialQuote()`
- `hospitalQuote()` (with solar)
- `microgridQuote()` (off-grid with solar)

## Usage in Tests

### Unit Tests
```typescript
import { FacilityBuilder } from '@/tests/utils/builders/FacilityBuilder';

test('should calculate for large medical office', async () => {
  const facility = new FacilityBuilder()
    .asMedicalOffice()
    .large()
    .build();
    
  const result = await service.calculate(facility);
  expect(result.peakLoad).toBeGreaterThan(2000);
});
```

### Integration Tests
```typescript
import { QuoteBuilder } from '@/tests/utils/builders/QuoteBuilder';

test('should save quote to database', async () => {
  const quote = new QuoteBuilder()
    .mediumCommercial()
    .withName('Integration Test Quote')
    .build();
    
  const savedQuote = await quoteService.save(quote);
  expect(savedQuote.id).toBeDefined();
});
```

### E2E Tests
```typescript
import { FacilityBuilder } from '@/tests/utils/builders/FacilityBuilder';
import { QuoteBuilderPage } from '@/tests/e2e/pages/QuoteBuilderPage';

test('generate quote with builder data', async ({ page }) => {
  const facility = new FacilityBuilder()
    .asHotel()
    .withNumberOfRooms(300)
    .build();
    
  const quotePage = new QuoteBuilderPage(page);
  await quotePage.navigateTo();
  await quotePage.fillFacilityDetails(facility);
  await quotePage.generateQuote();
});
```

## Builder Pattern Benefits

1. **Readable Tests**: Self-documenting test data creation
2. **Flexible**: Easy to create variations
3. **Maintainable**: Changes to defaults in one place
4. **Type-Safe**: Full TypeScript support
5. **Reusable**: Share across test suites
6. **Discoverable**: IDE autocomplete for all methods

## Creating New Builders

Template for new builder:

```typescript
export interface MyData {
  field1: string;
  field2: number;
  // ...
}

export class MyDataBuilder {
  private data: Partial<MyData> = {};

  withField1(value: string): this {
    this.data.field1 = value;
    return this;
  }

  withField2(value: number): this {
    this.data.field2 = value;
    return this;
  }

  asPreset(): this {
    return this
      .withField1('preset value')
      .withField2(100);
  }

  build(): MyData {
    const defaults: MyData = {
      field1: 'default',
      field2: 0
    };
    return { ...defaults, ...this.data } as MyData;
  }

  clone(): MyDataBuilder {
    const builder = new MyDataBuilder();
    builder.data = { ...this.data };
    return builder;
  }
}

export const createMyData = () => new MyDataBuilder();
export const presetData = () => new MyDataBuilder().asPreset().build();
```

## Advanced Patterns

### Chaining Multiple Builders
```typescript
const facility = new FacilityBuilder().asMedicalOffice().build();
const quote = new QuoteBuilder()
  .withFacilityType(facility.facilityType)
  .withSquareFootage(facility.squareFootage)
  .build();
```

### Creating Test Suites
```typescript
const testCases = [
  { name: 'Small Retail', facility: new FacilityBuilder().asRetailStore().small() },
  { name: 'Medium Retail', facility: new FacilityBuilder().asRetailStore().medium() },
  { name: 'Large Retail', facility: new FacilityBuilder().asRetailStore().large() }
];

testCases.forEach(({ name, facility }) => {
  test(name, async () => {
    const result = await service.calculate(facility.build());
    expect(result).toBeDefined();
  });
});
```

### Cloning and Modifying
```typescript
const baseFacility = new FacilityBuilder().asMedicalOffice();

const smallOffice = baseFacility.clone().small().build();
const largeOffice = baseFacility.clone().large().build();
```
