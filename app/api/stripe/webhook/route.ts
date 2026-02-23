import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";
import type { PlanTier } from "@/lib/stripe/config";
import type Stripe from "stripe";

// Use service role client to bypass RLS for webhook writes
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function epochToIso(epoch: number): string {
  return new Date(epoch * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = (session.metadata?.plan_tier || "pro") as PlanTier;

        if (userId && session.subscription) {
          // Fetch the subscription to get period dates
          const subResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          // Extract the raw data (Stripe Response wraps the object)
          const sub = subResponse as unknown as {
            current_period_start: number;
            current_period_end: number;
          };

          await supabase.from("subscriptions").update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_tier: tier,
            status: "active",
            current_period_start: epochToIso(sub.current_period_start),
            current_period_end: epochToIso(sub.current_period_end),
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        // Access the raw epoch fields
        const raw = sub as unknown as {
          current_period_start: number;
          current_period_end: number;
        };

        if (userId) {
          // Determine tier from price
          const priceId = sub.items.data[0]?.price?.id;
          let tier: PlanTier = "pro";
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID) {
            tier = "elite";
          }

          const status = sub.status === "active" || sub.status === "trialing"
            ? sub.status
            : sub.status === "past_due"
            ? "past_due"
            : "canceled";

          await supabase.from("subscriptions").update({
            plan_tier: tier,
            status,
            current_period_start: epochToIso(raw.current_period_start),
            current_period_end: epochToIso(raw.current_period_end),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        } else {
          // Fallback: look up by stripe_subscription_id
          await supabase.from("subscriptions").update({
            status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled",
            current_period_start: epochToIso(raw.current_period_start),
            current_period_end: epochToIso(raw.current_period_end),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }).eq("stripe_subscription_id", sub.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;

        const updateData = {
          plan_tier: "free",
          status: "canceled",
          stripe_subscription_id: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        };

        if (userId) {
          await supabase.from("subscriptions").update(updateData).eq("user_id", userId);
        } else {
          await supabase.from("subscriptions").update(updateData).eq("stripe_subscription_id", sub.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (invoice.subscription) {
          await supabase.from("subscriptions").update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          }).eq("stripe_subscription_id", invoice.subscription);
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
