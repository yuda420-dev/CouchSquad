import Link from "next/link";
import { Users, ArrowLeft, Bot, ShieldCheck, Lightbulb, Heart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCLAIMERS } from "@/lib/utils/disclaimers";

export const metadata = {
  title: "AI Disclosure — CoachSquad",
  description:
    "Full transparency about what CoachSquad's AI coaches are and aren't.",
};

function Section({
  icon: Icon,
  iconColor,
  heading,
  points,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  heading: string;
  points: readonly string[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}12` }}
        >
          <span style={{ color: iconColor }}>
            <Icon className="w-4.5 h-4.5" />
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      </div>
      <ul className="space-y-2.5 ml-12">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0 mt-2" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DisclaimerPage() {
  const { full } = DISCLAIMERS;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="flex items-center justify-between px-6 lg:px-10 py-4 max-w-4xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ember flex items-center justify-center shadow-lg shadow-ember/15">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Coach<span className="text-ember">Squad</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-600 text-xs font-medium mb-4">
            <Bot className="w-3.5 h-3.5" />
            AI Transparency
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mb-4 text-foreground">
            {full.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {full.subtitle}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          <Section
            icon={Bot}
            iconColor="#6366f1"
            heading={full.whatTheyAre.heading}
            points={full.whatTheyAre.points}
          />

          <div className="border-t border-border" />

          <Section
            icon={AlertTriangle}
            iconColor="#ef4444"
            heading={full.whatTheyAreNot.heading}
            points={full.whatTheyAreNot.points}
          />

          <div className="border-t border-border" />

          <Section
            icon={Lightbulb}
            iconColor="#f59e0b"
            heading={full.whyItsStillValuable.heading}
            points={full.whyItsStillValuable.points}
          />

          <div className="border-t border-border" />

          <Section
            icon={Heart}
            iconColor="#e8633b"
            heading={full.howToUseWell.heading}
            points={full.howToUseWell.points}
          />
        </div>

        {/* Crisis box */}
        <div className="mt-12 rounded-2xl border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                Crisis Resources
              </h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 leading-relaxed">
                {DISCLAIMERS.crisis}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Questions about our approach?{" "}
            <a href="mailto:hello@coachsquad.com" className="text-ember hover:text-ember/80 font-medium">
              Get in touch
            </a>
          </p>
          <Link href="/signup">
            <Button className="bg-ember hover:bg-ember/90 text-white shadow-lg shadow-ember/15 rounded-xl px-8">
              Start Building Your Squad
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
