import React from 'react';

const AboutMerlin: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Merlin BESS</h1>
        
        <div className="prose prose-lg text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mission</h2>
            <p>
              Merlin BESS is a professional Battery Energy Storage System (BESS) financial analysis and quote generation platform. 
              Our mission is to transform complex energy storage calculations into user-friendly workflows with investment-grade 
              financial modeling capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Platform Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Financial Modeling</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Target IRR-based pricing calculations</li>
                  <li>Professional battery capacity fading models</li>
                  <li>Multiple revenue stream modeling</li>
                  <li>Break-even analysis and sensitivity modeling</li>
                  <li>Risk analysis with Monte Carlo simulations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Project Analysis</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Comprehensive cost estimation by region</li>
                  <li>Use case optimization and ROI analysis</li>
                  <li>Currency conversion and localization</li>
                  <li>Tax and incentive calculations (ITC, MACRS)</li>
                  <li>Professional quote generation</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technology Stack</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Frontend:</strong>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    <li>React 18 + TypeScript</li>
                    <li>Vite Build System</li>
                    <li>Tailwind CSS</li>
                  </ul>
                </div>
                <div>
                  <strong>Backend:</strong>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    <li>Supabase (PostgreSQL)</li>
                    <li>Real-time subscriptions</li>
                    <li>Authentication & Storage</li>
                  </ul>
                </div>
                <div>
                  <strong>Deployment:</strong>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    <li>Fly.io with Docker</li>
                    <li>nginx proxy</li>
                    <li>Global CDN</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Use Cases</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800">Utility Scale</h3>
                <p className="text-sm text-blue-600 mt-1">Grid-scale energy storage projects with advanced revenue optimization</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800">Commercial & Industrial</h3>
                <p className="text-sm text-green-600 mt-1">Peak shaving, demand charge reduction, and backup power solutions</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-800">Frequency Regulation</h3>
                <p className="text-sm text-purple-600 mt-1">High-frequency cycling applications with advanced degradation modeling</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-medium text-orange-800">Microgrids</h3>
                <p className="text-sm text-orange-600 mt-1">Resilient energy systems with multiple value streams</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-800">Residential</h3>
                <p className="text-sm text-red-600 mt-1">Home energy storage with solar integration and time-of-use optimization</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-800">Market Intelligence</h3>
                <p className="text-sm text-indigo-600 mt-1">Competitive analysis and market positioning tools</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Industry Standards</h2>
            <p className="text-gray-600">
              Our financial modeling is based on industry-leading methodologies including eFinancialModels Battery Energy 
              Pricing Model, NREL cost modeling frameworks, IEEE standards for energy storage systems, and financial 
              industry standard practices for project evaluation.
            </p>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Get Started</h2>
            <p className="text-indigo-700 mb-4">
              Ready to analyze your next BESS project? Use our comprehensive quote builder to generate professional 
              financial analysis and investment-grade project reports.
            </p>
            <button 
              onClick={() => window.location.href = '/'} 
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Building Your Quote
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutMerlin;