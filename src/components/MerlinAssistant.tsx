/**
 * MerlinAssistant - Floating AI Help Widget
 * 
 * A friendly floating Merlin icon that provides instant help and answers
 * questions about the platform, BESS technology, and energy storage.
 * 
 * Features:
 * - Floating button in bottom-right corner
 * - Expandable chat interface
 * - Pre-built FAQ suggestions
 * - AI-powered responses (simulated for now)
 */

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MerlinAssistantProps {
  className?: string;
}

// Pre-built FAQ suggestions
const QUICK_QUESTIONS = [
  "What is BESS?",
  "How is system size calculated?",
  "Help with the wizard steps",
  "How do I request an official quote?",
  "What's included in each plan?",
  "How does the Power Profile work?",
];

// Knowledge base for common questions
const KNOWLEDGE_BASE: Record<string, string> = {
  "what is bess": `**Battery Energy Storage System (BESS)** is a rechargeable battery system that stores electrical energy from the grid or renewable sources (like solar) for later use.

**Key Benefits:**
• **Peak Shaving** - Reduce expensive demand charges by using stored energy during peak hours
• **Backup Power** - Keep critical systems running during outages
• **Solar Integration** - Store excess solar energy for use at night
• **Grid Services** - Participate in utility programs for additional revenue

BESS systems range from small commercial units (100-500 kWh) to utility-scale installations (100+ MWh).`,

  "how is system size calculated": `System sizing is based on several key factors:

**1. Peak Demand (kW)**
Your highest power draw determines the power rating needed.

**2. Energy Requirements (kWh)**
How much energy you need to store based on:
- Backup duration (e.g., 4 hours of critical loads)
- Peak shaving goals
- Solar production patterns

**3. Use Case**
Different industries have different needs:
- **Data Centers**: High reliability, 2-4 hour backup
- **EV Charging**: Match charger capacity, demand management
- **Commercial**: Peak shaving, demand charge reduction

**4. Operating Schedule**
When you use the most energy affects optimal sizing.

Our calculator analyzes all these factors to recommend the right system size for your needs.`,

  "what do npv and irr mean": `**NPV (Net Present Value)** and **IRR (Internal Rate of Return)** are key financial metrics:

**NPV - Net Present Value**
The total value of your investment in today's dollars, accounting for the time value of money.
- **Positive NPV** = Good investment (returns exceed costs)
- **Higher NPV** = Better investment

**IRR - Internal Rate of Return**
The annualized rate of return your investment generates.
- Compare to your required return (e.g., 8%)
- **IRR > Required Return** = Worth investing

**Example:**
A $500,000 BESS project with:
- NPV of $250,000 → You'll gain $250K in present value
- IRR of 15% → 15% annual return on investment

*Professional and Enterprise plans include NPV/IRR calculations.*`,

  "how do i request an official quote": `To get an official quote from Merlin Energy:

**1. Complete the Quote Builder**
Walk through our 7-step wizard to provide your project details.

**2. Click "Request Official Quote"**
At the end of the process, you'll see a purple button to request an official quote.

**3. Our Team Reviews**
A Merlin Energy specialist will review your requirements within 1-2 business days.

**4. Receive Your Quote**
We'll send you a detailed, professional quote including:
- Exact equipment specifications
- Installation estimates
- Financing options
- Warranty details

**Why request an official quote?**
- Verified by human experts
- Accurate vendor pricing
- Installation planning
- Financing discussions
- Priority support`,

  "what's included in each plan": `**Starter (Free)**
• 3 quotes/month
• Basic system sizing
• Simple ROI estimates
• PDF export (branded)
• Power Profile Levels 1-3

**Professional ($49/mo)**
• Unlimited quotes
• 25 saved projects
• NPV, IRR, DCF analysis
• AI recommendations
• Detailed equipment specs
• Financing calculator
• Clean exports
• Power Profile Levels 1-6

**Enterprise Pro ($149/mo)**
• Everything in Professional
• Unlimited projects
• Team collaboration (5 users)
• Sensitivity analysis
• Market intelligence
• White-label branding
• All 7 Power Profile levels

**Business (Custom)**
• Everything + API access
• Unlimited team members
• Custom integrations
• Dedicated account manager`,

  "how does the power profile work": `**Power Profile** is your energy expertise level that grows as you use the platform.

**How it works:**
1. Complete wizard questions → Earn points
2. More detailed data → Higher level
3. Higher level → More insights unlocked

**7 Levels:**
1. **Initiate** (0-10 pts) - Getting started
2. **Practitioner** (11-20 pts) - Learning fundamentals
3. **Specialist** (21-30 pts) - Building expertise
4. **Architect** (31-45 pts) - Designing solutions
5. **Strategist** (46-60 pts) - Advanced planning
6. **Authority** (61-80 pts) - Expert insights
7. **Luminary** (81-100 pts) - Complete mastery

**Level Access by Plan:**
- Starter: Levels 1-3
- Professional: Levels 1-6
- Enterprise Pro: All 7 levels

Each level unlocks new capabilities and insights!`,

  // Wizard Step Help
  "step 1": `**Step 1: Industry & Location**

This is where we learn about your business:

**Industry Selection**
Choose your industry type (e.g., Data Center, Hotel, EV Charging). This helps us apply industry-specific sizing logic and recommendations.

**Location**
Your location affects:
• Regional electricity rates
• Equipment pricing
• Available incentives
• Climate considerations

**Tips:**
• If you don't see your exact industry, choose the closest match
• Location helps us estimate accurate pricing`,

  "step 2": `**Step 2: Configuration**

This step gathers key information about your facility:

**Facility Size**
Square footage helps estimate your energy needs.

**Operating Hours**
When your facility operates affects peak demand patterns.

**Grid Connection**
Your grid reliability influences backup requirements.

**Tips:**
• More details = better recommendations
• Don't worry about exact numbers - estimates work fine
• You can always adjust later`,

  "step 3": `**Step 3: Add Goodies**

Enhance your system with additional features:

**Solar PV**
Add solar panels to generate clean energy and reduce grid dependence.

**EV Charging**
Include EV charger support for future-proofing.

**Wind Power**
If applicable, add wind generation.

**Tips:**
• Solar + Storage = Maximum savings
• Consider future needs (EV adoption is growing)
• These are optional - skip if not needed`,

  "step 4": `**Step 4: Goals & Interests**

Tell us what matters most to you:

**Primary Goals**
• Cost savings
• Backup power reliability
• Sustainability/carbon reduction
• Energy independence

**Budget Considerations**
Your budget range helps us recommend appropriate solutions.

**Tips:**
• Be honest about priorities - it helps us optimize
• Multiple goals are fine - we'll balance them`,

  "step 5": `**Step 5: Power Recommendation**

This is your personalized system recommendation!

**What you'll see:**
• Recommended battery size (kWh)
• Power rating (kW)
• Your Power Profile level
• Key benefits

**Power Profile**
Shows how complete your profile is. More details = higher level = better recommendations.

**Tips:**
• Review the recommendation carefully
• Go back to previous steps to add more details if needed`,

  "step 6": `**Step 6: Preliminary Quote**

Your detailed cost breakdown:

**Equipment Costs**
• Battery system
• Inverter
• Installation
• Balance of system

**Financial Projections**
• Simple payback period
• ROI estimates
• Annual savings

**Tips:**
• This is an estimate - official quotes may vary
• Contact us for exact vendor pricing
• Consider financing options`,

  "step 7": `**Step 7: Final Quote**

Your complete project summary:

**What's Included:**
• Full system specifications
• Total project cost
• Financing options
• Next steps

**Actions:**
• Download PDF/Excel
• Request official quote
• Find installers
• Explore financing

**Tips:**
• Save your quote for reference
• Request an official quote for exact pricing
• Our team is here to help!`,
};

