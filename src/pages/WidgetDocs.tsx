/**
 * Widget Documentation Page
 *
 * Complete integration guide and API reference for partners
 * - Getting started guide
 * - API authentication
 * - Code examples by industry
 * - Customization options
 */

import { useState } from "react";
import { Code2, Book, Zap, Copy, Check, Key, Globe, Palette, FileCode } from "lucide-react";

export default function WidgetDocs() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const industryExamples = [
    {
      name: "Hotel",
      slug: "hotel",
      description: "Energy savings calculator for hotels and hospitality",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'hotel',
  theme: 'light',
  primaryColor: '#3ecf8e',
  logo: 'https://yourhotel.com/logo.png',
  fields: {
    rooms: 150,
    hotelClass: 'midscale'
  }
});`,
    },
    {
      name: "Car Wash",
      slug: "car-wash",
      description: "BESS sizing for car wash facilities",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'car-wash',
  theme: 'light',
  primaryColor: '#3ecf8e',
  fields: {
    bays: 4,
    washType: 'tunnel'
  }
});`,
    },
    {
      name: "Hospital",
      slug: "hospital",
      description: "Critical load protection and energy cost reduction",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'hospital',
  theme: 'light',
  primaryColor: '#3ecf8e',
  fields: {
    beds: 200,
    squareFeet: 150000
  }
});`,
    },
    {
      name: "Manufacturing",
      slug: "manufacturing",
      description: "Industrial energy management and demand response",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'manufacturing',
  theme: 'dark',
  primaryColor: '#3ecf8e',
  fields: {
    squareFeet: 100000,
    industryType: 'automotive'
  }
});`,
    },
    {
      name: "EV Charging Station",
      slug: "ev-charging",
      description: "Load management for EV charging hubs",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'ev-charging',
  theme: 'light',
  primaryColor: '#3ecf8e',
  fields: {
    level2Chargers: 12,
    dcfcChargers: 8
  }
});`,
    },
    {
      name: "Warehouse / Logistics",
      slug: "warehouse",
      description: "Cold storage and logistics facility optimization",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'warehouse',
  theme: 'light',
  primaryColor: '#3ecf8e',
  fields: {
    squareFeet: 200000,
    isColdStorage: true
  }
});`,
    },
    {
      name: "Battery Vendor (Partner)",
      slug: "vendor-battery",
      description: "Battery equipment vendor offering quotes to customers",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'vendor-battery',
  theme: 'dark',
  primaryColor: '#1e40af',
  logo: 'https://battery-vendor.com/logo.png',
  hideAttribution: true,
  onQuoteGenerated: (quote) => {
    // Send lead to your CRM
    console.log('New quote:', quote);
  }
});`,
    },
    {
      name: "Solar Integrator (Partner)",
      slug: "vendor-solar",
      description: "Solar installer offering combined solar + BESS quotes",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'vendor-solar',
  theme: 'light',
  primaryColor: '#F59E0B',
  logo: 'https://solar-co.com/logo.png',
  hideAttribution: true,
  fields: {
    includeSolar: true,
    solarSizeKW: 500
  }
});`,
    },
    {
      name: "System Integrator / EPC (Partner)",
      slug: "vendor-integrator",
      description: "EPC contractor offering turnkey BESS projects",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'vendor-integrator',
  theme: 'dark',
  primaryColor: '#059669',
  logo: 'https://epc-firm.com/logo.png',
  hideAttribution: true,
  fields: {
    projectType: 'turnkey',
    includeEMS: true
  }
});`,
    },
    {
      name: "Architecture Firm (Partner)",
      slug: "vendor-architect",
      description: "Architects offering preliminary energy analysis to clients",
      code: `MerlinWidget.init({
  apiKey: 'YOUR_API_KEY',
  industry: 'vendor-architect',
  theme: 'light',
  primaryColor: '#7c3aed',
  logo: 'https://arch-firm.com/logo.png',
  onQuoteGenerated: (quote) => {
    // Add to project proposal
    saveToProject(quote);
  }
});`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#151515] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-10 h-10 text-[#3ecf8e]" />
              <div>
                <h1 className="text-2xl font-bold text-white">Widget Documentation</h1>
                <p className="text-sm text-gray-400">Integration Guide & API Reference</p>
              </div>
            </div>
            <a
              href="/widget"
              className="px-6 py-2.5 bg-[#3ecf8e] hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
            >
              View Demo
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Start */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-[#3ecf8e]" />
            <h2 className="text-3xl font-bold text-white">Quick Start</h2>
          </div>

          <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-8">
            <p className="text-gray-300 mb-6">
              Add the Merlin Widget to your website in 3 simple steps:
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center">
                  <span className="text-[#3ecf8e] font-bold">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Get Your API Key</h3>
                  <p className="text-gray-400 mb-3">
                    Sign up at{" "}
                    <a href="/widget" className="text-[#3ecf8e] hover:underline">
                      /widget
                    </a>{" "}
                    to receive your free API key. Start with 100 quotes per month.
                  </p>
                  <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-700">
                    <code className="text-gray-300 text-sm">pk_live_xxxxxxxxxxxxxxxxxxxxx</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center">
                  <span className="text-[#3ecf8e] font-bold">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Add Script to Your Page</h3>
                  <p className="text-gray-400 mb-3">
                    Copy this snippet and paste it into your HTML:
                  </p>
                  <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-4 relative">
                    <button
                      onClick={() =>
                        handleCopy(
                          `<!-- Merlin Widget -->\n<div id="merlin-widget"></div>\n<script src="https://widget.merlin.energy/embed.js"></script>`,
                          "install"
                        )
                      }
                      className="absolute top-3 right-3 p-2 bg-[#1a1a1a] hover:bg-[#252525] rounded text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedSection === "install" ? (
                        <Check className="w-4 h-4 text-[#3ecf8e]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                      {`<!-- Merlin Widget -->
