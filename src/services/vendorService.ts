import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { VendorProduct, RFQ, VendorNotification } from "./supabaseClient";

// =====================================================
// VENDOR AUTHENTICATION
// =====================================================

export interface VendorRegistrationData {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  password: string;
  specialty: "battery" | "inverter" | "ems" | "bos" | "epc" | "integrator";
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
    throw new Error("Supabase is not configured");
  }

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          user_type: "vendor",
          company_name: data.company_name,
          contact_name: data.contact_name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create user");

    // 2. Create vendor profile (status: pending by default)
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        id: authData.user.id,
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        website: data.website,
        description: data.description,
        status: "pending",
      })
      .select()
      .single();

    if (vendorError) throw vendorError;

    return {
      success: true,
      vendor: vendorData,
      message: "Registration successful! Your account is pending approval.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Registration failed",
    };
  }
};

/**
 * Login vendor
 */
export const loginVendor = async (data: VendorLoginData) => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Login failed");

    // Get vendor profile
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (vendorError) throw vendorError;
    if (!vendorData) throw new Error("Vendor profile not found");

    // Check if approved
    if (vendorData.status === "pending") {
      await supabase.auth.signOut();
      throw new Error("Your account is pending approval. Please wait for admin review.");
    }

    if (vendorData.status === "rejected" || vendorData.status === "suspended") {
      await supabase.auth.signOut();
      throw new Error("Your account is not active. Please contact support.");
    }

    // Update last login
    await supabase
      .from("vendors")
      .update({ last_login: new Date().toISOString() })
      .eq("id", authData.user.id);

    return {
      success: true,
      vendor: vendorData,
      session: authData.session,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Login failed",
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) throw error;
  return vendor;
};

// =====================================================
// VENDOR PRODUCTS
// =====================================================

export interface ProductSubmissionData {
  product_category: "battery" | "inverter" | "ems" | "bos" | "container";
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
  if (!vendor) throw new Error("Not authenticated");

  const { data: product, error } = await supabase
    .from("vendor_products")
    .insert({
      vendor_id: vendor.id,
      ...data,
      currency: "USD",
      status: "pending",
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
  if (!vendor) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("vendor_products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as VendorProduct[];
};

/**
 * Update a product
 */
export const updateProduct = async (productId: string, updates: Partial<ProductSubmissionData>) => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("vendor_products")
    .update(updates)
    .eq("id", productId)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Approve a vendor product (Admin only)
 * This triggers automatic integration into pricing system and ML training
 *
 * Optionally validates product before approval if autoValidate is true
 */
export const approveVendorProduct = async (
  productId: string,
  adminId: string,
  options?: { autoValidate?: boolean; skipValidation?: boolean }
) => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    // Auto-validate if requested (unless explicitly skipped)
    if (options?.autoValidate && !options?.skipValidation) {
      const { validateVendorProductById } = await import("./vendorValidationService");
      const validation = await validateVendorProductById(productId);

      if (!validation.isValid) {
        return {
          success: false,
          error: "Product validation failed",
          validation,
          message: `Product validation score: ${(validation.score * 100).toFixed(0)}%. Requires manual review.`,
        };
      }

      if (import.meta.env.DEV) {
        console.log(`✅ Product validation passed: ${(validation.score * 100).toFixed(0)}%`);
      }
    }

    // Update product status to approved
    const { data: product, error: updateError } = await supabase
      .from("vendor_products")
      .update({
        status: "approved",
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!product) throw new Error("Product not found");

    // Trigger integration services (async, don't wait)
    Promise.all([
      // Sync to equipment_pricing table
      (async () => {
        const { vendorPricingIntegrationService } =
          await import("./vendorPricingIntegrationService");
        return vendorPricingIntegrationService.syncVendorProductOnApproval(productId);
      })(),
      // Add to ML training data
      (async () => {
        const { vendorDataToMLService } = await import("./vendorDataToMLService");
        return vendorDataToMLService.addVendorDataToMLTraining(productId);
      })(),
      // Send approval email notification
      sendVendorProductApprovalEmail(product, adminId),
    ]).catch((err) => {
      console.error("Error triggering vendor product integration:", err);
      // Don't throw - integration is async, approval succeeded
    });

    return {
      success: true,
      product,
      message: "Product approved and integration triggered",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to approve product",
    };
  }
};

/**
 * Auto-approve vendor product if validation passes
 * Returns approval result or validation issues
 */
export const autoApproveVendorProduct = async (productId: string, adminId: string) => {
  const { validateVendorProductById } = await import("./vendorValidationService");
  const validation = await validateVendorProductById(productId);

  if (validation.isValid && validation.score >= 0.8) {
    // Auto-approve
    return await approveVendorProduct(productId, adminId, { skipValidation: true });
  } else {
    // Return validation results for manual review
    return {
      success: false,
      autoApproved: false,
      validation,
      message: `Product requires manual review. Validation score: ${(validation.score * 100).toFixed(0)}%`,
    };
  }
};

/**
 * Reject a vendor product (Admin only)
 */
export const rejectVendorProduct = async (productId: string, adminId: string, reason: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    const { data: product, error: updateError } = await supabase
      .from("vendor_products")
      .update({
        status: "rejected",
        approved_by: adminId,
        rejection_reason: reason,
      })
      .eq("id", productId)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!product) throw new Error("Product not found");

    // Send rejection email notification (async, don't wait)
    sendVendorProductRejectionEmail(product, adminId, reason).catch((err) => {
      console.error("Error sending rejection email:", err);
    });

    return {
      success: true,
      product,
      message: "Product rejected",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to reject product",
    };
  }
};

