# CoachSquad — Full Product Vision

## The Big Idea

CoachSquad isn't a chatbot. It's a **personal coaching firm** — a team of specialists who know you, remember everything, coordinate with each other, and proactively show up in your life. The value isn't "talk to AI." The value is: **you finally have the support system that only the ultra-wealthy used to afford.**

---

## 🎙️ 1. REAL-TIME VOICE CONVERSATIONS

**Talk to your coaches like you'd talk to a real person.**

- **Real-time voice** via OpenAI Realtime API — natural back-and-forth, interruptions, emotional tone
- **Unique voice per coach** — Marcus (deep, direct), Aria (calm, warm), Diesel (energetic), Nana Grace (soothing)
- **Mode toggle**: text ↔ voice ↔ hands-free (for workouts, driving, cooking)
- **Voice personality** matches written personality — high-warmth coaches sound warmer
- **Ambient listening mode** for workout coaches: "Count my reps" / "Call out my rest timer"
- **Voice memos**: Quick "Hey Marcus, I hit a new PR today" that get transcribed and remembered

---

## 🧠 2. COACH MEMORY SYSTEM (The Secret Weapon)

**Every coach remembers everything about you — and gets smarter over time.**

- **Automatic fact extraction** from conversations → stored in `coach_memory`
- Categories: goals, preferences, history, fears, milestones, relationships, schedule
- **Memory dashboard** per coach: "Here's what [Coach] knows about you" — reviewable, editable, deletable
- **Cross-coach memory** (with permission): your fitness coach knows your nutritionist recommended more protein
- **Memory decay**: old facts get lower priority unless reinforced
- **Milestone tracking**: coaches remember your PRs, breakthroughs, setbacks
- **Life context**: knows your job, family, schedule, timezone → adjusts advice accordingly

---

## 📋 3. GOAL TRACKING & ACTION PLANS

**Coaches don't just talk — they help you set goals and track progress.**

- **Goal setting flow**: each coach helps define 1-3 goals in their domain
- **Measurable milestones** with target dates
- **Progress check-ins** — coaches ask about goals proactively
- **Visual progress dashboard** — charts, streaks, completion percentages
- **Cross-domain goals**: "Get healthier" touches fitness + nutrition + mental health coaches
- **Weekly/monthly reviews** — auto-generated summary of progress across all coaches
- **Habit stacking**: coaches suggest habits and track streaks (e.g., "meditate 5min after coffee")

---

## 📬 4. PROACTIVE TOUCHPOINTS (Coaches Come to You)

**Your coaches don't wait for you to show up. They reach out.**

- **Smart scheduling**: morning motivation, post-workout check-in, evening reflection
- **Context-aware timing**: knows your timezone, schedule, habits
- **Touchpoint types**:
  - ✨ Motivation — "Hey, just checking in. Remember why you started."
  - 📋 Accountability — "You said you'd do X this week. How's it going?"
  - 🎉 Celebration — "You hit your 30-day streak! Here's what I've noticed..."
  - ❓ Thought-provoking — "Something for you to sit with today..."
  - 📊 Progress update — "Here's your week in review"
- **Push notifications** (if deployed as PWA or native) or email digests
- **Frequency control** per coach — daily, weekly, or "only when I message first"

---

## 🤝 5. COACH COORDINATION ("The Huddle")

**Your coaches talk to each other about you (with your permission).**

- **Cross-referral**: nutrition coach says "your fitness coach mentioned you're training for a marathon — here's how to fuel for it"
- **Conflict resolution**: if your fitness coach says "train harder" and your mental health coach says "you're burning out" — the system notices and facilitates
- **Unified context**: all coaches share a core understanding of your life situation
- **Team insights**: "Based on what your squad has observed, here are your top 3 patterns"
- **Coordination dashboard**: see which coaches are talking and what they've shared

---

## 📓 6. JOURNAL & REFLECTION

**A private space where your thoughts become data your coaches can use.**

- **Daily journal** — free-form writing, prompts optional
- **Mood tracking** — simple emoji/slider, builds a mood graph over time
- **Energy tracking** — morning/afternoon/evening energy levels
- **Auto-insights**: "You tend to feel anxious on Sundays. Your mental health coach has noticed this too."
- **Journal-to-coach**: tag a journal entry so a specific coach sees it at next session
- **Weekly reflection** — auto-generated summary with highlights and patterns

---

## 📊 7. INSIGHTS DASHBOARD (Your Life Dashboard)

**See the big picture of your personal development.**

- **Activity heatmap** — when you talk to which coaches
- **Mood trends** over time (from journal)
- **Goal progress** across all domains
- **Personality evolution** — how you've tuned your coaches over time
- **Coach engagement** — who you talk to most, who you might be neglecting
- **Pattern detection**: "You always skip your finance check-in on Fridays"
- **Monthly/quarterly "State of You" report** — AI-generated comprehensive review

---

## 🏋️ 8. DOMAIN-SPECIFIC FEATURES

### Fitness Coaches
- **Workout logging** — coaches ask "what did you do today?" and log it
- **Program design** — multi-week training plans generated in chat
- **Exercise library** — coaches reference exercises with descriptions
- **Progress photos** (optional) — tracked over time
- **Timer/stopwatch** integration for HIIT coaches

