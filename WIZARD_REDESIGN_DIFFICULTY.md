# Wizard Redesign Options - Implementation Difficulty

**Date:** January 22, 2026  
**Purpose:** Compare implementation difficulty for different wizard redesign approaches

---

## Option 2: Smart Form (Pre-filled) ⭐⭐ EASY

### What It Is
Single-page form showing all 16 questions at once, pre-populated with smart defaults.

### Implementation Time
**1-2 days** for full production version

### Difficulty Score: 2/5 ⭐⭐
- ✅ Very low complexity
- ✅ Uses existing components (CompleteQuestionRenderer)
- ✅ No new dependencies
- ✅ Low risk

### What You Need
```
✅ Already built:
- CompleteQuestionRenderer.tsx (polymorphic question renderer)
- useCaseService (loads questions from database)
- Questions in database (16Q migrations)

✅ To build (1-2 days):
- SmartFormWizard.tsx (created - see experimental folder)
- Calculator service integration
- Results display component
```

### Complexity Breakdown
| Task | Time | Difficulty |
|------|------|------------|
| Render all 16 questions in grid | 2 hours | Easy |
| Group by section (6 sections) | 1 hour | Easy |
| Handle answer state management | 2 hours | Easy |
| Pre-populate with defaults | 1 hour | Easy |
| Connect to calculator service | 2 hours | Easy |
| Results display | 3 hours | Easy |
| Polish UI/UX | 4 hours | Medium |
| **TOTAL** | **15 hours** | **Easy** |

### Demo Code
Already created: `src/components/wizard/experimental/SmartFormWizard.tsx`

**To test:**
```tsx
// In any route
import { SmartFormWizard } from '@/components/wizard/experimental/SmartFormWizard';

function TestPage() {
  return <SmartFormWizard industrySlug="car-wash" />;
}
```

### Pros
- ✅ Instant visual feedback (see all questions)
- ✅ Users can jump to any question
- ✅ Faster completion (no clicking "Next")
- ✅ Better for power users who know their data
- ✅ Can add smart pre-fill from Google Places API later

### Cons
- ⚠️ Can feel overwhelming (16 questions at once)
- ⚠️ Less guidance than wizard
- ⚠️ Mobile UX needs work (long scroll)

---

## Option 1: Conversational AI Wizard ⭐⭐⭐⭐ MEDIUM

### What It Is
Chat interface where AI asks questions naturally and extracts structured answers.

**Example conversation:**
```
Merlin: "Hi! What type of hotel do you operate?"
User: "It's a 150-room upscale hotel in San Francisco"
Merlin: "Great! I see you have 150 rooms in an upscale property. 
        Does it have a pool, restaurant, or spa?"
User: "Pool and restaurant, no spa"
Merlin: "Perfect. Let me calculate your energy profile..."
```

### Implementation Time
**3-5 days** for MVP, **2-3 weeks** for production-ready

### Difficulty Score: 4/5 ⭐⭐⭐⭐
- ⚠️ Medium-high complexity
- ⚠️ Requires LLM integration
- ⚠️ Prompt engineering needed
- ⚠️ Natural language parsing
- ✅ 16Q structure makes it MUCH easier than typical chatbot

### What You Need
```
✅ Already built:
- Questions in database (16Q migrations)
- Structured options for each question
- Calculator services (to be built)

❌ To build (3-5 days):
- LLM integration (OpenAI/Anthropic)
- Prompt templates for each question
- Natural language → structured answer parser
- Conversation state management
- Fallback to form if AI fails
- Chat UI component
- Message history + context window management
```

### Complexity Breakdown
| Task | Time | Difficulty |
|------|------|------------|
| Set up LLM API (OpenAI/Anthropic) | 2 hours | Easy |
| Create prompt templates | 4 hours | Medium |
| Build chat UI component | 6 hours | Medium |
| NL → structured answer parser | 8 hours | Hard |
| Conversation state management | 6 hours | Medium |
| Context window optimization | 4 hours | Medium |
| Fallback to form mode | 3 hours | Medium |
| Error handling + retries | 3 hours | Medium |
| Testing + prompt refinement | 8 hours | Hard |
| **TOTAL** | **44 hours** | **Medium-High** |

### Key Technical Challenges

**Challenge 1: Extracting Structured Answers**
```typescript
// User says: "150 room luxury hotel with pool and restaurant"
// Need to extract:
{
  roomCount: 150,
  hotelClass: "luxury",
  amenities: ["pool", "restaurant"]
}
```

**Solution:** Use structured output from LLM
```typescript
const prompt = `
Extract hotel information from user message.

User: "${userMessage}"

Available hotel classes: ${JSON.stringify(hotelClassOptions)}
Available amenities: ${JSON.stringify(amenityOptions)}

Return JSON:
{
  "roomCount": number,
  "hotelClass": "economy" | "midscale" | "upscale" | "luxury",
  "amenities": string[],
  "confidence": 0-1
}
`;

const response = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  response_format: { type: "json_object" },
  messages: [{ role: "user", content: prompt }]
});
```

**Challenge 2: Managing 16 Questions in Context**
- Can't send all 16 questions to LLM every message (token limit)
- Need to track which questions already answered
- Need to ask follow-ups intelligently

**Solution:** Progressive context building
```typescript
const context = {
  industrySlug: "hotel",
  questionsAnswered: ["hotelClass", "roomCount"],
  currentQuestion: questions.find(q => q.field_name === "amenities"),
  previousAnswers: { hotelClass: "luxury", roomCount: 150 }
};
```

**Challenge 3: User Says Something Ambiguous**
```
User: "We have a pool"
Merlin: "Indoor or outdoor pool?"
User: "Both"
Merlin: "Got it, marking both indoor and outdoor pools."
```

