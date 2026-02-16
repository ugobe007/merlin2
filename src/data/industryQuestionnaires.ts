/**
 * Industry-Specific Questionnaires for Step 2 Use Case Collection
 *
 * Each industry has:
 * - title: Display title for the questionnaire
 * - icon: Emoji icon for visual identification
 * - questions: Array of question objects with various types (number, select, multi-select)
 * - insights: Context-specific tips and recommendations based on user answers
 *
 * Question types:
 * - number: Numeric input with optional suffix (e.g., "100 MW")
 * - select: Single-select dropdown
 * - multi-select: Multiple selection checkboxes
 *
 * Conditional logic:
 * - conditional: { field: 'otherField', operator: '>' | '==' | '<', value: any }
 * - dependsOn: { field: 'otherField', value: 'expectedValue' }
 */

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface QuestionConditional {
  field?: string;
  operator?: ">" | "==" | "<" | ">=" | "!=";
  value?: any;
  dependsOn?: string; // Alternative conditional syntax
}

export interface Question {
  id: string;
  label?: string;
  question?: string; // Alternative to label (for compatibility with useCaseTemplates)
  type:
    | "number"
    | "number_stepper"
    | "select"
    | "multi-select"
    | "multiselect"
    | "buttons"
    | "toggle"
    | "slider";
  placeholder?: string;
  suffix?: string;
  unit?: string; // Alternative to suffix (for compatibility with useCaseTemplates)
  options?: (QuestionOption | string)[]; // Allow both formats
  conditional?: QuestionConditional;
  helpText?: string; // Display help text under question
}

export interface IndustryQuestionnaire {
  title: string;
  icon: string;
  questions: Question[];
  insights: Record<string, string>;
}

