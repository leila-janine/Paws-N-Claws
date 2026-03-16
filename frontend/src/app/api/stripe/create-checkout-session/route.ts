import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { appointmentId } = (await req.json()) as { appointmentId?: string };
    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointmentId" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: appt, error: apptError } = await supabase
      .from("APPOINTMENT")
      .select("Appointment_ID, Total_Price, Status")
      .eq("Appointment_ID", appointmentId)
      .maybeSingle();

    if (apptError || !appt) {
      return NextResponse.json(
        { error: apptError?.message ?? "Appointment not found" },
        { status: 400 },
      );
    }

    if (appt.Status === "Cancelled") {
      return NextResponse.json(
        { error: "This appointment has been cancelled." },
        { status: 400 },
      );
    }

    const amount = Number((appt as any).Total_Price);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Appointment has no valid Total_Price." },
        { status: 400 },
      );
    }

    const origin = req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "php",
      line_items: [
        {
          price_data: {
            currency: "php",
            product_data: {
              name: "Paws N Claws Grooming Appointment",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/appointments?paid=1`,
      cancel_url: `${origin}/appointments?paid=0`,
      metadata: {
        appointment_id: String((appt as any).Appointment_ID),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Stripe error" },
      { status: 500 },
    );
  }
}