Need clarification logic + multi-turn conversation.

### Implementation Phases

**Phase 1: MVP (3-5 days)**
- Basic chat UI
- LLM integration with structured output
- Ask questions sequentially (not contextual)
- Extract answers
- Generate quote at end
- **Result:** Works but feels scripted

**Phase 2: Enhanced (1 week)**
- Multi-answer extraction from single message
- Conversational follow-ups
- Skip questions if already answered
- Pre-fill detected info
- **Result:** Feels more natural

**Phase 3: Production (2-3 weeks)**
- Error handling + retries
- Fallback to form if AI fails
- A/B testing
- Cost optimization
- Analytics
- **Result:** Production-ready

### Pros
- ✅ Best user experience (feels like talking to expert)
- ✅ Can extract multiple answers from one message
- ✅ Natural for mobile (voice input)
- ✅ Differentiator (competitors don't have this)
- ✅ 16Q structure makes prompt engineering easier

### Cons
- ⚠️ LLM API costs (~$0.01-0.05 per conversation)
- ⚠️ Requires API keys + account setup
- ⚠️ Prompt engineering takes time to get right
- ⚠️ Need fallback if LLM fails
- ⚠️ Latency (1-3 seconds per message)

---

## Why 16Q Makes Conversational AI MUCH Easier

### Traditional Chatbot (Hard)
```
Problem: Open-ended conversation, infinite possible questions
- User can ask anything
- No clear end state
- Hard to extract structured data
- Needs large knowledge base
```

### 16Q Conversational (Easier)
```
Advantage: Closed domain, 16 specific questions
- ✅ Know exactly what questions to ask
- ✅ Know all possible answer options (in database)
- ✅ Clear end state (all 16 answered = generate quote)
- ✅ Can give LLM the schema upfront
```

**Example prompt structure:**
```typescript
const systemPrompt = `
You are Merlin, an energy consultant helping size a BESS system.

You need to collect exactly 16 answers for a ${industrySlug} facility.

Questions to ask (in order):
${questions.map(q => `
- ${q.field_name}: "${q.question_text}"
  Options: ${JSON.stringify(q.options)}
  Required: ${q.is_required}
`).join('\n')}

Current progress: ${answeredCount}/16 questions answered.

Ask the next unanswered question naturally. 
Extract structured answers from user's response.
If user provides multiple answers at once, extract all of them.
`;
```

### Cost Estimate

**Per conversation:**
- ~10 messages average
- ~500 tokens per message
- Total: ~5,000 tokens = $0.02-0.05 with GPT-4

**Monthly at scale:**
- 1,000 quotes/month
- Cost: $20-50/month
- **Very affordable**

---

## Recommendation: Build Both

### Phase 1 (Week 1): **Option 2 - Smart Form** ⭐⭐
- **Why:** Fast proof-of-concept, low risk
- **Time:** 1-2 days
- **Deploy:** To `/wizard-v7-form` route
- **Goal:** Validate calculator integration works

### Phase 2 (Week 2-3): **Option 1 - Conversational AI** ⭐⭐⭐⭐
- **Why:** Differentiator, best UX
- **Time:** 3-5 days MVP, 2 weeks polished
- **Deploy:** To `/wizard-v7-ai` route
- **Goal:** Premium feature for Merlin Pro users

### Phase 3 (Week 4): **A/B Test**
- Show different UIs to different user segments:
  - **Option 2 (Form):** Power users, engineers, repeat visitors
  - **Option 1 (AI):** First-time users, mobile users, premium tier
  - **WizardV6:** Control group

### Phase 4: **Data-Driven Decision**
- Measure:
  - Completion rate
  - Time to complete
  - Accuracy of answers
  - User satisfaction
  - Quote quality
- Keep winner(s)

---

## Quick Start: Build Option 2 Today

**Files already created:**
- ✅ `WIZARD_REDESIGN_ARCHITECTURE.md` (this doc's sibling)
- ✅ `src/components/wizard/experimental/SmartFormWizard.tsx`

**Next steps (30 minutes):**

1. **Create test route:**
```tsx
// src/App.tsx or routes file
import { SmartFormWizard } from '@/components/wizard/experimental/SmartFormWizard';

<Route path="/wizard-v7-form" element={
  <SmartFormWizard industrySlug="car-wash" />
} />
```

2. **Deploy car wash migration** (Week 1 plan)
```bash
# Copy SQL to Supabase
cat database/migrations/20260121_carwash_16q_v3.sql | pbcopy
# Open Supabase SQL editor
open https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq/sql/new
# Paste + execute
```

3. **Test locally:**
```bash
npm run dev
open http://localhost:5178/wizard-v7-form
```

4. **See all 16 questions rendered at once**
- Pre-populated with defaults
- Grouped by section
- Ready for calculator integration

**Total time:** 30 minutes to see it working

---

## Summary Table

| Feature | Option 2 (Form) | Option 1 (AI Chat) |
|---------|----------------|-------------------|
| **Time to MVP** | 1-2 days | 3-5 days |
| **Difficulty** | ⭐⭐ Easy | ⭐⭐⭐⭐ Medium |
| **Dependencies** | None | LLM API |
| **Monthly Cost** | $0 | $20-50 |
| **Mobile UX** | Good | Excellent |
| **Desktop UX** | Excellent | Good |
| **Completion Rate** | High (power users) | Very High (all users) |
| **Differentiation** | Low | High |
| **Risk** | Very Low | Medium |
| **Maintenance** | Low | Medium |

**Best Strategy:** Build Option 2 first (quick win), then Option 1 (differentiator).

Both can coexist - serve different user preferences.