export const industryQuestionnaires: Record<string, IndustryQuestionnaire> = {
  "ev-charging": {
    title: "EV Charging Station Configuration",
    icon: "🔌",
    questions: [
      {
        id: "stationType",
        label: "What type of charging station?",
        type: "buttons",
        options: [
          {
            value: "public-highway",
            label: "Public Highway",
            icon: "🛣️",
            description: "Travel Center",
          },
          { value: "public-urban", label: "Public Urban", icon: "🏢", description: "City Center" },
          { value: "workplace", label: "Workplace", icon: "🏢", description: "Corporate" },
          { value: "retail", label: "Retail", icon: "🛒", description: "Shopping Center" },
          { value: "multifamily", label: "Multi-family", icon: "🏠", description: "Residential" },
          { value: "fleet", label: "Fleet/Depot", icon: "🚛", description: "Charging" },
          {
            value: "destination",
            label: "Destination",
            icon: "🏨",
            description: "Hotel/Restaurant",
          },
        ],
      },
      {
        id: "level2Chargers",
        label: "Level 2 Chargers (7-19 kW)",
        type: "number_stepper",
        placeholder: "e.g., 20",
        suffix: "chargers",
      },
      {
        id: "level2Power",
        label: "Level 2 Power per Charger",
        type: "buttons",
        options: [
          { value: "7", label: "7 kW", icon: "🔋", description: "Basic Level 2" },
          { value: "11", label: "11 kW", icon: "🔋", description: "Standard Level 2" },
          { value: "19", label: "19 kW", icon: "⚡", description: "High-Power Level 2" },
        ],
        conditional: { field: "level2Chargers", operator: ">", value: 0 },
      },
      {
        id: "dcFastChargers",
        label: "DC Fast Chargers (50-350 kW)",
        type: "number_stepper",
        placeholder: "e.g., 8",
        suffix: "chargers",
      },
      {
        id: "dcFastPower",
        label: "DC Fast Charger Power",
        type: "buttons",
        options: [
          { value: "50", label: "50 kW", icon: "⚡", description: "Standard DC Fast" },
          { value: "150", label: "150 kW", icon: "⚡⚡", description: "High-Power DC Fast" },
          { value: "250", label: "250 kW", icon: "🚀", description: "Ultra-Fast" },
          { value: "350", label: "350 kW", icon: "🚀", description: "Ultra-Fast+" },
        ],
        conditional: { field: "dcFastChargers", operator: ">", value: 0 },
      },
      {
        id: "utilizationProfile",
        label: "Expected utilization pattern?",
        type: "buttons",
        options: [
          { value: "low", label: "Low", icon: "📉", description: "10-25% avg utilization" },
          { value: "medium", label: "Medium", icon: "📊", description: "25-50% avg utilization" },
          { value: "high", label: "High", icon: "📈", description: "50-75% avg utilization" },
          {
            value: "very-high",
            label: "Very High",
            icon: "🔥",
            description: "75%+ avg utilization",
          },
          { value: "custom", label: "Custom", icon: "⚙️", description: "I know my exact rates" },
        ],
      },
      {
        id: "customUtilization",
        label: "Average utilization rate (%)",
        type: "number_stepper",
        placeholder: "e.g., 65",
        suffix: "%",
        conditional: { field: "utilizationProfile", operator: "==", value: "custom" },
      },
      {
        id: "peakConcurrency",
        label: "Peak simultaneous charging (%)",
        type: "buttons",
        options: [
          { value: "30", label: "30%", icon: "🌾", description: "Rural/Low Traffic" },
          { value: "50", label: "50%", icon: "🏘️", description: "Suburban/Medium Traffic" },
          { value: "70", label: "70%", icon: "🏙️", description: "Urban/High Traffic" },
          { value: "85", label: "85%", icon: "🛣️", description: "Highway/Travel Centers" },
          { value: "100", label: "100%", icon: "🚛", description: "Fleet/Depot - All at once" },
        ],
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          {
            value: "on-grid",
            label: "On-Grid",
            icon: "🔌",
            description: "Full utility connection",
          },
          {
            value: "limited",
            label: "Limited Grid",
            icon: "⚠️",
            description: "Capacity constraints",
          },
          { value: "off-grid", label: "Off-Grid", icon: "🏝️", description: "Remote location" },
          { value: "microgrid", label: "Microgrid", icon: "🔄", description: "Local generation" },
        ],
      },
      {
        id: "operatingHours",
        label: "Operating schedule?",
        type: "buttons",
        options: [
          { value: "24-7", label: "24/7", icon: "🌙", description: "Always available" },
          { value: "extended", label: "Extended", icon: "🌅", description: "6 AM - 11 PM" },
          { value: "business", label: "Business Hours", icon: "🏢", description: "8 AM - 6 PM" },
          { value: "custom", label: "Custom hours", icon: "⚙️", description: "Set your own" },
        ],
      },
    ],
    insights: {
      "public-highway-high":
        "Highway travel centers need robust power management - battery storage prevents grid overload during peak travel times",
      "fleet-100":
        "Fleet charging at 100% concurrency requires significant demand management - storage reduces utility demand charges by 60-80%",
      "dcfast-limited":
        "DC Fast charging with limited grid capacity? Battery storage is essential - can reduce grid demand by 2-3x",
      "level2-workplace":
        "Workplace Level 2 charging pairs perfectly with solar+storage - charge during peak solar hours",
      "off-grid":
        "Off-grid EV charging requires oversized battery + renewable generation (typically 2-3x normal capacity)",
      "ultra-fast":
        "250kW+ ultra-fast chargers create massive demand spikes - storage smooths power delivery and cuts demand charges",
    },
  },

  "car-wash": {
    title: "Car Wash Operation Details",
    icon: "🚗",
    questions: [
      {
        id: "numBays",
        label: "Number of wash bays?",
        type: "number_stepper",
        placeholder: "e.g., 3",
        suffix: "bays",
      },
      {
        id: "washType",
        label: "Type of car wash?",
        type: "buttons",
        options: [
          { value: "self-serve", label: "Self-Serve", icon: "💪", description: "DIY wash bays" },
          { value: "automatic", label: "Automatic", icon: "🤖", description: "Touchless" },
          { value: "full-service", label: "Full-Service", icon: "✨", description: "With Detail" },
        ],
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Utility connected" },
          { value: "off-grid", label: "Off-Grid", icon: "🏝️", description: "Standalone" },
          { value: "hybrid", label: "Hybrid", icon: "🔄", description: "Grid + Backup" },
        ],
      },
      {
        id: "operatingHours",
        label: "Operating hours per day?",
        type: "number_stepper",
        placeholder: "e.g., 12",
        suffix: "hours",
      },
      {
        id: "heatedWater",
        label: "Do you use heated water?",
        type: "buttons",
        options: [
          { value: "yes", label: "Yes", icon: "✅", description: "Higher energy use" },
          { value: "no", label: "No", icon: "❌", description: "Lower energy use" },
        ],
      },
    ],
    insights: {
      "automatic-yes":
        "Automatic washes with heating have 30-45 min peak demand cycles - perfect for battery smoothing",
      "self-serve": "Self-serve washes benefit from solar+storage to offset daytime utility costs",
      "off-grid":
        "Off-grid car washes need reliable battery+solar systems for consistent operation",
    },
  },

  hotel: {
    title: "Hotel Facility Details",
    icon: "🏨",
    questions: [
      {
        id: "numRooms",
        label: "How many rooms?",
        type: "number_stepper",
        placeholder: "e.g., 120",
        suffix: "rooms",
      },
      {
        id: "hotelCategory",
        label: "Hotel category and service level",
        type: "select",
        helpText:
          "Hotel category affects energy intensity and system sizing. Star ratings define service level, facilities, and guest expectations.",
        options: [
          {
            value: "1-star",
            label: "⭐ 1-Star Hotel",
            description:
              "Basic accommodation with essential needs. Clean room, basic furniture, limited services, no restaurant or minimal facilities. Functionality over comfort.",
          },
          {
            value: "2-star",
            label: "⭐⭐ 2-Star Hotel",
            description:
              "Budget hotel with modest comfort. Private bathroom, daily housekeeping, limited front desk service. Affordable comfort.",
          },
          {
            value: "3-star",
            label: "⭐⭐⭐ 3-Star Hotel",
            description:
              "Mid-range hotel with standard hospitality services. 24-hour reception, breakfast or restaurant, room service (limited hours). Suitable for leisure and business travelers. Balance between price and service.",
          },
          {
            value: "4-star",
            label: "⭐⭐⭐⭐ 4-Star Hotel",
            description:
              "Upscale hotel with enhanced comfort and service quality. Concierge or guest services, multiple dining options, fitness center or pool, higher-quality rooms and amenities. Comfort with sophistication.",
          },
          {
            value: "5-star",
            label: "🌟 5-Star Hotel",
            description:
              "Luxury hotel with officially regulated standards. High staff-to-guest ratio, personalized service, concierge and valet services, spa, fine dining, and premium facilities. Strong SOPs and service consistency. Luxury defined by reliability and service depth.",
          },
          {
            value: "boutique",
            label: "🎨 Boutique Hotel",
            description:
              "Experience-driven property, not defined by size or star rating. Small to mid-size, unique design or theme, personalized intimate service, strong local or lifestyle identity. Curated interiors, signature dining or breakfast concept, personalized guest interaction. May be star-rated or non-classified.",
          },
          {
            value: "non-classified",
            label: "❓ Non-Classified Hotel",
            description:
              "Operates without an official star rating. No formal government classification, service levels vary widely, quality depends on management and reviews. Basic to moderate facilities, limited standardized services, flexible pricing. Can be excellent but consistency is not guaranteed.",
          },
        ],
      },
      {
        id: "squareFootage",
        label: "Facility square footage (optional)",
        type: "number",
        placeholder: "e.g., 50000",
        suffix: "sq ft",
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Utility connected" },
          { value: "off-grid", label: "Off-Grid", icon: "🏝️", description: "Standalone" },
          { value: "hybrid", label: "Hybrid", icon: "🔄", description: "Grid + Backup" },
        ],
      },
      {
        id: "occupancyRate",
        label: "Average occupancy rate?",
        type: "buttons",
        options: [
          { value: "high", label: "High", icon: "📈", description: "75-100%" },
          { value: "medium", label: "Medium", icon: "📊", description: "50-75%" },
          { value: "seasonal", label: "Seasonal", icon: "🍂", description: "Variable" },
          { value: "low", label: "Low", icon: "📉", description: "< 50%" },
        ],
      },
      {
        id: "amenities",
        label: "Major amenities? (Select all that apply)",
        type: "multi-select",
        options: [
          { value: "pool", label: "🏊 Pool/Spa" },
          { value: "restaurant", label: "🍽️ Restaurant/Kitchen" },
          { value: "hvac", label: "❄️ Central HVAC" },
          { value: "ev-charging", label: "🔌 EV Charging" },
          { value: "laundry", label: "🧺 Commercial Laundry" },
        ],
      },
      {
        id: "evChargers",
        label: "Want to add EV charging for guests?",
        type: "buttons",
        options: [
          { value: "yes", label: "Yes", icon: "✅", description: "How many chargers?" },
          { value: "no", label: "No", icon: "❌", description: "Skip EV charging" },
          {
            value: "future",
            label: "Maybe later",
            icon: "🔮",
            description: "Future consideration",
          },
        ],
      },
      {
        id: "numEVChargers",
        label: "How many EV chargers? (if yes above)",
        type: "number_stepper",
        placeholder: "e.g., 4",
        suffix: "chargers",
        conditional: { dependsOn: "evChargers", value: "yes" },
      },
      {
        id: "utilityRate",
        label: "Do you know your utility rate?",
        type: "buttons",
        options: [
          { value: "yes", label: "Yes", icon: "✅", description: "I know my rate" },
          { value: "no", label: "No", icon: "❓", description: "Help me calculate" },
        ],
      },
      {
        id: "kwhRate",
        label: "Utility rate ($/kWh)",
        type: "number",
        placeholder: "e.g., 0.15",
        suffix: "$/kWh",
        conditional: { dependsOn: "utilityRate", value: "yes" },
      },
      {
        id: "gridReliability",
        label: "Grid reliability in your area?",
        type: "buttons",
        options: [
          { value: "reliable", label: "Reliable", icon: "✅", description: "Rare outages" },
          { value: "moderate", label: "Moderate", icon: "⚠️", description: "Occasional outages" },
          { value: "unreliable", label: "Unreliable", icon: "❌", description: "Frequent outages" },
        ],
      },
    ],
    insights: {
      "pool-restaurant":
        "Hotels with pools and restaurants typically use solar+storage for daytime load coverage",
      unreliable:
        "Unreliable grid? Backup power is critical for guest experience and refrigeration",
      "off-grid": "Off-grid hotels need robust battery+solar+generator systems for 24/7 operations",
      "ev-charging":
        "Adding EV charging? We can size your system to handle both hotel and charging loads",
    },
  },

  datacenter: {
    title: "Data Center Specifications",
    icon: "🖥️",
    questions: [
      {
        id: "squareFootage",
        label: "Facility square footage (optional)",
        type: "number",
        placeholder: "e.g., 100000",
        suffix: "sq ft",
      },
      {
        id: "capacity",
        label: "Total IT capacity?",
        type: "number_stepper",
        placeholder: "e.g., 5",
        suffix: "MW",
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          {
            value: "redundant",
            label: "Redundant Grid Feeds",
            icon: "🔄",
            description: "2+ utility feeds for redundancy",
          },
          {
            value: "single",
            label: "Single Grid Connection",
            icon: "🔌",
            description: "Standard utility connection",
          },
          {
            value: "limited",
            label: "Limited Grid Capacity",
            icon: "⚠️",
            description: "Insufficient grid power",
          },
          {
            value: "microgrid",
            label: "Microgrid/Off-Grid",
            icon: "🏭",
            description: "Isolated power system",
          },
          {
            value: "hybrid",
            label: "Hybrid (Grid + Backup)",
            icon: "🔄",
            description: "Grid with battery/generator",
          },
        ],
      },
      {
        id: "uptimeRequirement",
        label: "Uptime requirement?",
        type: "buttons",
        options: [
          {
            value: "tier1",
            label: "Tier I",
            icon: "🟢",
            description: "99.671% - 28.8 hrs downtime/year",
          },
          {
            value: "tier2",
            label: "Tier II",
            icon: "🟡",
            description: "99.741% - 22 hrs downtime/year",
          },
          {
            value: "tier3",
            label: "Tier III",
            icon: "🟠",
            description: "99.982% - 1.6 hrs downtime/year",
          },
          {
            value: "tier4",
            label: "Tier IV",
            icon: "🔴",
            description: "99.995% - 26 min downtime/year",
          },
        ],
      },
      {
        id: "coolingSystem",
        label: "Cooling system type?",
        type: "buttons",
        options: [
          {
            value: "air",
            label: "Air-cooled",
            icon: "💨",
            description: "Traditional CRAC/CRAH units",
          },
          {
            value: "liquid",
            label: "Liquid-cooled",
            icon: "💧",
            description: "Chilled water or direct liquid",
          },
          {
            value: "hybrid",
            label: "Hybrid",
            icon: "🔄",
            description: "Both air and liquid cooling",
          },
        ],
      },
    ],
    insights: {
      microgrid:
        "Microgrids for datacenters require significant battery+generation for continuous uptime",
      tier4: "Tier IV datacenters need robust backup systems - typically 2N or 2N+1 redundancy",
      limited:
        "Limited grid capacity? Battery+solar reduces grid dependency during peak compute loads",
    },
  },

  hospital: {
    title: "Healthcare Facility Details",
    icon: "🏥",
    questions: [
      {
        id: "bedCount",
        label: "Number of beds?",
        type: "number_stepper",
        placeholder: "e.g., 200",
        suffix: "beds",
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Utility connected" },
          { value: "off-grid", label: "Off-Grid", icon: "🏝️", description: "Standalone" },
          { value: "hybrid", label: "Hybrid", icon: "🔄", description: "Grid + Robust Backup" },
        ],
      },
      {
        id: "criticalSystems",
        label: "Critical systems? (Select all that apply)",
        type: "multi-select",
        options: [
          { value: "icu", label: "🫀 ICU/Critical Care" },
          { value: "surgery", label: "⚕️ Operating Rooms" },
          { value: "imaging", label: "📷 MRI/CT/Imaging" },
          { value: "lab", label: "🔬 Laboratory" },
          { value: "pharmacy", label: "💊 Pharmacy (Refrigeration)" },
        ],
      },
      {
        id: "backupPower",
        label: "Current backup power?",
        type: "buttons",
        options: [
          {
            value: "generator-only",
            label: "Generator Only",
            icon: "⛽",
            description: "Diesel/gas backup",
          },
          {
            value: "ups-generator",
            label: "UPS + Generator",
            icon: "🔋",
            description: "Battery + backup",
          },
          { value: "none", label: "None", icon: "❌", description: "Inadequate backup" },
        ],
      },
      {
        id: "backupDuration",
        label: "Required backup duration?",
        type: "buttons",
        options: [
          { value: "4hr", label: "4 hours", icon: "⏰", description: "Minimum" },
          { value: "8hr", label: "8 hours", icon: "⏰", description: "Standard" },
          { value: "24hr", label: "24+ hours", icon: "🕒", description: "Extended" },
        ],
      },
    ],
    insights: {
      "icu-surgery":
        "ICU and surgery require instant switchover - BESS is faster than generator startup (10-15 sec)",
      "24hr": "24+ hour backup? Combine BESS with generator for cost-effective extended runtime",
      "off-grid":
        "Off-grid hospitals need 2N redundancy with battery+solar+generator for life-safety systems",
    },
  },

  airport: {
    title: "Airport Facility Details",
    icon: "✈️",
    questions: [
      {
        id: "facilityType",
        label: "Facility type?",
        type: "buttons",
        options: [
          {
            value: "terminal",
            label: "Terminal Building",
            icon: "🏢",
            description: "Passenger terminal operations",
          },
          {
            value: "hangar",
            label: "Hangar/Maintenance",
            icon: "🛩️",
            description: "Aircraft service facility",
          },
          {
            value: "ground-ops",
            label: "Ground Operations",
            icon: "🚜",
            description: "Baggage, fueling, ramp",
          },
          {
            value: "full-airport",
            label: "Full Airport Complex",
            icon: "✈️",
            description: "Complete airport infrastructure",
          },
        ],
      },
      {
        id: "operationSize",
        label: "Operation size?",
        type: "buttons",
        options: [
          { value: "small", label: "Small", icon: "🟢", description: "< 500K passengers/year" },
          {
            value: "medium",
            label: "Medium",
            icon: "🟡",
            description: "500K - 5M passengers/year",
          },
          { value: "large", label: "Large", icon: "🟠", description: "> 5M passengers/year" },
        ],
      },
      {
        id: "criticalLoads",
        label: "Critical loads? (Select all that apply)",
        type: "multi-select",
        options: [
          { value: "atc", label: "🗼 Air Traffic Control" },
          { value: "lighting", label: "💡 Runway Lighting" },
          { value: "fueling", label: "⛽ Fueling Systems" },
          { value: "baggage", label: "🧳 Baggage Handling" },
          { value: "security", label: "🔒 Security Systems" },
        ],
      },
    ],
    insights: {
      "atc-lighting":
        "ATC and runway lighting are FAA-mandated critical loads - require instant backup",
      "full-airport":
        "Full airport operations benefit from microgrid architecture with BESS+solar+generator",
    },
  },

  "tribal-casino": {
    title: "Tribal Casino & Resort Details",
    icon: "🎰",
    questions: [
      {
        id: "squareFootage",
        label: "Total facility square footage (optional)",
        type: "number_stepper",
        placeholder: "e.g., 75000",
        suffix: "sq ft",
      },
      {
        id: "facilitySize",
        label: "Facility size?",
        type: "buttons",
        options: [
          {
            value: "micro",
            label: "Micro",
            icon: "🟢",
            description: "< 15,000 sq ft gaming floor",
          },
          { value: "small", label: "Small", icon: "🟡", description: "15K-40K sq ft gaming floor" },
          { value: "medium", label: "Medium", icon: "🟠", description: "40K-100K sq ft" },
          { value: "large", label: "Large", icon: "🔴", description: "> 100K sq ft" },
        ],
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Utility connected" },
          { value: "off-grid", label: "Off-Grid", icon: "🏝️", description: "Remote location" },
          { value: "hybrid", label: "Hybrid", icon: "🔄", description: "Grid + Backup" },
        ],
      },
      {
        id: "amenities",
        label: "Resort amenities? (Select all that apply)",
        type: "multi-select",
        options: [
          { value: "hotel", label: "🏨 Hotel/Rooms" },
          { value: "restaurants", label: "🍽️ Multiple Restaurants" },
          { value: "entertainment", label: "🎭 Entertainment Venue" },
          { value: "spa", label: "💆 Spa/Pool" },
          { value: "convention", label: "🎪 Convention Center" },
        ],
      },
      {
        id: "operations",
        label: "Operations schedule?",
        type: "buttons",
        options: [
          {
            value: "24-7",
            label: "24/7 Operations",
            icon: "🌙",
            description: "Round-the-clock operations",
          },
          { value: "extended", label: "Extended Hours", icon: "🌅", description: "16-20 hrs/day" },
        ],
      },
      {
        id: "backupCritical",
        label: "How critical is backup power?",
        type: "buttons",
        options: [
          {
            value: "mission-critical",
            label: "Mission Critical",
            icon: "🚨",
            description: "Gaming/Hospitality - instant switchover required",
          },
          {
            value: "important",
            label: "Important",
            icon: "⚠️",
            description: "Minimize downtime",
          },
        ],
      },
    ],
    insights: {
      "24-7":
        "24/7 casinos need reliable backup power - even brief outages impact revenue significantly",
      "off-grid":
        "Remote tribal casinos benefit from microgrid systems with solar+storage+generator",
      "mission-critical":
        "Gaming operations require instant switchover - BESS responds in <10ms vs generators (10-15 sec)",
    },
  },

  "logistics-center": {
    title: "Logistics Center Details",
    icon: "🚚",
    questions: [
      {
        id: "squareFootage",
        label: "Facility square footage (optional)",
        type: "number",
        placeholder: "e.g., 200000",
        suffix: "sq ft",
      },
      {
        id: "facilityType",
        label: "Facility type?",
        type: "buttons",
        options: [
          {
            value: "fulfillment",
            label: "Fulfillment Center",
            icon: "📦",
            description: "Amazon-style",
          },
          {
            value: "distribution",
            label: "Distribution Hub",
            icon: "🚚",
            description: "FedEx/UPS",
          },
          {
            value: "cold-storage",
            label: "Cold Storage",
            icon: "❄️",
            description: "Refrigerated",
          },
          {
            value: "warehouse",
            label: "Standard Warehouse",
            icon: "🏭",
            description: "General warehousing",
          },
        ],
      },
      {
        id: "facilitySize",
        label: "Facility size?",
        type: "buttons",
        options: [
          { value: "micro", label: "Micro", icon: "🟢", description: "< 50,000 sq ft" },
          { value: "small", label: "Small", icon: "🟡", description: "50,000-150,000 sq ft" },
          { value: "medium", label: "Medium", icon: "🟠", description: "150,000-350,000 sq ft" },
          { value: "large", label: "Large", icon: "🔴", description: "> 350,000 sq ft" },
        ],
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Utility connected" },
          {
            value: "limited",
            label: "Limited Capacity",
            icon: "⚠️",
            description: "Grid constraints",
          },
          { value: "hybrid", label: "Hybrid", icon: "🔄", description: "Grid + Backup" },
        ],
      },
      {
        id: "operations",
        label: "Operations schedule?",
        type: "buttons",
        options: [
          { value: "24-7", label: "24/7 Operations", icon: "🌙", description: "Round-the-clock" },
          { value: "2-shift", label: "Two Shifts", icon: "🌅", description: "16 hrs/day" },
          { value: "1-shift", label: "Single Shift", icon: "🏢", description: "8-10 hrs/day" },
        ],
      },
      {
        id: "criticalLoads",
        label: "Critical loads? (Select all that apply)",
        type: "multi-select",
        options: [
          { value: "refrigeration", label: "❄️ Refrigeration/Cold Storage" },
          { value: "automation", label: "🤖 Warehouse Automation" },
          { value: "sorting", label: "📦 Sorting Systems" },
          { value: "ev-fleet", label: "🔌 EV Fleet Charging" },
        ],
      },
    ],
    insights: {
      "cold-storage":
        "Cold storage requires uninterrupted power - even brief outages can spoil inventory worth millions",
      "ev-fleet":
        "EV fleet charging creates significant demand - battery storage helps manage peak charges",
      "24-7": "24/7 operations benefit from demand charge reduction through battery peak shaving",
    },
  },

  "shopping-center": {
    title: "Shopping Center/Mall Details",
    icon: "🏬",
    questions: [
      {
        id: "squareFootage",
        label: "Total leasable square footage (optional)",
        type: "number",
        placeholder: "e.g., 250000",
        suffix: "sq ft",
      },
      {
        id: "centerSize",
        label: "Center size?",
        type: "buttons",
        options: [
          { value: "strip", label: "Strip Center", icon: "🟢", description: "< 100,000 sq ft" },
          {
            value: "community",
            label: "Community Center",
            icon: "🟡",
            description: "100,000-400,000 sq ft",
          },
          { value: "regional", label: "Regional Mall", icon: "🔴", description: "> 400,000 sq ft" },
        ],
      },
      {
        id: "numTenants",
        label: "Approximate number of tenants?",
        type: "number_stepper",
        placeholder: "e.g., 25",
        suffix: "tenants",
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Utility connected" },
          { value: "hybrid", label: "Hybrid", icon: "🔄", description: "Grid + Backup" },
        ],
      },
      {
        id: "anchorTenants",
        label: "Anchor tenants? (Select all that apply)",
        type: "multi-select",
        options: [
          { value: "grocery", label: "🛒 Grocery Store/Supermarket" },
          { value: "department", label: "🏬 Department Store" },
          { value: "cinema", label: "🎬 Movie Theater" },
          { value: "gym", label: "💪 Fitness Center" },
          { value: "restaurant", label: "🍽️ Food Court/Restaurants" },
        ],
      },
      {
        id: "hvacLoad",
        label: "HVAC load?",
        type: "buttons",
        options: [
          {
            value: "high",
            label: "High",
            icon: "🔥",
            description: "Central system for entire mall",
          },
          { value: "medium", label: "Medium", icon: "🌡️", description: "Shared systems" },
          { value: "tenant-controlled", label: "Tenant-Controlled", icon: "🏢" },
        ],
      },
    ],
    insights: {
      grocery:
        "Grocery stores have high refrigeration loads - backup power prevents inventory loss",
      cinema:
        "Movie theaters create peak demand during shows - battery storage can smooth these spikes",
      regional:
        "Regional malls benefit significantly from demand charge management using battery storage",
    },
  },

  "gas-station": {
    title: "Gas Station/C-Store Details",
    icon: "⛽",
    questions: [
      {
        id: "stationType",
        label: "Station type?",
        type: "buttons",
        options: [
          { value: "gas-only", label: "Gas Pumps Only", icon: "⛽" },
          {
            value: "with-cstore",
            label: "Gas + C-Store",
            icon: "🏪",
            description: "Convenience store",
          },
          { value: "truck-stop", label: "Truck Stop", icon: "🚛", description: "Travel center" },
        ],
      },
      {
        id: "numPumps",
        label: "Number of fuel pumps?",
        type: "number_stepper",
        placeholder: "e.g., 8",
        suffix: "pumps",
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "buttons",
        options: [
          { value: "on-grid", label: "On-Grid", icon: "🔌", description: "Utility connected" },
          { value: "off-grid", label: "Off-Grid", icon: "🏝️", description: "Remote location" },
          { value: "hybrid", label: "Hybrid", icon: "🔄", description: "Grid + Backup" },
        ],
      },
      {
        id: "operations",
        label: "Operating hours?",
        type: "buttons",
        options: [
          { value: "24-7", label: "24/7 Operations", icon: "🌙" },
          { value: "extended", label: "Extended Hours", icon: "🌅", description: "16-20 hrs/day" },
          { value: "standard", label: "Standard Hours", icon: "🏢", description: "12-14 hrs/day" },
        ],
      },
      {
        id: "additionalServices",
        label: "Additional services? (Select all that apply)",
        type: "multi-select",
        options: [
          { value: "car-wash", label: "🚗 Car Wash" },
          { value: "ev-charging", label: "🔌 EV Charging Stations" },
          { value: "restaurant", label: "🍔 Quick Service Restaurant" },
          { value: "refrigeration", label: "❄️ Walk-in Refrigeration" },
        ],
      },
    ],
    insights: {
      "ev-charging":
        "Adding EV charging? We can size your system to handle both gas and electric vehicle energy needs",
      "truck-stop":
        "Truck stops with multiple services benefit from battery storage to manage complex load profiles",
      "24-7": "24/7 stations need reliable backup - fuel pumps require power to operate",
    },
  },

  government: {
    title: "Government Building Details",
    icon: "🏛️",
    questions: [
      {
        id: "buildingType",
        label: "Building type?",
        type: "select",
        options: [
          { value: "city-hall", label: "🏢 City Hall/Municipal Building" },
          { value: "library", label: "📚 Public Library" },
          { value: "police-fire", label: "🚒 Police/Fire Station" },
          { value: "public-works", label: "🛠️ Public Works Facility" },
          { value: "community-center", label: "🏠 Community Center" },
        ],
      },
      {
        id: "buildingSize",
        label: "Building size?",
        type: "select",
        options: [
          { value: "micro", label: "🟢 Micro (< 5,000 sq ft)" },
          { value: "small", label: "🟢 Small (5,000-15,000 sq ft)" },
          { value: "medium-small", label: "🟡 Medium-Small (15,000-35,000 sq ft)" },
          { value: "medium", label: "🟠 Medium (35,000-75,000 sq ft)" },
          { value: "large", label: "🔴 Large (> 75,000 sq ft)" },
        ],
      },
      {
        id: "gridConnection",
        label: "Grid connection status?",
        type: "select",
        options: [
          { value: "on-grid", label: "🔌 On-Grid (Utility connected)" },
          { value: "hybrid", label: "🔄 Hybrid (Grid + Backup Required)" },
        ],
      },
      {
        id: "resilienceLevel",
        label: "Resilience requirement?",
        type: "select",
        options: [
          { value: "critical", label: "🚨 Critical (Police/Fire/Emergency Services)" },
          { value: "important", label: "⚠️ Important (City Hall/Community Services)" },
          { value: "standard", label: "🟢 Standard (Library/Parks)" },
        ],
      },
      {
        id: "operations",
        label: "Operating hours?",
        type: "select",
        options: [
          { value: "24-7", label: "🌙 24/7 Operations (Police/Fire)" },
          { value: "extended", label: "🌅 Extended Hours (6am-10pm)" },
          { value: "business", label: "🏢 Business Hours (8am-5pm)" },
        ],
      },
    ],
    insights: {
      "police-fire":
        "Emergency services require instant backup power - battery systems provide <10ms switchover",
      critical:
        "Critical infrastructure often qualifies for grants and incentives for resilience projects",
      "24-7": "24/7 facilities benefit from demand charge reduction and backup power capabilities",
    },
  },

  // Apartment/Multifamily Residential
  apartment: {
    title: "Apartment Complex Configuration",
    icon: "🏢",
    questions: [
      {
        id: "numberOfUnits",
        label: "How many apartment units?",
        type: "number_stepper",
        placeholder: "e.g., 400",
        suffix: "units",
        helpText: "Total number of residential units - drives base electrical load",
      },
      {
        id: "housingType",
        label: "Housing classification",
        type: "select",
        options: [
          { value: "luxury_apartments", label: "🌟 Luxury Apartments" },
          { value: "market_rate", label: "🏢 Market Rate" },
          { value: "affordable_housing", label: "🏠 Affordable Housing" },
          { value: "senior_housing", label: "👵 Senior Housing" },
          { value: "student_housing", label: "🎓 Student Housing" },
        ],
        helpText: "Housing type affects energy consumption patterns and available incentives",
      },
      {
        id: "gridSolutionType",
        label: "What type of grid solution do you want?",
        type: "select",
        options: [
          { value: "grid_tied", label: "🔌 Grid-Tied (cost savings only)" },
          { value: "hybrid", label: "🔄 Hybrid (backup + savings)" },
          { value: "microgrid", label: "🏭 Microgrid (full independence)" },
        ],
        helpText:
          "Grid-tied = cost savings only | Hybrid = backup + savings | Microgrid = full energy independence",
      },
      {
        id: "hasLaundryFacilities",
        label: "Does the complex have laundry facilities?",
        type: "select",
        options: [
          { value: "none", label: "❌ No laundry facilities" },
          { value: "centralized", label: "🧺 Centralized laundry room" },
          { value: "in_unit", label: "🏠 In-unit washers/dryers" },
          { value: "both", label: "✅ Both centralized and in-unit" },
        ],
        helpText: "Laundry adds significant electrical load, especially during peak hours",
      },
      {
        id: "hasCommercialKitchen",
        label: "Is there a commercial kitchen or restaurant?",
        type: "select",
        options: [
          { value: "none", label: "❌ No commercial kitchen" },
          { value: "cafe", label: "☕ Small cafe or coffee shop" },
          { value: "restaurant", label: "🍽️ Full-service restaurant" },
          { value: "catering", label: "👨‍🍳 Large catering kitchen" },
        ],
        helpText: "Commercial kitchens add 50-200+ kW depending on size",
      },
      {
        id: "amenitiesOffered",
        label: "What amenities does the complex offer?",
        type: "multi-select",
        options: [
          { value: "fitness", label: "💪 Fitness center" },
          { value: "pool", label: "🏊 Swimming pool" },
          { value: "spa", label: "🛁 Spa/hot tub" },
          { value: "coworking", label: "💻 Co-working space" },
          { value: "theater", label: "🎬 Movie theater" },
          { value: "ev_charging", label: "🔌 EV charging" },
          { value: "rooftop_lounge", label: "🌆 Rooftop lounge" },
        ],
        helpText: "Each amenity adds to total electrical load - select all that apply",
      },
      {
        id: "evChargingStatus",
        label: "EV charging infrastructure status",
        type: "select",
        options: [
          { value: "none", label: "❌ No EV charging plans" },
          { value: "planning", label: "📋 Planning to add EV charging" },
          { value: "existing_level2", label: "🔌 Existing Level 2 chargers" },
          { value: "existing_dcfast", label: "⚡ Existing DC fast chargers" },
          { value: "mixed", label: "🔄 Mix of Level 2 and DC fast" },
        ],
        helpText: "EV charging can be a major load - BESS can help manage charging costs",
      },
      {
        id: "evChargingPorts",
        label: "How many EV charging ports? (existing or planned)",
        type: "number_stepper",
        placeholder: "e.g., 50",
        suffix: "ports",
        helpText: "Total number of EV charging ports - each Level 2 port adds ~7-19 kW",
        conditional: { field: "evChargingStatus", operator: "!=", value: "none" },
      },
      {
        id: "wantsSolar",
        label: "Are you interested in adding solar?",
        type: "select",
        options: [
          { value: "yes_committed", label: "✅ Yes, definitely want solar" },
          { value: "yes_if_space", label: "🤔 Yes, if space available" },
          { value: "maybe", label: "💡 Maybe, considering it" },
          { value: "no", label: "❌ Not interested in solar" },
        ],
        helpText: "Solar can significantly reduce energy costs and improve ROI",
      },
      {
        id: "solarSpaceAvailable",
        label: "Do you have available space for solar panels?",
        type: "select",
        options: [
          { value: "rooftop_ample", label: "☀️ Ample rooftop space (50+ kW)" },
          { value: "rooftop_limited", label: "🌤️ Limited rooftop space (10-50 kW)" },
          { value: "parking_carport", label: "🅿️ Parking lot carport potential" },
          { value: "ground_mount", label: "🌿 Ground-mount space available" },
          { value: "combination", label: "🔄 Multiple solar locations" },
          { value: "no_space", label: "❌ No suitable space" },
        ],
        helpText:
          "Available space determines maximum solar capacity - parking carports are ideal for apartments",
        conditional: { field: "wantsSolar", operator: "!=", value: "no" },
      },
      {
        id: "parkingSpaces",
        label: "How many parking spaces does the complex have?",
        type: "number_stepper",
        placeholder: "e.g., 500",
        suffix: "spaces",
        helpText: "Parking lot carports can host large solar arrays (150W per space)",
      },
      {
        id: "buildingStories",
        label: "How many stories/floors?",
        type: "number_stepper",
        placeholder: "e.g., 4",
        suffix: "floors",
        helpText: "Building height affects elevator load and rooftop solar potential",
      },
      {
        id: "priorityGoals",
        label: "What are your top priorities? (select up to 3)",
        type: "multi-select",
        options: [
          { value: "cost_savings", label: "💰 Cost savings" },
          { value: "tenant_amenity", label: "🔌 Tenant amenity (EV charging)" },
          { value: "backup_power", label: "🔋 Backup power" },
          { value: "sustainability", label: "🌿 Sustainability" },
          { value: "property_value", label: "🏠 Property value" },
          { value: "demand_management", label: "📈 Demand management" },
        ],
        helpText: "Your priorities guide system sizing and configuration",
      },
    ],
    insights: {
      ev_charging:
        "EV charging infrastructure can be a major amenity and load - consider solar carports to offset charging costs",
      parking_carport:
        "Parking carports offer dual benefits: covered parking for residents and solar power generation (150W per space)",
      hybrid:
        "Hybrid systems provide both cost savings and backup power - ideal for multifamily properties",
      amenities:
        "Fitness centers, pools, and other amenities can add 100+ kW to peak load - BESS helps manage demand charges",
    },
  },

  // Default fallback for unknown industries
  default: {
    title: "Project Details",
    icon: "⚡",
    questions: [
      {
        id: "facilitySize",
        label: "Facility size?",
        type: "select",
        options: [
          { value: "micro", label: "🟢 Micro (< 10,000 sq ft)" },
          { value: "small", label: "🟡 Small (10,000-30,000 sq ft)" },
          { value: "medium", label: "🟠 Medium (30,000-100,000 sq ft)" },
          { value: "large", label: "🔴 Large (> 100,000 sq ft)" },
        ],
      },
      {
        id: "peakLoad",
        label: "Estimated peak load?",
        type: "number_stepper",
        placeholder: "e.g., 1.5",
        suffix: "MW",
      },
      {
        id: "operatingHours",
        label: "Operating hours per day?",
        type: "number_stepper",
        placeholder: "e.g., 16",
        suffix: "hours",
      },
    ],
    insights: {},
  },

  heavy_duty_truck_stop: {
    title: "Truck Stop / Travel Center Configuration",
    icon: "🚛",
    questions: [
      {
        id: "mcsChargers",
        label: "MCS Chargers (1,250 kW each)",
        type: "number_stepper",
        placeholder: "e.g., 2",
        suffix: "chargers",
        helpText: "Megawatt Charging System for Semi Trucks",
      },
      {
        id: "dcfc350",
        label: "DC Fast Chargers (350 kW each)",
        type: "number_stepper",
        placeholder: "e.g., 10",
        suffix: "chargers",
        helpText: "For Class 8 Trucks & RVs",
      },
      {
        id: "level2",
        label: "Level 2 Chargers (19.2 kW each)",
        type: "number_stepper",
        placeholder: "e.g., 20",
        suffix: "chargers",
        helpText: "For Passenger Vehicles",
      },
      {
        id: "serviceBays",
        label: "Service Bays (Speedco)",
        type: "number_stepper",
        placeholder: "e.g., 6",
        suffix: "bays",
        helpText: "Maintenance facility bays",
      },
      {
        id: "truckWashBays",
        label: "Truck Wash Bays",
        type: "number_stepper",
        placeholder: "e.g., 2",
        suffix: "bays",
        helpText: "Truck wash tunnels",
      },
      {
        id: "restaurantSeats",
        label: "Restaurant Seats",
        type: "number_stepper",
        placeholder: "e.g., 150",
        suffix: "seats",
        helpText: "Food court / QSR capacity",
      },
      {
        id: "hasShowers",
        label: "Shower Facilities?",
        type: "select",
        options: [
          { value: "true", label: "✅ Yes" },
          { value: "false", label: "❌ No" },
        ],
      },
      {
        id: "hasLaundry",
        label: "Laundry Facilities?",
        type: "select",
        options: [
          { value: "true", label: "✅ Yes" },
          { value: "false", label: "❌ No" },
        ],
      },
      {
        id: "parkingLotAcres",
        label: "Parking Lot Size",
        type: "number_stepper",
        placeholder: "e.g., 5",
        suffix: "acres",
        helpText: "For lighting load calculation",
      },
      {
        id: "climateZone",
        label: "Climate Zone",
        type: "select",
        options: [
          { value: "hot", label: "🌡️ Hot (AZ, NV, TX, FL)" },
          { value: "moderate", label: "☀️ Moderate (CA, NC, GA)" },
          { value: "cold", label: "❄️ Cold (MN, WI, NY)" },
        ],
        helpText: "Affects HVAC and thermal management loads",
      },
      // --- Professional facility profile (quick-review friendly) ---
      {
        id: "squareFeet",
        label: "Total facility square footage",
        type: "select",
        options: [
          { value: "17500", label: "🟢 10,000 - 25,000 sq ft" },
          { value: "37500", label: "🟢 25,000 - 50,000 sq ft" },
          { value: "75000", label: "🟡 50,000 - 100,000 sq ft" },
          { value: "150000", label: "🟠 100,000 - 200,000 sq ft" },
          { value: "300000", label: "🔴 200,000 - 400,000 sq ft" },
          { value: "500000", label: "🟣 Over 400,000 sq ft" },
        ],
        helpText: "Total building area including QSR, maintenance, retail",
      },
      {
        id: "monthlyElectricBill",
        label: "Average monthly electricity bill",
        type: "select",
        options: [
          { value: "17500", label: "💵 $10,000 - $25,000/month" },
          { value: "37500", label: "💵 $25,000 - $50,000/month" },
          { value: "75000", label: "💰 $50,000 - $100,000/month" },
          { value: "150000", label: "💰 $100,000 - $200,000/month" },
          { value: "300000", label: "💰 $200,000 - $400,000/month" },
          { value: "500000", label: "💰 Over $400,000/month" },
        ],
        helpText: "High-voltage loads drive significant bills at travel centers",
      },
      {
        id: "monthlyDemandCharges",
        label: "Monthly demand charges",
        type: "select",
        options: [
          { value: "10000", label: "⚡ $5,000 - $15,000/month" },
          { value: "22500", label: "⚡ $15,000 - $30,000/month" },
          { value: "45000", label: "⚡⚡ $30,000 - $60,000/month" },
          { value: "90000", label: "⚡⚡ $60,000 - $120,000/month" },
          { value: "160000", label: "🔥 $120,000 - $200,000/month" },
          { value: "300000", label: "🔥 Over $200,000/month" },
        ],
        helpText: "EV charging creates extreme demand charges (peak kW billing)",
      },
      {
        id: "gridCapacityKW",
        label: "Grid connection capacity",
        type: "select",
        options: [
          { value: "750", label: "🟢 500 kW - 1 MW" },
          { value: "1500", label: "🟡 1 - 2 MW" },
          { value: "3000", label: "🟠 2 - 4 MW" },
          { value: "5000", label: "🔴 4 - 6 MW" },
          { value: "8000", label: "🟣 6 - 10 MW" },
          { value: "12000", label: "🟣 Over 10 MW" },
        ],
        helpText: "Electrical service size (critical for MW-class EV infrastructure)",
      },
      {
        id: "operatingHours",
        label: "Operating hours",
        type: "select",
        options: [
          { value: "24_7", label: "🌙 24/7 Operations" },
          { value: "20", label: "🌅 20 hours/day (4am - 12am)" },
          { value: "18", label: "🌅 18 hours/day (6am - 12am)" },
          { value: "16", label: "🏢 16 hours/day (6am - 10pm)" },
        ],
        helpText: "Most travel centers operate 24/7",
      },
      {
        id: "backupRequirements",
        label: "Backup power requirements",
        type: "select",
        options: [
          { value: "critical", label: "🚨 Mission Critical - cannot lose power (24hr)" },
          { value: "important", label: "⚠️ Important - minimize downtime (8hr)" },
          { value: "nice_to_have", label: "🟡 Nice to have - occasional outages OK (4hr)" },
          { value: "has_generator", label: "⛽ Have existing generator backup" },
          { value: "not_priority", label: "❌ Not a priority" },
        ],
        helpText: "Travel centers are uptime-sensitive (lost revenue + stranded trucks)",
      },
    ],
    insights: {
      "mcsChargers-dcfc350":
        "MCS + DCFC chargers can pull 2,500-5,000 kW during peak - BESS sizing critical for demand charge management",
      "serviceBays-truckWashBays":
        "Maintenance and wash facilities have high inrush current - size BESS to handle motor starts",
      "hasShowers-hasLaundry":
        "Shower and laundry facilities add 130 kW constant load - factor into baseline",
      hot: "Hot climate zones require additional thermal management (30 kW) for battery cooling",
    },
  },
};

/**
 * Get questionnaire configuration for a specific industry
 * @param industryId - Industry template ID
 * @returns IndustryQuestionnaire configuration
 */
export function getIndustryQuestionnaire(industryId: string): IndustryQuestionnaire {
  return industryQuestionnaires[industryId] || industryQuestionnaires["default"];
}
