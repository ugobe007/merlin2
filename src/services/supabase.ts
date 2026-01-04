/**
 * Supabase Client
 * Provides database connection for AI data collection and storage
 */

import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      battery_pricing: {
        Row: {
          id: number;
          date: string;
          source: string;
          systemSize: string;
          pricePerKWh: number;
          chemistry: string;
          region: string;
          includes: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["battery_pricing"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["battery_pricing"]["Insert"]>;
      };
      product_catalog: {
        Row: {
          id: number;
          manufacturer: string;
          model: string;
          category: string;
          capacity?: number;
          power?: number;
          chemistry?: string;
          efficiency?: number;
          warranty: number;
          cycleLife: number;
          price?: number;
          availability: string;
          leadTimeDays?: number;
          certifications: string[];
          lastUpdated: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_catalog"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["product_catalog"]["Insert"]>;
      };
      financing_options: {
        Row: {
          id: number;
          provider: string;
          type: string;
          interestRate?: number;
          term: number;
          minProjectSize?: number;
          maxProjectSize?: number;
          region: string[];
          sector: string[];
          requirements: string[];
          incentivesIncluded: string[];
          lastUpdated: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["financing_options"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["financing_options"]["Insert"]>;
      };
      industry_news: {
        Row: {
          id: number;
          title: string;
          source: string;
          category: string;
          summary: string;
          url: string;
          publishDate: string;
          relevanceScore: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["industry_news"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["industry_news"]["Insert"]>;
      };
      incentive_programs: {
        Row: {
          id: number;
          name: string;
          state?: string;
          region: string;
          type: string;
          value: string;
          eligibility: string[];
          deadline?: string;
          status: string;
          applicationLink?: string;
          lastUpdated: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["incentive_programs"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["incentive_programs"]["Insert"]>;
      };
      data_collection_log: {
        Row: {
          id: number;
          collection_date: string;
          duration_seconds?: number;
          status: string;
          items_collected?: number;
          error_message?: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["data_collection_log"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["data_collection_log"]["Insert"]>;
      };
    };
  };
}
