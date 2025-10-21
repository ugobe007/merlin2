/**
 * Marketplace Service
 * Handles product listings, vendor operations, and commerce transactions
 */

import type { 
  Product, 
  VendorProfile, 
  QuoteRequest, 
  ProposalSubmission, 
  Lead,
  Referral
} from '../types/commerce';

class MarketplaceService {
  private STORAGE_KEYS = {
    PRODUCTS: 'merlin_products',
    VENDORS: 'merlin_vendors',
    QUOTE_REQUESTS: 'merlin_quote_requests',
    PROPOSALS: 'merlin_proposals',
    LEADS: 'merlin_leads',
    REFERRALS: 'merlin_referrals',
  };

  // ============================================
  // PRODUCT OPERATIONS
  // ============================================

  getAllProducts(): Product[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  }

  getProductById(productId: string): Product | null {
    const products = this.getAllProducts();
    return products.find(p => p.id === productId) || null;
  }

  getProductsByCategory(category: string): Product[] {
    const products = this.getAllProducts();
    return products.filter(p => p.category === category);
  }

  getProductsByVendor(vendorId: string): Product[] {
    const products = this.getAllProducts();
    return products.filter(p => p.vendorId === vendorId);
  }

  getFeaturedProducts(limit: number = 10): Product[] {
    const products = this.getAllProducts();
    return products
      .filter(p => p.featured)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  searchProducts(query: string): Product[] {
    const products = this.getAllProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.vendorName.toLowerCase().includes(lowerQuery)
    );
  }

  addProduct(product: Product): void {
    const products = this.getAllProducts();
    products.push(product);
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  updateProduct(productId: string, updates: Partial<Product>): void {
    const products = this.getAllProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
  }

  deleteProduct(productId: string): void {
    const products = this.getAllProducts();
    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
  }

  // ============================================
  // VENDOR OPERATIONS
  // ============================================

  getAllVendors(): VendorProfile[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.VENDORS);
    return data ? JSON.parse(data) : [];
  }

  getVendorById(vendorId: string): VendorProfile | null {
    const vendors = this.getAllVendors();
    return vendors.find(v => v.id === vendorId) || null;
  }

  getVendorByUserId(userId: string): VendorProfile | null {
    const vendors = this.getAllVendors();
    return vendors.find(v => v.userId === userId) || null;
  }

  getFeaturedVendors(limit: number = 10): VendorProfile[] {
    const vendors = this.getAllVendors();
    return vendors
      .filter(v => v.featured && v.verified)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  createVendorProfile(profile: VendorProfile): void {
    const vendors = this.getAllVendors();
    vendors.push(profile);
    localStorage.setItem(this.STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }

  updateVendorProfile(vendorId: string, updates: Partial<VendorProfile>): void {
    const vendors = this.getAllVendors();
    const index = vendors.findIndex(v => v.id === vendorId);
    if (index !== -1) {
      vendors[index] = { ...vendors[index], ...updates };
      localStorage.setItem(this.STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
    }
  }

  incrementVendorAnalytics(vendorId: string, metric: keyof VendorProfile['analytics']): void {
    const vendor = this.getVendorById(vendorId);
    if (vendor) {
      const updatedAnalytics = {
        ...vendor.analytics,
        [metric]: (vendor.analytics[metric] as number) + 1
      };
      this.updateVendorProfile(vendorId, { analytics: updatedAnalytics });
    }
  }

  // ============================================
  // QUOTE REQUEST OPERATIONS
  // ============================================

  submitQuoteRequest(request: QuoteRequest): string {
    const requests = this.getAllQuoteRequests();
    requests.push(request);
    localStorage.setItem(this.STORAGE_KEYS.QUOTE_REQUESTS, JSON.stringify(requests));
    
    // Create lead
    this.createLeadFromQuoteRequest(request);
    
    // Track referral if applicable
    this.trackReferral(request.userId, request.productId, request.vendorId, 'quote-request');
    
    // Increment vendor analytics
    this.incrementVendorAnalytics(request.vendorId, 'quotesRequested');
    
    return request.id;
  }

  getAllQuoteRequests(): QuoteRequest[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.QUOTE_REQUESTS);
    return data ? JSON.parse(data) : [];
  }

  getQuoteRequestsByUser(userId: string): QuoteRequest[] {
    const requests = this.getAllQuoteRequests();
    return requests.filter(r => r.userId === userId);
  }

  getQuoteRequestsByVendor(vendorId: string): QuoteRequest[] {
    const requests = this.getAllQuoteRequests();
    return requests.filter(r => r.vendorId === vendorId);
  }

  updateQuoteRequestStatus(requestId: string, status: QuoteRequest['status']): void {
    const requests = this.getAllQuoteRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      requests[index].status = status;
      requests[index].respondedAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEYS.QUOTE_REQUESTS, JSON.stringify(requests));
    }
  }

  // ============================================
  // PROPOSAL OPERATIONS
  // ============================================

  submitProposal(proposal: ProposalSubmission): string {
    const proposals = this.getAllProposals();
    proposals.push(proposal);
    localStorage.setItem(this.STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
    
    // Create lead
    this.createLeadFromProposal(proposal);
    
    // Track referral
    this.trackReferral(proposal.userId, undefined, proposal.vendorId, 'proposal');
    
    // Increment vendor analytics
    this.incrementVendorAnalytics(proposal.vendorId, 'proposalsSubmitted');
    
    return proposal.id;
  }

  getAllProposals(): ProposalSubmission[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.PROPOSALS);
    return data ? JSON.parse(data) : [];
  }

  getProposalsByUser(userId: string): ProposalSubmission[] {
    const proposals = this.getAllProposals();
    return proposals.filter(p => p.userId === userId);
  }

