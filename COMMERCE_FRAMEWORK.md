# Merlin Commerce Framework

## Overview
The Merlin Commerce Framework is a comprehensive system for marketplace operations, vendor management, and revenue generation through the BESS quote builder platform.

## Revenue Streams

### 1. **Marketplace Transactions**
- Commission on product sales through the platform
- Referral fees when users connect with vendors
- Transaction fees on quote requests and proposals

### 2. **Vendor Program**
- Monthly subscription fees for vendor storefronts
- Featured placement fees for premium visibility
- Lead generation and analytics access fees

### 3. **Data Monetization (Privacy-First)**
- Aggregated market insights sold to industry participants
- Anonymized pricing trends and demand forecasts
- Regional market intelligence reports

### 4. **User Promotions**
- Users can promote their own products on profiles
- Commission on leads generated from user promotions
- Premium profile features for product showcases

## Core Components

### Data Models (`/src/types/commerce.ts`)

#### Product Management
- **Product**: Complete product listings with specs, pricing, certifications
- **ProductCategory**: 20+ categories from battery cells to EPC services
- **ProductPricing**: Flexible pricing with volume discounts, currency support
- **ProductSpecification**: Detailed technical specifications

#### Vendor System
- **VendorProfile**: Complete vendor storefronts with branding
- **VendorAnalytics**: Profile views, inquiries, conversion tracking
- **VendorPreferences**: Privacy and notification settings

#### Transaction Models
- **QuoteRequest**: Buyers requesting quotes from vendors
- **QuoteResponse**: Vendor responses with pricing and terms
- **ProposalSubmission**: Complex project proposals to vendors

#### Lead Generation
- **Lead**: Qualified sales leads with scoring (0-100)
- **Lead Sources**: Quote requests, proposals, product views, inquiries
- **Lead Scoring**: Automatic quality assessment based on project details

#### Revenue Tracking
- **Referral**: Click, quote, proposal, and purchase tracking
- **Commission**: Automatic commission calculations
- **Attribution**: Multi-touch attribution over configurable periods

#### Market Research
- **MarketResearchData**: Anonymized, aggregated industry insights
- **Regional Analysis**: Market trends by geography
- **Demand Indicators**: Predictive analytics for product categories

### Services (`/src/services/marketplaceService.ts`)

#### Product Operations
```typescript
- getAllProducts(): Product[]
- getProductById(id): Product
- getProductsByCategory(category): Product[]
- getProductsByVendor(vendorId): Product[]
- getFeaturedProducts(limit): Product[]
- searchProducts(query): Product[]
```

#### Vendor Operations
```typescript
- getAllVendors(): VendorProfile[]
- getVendorById(id): VendorProfile
- getFeaturedVendors(limit): VendorProfile[]
- createVendorProfile(profile): void
- updateVendorProfile(id, updates): void
- incrementVendorAnalytics(id, metric): void
```

#### Transaction Management
```typescript
- submitQuoteRequest(request): string
- getQuoteRequestsByUser(userId): QuoteRequest[]
- getQuoteRequestsByVendor(vendorId): QuoteRequest[]
- submitProposal(proposal): string
- getProposalsByVendor(vendorId): ProposalSubmission[]
```

#### Lead Generation
```typescript
- createLeadFromQuoteRequest(request): void
- createLeadFromProposal(proposal): void
- getLeadsByVendor(vendorId): Lead[]
- calculateLeadScore(request): number (0-100)
```

#### Referral Tracking
```typescript
- trackReferral(userId, productId, vendorId, type): void
- getReferralsByUser(userId): Referral[]
- getReferralsByVendor(vendorId): Referral[]
```

#### Analytics & Insights
```typescript
- getMarketInsights(region?): MarketInsights
- calculateAverageSystemSize(quotes): number
- getPopularUseCases(quotes): UseCase[]
```

## User Experience

### "Why Join Us" Page (`/src/components/WhyJoinUs.tsx`)

A comprehensive marketing page highlighting platform value:

1. **Build Accurate Quotes**
   - Real-time calculations
   - Industry-standard assumptions
   - Export to multiple formats
   - Unlimited portfolio storage

2. **Customize Energy Resources**
   - Hybrid system configurations
   - On-grid and off-grid modes
   - Multiple use case templates
   - Custom vendor pricing

3. **Shop the Marketplace** (Coming Q4 2025)
   - Verified vendor products
   - Real-time price requests
   - Direct proposal submission
   - Earn referral commissions

4. **Promote Your Products**
   - Custom vendor storefronts
   - Product catalog management
   - Lead generation & analytics
   - Featured placement opportunities

## Implementation Phases

### Phase 1: Foundation (✅ Complete)
- [x] Commerce data models and types
- [x] Marketplace service infrastructure
- [x] "Why Join Us" marketing page
- [x] Lead generation framework
- [x] Referral tracking system

### Phase 2: Vendor Portal (🚧 In Progress)
- [ ] Vendor registration and onboarding
- [ ] Product catalog management interface
- [ ] Vendor dashboard with analytics
- [ ] Lead management system
- [ ] Payment integration

### Phase 3: Marketplace (📅 Planned Q4 2025)
- [ ] Product browsing and search
- [ ] Quote request submission
- [ ] Proposal builder
- [ ] Review and rating system
- [ ] Secure messaging between buyers/vendors

### Phase 4: Advanced Features (📅 Future)
- [ ] API for third-party integrations
- [ ] Mobile app
- [ ] Advanced market analytics
- [ ] AI-powered product recommendations
- [ ] Blockchain-based transaction verification

## Privacy & Data Ethics

### Data Collection
- **Opt-in by default**: Users must consent to data collection
- **Granular controls**: Choose what to share
- **Transparent usage**: Clear explanations of how data is used

### Anonymization
- Personal information removed before aggregation
- Minimum sample sizes for statistical validity
- Geographic generalization to protect individual projects

### User Rights
- Download all personal data
- Request data deletion
- Opt-out of market research
- Control promotional communications

## Revenue Projections

### Conservative Model (Year 1)
- 1,000 active users
- 50 vendor partners
- 10% conversion to paid plans
- Average transaction value: $500
- **Estimated Revenue**: $200K-$300K

### Growth Model (Year 3)
- 10,000 active users
- 200 vendor partners
- 20% conversion to paid plans
- Average transaction value: $2,000
- **Estimated Revenue**: $2M-$4M

## Technical Architecture

### Data Storage
- Current: localStorage (prototype)
- Production: PostgreSQL + Redis cache
- Future: Distributed database with global replication

### Security
- End-to-end encryption for sensitive data
- OAuth 2.0 for third-party integrations
- Regular security audits
- GDPR and CCPA compliance

### Scalability
- Microservices architecture
- CDN for static assets
- Load balancing across regions
- Automatic scaling based on demand

## Next Steps

1. **Immediate**: Create vendor onboarding flow
2. **Short-term**: Build product catalog interface
3. **Medium-term**: Launch marketplace beta
4. **Long-term**: Expand to international markets

## Getting Started

### For Vendors
1. Sign up for a vendor account
2. Complete company profile
3. Add products to catalog
4. Set pricing and terms
5. Start receiving leads

### For Users
1. Create free account
2. Build BESS quotes
3. Browse marketplace
4. Request quotes from vendors
5. Promote your own products (optional)

## Support

For questions or support:
- Email: support@merlinenergy.com
- Documentation: docs.merlinenergy.com
- Community: community.merlinenergy.com

---

**Last Updated**: October 21, 2025
**Version**: 1.0.0
**Status**: Foundation Complete, Vendor Portal In Development
