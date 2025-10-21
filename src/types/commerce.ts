/**
 * Commerce Framework Types
 * Data models for the Merlin marketplace and vendor system
 */

// Product Categories
export type ProductCategory = 
  | 'battery-cells'
  | 'battery-packs'
  | 'inverters'
  | 'pcs'
  | 'bms'
  | 'ems'
  | 'enclosures'
  | 'hvac'
  | 'fire-suppression'
  | 'transformers'
  | 'switchgear'
  | 'cables'
  | 'monitoring'
  | 'solar-panels'
  | 'wind-turbines'
  | 'generators'
  | 'epc-services'
  | 'engineering'
  | 'installation'
  | 'maintenance'
  | 'other';

// Product Listing
export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  category: ProductCategory;
  description: string;
  specifications: ProductSpecification[];
  pricing: ProductPricing;
  certifications: string[];
  warranty: {
    years: number;
    cycles?: number;
    description: string;
  };
  availability: 'in-stock' | 'lead-time' | 'made-to-order' | 'discontinued';
  leadTime?: string;
  minOrderQuantity: number;
  images: string[];
  datasheets: string[];
  featured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Product Specifications
export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
  category: 'electrical' | 'mechanical' | 'thermal' | 'safety' | 'environmental' | 'other';
}

// Product Pricing
export interface ProductPricing {
  basePrice: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CNY';
  unit: 'per-unit' | 'per-kwh' | 'per-kw' | 'per-mw' | 'per-mwh';
  volumeDiscounts: VolumeDiscount[];
  priceVisibility: 'public' | 'request-quote' | 'members-only';
  negotiable: boolean;
}

export interface VolumeDiscount {
  minQuantity: number;
  discountPercent: number;
}

// Vendor Profile
export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  businessType: 'manufacturer' | 'distributor' | 'integrator' | 'consultant';
  description: string;
  logo: string;
  banner: string;
  location: {
    country: string;
    state?: string;
    city?: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  certifications: string[];
  yearEstablished?: number;
  employeeCount?: string;
  productCategories: ProductCategory[];
  products: string[]; // Product IDs
  featured: boolean;
  verified: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  responseTime: string; // e.g., "< 24 hours"
  memberSince: string;
  preferences: VendorPreferences;
  analytics: VendorAnalytics;
}

export interface VendorPreferences {
  acceptsInquiries: boolean;
  acceptsProposals: boolean;
  showPricing: boolean;
  showContactInfo: boolean;
  leadNotifications: boolean;
  marketingOptIn: boolean;
}

export interface VendorAnalytics {
  profileViews: number;
  productViews: number;
  inquiriesReceived: number;
  quotesRequested: number;
  proposalsSubmitted: number;
  conversionRate: number;
}

// Quote Request (Price Request from Buyer to Vendor)
export interface QuoteRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCompany?: string;
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  projectDetails: {
    projectName: string;
    location: string;
    capacity: string;
    timeline: string;
    budget?: string;
  };
  additionalRequirements: string;
  status: 'pending' | 'quoted' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
}

// Quote Response (Vendor's response to Quote Request)
export interface QuoteResponse {
  id: string;
  quoteRequestId: string;
  vendorId: string;
  pricing: {
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    currency: string;
    validUntil: string;
  };
  terms: {
    paymentTerms: string;
    deliveryTerms: string;
    leadTime: string;
    warranty: string;
  };
  notes: string;
  attachments: string[];
  createdAt: string;
}

// Proposal (Buyer submitting project to Vendor)
export interface ProposalSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCompany?: string;
  vendorId: string;
  vendorName: string;
  projectType: 'turnkey' | 'supply-only' | 'epc' | 'consulting' | 'other';
  projectDetails: {
    name: string;
    location: string;
    systemSize: string;
    budget: string;
    timeline: string;
    requirements: string;
  };
  systemConfiguration: {
    bessMW?: number;
    bessMWh?: number;
    solarMW?: number;
    windMW?: number;
    generatorMW?: number;
    gridConnection: string;
  };
  documents: string[];
  status: 'submitted' | 'reviewing' | 'responded' | 'declined' | 'closed';
  createdAt: string;
  respondedAt?: string;
}

// Lead (Generated from user activity)
export interface Lead {
  id: string;
  userId: string;
  source: 'quote-request' | 'proposal' | 'product-view' | 'profile-view' | 'inquiry';
  productId?: string;
  vendorId: string;
  score: number; // 0-100 lead quality score
  data: {
    userProfile: {
      name: string;
      email: string;
      company?: string;
      role?: string;
      location?: string;
    };
    projectInfo: {
      systemSize?: string;
      budget?: string;
      timeline?: string;
      location?: string;
    };
    engagement: {
      quotesBuilt: number;
      productsViewed: string[];
      lastActive: string;
    };
  };
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assignedTo?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// User Product Promotions (Users promoting products on their profile)
export interface UserProductPromotion {
  id: string;
  userId: string;
  productType: ProductCategory;
  productName: string;
  productDescription: string;
  manufacturer?: string;
  specifications: string[];
  pricing?: string;
  contactPreference: 'profile-email' | 'direct-contact' | 'inquiry-form';
  images: string[];
  featured: boolean;
  views: number;
  inquiries: number;
  createdAt: string;
  updatedAt: string;
}

// Referral Tracking
export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  productId?: string;
  vendorId: string;
  type: 'click' | 'quote-request' | 'proposal' | 'purchase';
  value?: number;
  commission?: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  metadata: {
    source: string;
    campaign?: string;
    timestamp: string;
  };
  createdAt: string;
}

// Market Research Data (Anonymized)
export interface MarketResearchData {
  id: string;
  dataType: 'quote-statistics' | 'pricing-trends' | 'product-preferences' | 'regional-demand';
  period: {
    start: string;
    end: string;
  };
  region?: string;
  aggregatedData: {
    // Anonymized, aggregated insights
    averageSystemSize?: number;
    commonConfigurations?: string[];
    pricingTrends?: { [key: string]: number };
    popularProducts?: string[];
    demandIndicators?: { [key: string]: number };
  };
  sampleSize: number;
  generatedAt: string;
}

// Commerce Settings
export interface CommerceSettings {
  marketplace: {
    enabled: boolean;
    commissionRate: number;
    currency: string;
    minOrderValue: number;
  };
  vendorProgram: {
    enabled: boolean;
    monthlyFee: number;
    transactionFee: number;
    featuredListingFee: number;
  };
  referrals: {
    enabled: boolean;
    defaultCommissionRate: number;
    cookieDuration: number; // days
  };
  privacy: {
    dataCollectionEnabled: boolean;
    marketResearchOptIn: boolean;
    anonymizationPeriod: number; // days
  };
}
