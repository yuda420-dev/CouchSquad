"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  ArrowRight,
  Users,
  Sparkles,
  Loader2,
  Crown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanTier } from "@/lib/stripe/config";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const tierIcons: Record<PlanTier, typeof Users> = {
  free: Users,
  pro: Zap,
  elite: Crown,
};

export default function PricingPage() {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);

  async function handleCheckout(tier: PlanTier) {
    if (tier === "free") {
      router.push("/signup");
      return;
    }

    setLoadingTier(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (res.status === 401) {
        // Not logged in — redirect to signup with plan intent
        router.push(`/signup?plan=${tier}`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="flex items-center justify-between px-6 lg:px-10 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ember flex items-center justify-center shadow-lg shadow-ember/15">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Coach<span className="text-ember">Squad</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-ember hover:bg-ember/90 text-white shadow-md shadow-ember/15">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-5xl mx-auto px-6 lg:px-10 pt-16 pb-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ember/[0.06] border border-ember/15 text-ember text-[13px] font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, honest pricing
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
            Invest in yourself.
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto">
            A team of 20 real coaches would cost $50,000+/year.
            CoachSquad gives you the same breadth of support for less than a gym membership.
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const Icon = tierIcons[plan.tier];
            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-ember/30 bg-card shadow-xl shadow-ember/[0.06] ring-1 ring-ember/10"
                    : "border-border bg-card card-warm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-ember text-white text-xs font-bold shadow-md shadow-ember/20">
                    Most Popular
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: plan.highlight ? "rgba(232,99,59,0.1)" : "var(--secondary)" }}
                  >
                    <Icon className={`w-5 h-5 ${plan.highlight ? "text-ember" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price === 0 ? "Free" : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm">/month</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlight ? "text-ember" : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleCheckout(plan.tier)}
                  disabled={loadingTier === plan.tier}
                  className={`w-full h-11 rounded-xl font-medium ${
                    plan.highlight
                      ? "bg-ember hover:bg-ember/90 text-white shadow-lg shadow-ember/15"
                      : plan.tier === "elite"
                      ? "bg-foreground hover:bg-foreground/90 text-background"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                  }`}
                >
                  {loadingTier === plan.tier ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : plan.tier === "free" ? (
                    <>Get Started Free</>
                  ) : (
                    <>
                      Subscribe to {plan.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FAQ / Trust */}
      <section className="max-w-3xl mx-auto px-6 lg:px-10 pb-24">
        <div className="space-y-6">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel with one click from your billing settings. You'll keep access until the end of your billing period.",
            },
            {
              q: "What happens if I downgrade?",
              a: "You keep your data. Features beyond your new plan's limits become read-only. No data is ever deleted.",
            },
            {
              q: "Is there a free trial?",
              a: "The Starter plan is free forever. Try CoachSquad with 2 coaches and 15 messages per day before upgrading.",
            },
            {
              q: "What payment methods do you accept?",
              a: "All major credit and debit cards via Stripe. Your payment info is never stored on our servers.",
            },
          ].map((faq) => (
            <div
              key={faq.q}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <h4 className="font-semibold text-sm text-foreground mb-1">
                {faq.q}
              </h4>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded bg-ember/80 flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
            <span>Coach<span className="text-ember font-medium">Squad</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/disclaimer" className="text-xs text-muted-foreground/60 hover:text-ember transition-colors">
              AI Disclosure
            </Link>
            <Link href="/" className="text-xs text-muted-foreground/60 hover:text-ember transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