### Nutrition Coaches
- **Meal logging** — describe what you ate, coach logs macros/quality
- **Recipe suggestions** — personalized based on preferences and goals
- **Grocery lists** — generated from meal plans
- **Supplement tracking**

### Finance Coaches
- **Budget snapshots** — manual entry, coaches help analyze
- **Debt payoff tracker** — visualize progress
- **Savings goal trackers**
- **Net worth timeline** (manual entry)

### Mental Health Coaches
- **CBT thought records** — structured in chat, saved as data
- **Meditation timer** — guided by coach, tracked
- **Anxiety/mood logs** — coaches help identify triggers
- **Gratitude practice** — prompted, tracked, reviewed

### Parenting Coaches
- **Behavior logs** — track patterns in child behavior
- **Age-based milestones** — know what's normal
- **Incident journal** — "here's what happened today" → coach reflects back

---

## 🔗 9. INTEGRATIONS

- **Apple Health / Google Fit** → auto-import steps, sleep, heart rate → fitness/health coaches react
- **Calendar** → coaches know when you're busy, suggest optimal times
- **Spotify** → creativity coach knows your music taste
- **Wearables** (Oura, Whoop, Garmin) → recovery scores, HRV → coaches adjust intensity

---

## 💬 10. CONVERSATION FEATURES

- **Voice + text in same thread** — switch seamlessly
- **Rich messages** — coaches can send structured cards (workout plan, recipe, budget template)
- **Reactions** — emoji react to coach messages (coaches notice and respond)
- **Bookmarks** — save important advice for later
- **Search** — find any conversation, any coach, any topic
- **Export** — download conversation history as PDF

---

## 🎨 11. PERSONALIZATION DEPTH

- **Communication style presets**: "Drill Sergeant" / "Best Friend" / "Professor" / "Therapist"
- **Language/cultural preferences** — coaches adapt to cultural context
- **Time-of-day personality shift** — coach is more gentle at night, more energetic in morning
- **Seasonal awareness** — coaches reference seasons, holidays, your schedule

---

## 🏆 12. GAMIFICATION & MOTIVATION

- **Streak tracking** — per coach and global
- **Milestones** — "100 conversations with Marcus", "30-day journal streak"
- **Badges/achievements** — "First Intake", "Full Squad", "Voice Debut"
- **Coach "favorites"** — see which coach you vibe with most
- **Weekly challenges** — coaches propose challenges, you track completion

---

## 📱 13. PLATFORM

- **PWA** — installable, works offline for journaling
- **Push notifications** for touchpoints
- **Responsive** — full mobile-first design
- **Dark/light mode** — user preference
- **Keyboard shortcuts** — power users can navigate fast

---

## Priority Implementation Order

### Phase 1 — Core Value ✅
1. ✅ Coach catalog and browsing
2. ✅ Text chat with streaming
3. ✅ Intake sessions
4. ✅ Persist conversations to Supabase
5. ✅ Coach memory system (auto-extract, store, use in prompts)
6. ✅ Real-time voice conversations (WebRTC + OpenAI Realtime API)
7. ✅ Personality overrides persistence (auto-save + load)

### Phase 2 — Engagement ✅
8. ✅ Goal setting & tracking (create, milestones, progress slider, per-coach)
9. ✅ Proactive touchpoints (generate, mark read, dismiss, template-based)
10. ✅ Journal & mood tracking (entries, quick mood, coach tags, streaks)
11. ✅ Insights dashboard (real data — sessions, hours, streaks, mood trend, goal progress, per-coach activity)

### Phase 3 — Depth ✅
12. ✅ Coach coordination / cross-referral (Huddle page — cross-coach themes, per-coach memory/goal summaries, multi-coach journal entries)
13. ✅ Domain-specific features (Activity Log — workout/meal/meditation/budget/habit logging with type-specific fields, stats, filtering)
14. ✅ Rich message types (structured block parser — plan/recipe/checklist cards with interactive checklists, copy, metadata badges)
15. ✅ Conversation search & bookmarks (history page with search, message bookmarks + copy, coach profile conversation history)

### Phase 4 — Platform ✅
16. 🔲 PWA + push notifications
17. 🔲 Wearable integrations
18. ✅ Gamification (21 achievements across 7 categories — sessions, streaks, goals, journal, squad, voice, special — with progress bars)
19. ✅ Dark mode toggle (warm dark theme, 3-way toggle: light/dark/system, persisted to localStorage)
20. ✅ Export & sharing (full JSON data export — conversations, memories, goals, journal, moods, bookmarks, activity logs)

### Phase 5 — Intelligence & Polish ✅
21. ✅ Smart Recommendations ("For You" page — priority-scored coach suggestions based on mood trends, stale coaches, active goals, uncovered domains, incomplete intakes)
22. ✅ Weekly Review ("State of You" — sessions delta, mood trajectory, goal progress, coach-by-coach breakdown, journal highlights, memory highlights, activity summary)
23. ✅ Conversation Reactions (emoji reactions on messages — 6 quick reactions with optimistic UI, persisted to Supabase)
24. ✅ Coach Memory Dashboard (view/edit/delete all memories, filter by coach/category/search, grouped by coach, inline editing with confirmation)
25. ✅ Habit Tracker (daily habits with streak tracking, week heatmap, coach accountability linking, emoji picker, completion stats)
26. ✅ Keyboard Shortcuts (vim-style "g then key" navigation to all pages, ? for help dialog, auto-cancel timeout)
