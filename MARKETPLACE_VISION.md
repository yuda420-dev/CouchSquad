# CoachSquad — Human Coach Marketplace (Siloed Add-On)

> **Status**: Concept stage. Kept separate from core AI product until decision to integrate.

---

## The Idea

A **side roster of real human coaches** available at hourly rates. Users can bridge the gap between AI-generated guidance and professional-grade outcomes by booking sessions with vetted human specialists.

The key differentiator: **AI-to-human handoff**. Users don't walk into a session cold — their AI coach has already gathered context, goals, memories, and conversation history that can be packaged into a briefing for the human coach. The human coach gets a head start. The user gets more value per dollar.

---

## How It Works

### For Users
1. Browse a curated roster of real human coaches (separate from the AI roster)
2. See their credentials, specialties, rates, availability, and reviews
3. Book sessions at hourly rates ($75–$250/hr depending on specialty)
4. Before the session, optionally share an "AI Briefing" — a summary of relevant AI coach conversations, goals, memories, and insights
5. After the session, the human coach can leave notes that feed back into the AI system (with user permission)

### For Human Coaches
1. Apply to join the marketplace (vetted for real credentials)
2. Set their own rates, availability, and specialties
3. Receive AI-generated briefings before sessions (user opt-in)
4. Leave session notes that enrich the user's AI coaching experience
5. Get paid via platform minus commission

---

## Revenue Model

- **Platform commission**: 20–30% of each booking
- **User pays**: Full hourly rate at checkout
- **Coach receives**: 70–80% of booking fee
- **Example**: User books a $150/hr session → CoachSquad keeps $30–45, coach receives $105–120

---

## Architecture (Siloed)

Keep completely separate from the AI coaching codebase until integration decision:

### Route Group
```
app/(marketplace)/
  ├── browse/          — Browse human coaches
  ├── coach/[id]/      — Human coach profile + booking
  ├── bookings/        — My upcoming & past sessions
  ├── apply/           — Coach application form
  └── dashboard/       — Coach dashboard (for human coaches)
```

### Database Tables (New, separate)
```sql
-- Human coach profiles (separate from AI coaches table)
human_coaches (
  id, user_id, name, credentials, specialties[], bio,
  hourly_rate, availability_json, rating, review_count,
  stripe_account_id, verified, active
)

-- Booking slots
booking_slots (
  id, coach_id, start_time, end_time, is_available
)

-- Sessions
human_sessions (
  id, user_id, coach_id, booking_slot_id,
  status (booked/completed/cancelled/no_show),
  ai_briefing_shared boolean,
  session_notes text,
  rating, review
)

-- Payments (linked to Stripe Connect)
marketplace_payments (
  id, session_id, amount, platform_fee, coach_payout,
  stripe_payment_intent_id, status
)
```

### Integration Points (Future, Not Now)
- **AI Briefing Export**: Package AI conversation history + goals + memories into a structured briefing doc for the human coach
- **Session Notes Import**: Human coach's notes feed back as high-importance memories into the AI system
- **Cross-referral**: AI coach says "This is beyond my scope — want me to help you book a session with a real [specialty] coach?"
- **Blended Roster**: Human coaches appear alongside AI coaches with a "Real Coach" badge, bookable directly from the discover page

### Payment Infrastructure
- **Stripe Connect** for marketplace payments (separate from subscription billing)
- Human coaches onboard via Stripe Connect Express
- Platform handles payouts automatically

---

## What NOT to Build Yet

- No shared UI components with AI coaching
- No shared database tables
- No AI-to-human handoff features
- No integration into the existing nav/sidebar
- No cross-referral prompts in AI chat

Build the marketplace as if it were a separate product that happens to share auth. Integrate later.

---

## When to Build

**After** the AI product has:
1. Proven product-market fit (retention > 30% at day 30)
2. Active paying subscribers
3. Users explicitly asking for human coaching options (validate demand)

The AI product is the foundation. The marketplace is the expansion.
