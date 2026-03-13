/**
 * Merlin Widget - Embed Script
 *
 * Lightweight script that partners add to their sites.
 * Creates an iframe containing the widget calculator.
 *
 * Usage:
 * <div id="merlin-widget" data-industry="hotel"></div>
 * <script src="https://widget.merlin.energy/embed.js"></script>
 * <script>
 *   MerlinWidget.init({
 *     apiKey: 'pk_live_xxxxx',
 *     industry: 'hotel',
 *     theme: 'light',
 *     primaryColor: '#3ecf8e'
 *   });
 * </script>
 */

(function () {
  "use strict";

  const WIDGET_VERSION = "1.0.0";
  const WIDGET_BASE_URL = "https://widget.merlin.energy"; // TODO: Update for production

  // ============================================================================
  // Widget Config
  // ============================================================================

  interface WidgetConfig {
    apiKey: string;
    industry: string;
    theme?: "light" | "dark";
    primaryColor?: string;
    logo?: string;
    hideAttribution?: boolean;
    onQuoteGenerated?: (quote: unknown) => void;
    onError?: (error: { message: string }) => void;
  }

  // ============================================================================
  // MerlinWidget Class
  // ============================================================================

  class MerlinWidgetManager {
    private config: WidgetConfig | null = null;
    private iframe: HTMLIFrameElement | null = null;
    private container: HTMLElement | null = null;

    /**
     * Initialize the widget
     */
    init(config: WidgetConfig) {
      this.config = config;

      // Validate config
      if (!config.apiKey) {
        console.error("[Merlin Widget] API key required");
        return;
      }

      if (!config.industry) {
        console.error("[Merlin Widget] Industry required");
        return;
      }

      // Find container
      this.container = document.getElementById("merlin-widget");
      if (!this.container) {
        console.error("[Merlin Widget] Container #merlin-widget not found");
        return;
      }

      // Create iframe
      this.createIframe();

      // Setup message listener
      this.setupMessageListener();

      console.log(`[Merlin Widget] v${WIDGET_VERSION} initialized`);
    }

    /**
     * Create iframe and inject into container
     */
    private createIframe() {
      if (!this.container || !this.config) return;

      // Build iframe URL with query params
      const params = new URLSearchParams({
        apiKey: this.config.apiKey,
        industry: this.config.industry,
        theme: this.config.theme || "light",
        primaryColor: this.config.primaryColor || "#3ecf8e",
        logo: this.config.logo || "",
        hideAttribution: String(this.config.hideAttribution || false),
      });

      const iframeUrl = `${WIDGET_BASE_URL}/calculator?${params.toString()}`;

      // Create iframe element
      this.iframe = document.createElement("iframe");
      this.iframe.src = iframeUrl;
      this.iframe.style.width = "100%";
      this.iframe.style.height = "600px";
      this.iframe.style.border = "none";
      this.iframe.style.borderRadius = "12px";
      this.iframe.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";

      // Append to container
      this.container.appendChild(this.iframe);

      // Track widget load
      this.trackEvent("widget_loaded");
    }

    /**
     * Listen for messages from iframe
     */
    private setupMessageListener() {
      window.addEventListener("message", (event) => {
        // Verify origin
        if (event.origin !== WIDGET_BASE_URL) return;

        const message = event.data;

        // Handle quote generated
        if (message.type === "quote_generated" && this.config?.onQuoteGenerated) {
          this.config.onQuoteGenerated(message.data);
          this.trackEvent("quote_completed");
        }

        // Handle errors
        if (message.type === "error" && this.config?.onError) {
          this.config.onError(message.data);
          this.trackEvent("error");
        }

        // Handle resize
        if (message.type === "resize" && this.iframe) {
          this.iframe.style.height = `${message.height}px`;
        }
      });
    }

    /**
     * Track widget events (analytics)
     */
    private trackEvent(event: string) {
      if (!this.config) return;

      // Fire tracking pixel (async, non-blocking)
      const trackingUrl = `${WIDGET_BASE_URL}/api/v1/widget/track`;
      const trackingData = {
        event,
        apiKey: this.config.apiKey,
        industry: this.config.industry,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      fetch(trackingUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingData),
      }).catch(() => {
        // Silently fail tracking (don't break widget)
      });
    }
  }

  // ============================================================================
  // Expose Global API
  // ============================================================================

  (window as unknown as Window & { MerlinWidget: MerlinWidgetManager }).MerlinWidget =
    new MerlinWidgetManager();
})();
