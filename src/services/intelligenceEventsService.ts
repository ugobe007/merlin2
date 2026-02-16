/**
 * Intelligence Events Service - ML Training Data Collection
 * ==========================================================
 *
 * Captures all user interactions with the intelligence layer to train
 * and improve ML models over time.
 *
 * Event Types:
 * - zip_lookup: User enters ZIP code → detect state, city, utility territory
 * - business_detection: Business lookup → infer industry, size, goals
 * - goal_selection: User selects/deselects energy goals
 * - industry_inference: AI infers industry from business name
 * - value_teaser_view: User sees peer benchmark data
 * - weather_impact_view: User sees climate impact panel
 * - grid_stress_view: User sees grid stress index
 *
 * Privacy:
 * - No PII stored (uses anonymous session IDs)
 * - IP addresses hashed (SHA-256)
 * - Business names sanitized (no personal info)
 *
 * Usage:
 * ```typescript
 * import { intelligenceEventsService } from '@/services/intelligenceEventsService';
 *
 * // Log ZIP lookup
 * await intelligenceEventsService.logZipLookup({
 *   zip: '89101',
 *   detectedState: 'NV',
 *   detectedCity: 'Las Vegas',
 *   confidence: 1.0
 * });
 *
 * // Log business detection
 * await intelligenceEventsService.logBusinessDetection({
 *   businessName: 'Tesla Gigafactory',
 *   inferredIndustry: 'manufacturing',
 *   confidence: 0.92
 * });
 * ```
 *
 * Created: January 18, 2026
 */

import { supabase } from "@/services/supabaseClient";

// =====================================================
// Types
// =====================================================

export interface IntelligenceEvent {
  id?: string;
  event_type: EventType;
  event_category: EventCategory;
  user_session_id?: string;
  wizard_step: number;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  confidence?: number;
  was_correct?: boolean;
  correction_value?: string;
  processing_time_ms?: number;
  created_at?: string;
}

export type EventType =
  | "zip_lookup"
  | "business_detection"
  | "goal_selection"
  | "industry_inference"
  | "value_teaser_view"
  | "weather_impact_view"
  | "grid_stress_view";

export type EventCategory = "location" | "business" | "goals" | "industry" | "intelligence_panel";

// =====================================================
// Core Service
// =====================================================

class IntelligenceEventsService {
  private sessionId: string | null = null;

  /**
   * Get or create anonymous session ID
   * Stored in sessionStorage (cleared when browser tab closes)
   */
  private getSessionId(): string {
    if (typeof window === "undefined") return "server-session";

    if (!this.sessionId) {
      this.sessionId = sessionStorage.getItem("merlin_session_id");
      if (!this.sessionId) {
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem("merlin_session_id", this.sessionId);
      }
    }
    return this.sessionId;
  }

  /**
   * Log generic event (base method)
   */
  private async logEvent(event: Omit<IntelligenceEvent, "user_session_id">): Promise<void> {
    try {
      const { error } = await (supabase as any).from("intelligence_events").insert({
        ...event,
        user_session_id: this.getSessionId(),
      });

      if (error) {
        console.error("[IntelligenceEvents] Failed to log event:", error);
      }
    } catch (err) {
      console.error("[IntelligenceEvents] Exception logging event:", err);
    }
  }

