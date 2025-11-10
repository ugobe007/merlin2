import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Vendor, VendorProduct, RFQ, RFQResponse, VendorNotification } from './supabaseClient';

// =====================================================
// VENDOR AUTHENTICATION
// =====================================================

export interface VendorRegistrationData {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  password: string;
  specialty: 'battery' | 'inverter' | 'ems' | 'bos' | 'epc' | 'integrator';
  website?: string;
  description?: string;
}

export interface VendorLoginData {
  email: string;
  password: string;
}

/**
 * Register a new vendor
 */
export const registerVendor = async (data: VendorRegistrationData) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          user_type: 'vendor',
          company_name: data.company_name,
          contact_name: data.contact_name
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Create vendor profile (status: pending by default)
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        id: authData.user.id,
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        website: data.website,
        description: data.description,
        status: 'pending'
      })
      .select()
      .single();

    if (vendorError) throw vendorError;

    return {
      success: true,
      vendor: vendorData,
      message: 'Registration successful! Your account is pending approval.'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
};

/**
 * Login vendor
 */
export const loginVendor = async (data: VendorLoginData) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    // Get vendor profile
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (vendorError) throw vendorError;
    if (!vendorData) throw new Error('Vendor profile not found');

    // Check if approved
    if (vendorData.status === 'pending') {
      await supabase.auth.signOut();
      throw new Error('Your account is pending approval. Please wait for admin review.');
    }

    if (vendorData.status === 'rejected' || vendorData.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error('Your account is not active. Please contact support.');
    }

    // Update last login
    await supabase
      .from('vendors')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    return {
      success: true,
      vendor: vendorData,
      session: authData.session
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
};

/**
 * Logout vendor
 */
export const logoutVendor = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { success: true };
};

/**
 * Get current vendor session
 */
export const getCurrentVendor = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;
  return vendor;
};

// =====================================================
// VENDOR PRODUCTS
// =====================================================

export interface ProductSubmissionData {
  product_category: 'battery' | 'inverter' | 'ems' | 'bos' | 'container';
  manufacturer: string;
  model: string;
  capacity_kwh?: number;
  power_kw?: number;
  voltage_v?: number;
  chemistry?: string;
  efficiency_percent?: number;
  price_per_kwh?: number;
  price_per_kw?: number;
  lead_time_weeks: number;
  warranty_years: number;
  minimum_order_quantity?: number;
  certifications?: string[];
  datasheet_url?: string;
  datasheet_filename?: string;
}

/**
 * Submit a new product
 */
export const submitProduct = async (data: ProductSubmissionData) => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  const { data: product, error } = await supabase
    .from('vendor_products')
    .insert({
      vendor_id: vendor.id,
      ...data,
      currency: 'USD',
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return product;
};

/**
 * Get vendor's products
 */
export const getVendorProducts = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vendor_products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as VendorProduct[];
};

/**
 * Update a product
 */
export const updateProduct = async (productId: string, updates: Partial<ProductSubmissionData>) => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vendor_products')
    .update(updates)
    .eq('id', productId)
    .eq('vendor_id', vendor.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// =====================================================
// RFQs (REQUEST FOR QUOTES)
// =====================================================

/**
 * Get open RFQs for vendor
 */
export const getOpenRFQs = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('status', 'open')
    .gte('due_date', new Date().toISOString())
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as RFQ[];
};

/**
 * Get RFQ details
 */
export const getRFQDetails = async (rfqId: string) => {
  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('id', rfqId)
    .single();

  if (error) throw error;
  return data as RFQ;
};

// =====================================================
// RFQ RESPONSES
// =====================================================

export interface RFQResponseData {
  rfq_id: string;
  total_price: number;
  lead_time_weeks: number;
  warranty_years: number;
  pricing_breakdown: Record<string, any>;
  technical_proposal?: string;
  value_proposition?: string;
  proposal_document_url?: string;
  proposal_filename?: string;
}

/**
 * Submit RFQ response
 */
export const submitRFQResponse = async (data: RFQResponseData) => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  const { data: response, error } = await supabase
    .from('rfq_responses')
    .insert({
      vendor_id: vendor.id,
      currency: 'USD',
      status: 'submitted',
      ...data
    })
    .select()
    .single();

  if (error) throw error;

  // Update RFQ response count
  await supabase.rpc('increment_rfq_responses', { rfq_id: data.rfq_id });

  return response;
};

/**
 * Get vendor's RFQ responses
 */
export const getVendorRFQResponses = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('rfq_responses')
    .select(`
      *,
      rfqs (
        rfq_number,
        project_name,
        system_size_mw,
        duration_hours,
        location
      )
    `)
    .eq('vendor_id', vendor.id)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
};

// =====================================================
// NOTIFICATIONS
// =====================================================

/**
 * Get vendor notifications
 */
export const getVendorNotifications = async (unreadOnly = false) => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  let query = supabase
    .from('vendor_notifications')
    .select('*')
    .eq('vendor_id', vendor.id);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as VendorNotification[];
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('vendor_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) throw error;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('vendor_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('vendor_id', vendor.id)
    .eq('is_read', false);

  if (error) throw error;
};

// =====================================================
// DASHBOARD STATS
// =====================================================

/**
 * Get vendor dashboard statistics
 */
export const getVendorStats = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error('Not authenticated');

  // Get products stats
  const { data: products } = await supabase
    .from('vendor_products')
    .select('status')
    .eq('vendor_id', vendor.id);

  const pendingProducts = products?.filter(p => p.status === 'pending').length || 0;
  const approvedProducts = products?.filter(p => p.status === 'approved').length || 0;

  // Get RFQ responses stats
  const { data: responses } = await supabase
    .from('rfq_responses')
    .select('status')
    .eq('vendor_id', vendor.id);

  const activeSubmissions = responses?.filter(r => 
    ['submitted', 'under_review'].includes(r.status)
  ).length || 0;

  // Get open RFQs count
  const { count: openRFQsCount } = await supabase
    .from('rfqs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .gte('due_date', new Date().toISOString());

  // Get unread notifications
  const { count: unreadNotifications } = await supabase
    .from('vendor_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .eq('is_read', false);

  return {
    pendingProducts,
    approvedProducts,
    activeSubmissions,
    openRFQs: openRFQsCount || 0,
    quotesThisMonth: vendor.quotes_included_count,
    unreadNotifications: unreadNotifications || 0
  };
};

// =====================================================
// FILE UPLOAD HELPER
// =====================================================

/**
 * Upload datasheet to Supabase Storage
 */
export const uploadDatasheet = async (file: File, vendorId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${vendorId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('vendor-datasheets')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('vendor-datasheets')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    filename: file.name
  };
};

export const vendorService = {
  // Auth
  registerVendor,
  loginVendor,
  logoutVendor,
  getCurrentVendor,
  
  // Products
  submitProduct,
  getVendorProducts,
  updateProduct,
  
  // RFQs
  getOpenRFQs,
  getRFQDetails,
  
  // Responses
  submitRFQResponse,
  getVendorRFQResponses,
  
  // Notifications
  getVendorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  
  // Stats
  getVendorStats,
  
  // Files
  uploadDatasheet
};

export default vendorService;