// Simple AI response generator
function generateResponse(question: string): string {
  const lowerQuestion = question.toLowerCase().trim();
  
  // Check for step-specific questions
  const stepMatch = lowerQuestion.match(/step\s*(\d)/);
  if (stepMatch) {
    const stepNum = stepMatch[1];
    if (KNOWLEDGE_BASE[`step ${stepNum}`]) {
      return KNOWLEDGE_BASE[`step ${stepNum}`];
    }
  }
  
  // Check for "what is this step" or "help with current step" or "wizard steps"
  if (lowerQuestion.includes('this step') || lowerQuestion.includes('current step') || lowerQuestion.includes('what do i do') || lowerQuestion.includes('wizard step')) {
    return `I can help you with any step! Just ask:

• "Help with Step 1" - Industry & Location
• "Help with Step 2" - Configuration  
• "Help with Step 3" - Add Goodies (Solar, EV, etc.)
• "Help with Step 4" - Goals & Interests
• "Help with Step 5" - Power Recommendation
• "Help with Step 6" - Preliminary Quote
• "Help with Step 7" - Final Quote

Or ask me anything about BESS, sizing, costs, or how the platform works!`;
  }
  
  // Check knowledge base
  for (const [key, answer] of Object.entries(KNOWLEDGE_BASE)) {
    if (lowerQuestion.includes(key) || key.split(' ').every(word => lowerQuestion.includes(word))) {
      return answer;
    }
  }
  
  // Generic helpful responses
  if (lowerQuestion.includes('solar') || lowerQuestion.includes('pv')) {
    return `**Solar Integration with BESS**

Battery storage works great with solar PV systems:

• **Store excess solar** - Don't waste energy, save it for later
• **Use solar at night** - Power your facility after sunset
• **Maximize self-consumption** - Reduce grid dependence
• **Peak shaving** - Use stored solar during expensive peak hours

In our calculator, you can specify your existing or planned solar capacity, and we'll optimize the battery size to match.`;
  }
  
  if (lowerQuestion.includes('cost') || lowerQuestion.includes('price') || lowerQuestion.includes('expensive')) {
    return `**BESS Pricing Overview**

Battery storage costs vary based on:

• **System size** - Larger systems have better $/kWh economics
• **Chemistry** - LFP (safer, longer life) vs NMC (higher density)
• **Configuration** - Indoor/outdoor, AC/DC coupled
• **Region** - Installation costs vary by location

**Typical ranges (2024):**
• Commercial: $400-600/kWh installed
• Industrial: $350-500/kWh installed
• Utility-scale: $250-400/kWh installed

Use our calculator for a personalized estimate based on your specific requirements.`;
  }
  
  if (lowerQuestion.includes('backup') || lowerQuestion.includes('outage') || lowerQuestion.includes('blackout')) {
    return `**Backup Power with BESS**

BESS provides reliable backup power when the grid goes down:

**Critical load protection:**
• Servers and IT equipment
• Refrigeration
• Life safety systems
• Security and access control

**Sizing for backup:**
Backup hours = Battery capacity (kWh) ÷ Critical load (kW)

Example: 500 kWh battery ÷ 100 kW load = 5 hours backup

**Key considerations:**
• Identify critical vs non-critical loads
• Consider generator integration for extended outages
• Automatic transfer switches for seamless switchover

Our calculator asks about your backup requirements to size appropriately.`;
  }
  
  // Default response
  return `Thanks for your question! Here are some things I can help with:

**Platform Help:**
• "Help with Step 1" through "Help with Step 7"
• "How does the Power Profile work?"
• "What's included in each plan?"

**BESS Knowledge:**
• "What is BESS?"
• "How is system size calculated?"
• "What do NPV and IRR mean?"

**Getting Started:**
• "How do I request an official quote?"
• Cost and pricing questions

Feel free to ask about any of these topics!`;
}

const MerlinAssistant: React.FC<MerlinAssistantProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Hi! I'm Merlin, your energy assistant.**

I'm here to help you understand BESS technology, navigate the quote builder, and answer questions about our platform.

**Try asking me about:**
• What is BESS and how does it work?
• How is system sizing calculated?
• What do the financial metrics mean?

Or click one of the suggested questions below!`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateResponse(text);
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (line.startsWith('• ')) {
        return <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
      }
      // Empty line
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <>
      {/* Floating Button - Bottom Right Corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${className}`}
        title={isOpen ? 'Close Merlin Assistant' : 'Ask Merlin for Help'}
      >
        {isOpen ? (
          <span className="text-white text-xl">✕</span>
        ) : (
          <span className="text-2xl">🧙‍♂️</span>
        )}
      </button>

      {/* Chat Panel - Pops up from bottom right */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-96 max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🧙‍♂️</span>
                </div>
                <div>
                  <h3 className="font-bold">Merlin Assistant</h3>
                  <p className="text-xs text-white/80">Your energy expert</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80 min-h-48 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {renderContent(message.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors border border-purple-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MerlinAssistant;