// =====================================================
// RFQs (REQUEST FOR QUOTES)
// =====================================================

export interface CreateRFQData {
  projectName: string;
  systemSizeMW: number;
  durationHours: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  location: string;
  useCase: string;
  isPremium: boolean;

  // Customer info
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;

  // Requirements
  requirements?: {
    batteryManufacturer?: string;
    batteryModel?: string;
    inverterManufacturer?: string;
    inverterModel?: string;
    minWarrantyYears?: number;
    minCycleLife?: number;
    requiredCertifications?: string[];
  };

  // Pricing from SSOT
  standardQuoteCost: number;
  premiumQuoteCost?: number;

  // Timeline
  projectTimeline?: "immediate" | "3-months" | "6-months" | "12-months";
}

/**
 * Create a new RFQ (Request for Quote) from customer quote
 *
 * SSOT: Uses data processed through unifiedQuoteCalculator
 * AAD: Accurate pricing from calculateQuote() + premium comparison
 * Workflow: Creates RFQ → Notifies relevant vendors → Vendors respond
 */
export const createRFQ = async (data: CreateRFQData) => {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured - RFQ stored locally");
    return {
      success: true,
      rfqId: `local-${Date.now()}`,
      message: "Quote request saved (offline mode)",
    };
  }

  try {
    // Generate RFQ number
    const rfqNumber = `RFQ-${data.isPremium ? "P" : "S"}-${Date.now().toString(36).toUpperCase()}`;

    // Calculate due date (7 days for standard, 14 for premium)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (data.isPremium ? 14 : 7));

    // Create RFQ record
    const { data: rfq, error: rfqError } = await supabase
      .from("rfqs")
      .insert({
        rfq_number: rfqNumber,
        project_name: data.projectName,
        system_size_mw: data.systemSizeMW,
        duration_hours: data.durationHours,
        solar_mw: data.solarMW || 0,
        wind_mw: data.windMW || 0,
        generator_mw: data.generatorMW || 0,
        location: data.location,
        use_case: data.useCase,
        is_premium: data.isPremium,

        // Customer info
        customer_email: data.customerEmail,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,

        // Requirements (stored as JSONB)
        requirements: data.requirements || {},

        // Pricing reference (SSOT data)
        estimated_budget_min: Math.round(data.standardQuoteCost * 0.9),
        estimated_budget_max: Math.round((data.premiumQuoteCost || data.standardQuoteCost) * 1.1),

        // Status
        status: "open",
        due_date: dueDate.toISOString(),
        responses_count: 0,
      })
      .select()
      .single();

    if (rfqError) throw rfqError;

    // Notify relevant vendors based on specialty and capacity
    await notifyRelevantVendors(rfq.id, data);

    return {
      success: true,
      rfqId: rfq.id,
      rfqNumber: rfq.rfq_number,
      message: data.isPremium
        ? "Premium quote request submitted! Qualified vendors will respond within 14 days."
        : "Quote request submitted! Vendors will respond within 7 days.",
    };
  } catch (error: any) {
    console.error("Error creating RFQ:", error);
    return {
      success: false,
      error: error.message || "Failed to create quote request",
    };
  }
};

/**
 * Notify vendors who match the RFQ requirements
 */
