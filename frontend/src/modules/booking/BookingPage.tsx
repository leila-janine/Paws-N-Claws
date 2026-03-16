"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Pet = {
  Pet_ID: string;
  Pet_Name: string;
};

const SERVICES = [
  "Full groom",
  "Bath & tidy",
  "Nail trim",
  "De-shedding",
  "Puppy groom",
];

export function BookingPage() {
  const supabase = createClient();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    petId: "",
    date: "",
    time: "",
    service: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPets = async () => {
      setLoadingPets(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoadingPets(false);
        return;
      }

      if (!user) {
        setError("You must be logged in to view your pets.");
        setLoadingPets(false);
        return;
      }

      const { data, error: petsError } = await supabase
        .from("PET")
        .select("Pet_ID, Pet_Name")
        .eq("Customer_ID", user.id)
        .order("Pet_Name");

      if (petsError) {
        setError(petsError.message);
      } else {
        setPets(data ?? []);
      }

      setLoadingPets(false);
    };

    fetchPets();
  }, [supabase]);

  useEffect(() => {
    const loadBookedTimes = async () => {
      if (!form.date) {
        setBookedTimes(new Set());
        return;
      }

      const { data, error } = await supabase
        .from("APPOINTMENT")
        .select("Start_Time")
        .eq("Appointment_Date", form.date);

      if (error || !data) {
        setBookedTimes(new Set());
        return;
      }

      const times = new Set<string>(
        data.map((row: any) => String(row.Start_Time)).filter(Boolean),
      );
      setBookedTimes(times);
    };

    loadBookedTimes();
  }, [supabase, form.date]);

  const timeOptions = (() => {
    const opts: string[] = [];
    // 9:00 to 18:00 every 30 minutes
    for (let h = 9; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 18 && m > 0) continue;
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        opts.push(`${hh}:${mm}:00`);
      }
    }
    return opts;
  })();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setError(userError.message);
      setSubmitting(false);
      return;
    }

    if (!user) {
      setError("You must be logged in to make a booking.");
      setSubmitting(false);
      return;
    }

    const firstName =
      (user.user_metadata as any)?.first_name ??
      (user.user_metadata as any)?.given_name ??
      (user.user_metadata as any)?.full_name ??
      "Customer";
    const lastName =
      (user.user_metadata as any)?.last_name ??
      (user.user_metadata as any)?.family_name ??
      "";
    const phone =
      (user.user_metadata as any)?.phone ??
      (user.user_metadata as any)?.phone_number ??
      "";

    const { error: customerError } = await supabase
      .from("CUSTOMER")
      .upsert(
        {
          Customer_ID: user.id,
          Email: user.email,
          First_Name: firstName,
          Last_Name: lastName,
          Phone_Number: phone,
        },
        {
          onConflict: "Customer_ID",
        },
      );

    if (customerError) {
      setError(customerError.message);
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("APPOINTMENT").insert({
      Customer_ID: user.id,
      Pet_ID: form.petId,
      Appointment_Date: form.date,
      Start_Time: form.time,
      Status: "Pending",
      Special_Notes: `${form.service}${form.notes ? ` — ${form.notes}` : ""}`,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      setForm({
        petId: "",
        date: "",
        time: "",
        service: "",
        notes: "",
      });
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg px-8 py-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/pawsnclawslogo.jpg"
            alt="Paws n Claws Logo"
            className="w-6 h-6 object-contain"
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Book a grooming appointment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a pet, date, time, and service so we can reserve the perfect
            slot.
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🛁</div>
            <h2 className="text-lg font-semibold text-slate-800">
              Booking requested!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              We&apos;ve received your booking details. You&apos;ll hear from us
              soon.
            </p>
            <div className="mt-6 grid gap-3">
              <Link
                href="/"
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
              >
                Go to home
              </Link>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="text-sm font-medium text-blue-500 hover:text-blue-600 transition"
              >
                + Make another booking
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pet selector */}
            <div>
              <label
                htmlFor="petId"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Which pet is this for?
              </label>
              <select
                id="petId"
                name="petId"
                required
                value={form.petId}
                onChange={handleChange}
                disabled={loadingPets || pets.length === 0}
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              >
                {loadingPets ? (
                  <option>Loading your pets...</option>
                ) : pets.length === 0 ? (
                  <option>You don&apos;t have any pets yet.</option>
                ) : (
                  <>
                    <option value="" disabled>
                      Select a pet
                    </option>
                    {pets.map((pet) => (
                      <option key={pet.Pet_ID} value={pet.Pet_ID}>
                        {pet.Pet_Name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {!loadingPets && pets.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Add a pet first on the pets page, then come back to book.
                </p>
              )}
            </div>

            {/* Date & time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Time
                </label>
                <select
                  id="time"
                  name="time"
                  required
                  value={form.time}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                >
                  <option value="" disabled>
                    Select a time
                  </option>
                  {timeOptions.map((t) => {
                    const isBooked = bookedTimes.has(t);
                    const label = t.slice(0, 5); // HH:MM
                    return (
                      <option
                        key={t}
                        value={t}
                        disabled={isBooked}
                        className={isBooked ? "text-red-500" : ""}
                      >
                        {label}
                        {isBooked ? " • booked" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Service type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Service
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICES.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, service }))}
                    className={`py-2 text-xs font-medium rounded-lg border transition ${
                      form.service === service
                        ? "border-transparent text-white"
                        : "border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300"
                    }`}
                    style={
                      form.service === service
                        ? {
                            background:
                              "linear-gradient(to right, #01e7e5, #d90097)",
                          }
                        : {}
                    }
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Notes for your groomer{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Anything we should know about your pet or the appointment?"
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-slate-400 transition resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                submitting ||
                !form.petId ||
                !form.date ||
                !form.time ||
                !form.service
              }
              style={{
                background: "linear-gradient(to right, #01e7e5, #d90097)",
              }}
              className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Request booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

