import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}

// Demo coaches: Marcus (fitness), Dr. Sarah Kim (mental_health), Victoria (career), Dr. Elena Voss (nutrition)
const DEMO_COACHES = [
  { id: "c0010000-0000-4000-8000-000000000001", name: "Marcus", domain: "fitness" },
  { id: "c0010000-0000-4000-8000-000000000011", name: "Dr. Sarah Kim", domain: "mental_health" },
  { id: "c0010000-0000-4000-8000-000000000007", name: "Victoria", domain: "career" },
  { id: "c0010000-0000-4000-8000-000000000004", name: "Dr. Elena Voss", domain: "nutrition" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

/**
 * POST /api/demo — Seed realistic demo data for the pitch
 */
export async function POST() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Add coaches to roster
    for (const coach of DEMO_COACHES) {
      await supabase.from("user_roster").upsert(
        {
          user_id: user.id,
          coach_id: coach.id,
          is_active: true,
          intake_completed: true,
          last_interaction: daysAgo(Math.floor(Math.random() * 3)),
        },
        { onConflict: "user_id,coach_id" }
      );
    }

    // 2. Create conversations with messages
    const conversations = [
      {
        coach: DEMO_COACHES[0], // Marcus - fitness
        type: "chat" as const,
        title: "Starting a strength program",
        daysBack: 5,
        messages: [
          { role: "user", content: "Hey Marcus, I want to start getting serious about strength training. I've been doing random workouts but nothing consistent." },
          { role: "assistant", content: "Good — recognizing the inconsistency is step one. Random workouts give random results. Here's what I want to know: how many days a week can you realistically commit to training? Not ideally. Realistically." },
          { role: "user", content: "Honestly, 3 days a week. I've got a busy schedule with work." },
          { role: "assistant", content: "Three days is perfect. That's all you need for serious strength gains. Here's what I'm thinking:\n\n**Day 1 — Squat focus**\n- Back squat: 4x5\n- Romanian deadlift: 3x8\n- Lunges: 3x10/side\n\n**Day 2 — Bench focus**\n- Bench press: 4x5\n- Overhead press: 3x8\n- Rows: 3x10\n\n**Day 3 — Deadlift focus**\n- Deadlift: 4x5\n- Front squat: 3x8\n- Pull-ups: 3xAMRAP\n\nWe start light, nail the form, then we build. Trust the process. What equipment do you have access to?" },
          { role: "user", content: "Full gym with racks and barbells. This looks perfect. When should I start?" },
          { role: "assistant", content: "Today. Or tomorrow morning at the latest. The best program is the one you start. First session, I want you to go light — maybe 60% of what you think you can do. We're building the habit first, not testing your max.\n\nOne more thing: track every workout. Write down the weight, sets, reps. The iron doesn't lie, and neither should your log. Ready to get after it?" },
        ],
      },
      {
        coach: DEMO_COACHES[0], // Marcus - intake
        type: "intake" as const,
        title: "Intake session with Marcus",
        daysBack: 12,
        messages: [
          { role: "assistant", content: "Welcome. I'm Marcus, and I'm going to be straight with you — I care about results, not feelings. But I also know that sustainable results come from understanding where you're starting. So let's get to know each other.\n\nFirst question: What's your experience with strength training? Be honest." },
          { role: "user", content: "I've been going to the gym on and off for about 2 years. Mostly machines and some dumbbell work. Never really followed a program." },
          { role: "assistant", content: "Good. Two years means you're not a complete beginner, but program-hopping means we have room to build a real foundation. Next: what's your main goal? What does 'success' look like to you in 6 months?" },
          { role: "user", content: "I want to feel confident in the gym, hit a 225 bench, and just look and feel stronger overall." },
          { role: "assistant", content: "A 225 bench is a great milestone — it's achievable and specific. I like that. Now, any injuries, limitations, or medical conditions I should know about? This isn't optional — I need to know so I can keep you safe." },
        ],
      },
      {
        coach: DEMO_COACHES[1], // Dr. Sarah Kim - mental health
        type: "chat" as const,
        title: "Managing work stress",
        daysBack: 3,
        messages: [
          { role: "user", content: "I've been feeling really overwhelmed at work lately. It's like I can never catch up." },
          { role: "assistant", content: "I hear you, and that feeling of being perpetually behind is really common — and really draining. Before we work on strategies, I want to understand what 'overwhelmed' looks like for you. When you say you can never catch up, is that about the volume of tasks, the emotional weight of the work, or something else?" },
          { role: "user", content: "Both, I think. There's always more to do, and I feel guilty when I stop working." },
          { role: "assistant", content: "That guilt is important to notice. Let's look at that through a CBT lens:\n\n**The thought:** \"I should always be working. If I stop, I'm falling behind.\"\n**The feeling:** Guilt, anxiety\n**The behavior:** Working longer hours, not resting\n\nHere's what I want you to try this week — a thought record. When you notice that guilt creeping in, write down:\n1. What triggered it\n2. What you were thinking\n3. What evidence supports that thought\n4. What evidence contradicts it\n\nOften, the thought \"I should never stop\" doesn't survive scrutiny. Would you be willing to try this?" },
          { role: "user", content: "That makes sense. I'll try it. I think I know the guilt doesn't make rational sense, but it feels so real in the moment." },
          { role: "assistant", content: "That's exactly right — feelings aren't facts, but they feel like facts. And that's okay. The thought record isn't about dismissing your feelings. It's about creating a small pause between the trigger and your reaction.\n\nAlso — I notice Marcus has you starting a strength program. That's actually great for stress management. Exercise is one of the most evidence-based interventions for anxiety. The two go hand in hand.\n\nLet's check in at the end of the week and see what patterns show up in your thought records." },
        ],
      },
      {
        coach: DEMO_COACHES[2], // Victoria - career
        type: "chat" as const,
        title: "Leadership development",
        daysBack: 2,
        messages: [
          { role: "user", content: "I just got promoted to lead a team of 5. First time managing people. Any advice?" },
          { role: "assistant", content: "Congratulations on the promotion. This is a pivotal moment in your career, and I want to make sure you set the right foundation.\n\nFirst principle: **leadership is not about being the smartest person in the room.** It's about making everyone else more effective.\n\nHere are three things I want you to do in your first 30 days:\n\n1. **One-on-ones with each team member** — 30 minutes, ask them: What's going well? What's frustrating? What would make your job easier?\n\n2. **Set clear expectations** — What does \"good\" look like for each person's role? Write it down.\n\n3. **Establish your communication cadence** — Weekly team meeting + weekly 1:1s. Non-negotiable.\n\nWhich of these feels most daunting to you?" },
          { role: "user", content: "Probably the one-on-ones. I'm not sure what to ask or how to handle it if they have complaints." },
          { role: "assistant", content: "That's completely normal. Most new managers fear the 1:1 because they think they need to have all the answers. You don't.\n\nHere's your script for the first round:\n\n*\"Hey [name], now that I'm in this role, I want to understand how I can best support you. I'm not going to pretend I have everything figured out. I'd love to hear: what's working well for you right now, and what's one thing I could help improve?\"*\n\nIf they bring complaints — **listen first, solve later.** Say: \"Thank you for telling me that. I want to think about this and come back with a plan.\"\n\nYou don't have to fix everything on the spot. Listening alone builds enormous trust. Ready to schedule those first three?" },
        ],
      },
      {
        coach: DEMO_COACHES[3], // Dr. Elena Voss - nutrition
        type: "chat" as const,
        title: "Protein and meal planning",
        daysBack: 4,
        messages: [
          { role: "user", content: "Marcus told me I need to eat more protein for my strength goals. How much should I be eating?" },
          { role: "assistant", content: "Marcus is right — protein is the building block your muscles need to recover and grow from training. The evidence is clear on this.\n\nFor someone doing strength training 3x/week, I recommend **0.7-1.0 grams of protein per pound of body weight per day**. What's your current weight?" },
          { role: "user", content: "About 180 pounds." },
          { role: "assistant", content: "Perfect. So you're aiming for **130-180g of protein per day**. I'd suggest starting at 150g and seeing how it feels.\n\nHere's a practical framework:\n\n**Breakfast (30-40g):** Greek yogurt with nuts + eggs, or a protein smoothie\n**Lunch (40-50g):** Chicken/fish/tofu with vegetables and a grain\n**Dinner (40-50g):** Lean meat or fish with roasted vegetables\n**Snacks (20-30g):** Protein shake, jerky, cottage cheese, edamame\n\nThe key isn't perfection — it's consistency. Track your protein for one week so we can identify gaps. What does a typical day of eating look like for you right now?" },
        ],
      },
    ];

    for (const convo of conversations) {
      // Create conversation
      const { data: conv } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          coach_id: convo.coach.id,
          conversation_type: convo.type,
          title: convo.title,
          started_at: daysAgo(convo.daysBack),
          last_message_at: daysAgo(convo.daysBack),
          message_count: convo.messages.length,
        })
        .select("id")
        .single();

      if (conv) {
        // Insert messages with staggered timestamps
        const msgs = convo.messages.map((m, i) => ({
          conversation_id: conv.id,
          role: m.role,
          content: m.content,
          created_at: new Date(
            new Date(daysAgo(convo.daysBack)).getTime() + i * 60000
          ).toISOString(),
        }));
        await supabase.from("messages").insert(msgs);
      }
    }

    // 3. Create memories
    const memories = [
      { coach_id: DEMO_COACHES[0].id, fact: "Has been going to the gym on and off for 2 years, mostly machines and dumbbells", category: "personal", importance: 7 },
      { coach_id: DEMO_COACHES[0].id, fact: "Goal: hit a 225 bench press within 6 months", category: "goal", importance: 9 },
      { coach_id: DEMO_COACHES[0].id, fact: "Can train 3 days per week due to busy work schedule", category: "preference", importance: 8 },
      { coach_id: DEMO_COACHES[0].id, fact: "Has access to a full gym with racks and barbells", category: "personal", importance: 6 },
      { coach_id: DEMO_COACHES[1].id, fact: "Experiencing significant work stress and overwhelm", category: "challenge", importance: 9 },
      { coach_id: DEMO_COACHES[1].id, fact: "Feels guilty when not working, even during rest time", category: "challenge", importance: 8 },
      { coach_id: DEMO_COACHES[1].id, fact: "Starting CBT thought records to track anxious patterns", category: "goal", importance: 7 },
      { coach_id: DEMO_COACHES[2].id, fact: "Recently promoted to first management role, leading team of 5", category: "achievement", importance: 9 },
      { coach_id: DEMO_COACHES[2].id, fact: "Nervous about conducting one-on-one meetings with reports", category: "challenge", importance: 7 },
      { coach_id: DEMO_COACHES[3].id, fact: "Weighs approximately 180 pounds", category: "personal", importance: 6 },
      { coach_id: DEMO_COACHES[3].id, fact: "Needs to increase protein intake to support strength training goals", category: "goal", importance: 8 },
      { coach_id: DEMO_COACHES[3].id, fact: "Target: 150g protein per day", category: "preference", importance: 7 },
    ];

    await supabase.from("coach_memory").insert(
      memories.map((m) => ({
        user_id: user.id,
        ...m,
        source: "conversation",
      }))
    );

    // 4. Create goals
    const goals = [
      {
        coach_id: DEMO_COACHES[0].id,
        title: "Bench press 225 lbs",
        description: "Build up to a 225 lb bench press using progressive overload",
        domain: "Fitness",
        status: "active",
        progress: 35,
        target_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      },
      {
        coach_id: DEMO_COACHES[0].id,
        title: "Train consistently 3x/week",
        description: "Establish a consistent training habit of 3 sessions per week",
        domain: "Fitness",
        status: "active",
        progress: 60,
      },
      {
        coach_id: DEMO_COACHES[1].id,
        title: "Manage work stress better",
        description: "Develop coping strategies for work-related stress and guilt",
        domain: "Mental Health",
        status: "active",
        progress: 25,
      },
      {
        coach_id: DEMO_COACHES[2].id,
        title: "Complete first 30 days as manager",
        description: "Successfully onboard as a new team lead with 1:1s, expectations, and cadence",
        domain: "Career",
        status: "active",
        progress: 40,
        target_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      },
      {
        coach_id: DEMO_COACHES[3].id,
        title: "Hit 150g protein daily",
        description: "Consistently meet protein targets to support strength goals",
        domain: "Nutrition",
        status: "active",
        progress: 45,
      },
    ];

    for (const goal of goals) {
      await supabase.from("goals").insert({
        user_id: user.id,
        ...goal,
      });
    }

    // 5. Create mood entries (past 10 days)
    const moodSequence = ["okay", "good", "good", "great", "okay", "low", "okay", "good", "great", "good"];
    const energySequence: Array<"moderate" | "high" | "low"> = ["moderate", "high", "high", "high", "moderate", "low", "moderate", "high", "high", "moderate"];
    for (let i = 0; i < moodSequence.length; i++) {
      await supabase.from("mood_entries").insert({
        user_id: user.id,
        mood: moodSequence[i],
        energy: energySequence[i],
        created_at: daysAgo(9 - i),
      });
    }

    // 6. Create journal entries
    const journals = [
      { content: "First real strength training session today. Marcus had me start light — just the bar for squats. Humbling but I see the logic. Form first.", mood: "good", energy: "high", daysBack: 5 },
      { content: "Had a tough day at work. The overwhelm is real. Started Dr. Kim's thought record exercise. Writing down my anxious thoughts felt strange but also... clarifying.", mood: "okay", energy: "moderate", daysBack: 3 },
      { content: "Victoria's advice about 1:1 meetings was spot-on. Had my first one with a team member today. They actually seemed grateful someone asked how they were doing.", mood: "great", energy: "high", daysBack: 2 },
      { content: "Meal prepped for the first time. Dr. Voss's protein framework is actually simple when I lay it out. Hit 142g today — close to the 150g target.", mood: "good", energy: "moderate", daysBack: 1 },
    ];

    for (const entry of journals) {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: entry.content,
        mood: entry.mood,
        energy: entry.energy,
        created_at: daysAgo(entry.daysBack),
      });
    }

    // 7. Create habits
    const habitDefs = [
      { name: "Morning workout", emoji: "💪", coach_id: DEMO_COACHES[0].id },
      { name: "Meditate 10 min", emoji: "🧘", coach_id: DEMO_COACHES[1].id },
      { name: "Track protein", emoji: "🥗", coach_id: DEMO_COACHES[3].id },
      { name: "Read 20 pages", emoji: "📚", coach_id: null },
    ];

    for (const h of habitDefs) {
      const { data: habit } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          name: h.name,
          emoji: h.emoji,
          coach_id: h.coach_id,
          frequency: "daily",
          is_active: true,
        })
        .select("id")
        .single();

      if (habit) {
        // Add some completions for past days
        const completionDays = h.name === "Morning workout"
          ? [1, 2, 3, 5, 6, 7]
          : h.name === "Meditate 10 min"
            ? [1, 2, 4, 5, 7]
            : h.name === "Track protein"
              ? [1, 2, 3, 4]
              : [2, 3, 5];

        for (const d of completionDays) {
          await supabase.from("habit_completions").insert({
            user_id: user.id,
            habit_id: habit.id,
            completed_date: dateStr(d),
          });
        }
      }
    }

    // 8. Create touchpoints
    const touchpoints = [
      {
        coach_id: DEMO_COACHES[0].id,
        touchpoint_type: "motivation",
        content: "Hey — just checking in. You've been consistent this week with your training. That's the foundation of everything. Keep showing up. The iron never lies.",
        status: "delivered",
      },
      {
        coach_id: DEMO_COACHES[1].id,
        touchpoint_type: "question",
        content: "Something to sit with today: when was the last time you gave yourself permission to rest without guilt? Notice what comes up.",
        status: "delivered",
      },
      {
        coach_id: DEMO_COACHES[2].id,
        touchpoint_type: "accountability",
        content: "How did your first round of 1:1 meetings go? I'd love to hear what you learned about your team.",
        status: "pending",
      },
    ];

    for (const tp of touchpoints) {
      await supabase.from("touchpoints").insert({
        user_id: user.id,
        ...tp,
        scheduled_for: daysAgo(tp.status === "pending" ? 0 : 1),
        delivered_at: tp.status === "delivered" ? daysAgo(1) : null,
      });
    }

    return Response.json({ success: true, message: "Demo data loaded successfully" });
  } catch (error) {
    console.error("Demo seed error:", error);
    return Response.json({ error: "Failed to load demo data" }, { status: 500 });
  }
}