<div id="merlin-widget"></div>
<script src="https://widget.merlin.energy/embed.js"></script>`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center">
                  <span className="text-[#3ecf8e] font-bold">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Initialize Widget</h3>
                  <p className="text-gray-400 mb-3">
                    Configure the widget with your API key and preferences:
                  </p>
                  <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-4 relative">
                    <button
                      onClick={() =>
                        handleCopy(
                          `<script>\n  MerlinWidget.init({\n    apiKey: 'YOUR_API_KEY',\n    industry: 'hotel',\n    theme: 'light',\n    primaryColor: '#3ecf8e'\n  });\n</script>`,
                          "init"
                        )
                      }
                      className="absolute top-3 right-3 p-2 bg-[#1a1a1a] hover:bg-[#252525] rounded text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedSection === "init" ? (
                        <Check className="w-4 h-4 text-[#3ecf8e]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                      {`<script>
  MerlinWidget.init({
    apiKey: 'YOUR_API_KEY',
    industry: 'hotel',
    theme: 'light',
    primaryColor: '#3ecf8e'
  });
</script>`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-[#3ecf8e]" />
            <h2 className="text-3xl font-bold text-white">API Reference</h2>
          </div>

          <div className="space-y-6">
            {/* Generate Quote Endpoint */}
            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-[#3ecf8e]/10 text-[#3ecf8e] text-xs font-bold rounded">
                  POST
                </div>
                <code className="text-gray-300 font-mono">/api/v1/widget/quote</code>
              </div>
              <p className="text-gray-400 mb-6">
                Generate a BESS quote for a specific industry and configuration
              </p>

              <h4 className="text-white font-semibold mb-3">Headers</h4>
              <div className="bg-[#0a0a0a] rounded-lg p-4 mb-6 border border-gray-700">
                <pre className="text-sm text-gray-300 font-mono">
                  {`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                </pre>
              </div>

              <h4 className="text-white font-semibold mb-3">Request Body</h4>
              <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-4 mb-6">
                <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                  {`{
  "industry": "hotel",
  "location": {
    "state": "CA",
    "zipCode": "90210"
  },
  "facility": {
    "rooms": 150,
    "hotelClass": "midscale",
    "hasPool": true,
    "hasRestaurant": true
  },
  "preferences": {
    "includeSolar": true,
    "backupHours": 4
  }
}`}
                </pre>
              </div>

              <h4 className="text-white font-semibold mb-3">Response</h4>
              <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-4">
                <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                  {`{
  "success": true,
  "quote": {
    "systemSize": {
      "batteryKW": 500,
      "batteryKWh": 2000,
      "solarKW": 300
    },
    "costs": {
      "equipment": 850000,
      "installation": 150000,
      "total": 1000000,
      "afterIncentives": 700000
    },
    "savings": {
      "annual": 125000,
      "paybackYears": 5.6,
      "roi25Year": 245
    },
    "truequote": {
      "verified": true,
      "sources": ["NREL ATB 2024", "IRA 2022"],
      "confidence": 0.95
    }
  },
  "quotesRemaining": 99
}`}
                </pre>
              </div>
            </div>

            {/* Check Quota Endpoint */}
            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded">
                  GET
                </div>
                <code className="text-gray-300 font-mono">/api/v1/widget/quota</code>
              </div>
              <p className="text-gray-400 mb-6">
                Check your remaining quote quota for the current month
              </p>

              <h4 className="text-white font-semibold mb-3">Response</h4>
              <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-4">
                <pre className="text-sm text-gray-300 font-mono">
                  {`{
  "tier": "free",
  "quotesUsed": 15,
  "quotesRemaining": 85,
  "monthlyLimit": 100,
  "resetDate": "2026-04-01T00:00:00Z"
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Industry Examples */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-[#3ecf8e]" />
            <h2 className="text-3xl font-bold text-white">Industry Examples</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {industryExamples.map((example) => (
              <div
                key={example.slug}
                className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{example.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{example.description}</p>
                <div className="bg-[#0d1117] rounded-lg border border-[#1a1a1a] p-4 relative">
                  <button
                    onClick={() => handleCopy(example.code, example.slug)}
                    className="absolute top-3 right-3 p-2 bg-[#1a1a1a] hover:bg-[#252525] rounded text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedSection === example.slug ? (
                      <Check className="w-4 h-4 text-[#3ecf8e]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                    {example.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customization */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-[#3ecf8e]" />
            <h2 className="text-3xl font-bold text-white">Customization Options</h2>
          </div>

          <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-white font-semibold">Option</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Default</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <code className="text-[#3ecf8e]">apiKey</code>
                    </td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">
                      <em className="text-gray-500">required</em>
                    </td>
                    <td className="py-3 px-4">Your API authentication key</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <code className="text-[#3ecf8e]">industry</code>
                    </td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">
                      <em className="text-gray-500">required</em>
                    </td>
                    <td className="py-3 px-4">Industry type (hotel, car-wash, hospital, etc.)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <code className="text-[#3ecf8e]">theme</code>
                    </td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">'light'</td>
                    <td className="py-3 px-4">Widget theme: 'light' or 'dark'</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <code className="text-[#3ecf8e]">primaryColor</code>
                    </td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">'#3ecf8e'</td>
                    <td className="py-3 px-4">Primary brand color (hex format)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <code className="text-[#3ecf8e]">locale</code>
                    </td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">'en-US'</td>
                    <td className="py-3 px-4">Language and region settings</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <code className="text-[#3ecf8e]">containerWidth</code>
                    </td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4">'100%'</td>
                    <td className="py-3 px-4">Widget container width</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">
                      <code className="text-[#3ecf8e]">onQuoteGenerated</code>
                    </td>
                    <td className="py-3 px-4">function</td>
                    <td className="py-3 px-4">null</td>
                    <td className="py-3 px-4">Callback when quote is generated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <FileCode className="w-6 h-6 text-[#3ecf8e]" />
            <h2 className="text-3xl font-bold text-white">Need Help?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
              <Code2 className="w-8 h-8 text-[#3ecf8e] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">API Issues</h3>
              <p className="text-gray-400 text-sm mb-4">Contact our technical support team</p>
              <a href="mailto:api@merlin.energy" className="text-[#3ecf8e] hover:underline text-sm">
                api@merlin.energy
              </a>
            </div>

            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
              <Book className="w-8 h-8 text-[#3ecf8e] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
              <p className="text-gray-400 text-sm mb-4">Browse our full documentation</p>
              <a
                href="https://docs.merlin.energy"
                className="text-[#3ecf8e] hover:underline text-sm"
              >
                docs.merlin.energy
              </a>
            </div>

            <div className="bg-[#151515] rounded-xl border border-[#1a1a1a] p-6">
              <Globe className="w-8 h-8 text-[#3ecf8e] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-400 text-sm mb-4">Join our developer community</p>
              <a
                href="https://community.merlin.energy"
                className="text-[#3ecf8e] hover:underline text-sm"
              >
                community.merlin.energy
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