async function notifyRelevantVendors(rfqId: string, data: CreateRFQData) {
  try {
    // Get vendors that match (approved, specialty matches)
    const specialties = ["battery", "inverter", "integrator", "epc"];

    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("id, email, company_name, specialty")
      .eq("status", "approved")
      .in("specialty", specialties);

    if (error || !vendors?.length) {
      console.log("No matching vendors found for RFQ notification");
      return;
    }

    // Create notifications for each vendor
    const notifications = vendors.map((vendor) => ({
      vendor_id: vendor.id,
      type: data.isPremium ? "premium_rfq" : "new_rfq",
      title: data.isPremium
        ? `🌟 Premium RFQ: ${data.projectName}`
        : `New RFQ: ${data.projectName}`,
      message:
        `${data.systemSizeMW.toFixed(2)} MW / ${data.durationHours}h system in ${data.location}. ` +
        `Use case: ${data.useCase}. ` +
        (data.isPremium ? "Premium equipment required." : ""),
      rfq_id: rfqId,
      is_read: false,
    }));

    await supabase.from("vendor_notifications").insert(notifications);

    // Queue email notifications (processed by background job)
    await queueVendorEmails(vendors, data, rfqId);
  } catch (error) {
    console.error("Error notifying vendors:", error);
  }
}

/**
 * Queue emails to vendors about new RFQ
 */
async function queueVendorEmails(
  vendors: { id: string; email: string; company_name: string; specialty: string }[],
  data: CreateRFQData,
  rfqId: string
) {
  try {
    const emailJobs = vendors.map((vendor) => ({
      vendor_id: vendor.id,
      email_type: "rfq_notification",
      to_email: vendor.email,
      subject: data.isPremium
        ? `🌟 Premium Quote Opportunity: ${data.projectName}`
        : `New Quote Opportunity: ${data.projectName}`,
      template_data: {
        vendorName: vendor.company_name,
        projectName: data.projectName,
        systemSize: `${data.systemSizeMW.toFixed(2)} MW`,
        duration: `${data.durationHours} hours`,
        location: data.location,
        useCase: data.useCase,
        isPremium: data.isPremium,
        requirements: data.requirements,
        rfqId: rfqId,
        portalUrl: `${window.location.origin}/vendor-portal?rfq=${rfqId}`,
      },
      status: "queued",
      created_at: new Date().toISOString(),
    }));

    await supabase.from("email_queue").insert(emailJobs);
  } catch (error) {
    console.error("Error queuing vendor emails:", error);
  }
}

/**
 * Get open RFQs for vendor
 */
export const getOpenRFQs = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("rfqs")
    .select("*")
    .eq("status", "open")
    .gte("due_date", new Date().toISOString())
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data as RFQ[];
};

/**
 * Get RFQ details
 */
export const getRFQDetails = async (rfqId: string) => {
  const { data, error } = await supabase.from("rfqs").select("*").eq("id", rfqId).single();

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
  if (!vendor) throw new Error("Not authenticated");

  const { data: response, error } = await supabase
    .from("rfq_responses")
    .insert({
      vendor_id: vendor.id,
      currency: "USD",
      status: "submitted",
      ...data,
    })
    .select()
    .single();

  if (error) throw error;

  // Update RFQ response count
  await supabase.rpc("increment_rfq_responses", { rfq_id: data.rfq_id });

  return response;
};

/**
 * Get vendor's RFQ responses
 */
export const getVendorRFQResponses = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("rfq_responses")
    .select(
      `
      *,
      rfqs (
        rfq_number,
        project_name,
        system_size_mw,
        duration_hours,
        location
      )
    `
    )
    .eq("vendor_id", vendor.id)
    .order("submitted_at", { ascending: false });

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
  if (!vendor) throw new Error("Not authenticated");

  let query = supabase.from("vendor_notifications").select("*").eq("vendor_id", vendor.id);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data as VendorNotification[];
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId: string) => {
  const { error } = await supabase
    .from("vendor_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) throw error;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async () => {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("vendor_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("vendor_id", vendor.id)
    .eq("is_read", false);

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
  if (!vendor) throw new Error("Not authenticated");

  // Get products stats
  const { data: products } = await supabase
    .from("vendor_products")
    .select("status")
    .eq("vendor_id", vendor.id);

  const pendingProducts = products?.filter((p) => p.status === "pending").length || 0;
  const approvedProducts = products?.filter((p) => p.status === "approved").length || 0;

  // Get RFQ responses stats
  const { data: responses } = await supabase
    .from("rfq_responses")
    .select("status")
    .eq("vendor_id", vendor.id);

  const activeSubmissions =
    responses?.filter((r) => ["submitted", "under_review"].includes(r.status)).length || 0;

  // Get open RFQs count
  const { count: openRFQsCount } = await supabase
    .from("rfqs")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")
    .gte("due_date", new Date().toISOString());

  // Get unread notifications
  const { count: unreadNotifications } = await supabase
    .from("vendor_notifications")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendor.id)
    .eq("is_read", false);

  return {
    pendingProducts,
    approvedProducts,
    activeSubmissions,
    openRFQs: openRFQsCount || 0,
    quotesThisMonth: vendor.quotes_included_count,
    unreadNotifications: unreadNotifications || 0,
  };
};

