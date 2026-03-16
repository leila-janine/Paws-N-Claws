"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Pet = {
  Pet_ID: string;
  Pet_Name: string;
};

type Appointment = {
  Appointment_ID: string | number;
  Pet_ID: string;
  Appointment_Date: string;
  Start_Time: string;
  Status: string | null;
  Special_Notes: string | null;
};

export function CustomerQuickViewCard() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [petCount, setPetCount] = useState<number>(0);
  const [nextAppt, setNextAppt] = useState<Appointment | null>(null);
  const [upcomingCount, setUpcomingCount] = useState<number>(0);
  const [petsById, setPetsById] = useState<Record<string, Pet>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSignedIn(false);
        setPetCount(0);
        setNextAppt(null);
        setPetsById({});
        setLoading(false);
        return;
      }

      setSignedIn(true);

      const [{ data: pets }, { data: appts }] = await Promise.all([
        supabase
          .from("PET")
          .select("Pet_ID, Pet_Name")
          .eq("Customer_ID", user.id)
          .order("Pet_Name"),
        supabase
          .from("APPOINTMENT")
          .select(
            "Appointment_ID, Pet_ID, Appointment_Date, Start_Time, Status, Special_Notes",
          )
          .eq("Customer_ID", user.id)
          .order("Appointment_Date", { ascending: true })
          .order("Start_Time", { ascending: true }),
      ]);

      const petList = (pets ?? []) as any[];
      const petMap: Record<string, Pet> = {};
      petList.forEach((p: any) => {
        petMap[p.Pet_ID] = p;
      });

      setPetsById(petMap);
      setPetCount(petList.length);

      const list = (appts ?? []) as any[];
      const appt = (list[0] as any) ?? null;
      setNextAppt(appt);
      setUpcomingCount(list.length);

      setLoading(false);
    };

    load();
  }, [supabase]);

  const nextPetName = nextAppt ? petsById[nextAppt.Pet_ID]?.Pet_Name : null;
  const nextStatus = nextAppt?.Status ?? "Pending";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Today</p>
          <p className="mt-1 text-sm text-zinc-600">
            Quick view of your next appointment
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {signedIn ? "Signed in" : "Guest"}
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-sm font-medium">Next appointment</p>
          {loading ? (
            <p className="mt-1 text-sm text-zinc-600">Loading…</p>
          ) : !signedIn ? (
            <p className="mt-1 text-sm text-zinc-600">
              Log in to see your upcoming bookings.
            </p>
          ) : nextAppt ? (
            <>
              <p className="mt-1 text-sm text-zinc-600">
                {nextAppt.Appointment_Date} at {nextAppt.Start_Time}
                {nextPetName ? ` • ${nextPetName}` : ""}
              </p>
              {upcomingCount > 1 && (
                <p className="mt-1 text-xs text-zinc-500">
                  and {upcomingCount - 1} more upcoming appointment
                  {upcomingCount - 1 === 1 ? "" : "s"}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-zinc-600">
              No appointment yet — book one anytime.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-sm font-medium">Pet profiles</p>
          {loading ? (
            <p className="mt-1 text-sm text-zinc-600">Loading…</p>
          ) : !signedIn ? (
            <p className="mt-1 text-sm text-zinc-600">
              Log in to manage your pets.
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-600">
              {petCount} pet{petCount === 1 ? "" : "s"} on file
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <p className="text-sm font-medium">Appointment status</p>
          {loading ? (
            <p className="mt-1 text-sm text-zinc-600">Loading…</p>
          ) : !signedIn ? (
            <p className="mt-1 text-sm text-zinc-600">
              Pending → Confirmed → Completed
            </p>
          ) : nextAppt ? (
            <p className="mt-1 text-sm text-zinc-600">{nextStatus}</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-600">No appointments yet</p>
          )}
        </div>

        {signedIn ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/booking"
              className="inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              style={{
                background: "linear-gradient(to right, #01e7e5, #d90097)",
              }}
            >
              Book now
            </Link>
            <Link
              href="/pets"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Manage pets
            </Link>
            <Link
              href="/appointments"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              My appointments
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Log in to continue
          </Link>
        )}
      </div>
    </div>
  );
}

