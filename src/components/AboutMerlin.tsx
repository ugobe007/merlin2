import React from 'react';
import { Battery, Zap, Target, Users, LineChart, Shield, Sparkles, Award, TrendingUp } from 'lucide-react';

const AboutMerlin: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="text-6xl">🧙‍♂️</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              About Merlin Energy Solutions
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Removing the hurdles between people and smart energy through transparent pricing, 
            AI-powered optimization, and industry expertise.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 mb-16 text-white shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <Sparkles className="w-10 h-10 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-lg leading-relaxed opacity-95">
                We built Merlin to help people save money with energy and to build a path to a zero carbon future. 
                Our platform uses industry-standard formulas and the latest price sheets to calculate optimal 
                configurations using AI that delivers real-time quotes and configurations guided by industry experts.
              </p>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 mt-6">
            <p className="text-lg leading-relaxed opacity-95">
              <strong>We believe in transparency.</strong> We're open about energy configurations and pricing 
              because we want to help you make clear, well-informed decisions about your energy needs.
            </p>
          </div>
        </div>

        {/* Team Background */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-800">Our Team's Background</h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              The Merlin Energy team brings decades of combined experience from the world's leading energy, 
              automotive, and technology companies. Our backgrounds span across:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Mitsubishi Chemical</h3>
                  <p className="text-gray-600 text-sm">Advanced battery chemistry and materials science</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Panasonic</h3>
                  <p className="text-gray-600 text-sm">Lithium-ion battery manufacturing and innovation</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Ford Motor Company</h3>
                  <p className="text-gray-600 text-sm">Electric vehicle systems and large-scale energy integration</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Magna International</h3>
                  <p className="text-gray-600 text-sm">Automotive engineering and manufacturing excellence</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg col-span-2">
                <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Noah Energy</h3>
                  <p className="text-gray-600 text-sm">Energy storage deployment, project development, and market intelligence</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Innovation Focus */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-800">Our Innovation Drive</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <Battery className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">Battery Design Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                Leveraging cutting-edge chemistry knowledge and manufacturing expertise to optimize 
                battery system designs for performance, longevity, and cost-effectiveness.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <LineChart className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">ESS System Development</h3>
              <p className="text-gray-600 leading-relaxed">
                Building comprehensive Energy Storage Systems that integrate seamlessly with existing 
                infrastructure while maximizing efficiency and return on investment.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">BESS Project Excellence</h3>
              <p className="text-gray-600 leading-relaxed">
                From initial assessment to commissioning, we bring end-to-end expertise in Battery Energy 
                Storage System development and deployment.
              </p>
            </div>
          </div>
        </div>

        {/* The Innovation Puzzle */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-10 mb-16 border-2 border-purple-200">
          <div className="flex items-start gap-4 mb-6">
            <Target className="w-10 h-10 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">The Most Important Piece of the Innovation Puzzle</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                After years of working with advanced battery technologies and energy systems, we've learned 
                that the most critical innovation isn't just in the hardware—it's in the <strong>right-sizing 
                of energy storage systems</strong> and <strong>accurate pricing of energy needs</strong>.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Too many projects fail not because of technology limitations, but because of:
              </p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Oversized systems</strong> that drive up costs unnecessarily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Undersized systems</strong> that fail to meet actual energy demands</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Inaccurate pricing</strong> that leads to unrealistic expectations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Lack of transparency</strong> that prevents informed decision-making</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                Merlin Energy was built to solve these fundamental challenges by combining AI-powered 
                optimization with real-world industry expertise and transparent, up-to-date pricing data.
              </p>
            </div>
          </div>
        </div>

        {/* How We Help */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-800">How We Help You</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">AI-Powered Optimization</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our platform analyzes your specific use case, energy patterns, and goals to recommend 
                the optimal system configuration—not too big, not too small, but exactly right for your needs.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Industry-standard calculation formulas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Real-time utility rate integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Demand pattern analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>ROI-focused recommendations</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LineChart className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Transparent Pricing</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Every quote is based on current market prices, updated regularly from manufacturers and 
                suppliers. No hidden costs, no surprises—just clear, honest pricing you can trust.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Latest equipment price sheets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Installation cost breakdowns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Incentive calculations (ITC, state programs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>25-year financial projections</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Path to Zero Carbon */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-6">Building the Path to Zero Carbon</h2>
          <p className="text-lg leading-relaxed mb-4 opacity-95">
            Energy storage is the key enabler of renewable energy integration. By helping businesses and 
            organizations right-size their energy storage investments, we're accelerating the transition 
            to clean energy while ensuring economic viability.
          </p>
          <p className="text-lg leading-relaxed opacity-95">
            Every optimized BESS installation is a step toward grid stability, reduced emissions, and 
            energy independence. Together, we're not just saving money—we're building a sustainable future.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the Merlin difference with a free, no-obligation quote powered by our AI platform 
            and backed by decades of industry expertise.
          </p>
          <button 
            onClick={() => window.location.href = '#smart-wizard'}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Start Your Smart Wizard 🧙‍♂️
          </button>
        </div>

        {/* Contact & Social Media Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-10 border-2 border-purple-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Get In Touch</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h3 className="text-xl font-bold text-purple-600 mb-6">Contact Information</h3>
              
              <div className="space-y-4">
                <a 
                  href="mailto:info@merlinenergy.com"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email Us</p>
                    <p className="text-purple-600">info@merlinenergy.com</p>
                  </div>
                </a>
                
                <a 
                  href="tel:+15551234567"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Call Us</p>
                    <p className="text-blue-600">(555) 123-4567</p>
                  </div>
                </a>
                
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Office Hours</p>
                    <p className="text-gray-600">Monday - Friday, 9 AM - 6 PM EST</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Social Media */}
            <div>
              <h3 className="text-xl font-bold text-purple-600 mb-6">Follow Us</h3>
              
              <p className="text-gray-600 mb-6">
                Stay updated with the latest in energy storage technology, industry insights, and Merlin news.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <a 
                  href="https://linkedin.com/company/merlin-energy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[#0077B5] text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="font-semibold">LinkedIn</span>
                </a>
                
                <a 
                  href="https://twitter.com/merlinenergy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[#1DA1F2] text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  <span className="font-semibold">Twitter</span>
                </a>
                
                <a 
                  href="https://facebook.com/merlinenergy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[#1877F2] text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="font-semibold">Facebook</span>
                </a>
                
                <a 
                  href="https://youtube.com/@merlinenergy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[#FF0000] text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="font-semibold">YouTube</span>
                </a>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  <strong>Newsletter:</strong> Subscribe for energy storage insights and updates
                </p>
                <div className="flex gap-2 mt-3">
                  <input 
                    type="email" 
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutMerlin;