  getProposalsByVendor(vendorId: string): ProposalSubmission[] {
    const proposals = this.getAllProposals();
    return proposals.filter(p => p.vendorId === vendorId);
  }

  // ============================================
  // LEAD GENERATION
  // ============================================

  createLeadFromQuoteRequest(request: QuoteRequest): void {
    const lead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.userId,
      source: 'quote-request',
      productId: request.productId,
      vendorId: request.vendorId,
      score: this.calculateLeadScore(request),
      data: {
        userProfile: {
          name: request.userName,
          email: request.userEmail,
          company: request.userCompany,
        },
        projectInfo: {
          systemSize: request.projectDetails.capacity,
          budget: request.projectDetails.budget,
          timeline: request.projectDetails.timeline,
          location: request.projectDetails.location,
        },
        engagement: {
          quotesBuilt: 1,
          productsViewed: [request.productId],
          lastActive: new Date().toISOString(),
        },
      },
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const leads = this.getAllLeads();
    leads.push(lead);
    localStorage.setItem(this.STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }

  createLeadFromProposal(proposal: ProposalSubmission): void {
    const lead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: proposal.userId,
      source: 'proposal',
      vendorId: proposal.vendorId,
      score: this.calculateLeadScoreFromProposal(proposal),
      data: {
        userProfile: {
          name: proposal.userName,
          email: proposal.userEmail,
          company: proposal.userCompany,
        },
        projectInfo: {
          systemSize: proposal.projectDetails.systemSize,
          budget: proposal.projectDetails.budget,
          timeline: proposal.projectDetails.timeline,
          location: proposal.projectDetails.location,
        },
        engagement: {
          quotesBuilt: 1,
          productsViewed: [],
          lastActive: new Date().toISOString(),
        },
      },
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const leads = this.getAllLeads();
    leads.push(lead);
    localStorage.setItem(this.STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }

  getAllLeads(): Lead[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.LEADS);
    return data ? JSON.parse(data) : [];
  }

  getLeadsByVendor(vendorId: string): Lead[] {
    const leads = this.getAllLeads();
    return leads
      .filter(l => l.vendorId === vendorId)
      .sort((a, b) => b.score - a.score);
  }

  private calculateLeadScore(request: QuoteRequest): number {
    let score = 50; // Base score
    
    if (request.projectDetails.budget) score += 15;
    if (request.projectDetails.timeline) score += 10;
    if (request.userCompany) score += 10;
    if (request.quantity > 1) score += 10;
    if (request.additionalRequirements.length > 50) score += 5;
    
    return Math.min(score, 100);
  }

  private calculateLeadScoreFromProposal(proposal: ProposalSubmission): number {
    let score = 70; // Higher base score for proposals
    
    if (proposal.projectDetails.budget) score += 10;
    if (proposal.projectDetails.timeline) score += 5;
    if (proposal.userCompany) score += 5;
    if (proposal.documents.length > 0) score += 5;
    if (proposal.systemConfiguration.bessMW && proposal.systemConfiguration.bessMW > 5) score += 5;
    
    return Math.min(score, 100);
  }

  // ============================================
  // REFERRAL TRACKING
  // ============================================

  trackReferral(
    userId: string,
    productId: string | undefined,
    vendorId: string,
    type: Referral['type']
  ): void {
    const referral: Referral = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      referrerId: userId,
      productId,
      vendorId,
      type,
      status: 'pending',
      metadata: {
        source: 'platform',
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    const referrals = this.getAllReferrals();
    referrals.push(referral);
    localStorage.setItem(this.STORAGE_KEYS.REFERRALS, JSON.stringify(referrals));
  }

  getAllReferrals(): Referral[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.REFERRALS);
    return data ? JSON.parse(data) : [];
  }

  getReferralsByUser(userId: string): Referral[] {
    const referrals = this.getAllReferrals();
    return referrals.filter(r => r.referrerId === userId);
  }

  getReferralsByVendor(vendorId: string): Referral[] {
    const referrals = this.getAllReferrals();
    return referrals.filter(r => r.vendorId === vendorId);
  }

  // ============================================
  // ANALYTICS & INSIGHTS
  // ============================================

  getMarketInsights(region?: string) {
    const quotes = localStorage.getItem('merlin_quotes');
    const allQuotes = quotes ? JSON.parse(quotes) : [];
    
    return {
      totalQuotes: allQuotes.length,
      averageSystemSize: this.calculateAverageSystemSize(allQuotes),
      popularUseCases: this.getPopularUseCases(allQuotes),
      regionData: region ? this.getRegionData(allQuotes, region) : null,
    };
  }

  private calculateAverageSystemSize(quotes: any[]): number {
    if (quotes.length === 0) return 0;
    const total = quotes.reduce((sum, q) => sum + (q.outputs?.totalMWh || 0), 0);
    return total / quotes.length;
  }

  private getPopularUseCases(quotes: any[]): { useCase: string; count: number }[] {
    const useCaseCounts: { [key: string]: number } = {};
    quotes.forEach(q => {
      const useCase = q.tags || 'Unknown';
      useCaseCounts[useCase] = (useCaseCounts[useCase] || 0) + 1;
    });
    
    return Object.entries(useCaseCounts)
      .map(([useCase, count]) => ({ useCase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getRegionData(quotes: any[], region: string) {
    const regionQuotes = quotes.filter(q => 
      q.inputs?.location?.includes(region)
    );
    return {
      count: regionQuotes.length,
      averageSize: this.calculateAverageSystemSize(regionQuotes),
    };
  }
}

export const marketplaceService = new MarketplaceService();
