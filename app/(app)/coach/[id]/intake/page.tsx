"use client";

import { use } from "react";
import { COACHES } from "@/lib/coaches/catalog";
import { ChatInterface } from "@/components/chat-interface";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import type { Coach } from "@/lib/supabase/types";

// Pre-built intake opening messages for each coach
function getIntakeOpening(coach: Coach): { id: string; role: "assistant"; content: string; createdAt: string }[] {
  const domainQuestions: Record<string, string> = {
    fitness: `Hey! I'm ${coach.name}, and I'm excited to work with you. Before we dive in, I'd love to spend some time getting to know you — your body, your goals, your history with movement. This helps me tailor everything specifically to YOU.\n\nLet's start with the basics:\n\n**What's your current fitness routine like?** Do you work out regularly, occasionally, or are you starting fresh? No wrong answers here.`,
    nutrition: `Welcome! I'm ${coach.name}. Before I can give you truly personalized guidance, I need to understand your relationship with food, your goals, and your daily life.\n\nLet's begin:\n\n**How would you describe your current eating habits?** Just paint me a picture of a typical day of eating — no judgment at all.`,
    career: `Hello, I'm ${coach.name}. To coach you effectively, I need to understand where you are, where you want to go, and what's in the way.\n\nLet's start here:\n\n**Tell me about your current professional situation.** What's your role, how long have you been there, and how do you feel about where things stand?`,
    relationships: `Hi there, I'm ${coach.name}. Relationships are deeply personal, so I want to take some time to really understand your world before we work together.\n\nLet's begin gently:\n\n**What brings you to relationship coaching?** Is there a specific situation, or more of a general desire to improve how you connect with others?`,
    mental_health: `Hello, I'm ${coach.name}. I'm glad you're here. Before we start working together, I'd like to understand what's going on in your inner world.\n\nLet's start with:\n\n**What made you seek out coaching in this area?** What's been on your mind lately?`,
    finance: `Hi, I'm ${coach.name}. Money is one of those topics people rarely talk about honestly — so I appreciate you being here. To help you effectively, I need to understand your financial picture.\n\n**Where would you say you are financially right now?** Not specific numbers if you're not comfortable — just the general landscape. Are you feeling in control, overwhelmed, somewhere in between?`,
    parenting: `Hello! I'm ${coach.name}. Parenting is the hardest, most important job there is — and there's no manual. I'm here to help.\n\n**Tell me about your family.** How many kids, what ages? And what's the biggest parenting challenge you're facing right now?`,
    gardening: `Hi there! I'm ${coach.name}. Every garden starts with understanding — the space, the climate, the gardener. So let's get to know each other.\n\n**What's your gardening situation?** Big yard, small patio, windowsill, or just a dream right now? And have you grown anything before?`,
    leadership: `Hello, I'm ${coach.name}. Leadership is built through understanding — of yourself and of the people you lead. Let's start there.\n\n**Tell me about your current leadership role.** Who do you lead, what's the context, and what's the biggest challenge you're facing as a leader right now?`,
    creativity: `Hi! I'm ${coach.name}. Creativity lives in different places for different people, so I want to understand YOUR creative world.\n\n**What's your creative passion?** Writing, art, music, something else? And where are you with it right now — thriving, stuck, just starting?`,
    philosophy: `Welcome. I'm ${coach.name}. Philosophy begins with questions — so let me ask the first ones.\n\n**What's the big question on your mind these days?** It could be about purpose, decisions, ethics, meaning — anything that you've been turning over.`,
  };

  const content = domainQuestions[coach.domain] ||
    `Hello! I'm ${coach.name}. I'm looking forward to working with you. Let's start with a conversation so I can understand your goals and how I can best help.\n\n**What brought you here today?** What are you hoping to work on or improve?`;

  return [{
    id: "intake-opening",
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  }];
}

export default function IntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const coaches = COACHES as unknown as Coach[];
  const coach = coaches.find((c) => c.id === id);

  if (!coach) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-xl font-semibold">Coach not found</p>
      </div>
    );
  }

  const opening = getIntakeOpening(coach);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/50">
        <Link href={`/coach/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <ClipboardList className="w-5 h-5 text-ember" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm">Intake Session with {coach.name}</h2>
          <p className="text-xs text-muted-foreground">
            ~30 minutes to help {coach.name.split(" ")[0]} get to know you
          </p>
        </div>
      </div>

      <ChatInterface
        coach={coach}
        initialMessages={opening as any}
      />
    </div>
  );
}