// =====================================================
// FILE UPLOAD HELPER
// =====================================================

/**
 * Upload datasheet to Supabase Storage
 */
export const uploadDatasheet = async (file: File, vendorId: string) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${vendorId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage.from("vendor-datasheets").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("vendor-datasheets").getPublicUrl(fileName);

  return {
    url: publicUrl,
    filename: file.name,
  };
};

// =====================================================
// EMAIL NOTIFICATIONS
// =====================================================

/**
 * Send email notification when vendor product is approved
 */
async function sendVendorProductApprovalEmail(product: any, adminId: string): Promise<void> {
  try {
    // Get vendor info
    const { data: vendor } = await supabase
      .from("vendors")
      .select("email, company_name, contact_name")
      .eq("id", product.vendor_id)
      .single();

    if (!vendor || !vendor.email) {
      if (import.meta.env.DEV) {
        console.warn("⚠️ No vendor email found for approval notification");
      }
      return;
    }

    // Queue email (using email_queue table if available)
    const { error } = await supabase.from("email_queue").insert({
      to_email: vendor.email,
      subject: `✅ Product Approved: ${product.manufacturer} ${product.model}`,
      body: `
          <h2>Product Approved!</h2>
          <p>Dear ${vendor.contact_name || "Vendor"},</p>
          <p>Your product submission has been approved and is now active in our pricing system:</p>
          <ul>
            <li><strong>Product:</strong> ${product.manufacturer} ${product.model}</li>
            <li><strong>Category:</strong> ${product.product_category}</li>
            ${product.price_per_kwh ? `<li><strong>Price:</strong> $${product.price_per_kwh}/kWh</li>` : ""}
            ${product.price_per_kw ? `<li><strong>Price:</strong> $${product.price_per_kw}/kW</li>` : ""}
          </ul>
          <p>Your product is now available for use in quotes and will be included in our ML pricing analysis.</p>
          <p>Thank you for partnering with Merlin Energy Solutions!</p>
        `,
      email_type: "vendor_product_approved",
      status: "queued",
      created_at: new Date().toISOString(),
    });

    if (error && !error.message.includes("does not exist")) {
      console.error("Error queuing approval email:", error);
    } else if (import.meta.env.DEV) {
      console.log(`✅ Approval email queued for ${vendor.email}`);
    }
  } catch (error) {
    console.error("Error sending approval email:", error);
  }
}

/**
 * Send email notification when vendor product is rejected
 */
async function sendVendorProductRejectionEmail(
  product: any,
  adminId: string,
  reason: string
): Promise<void> {
  try {
    // Get vendor info
    const { data: vendor } = await supabase
      .from("vendors")
      .select("email, company_name, contact_name")
      .eq("id", product.vendor_id)
      .single();

    if (!vendor || !vendor.email) {
      if (import.meta.env.DEV) {
        console.warn("⚠️ No vendor email found for rejection notification");
      }
      return;
    }

    // Queue email
    const { error } = await supabase.from("email_queue").insert({
      to_email: vendor.email,
      subject: `Product Review Required: ${product.manufacturer} ${product.model}`,
      body: `
          <h2>Product Review Required</h2>
          <p>Dear ${vendor.contact_name || "Vendor"},</p>
          <p>Your product submission requires additional review before approval:</p>
          <ul>
            <li><strong>Product:</strong> ${product.manufacturer} ${product.model}</li>
            <li><strong>Category:</strong> ${product.product_category}</li>
            <li><strong>Reason:</strong> ${reason}</li>
          </ul>
          <p>Please review your submission and resubmit with the requested corrections. If you have questions, please contact our support team.</p>
          <p>Thank you for your partnership with Merlin Energy Solutions.</p>
        `,
      email_type: "vendor_product_rejected",
      status: "queued",
      created_at: new Date().toISOString(),
    });

    if (error && !error.message.includes("does not exist")) {
      console.error("Error queuing rejection email:", error);
    } else if (import.meta.env.DEV) {
      console.log(`✅ Rejection email queued for ${vendor.email}`);
    }
  } catch (error) {
    console.error("Error sending rejection email:", error);
  }
}

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
  approveVendorProduct,
  rejectVendorProduct,
  autoApproveVendorProduct,

  // RFQs
  createRFQ,
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
  uploadDatasheet,
};

export default vendorService;
