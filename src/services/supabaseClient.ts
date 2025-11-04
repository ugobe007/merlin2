import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Please add them to your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database Types
export interface Vendor {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  specialty: 'battery' | 'inverter' | 'ems' | 'bos' | 'epc' | 'integrator';
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_submissions: number;
  approved_submissions: number;
  quotes_included_count: number;
}

export interface VendorProduct {
  id: string;
  vendor_id: string;
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
  currency: string;
  lead_time_weeks: number;
  warranty_years: number;
  minimum_order_quantity: number;
  certifications?: string[];
  certification_docs?: Record<string, any>;
  datasheet_url?: string;
  datasheet_filename?: string;
  status: 'pending' | 'approved' | 'rejected' | 'discontinued';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  times_quoted: number;
  times_selected: number;
}

export interface RFQ {
  id: string;
  rfq_number: string;
  project_name: string;
  system_size_mw: number;
  duration_hours: number;
  location: string;
  state_province?: string;
  country: string;
  requirements?: string;
  preferred_chemistry?: string;
  delivery_deadline?: string;
  due_date: string;
  project_start_date?: string;
  status: 'draft' | 'open' | 'closed' | 'awarded' | 'cancelled';
  target_specialties?: string[];
  invited_vendors?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  response_count: number;
}

export interface RFQResponse {
  id: string;
  rfq_id: string;
  vendor_id: string;
  total_price: number;
  currency: string;
  lead_time_weeks: number;
  warranty_years: number;
  pricing_breakdown: Record<string, any>;
  technical_proposal?: string;
  value_proposition?: string;
  proposal_document_url?: string;
  proposal_filename?: string;
  supporting_docs?: Record<string, any>;
  status: 'draft' | 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected';
  evaluation_score?: number;
  evaluation_notes?: string;
  evaluated_by?: string;
  evaluated_at?: string;
  submitted_at: string;
  updated_at: string;
}

export interface VendorNotification {
  id: string;
  vendor_id: string;
  type: string;
  title: string;
  message: string;
  related_rfq_id?: string;
  related_product_id?: string;
  is_read: boolean;
  read_at?: string;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export default supabase;