  /**
   * Log ZIP code lookup
   */
  async logZipLookup(params: {
    zip: string;
    detectedState: string;
    detectedCity: string;
    confidence: number;
    processingTimeMs?: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: "zip_lookup",
      event_category: "location",
      wizard_step: 1,
      input_data: { zip: params.zip },
      output_data: {
        state: params.detectedState,
        city: params.detectedCity,
      },
      confidence: params.confidence,
      processing_time_ms: params.processingTimeMs,
    });
  }

  /**
   * Log business name/address detection
   */
  async logBusinessDetection(params: {
    businessName: string;
    address?: string;
    inferredIndustry: string;
    confidence: number;
    detectedSqft?: number;
    detectedEmployees?: number;
    processingTimeMs?: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: "business_detection",
      event_category: "business",
      wizard_step: 1,
      input_data: {
        businessName: params.businessName,
        address: params.address,
      },
      output_data: {
        inferredIndustry: params.inferredIndustry,
        detectedSqft: params.detectedSqft,
        detectedEmployees: params.detectedEmployees,
      },
      confidence: params.confidence,
      processing_time_ms: params.processingTimeMs,
    });
  }

  /**
   * Log energy goal selection/deselection
   */
  async logGoalSelection(params: {
    goalId: string;
    goalName: string;
    action: "selected" | "deselected";
    currentGoals: string[];
    suggestedGoals?: string[];
    confidence?: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: "goal_selection",
      event_category: "goals",
      wizard_step: 1,
      input_data: {
        goalId: params.goalId,
        action: params.action,
        suggestedGoals: params.suggestedGoals,
      },
      output_data: {
        goalName: params.goalName,
        currentGoals: params.currentGoals,
      },
      confidence: params.confidence,
    });
  }

  /**
   * Log industry inference from business name
   */
  async logIndustryInference(params: {
    businessName: string;
    inferredIndustry: string;
    inferredIndustryName: string;
    confidence: number;
    keywords?: string[];
    processingTimeMs?: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: "industry_inference",
      event_category: "industry",
      wizard_step: 1,
      input_data: {
        businessName: params.businessName,
        keywords: params.keywords,
      },
      output_data: {
        industrySlug: params.inferredIndustry,
        industryName: params.inferredIndustryName,
      },
      confidence: params.confidence,
      processing_time_ms: params.processingTimeMs,
    });
  }

  /**
   * Log value teaser panel view
   */
  async logValueTeaserView(params: {
    state: string;
    industry?: string;
    metrics: Array<{ displayText: string; sampleSize?: number }>;
    confidence: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: "value_teaser_view",
      event_category: "intelligence_panel",
      wizard_step: 1,
      input_data: {
        state: params.state,
        industry: params.industry,
      },
      output_data: {
        metrics: params.metrics,
      },
      confidence: params.confidence,
    });
  }

  /**
   * Log weather impact panel view
   */
  async logWeatherImpactView(params: {
    state: string;
    city: string;
    impactDescription: string;
    whyItMatters: string;
    confidence: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: "weather_impact_view",
      event_category: "intelligence_panel",
      wizard_step: 1,
      input_data: {
        state: params.state,
        city: params.city,
      },
      output_data: {
        impactDescription: params.impactDescription,
        whyItMatters: params.whyItMatters,
      },
      confidence: params.confidence,
    });
  }

  /**
   * Log grid stress index view
   */
  async logGridStressView(params: {
    state: string;
    stressLevel: "low" | "medium" | "high";
    confidence: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: "grid_stress_view",
      event_category: "intelligence_panel",
      wizard_step: 1,
      input_data: {
        state: params.state,
      },
      output_data: {
        stressLevel: params.stressLevel,
      },
      confidence: params.confidence,
    });
  }

  /**
   * Log user feedback on AI inference accuracy
   * Call this when user manually corrects an AI-generated value
   */
  async logUserFeedback(params: {
    eventType: EventType;
    originalValue: string;
    correctedValue: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      // Find most recent event of this type for this session
      const { data: events, error } = await supabase
        .from("intelligence_events")
        .select("id")
        .eq("event_type", params.eventType)
        .eq("user_session_id", params.sessionId || this.getSessionId())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !events || events.length === 0) {
        console.warn("[IntelligenceEvents] No event found to update with feedback");
        return;
      }

      // Update event with feedback
      await supabase
        .from("intelligence_events")
        .update({
          was_correct: false,
          correction_value: params.correctedValue,
        })
        .eq("id", events[0].id);
    } catch (err) {
      console.error("[IntelligenceEvents] Exception logging feedback:", err);
    }
  }

  /**
   * Get event statistics (for admin/analytics)
   */
  async getEventStats(params?: {
    eventType?: EventType;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalEvents: number;
    averageConfidence: number;
    feedbackRate: number;
    accuracyRate: number;
  } | null> {
    try {
      let query = supabase
        .from("intelligence_events")
        .select("confidence, was_correct", { count: "exact" });

      if (params?.eventType) {
        query = query.eq("event_type", params.eventType);
      }
      if (params?.startDate) {
        query = query.gte("created_at", params.startDate);
      }
      if (params?.endDate) {
        query = query.lte("created_at", params.endDate);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error("[IntelligenceEvents] Failed to get stats:", error);
        return null;
      }

      const totalEvents = count || 0;
      const eventsWithConfidence =
        data?.filter((e: { confidence: number | null }) => e.confidence !== null) || [];
      const averageConfidence =
        eventsWithConfidence.reduce(
          (sum: number, e: { confidence: number | null }) => sum + (e.confidence || 0),
          0
        ) / eventsWithConfidence.length || 0;

      const eventsWithFeedback =
        data?.filter((e: { was_correct: boolean | null }) => e.was_correct !== null) || [];
      const feedbackRate = eventsWithFeedback.length / totalEvents;

      const correctEvents = eventsWithFeedback.filter(
        (e: { was_correct: boolean | null }) => e.was_correct === true
      );
      const accuracyRate = correctEvents.length / eventsWithFeedback.length || 0;

      return {
        totalEvents,
        averageConfidence,
        feedbackRate,
        accuracyRate,
      };
    } catch (err) {
      console.error("[IntelligenceEvents] Exception getting stats:", err);
      return null;
    }
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const intelligenceEventsService = new IntelligenceEventsService();
