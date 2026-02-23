import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: subscription } = await (supabase
      .from("subscriptions") as any)
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!subscription) {
      // Return default free tier
      return NextResponse.json({
        plan_tier: "free",
        status: "active",
        cancel_at_period_end: false,
      });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
