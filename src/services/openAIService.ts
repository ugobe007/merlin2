/**
 * OpenAI Service for BESS (Battery Energy Storage Systems) Expert Chat
 * Trained on energy storage data, market insights, and technical specifications
 */

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenAIService {
  private apiKey: string | null = null;
  private baseUrl = "https://api.openai.com/v1/chat/completions";

  // BESS Expert System Prompt - Enhanced with comprehensive market pricing intelligence
  private systemPrompt = `You are an expert AI consultant specializing in Battery Energy Storage Systems (BESS) with access to the latest market pricing and technical intelligence. You provide accurate, data-driven advice based on:

**Enhanced Pricing Intelligence (November 2025 - Market Validated):**
- BESS System Costs (NREL ATB 2024 & BloombergNEF):
  * Residential: $500-800/kWh installed (complete turnkey)
  * Commercial: $400-600/kWh installed (1-10 MW)
  * Utility-scale: $200-400/kWh installed (10+ MW)
- Battery Pack Prices: $132/kWh (BNEF Q4 2024) - down 20% from 2023
- Component Cost Breakdown:
  * Battery cells: ~50% of total system cost
  * PCS/Inverters: 20-25% of battery cost
  * Balance of system: 10-15% of battery cost
  * Integration: ~5% of total system

**Solar Integration Pricing (2025 Rates):**
- Utility-scale: $0.85-1.10/Wp installed
- Commercial: $1.20-1.60/Wp installed  
- Residential: $2.50-3.50/Wp installed
- Solar+Storage premium: 10-15% integration cost
- Optimal ratios: 1.2-1.5x solar-to-storage for max ROI

**Power Generation & Backup:**
- Diesel generators: $400-800/kW installed
- Natural gas: $500-900/kW installed
- Runtime costs: $0.15-0.35/kWh (fuel+maintenance)
- Hybrid systems: 40-60% fuel reduction possible

**Labor & Installation (Market-Aligned):**
- Electrical: $150-250/kWh battery capacity
- Civil/mechanical: $50-100/kWh capacity
- Commissioning: $25-50/kWh capacity
- Project management: 8-12% of equipment
- Regional multipliers: CA +25%, TX baseline, NE +20%

**Technical & Market Expertise:**
- Battery tech: Li-ion (NMC/LFP), flow batteries, CAES
- Grid integration, safety, thermal management
- Revenue streams: peak shaving, arbitrage, ancillary services
- Standards: UL, IEEE, utility interconnection
- Leading vendors: Tesla, LG Chem, CATL, BYD, Fluence

Always provide specific cost estimates, technical specs, and ROI analysis. Ask clarifying questions to optimize recommendations.`;

  constructor() {
    // Try to get API key from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;

    if (!this.apiKey) {
      console.warn("OpenAI API key not found. Set VITE_OPENAI_API_KEY in .env file");
    }
  }

  /**
   * Check if OpenAI service is configured and ready
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Send a chat message to OpenAI and get a response
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: OpenAIMessage[] = []
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      const messages: OpenAIMessage[] = [
        { role: "system", content: this.systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ];

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview", // Use GPT-4 for better technical knowledge
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7, // Balanced creativity and accuracy
          presence_penalty: 0.6, // Encourage variety in responses
          frequency_penalty: 0.3, // Reduce repetition
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI");
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenAI Service Error:", error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Get a context-aware fallback response when OpenAI is not available
   */
  private getFallbackResponse(userMessage: string): string {
    const input = userMessage.toLowerCase();

    // Enhanced fallback responses based on BESS expertise
    if (input.includes("size") || input.includes("sizing")) {
      return `**System Sizing Guidance** (Expert Mode)

For optimal BESS sizing, I need to understand your specific requirements:

**Power Requirements (kW/MW):**
- What's your peak demand or target power output?
- Residential: Typically 5-20 kW
- Commercial: 100 kW - 2 MW  
- Utility-scale: 1-100+ MW

**Energy Requirements (kWh/MWh):**
- How long do you need to run at full power?
- Short duration (1-2 hours): Frequency regulation, grid services
- Medium duration (2-6 hours): Peak shaving, load shifting
- Long duration (6+ hours): Backup power, renewable shifting

**Application Type:**
- Peak demand reduction
- Time-of-use arbitrage  
- Backup power
- Renewable integration
- Grid services

**Location & Utility:** This affects interconnection requirements and available incentives.

Could you provide more details about your project scope and primary objectives? I can then give you specific sizing recommendations and cost estimates.`;
    }

    if (input.includes("cost") || input.includes("price") || input.includes("roi")) {
      return `**BESS Cost Analysis** (Market Intelligence)

**Current Market Pricing (2025):**
- **Residential Systems:** $500-800/kWh installed
- **Commercial Systems:** $400-600/kWh installed  
- **Utility-Scale Systems:** $200-400/kWh installed

**Cost Components:**
- Battery cells: 40-50% of total cost
- Inverter/PCS: 15-20%
- Balance of system: 20-25%
- Installation & commissioning: 15-20%

**ROI Factors:**
- **Peak demand charges:** $10-50/kW/month savings
- **Time-of-use arbitrage:** $0.05-0.30/kWh spread
- **Backup value:** $1,000-5,000/year for critical operations
- **Tax incentives:** 30% ITC + MACRS depreciation

**Payback Timeline:**
- Commercial applications: 3-7 years
- Utility-scale projects: 5-10 years
- Residential systems: 5-12 years

Would you like me to calculate specific ROI projections for your use case? I can factor in your local utility rates, system size, and application type.`;
    }

    if (input.includes("use case") || input.includes("application")) {
      return `**BESS Use Case Analysis** (Application Engineering)

**Primary Revenue Streams:**

**1. Peak Shaving ($$$)**
- Reduce demand charges by discharging during peak periods
- Typical savings: $10-50/kW/month
- Best for: Commercial/industrial with high demand charges
- System requirements: 1-3 hour duration

**2. Time-of-Use Arbitrage ($$)**
- Store energy during low-cost periods, discharge during high-cost
- Profit margin: $0.05-0.30/kWh depending on rate spread
- Best for: Areas with significant TOU rate differences
- System requirements: 2-6 hour duration

**3. Backup Power ($$$)**
- Critical load support during outages
- Value: Avoided downtime costs + insurance premium
- Best for: Healthcare, data centers, manufacturing
- System requirements: 4-24+ hour duration

**4. Renewable Integration ($$)**
- Store excess solar/wind for later use
- Maximize renewable energy utilization
- Combine with net metering optimization
- System requirements: Match renewable generation profile

**5. Grid Services ($)**
- Frequency regulation, voltage support, capacity market
- Revenue: $50-200/kW/year depending on market
- Best for: Utility-scale systems with grid interconnection

What type of facility/application are you considering? I can provide tailored recommendations based on your specific situation.`;
    }

    if (input.includes("battery") || input.includes("technology") || input.includes("lithium")) {
      return `**Battery Technology Comparison** (Technical Specifications)

**Lithium-Ion Technologies:**

**1. Lithium Iron Phosphate (LFP/LiFePO4)**
- Safety: Excellent (most stable chemistry)
- Cycle life: 6,000-10,000 cycles
- Energy density: 120-160 Wh/kg
- Cost: Lower $/kWh
- Best for: Stationary storage, safety-critical applications

**2. Lithium Nickel Manganese Cobalt (NMC)**  
- Energy density: 150-250 Wh/kg
- Cycle life: 3,000-5,000 cycles
- Power density: High
- Cost: Moderate
- Best for: High energy density requirements

**3. Lithium Titanate (LTO)**
- Cycle life: 15,000+ cycles
- Fast charging capability
- Wide temperature range
- Higher cost per kWh
- Best for: Frequent cycling applications

**Alternative Technologies:**

**Flow Batteries (Vanadium, Zinc-Bromine)**
- Pros: Very long duration (4-12+ hours), 20+ year life
- Cons: Lower efficiency (70-80%), larger footprint
- Best for: Long duration storage applications

**System Integration Considerations:**
- Thermal management and safety systems
- Fire suppression (FM-200, water mist)
- Monitoring and control systems
- Grid interconnection and protection

What's your primary application? Duration requirements? I can recommend the optimal technology for your specific use case.`;
    }

    // Default comprehensive response
    return `I'm your BESS (Battery Energy Storage Systems) expert assistant! I can help you with comprehensive analysis and recommendations for energy storage projects.

**I specialize in:**
• **System Design:** Optimal sizing, technology selection, configuration
• **Financial Analysis:** Cost estimates, ROI calculations, incentive analysis  
• **Use Case Optimization:** Peak shaving, arbitrage, backup power, grid services
• **Technical Specifications:** Battery technologies, inverters, safety systems
• **Market Intelligence:** Current pricing, manufacturers, trends
• **Implementation:** Permitting, interconnection, installation considerations

**To provide the most accurate guidance, please share:**
- Project size or power requirements
- Primary objectives (cost savings, backup power, etc.)
- Location and utility company
- Budget considerations
- Timeline for implementation

**Quick Examples:**
- "Help me size a 100 kW system for peak shaving"
- "What's the ROI for a 2 MWh commercial battery system?"
- "Compare LFP vs NMC batteries for my application"
- "How do I integrate storage with my 500 kW solar array?"

What specific aspect of energy storage can I help you with today?`;
  }

  /**
   * Convert conversation messages to OpenAI format
   */
  formatConversationHistory(
    messages: Array<{ type: "user" | "ai"; content: string }>
  ): OpenAIMessage[] {
    return messages.map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content,
    }));
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
export default openAIService;
