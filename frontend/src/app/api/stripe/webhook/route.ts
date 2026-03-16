import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook signature/secret" },
      { status: 400 },
    );
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointment_id;

    if (appointmentId) {
      const supabase = createServerSupabaseClient();
      const amount = (session.amount_total ?? 0) / 100;
      const paymentMethod =
        session.payment_method_types?.[0] ?? session.payment_status ?? "stripe";

      // Insert payment record
      await supabase.from("PAYMENT").insert({
        Appointment_ID: appointmentId,
        Amount: amount,
        Payment_Method: paymentMethod,
      });

      // Optional: mark appointment as Confirmed after payment
      await supabase
        .from("APPOINTMENT")
        .update({ Status: "Confirmed" })
        .eq("Appointment_ID", appointmentId)
        .neq("Status", "Cancelled");
    }
  }

  return NextResponse.json({ received: true });
}

