"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  id: string;
  Customer_ID: string;
  Pet_ID: string;
  Appointment_Date: string;
  Start_Time: string;
  Status: string | null;
  Special_Notes: string | null;
  created_at?: string;
};

type Pet = {
  Pet_ID: string;
  Pet_Name: string;
};

const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Cancelled"];

export function AdminDashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [petsById, setPetsById] = useState<Record<string, Pet>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const [
        { data: bookingData, error: bookingError },
        { data: petData, error: petError },
      ] =
        await Promise.all([
          supabase
            .from("APPOINTMENT")
            .select(
              "Appointment_ID, Customer_ID, Pet_ID, Appointment_Date, Start_Time, Status, Special_Notes",
            )
            .order("Appointment_Date", { ascending: true })
            .order("Start_Time", { ascending: true }),
          supabase.from("PET").select("Pet_ID, Pet_Name"),
        ]);

      if (bookingError) {
        setError(bookingError.message);
        setLoading(false);
        return;
      }

      if (petError) {
        setError(petError.message);
      }

      const normalizedBookings = (bookingData ?? []).map((b: any) => ({
        id: String(b.Appointment_ID),
        Customer_ID: b.Customer_ID,
        Pet_ID: b.Pet_ID,
        Appointment_Date: b.Appointment_Date,
        Start_Time: b.Start_Time,
        Status: b.Status ?? null,
        Special_Notes: b.Special_Notes ?? null,
      })) as Booking[];

      setBookings(normalizedBookings);

      const petLookup: Record<string, Pet> = {};
      (petData ?? []).forEach((p: any) => {
        petLookup[p.Pet_ID] = p;
      });
      setPetsById(petLookup);

      setLoading(false);
    };

    load();
  }, [supabase, router]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "All") return bookings;
    return bookings.filter(
      (b) => (b.Status ?? "Pending") === statusFilter,
    );
  }, [bookings, statusFilter]);

  const handleStatusChange = async (booking: Booking, nextStatus: string) => {
    setUpdatingId(booking.id);
    setError(null);

    const { error: updateError } = await supabase
      .from("APPOINTMENT")
      .update({ Status: nextStatus })
      .eq("Appointment_ID", booking.id);

    if (updateError) {
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id ? { ...b, Status: nextStatus } : b,
      ),
    );
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <span className="text-sm font-semibold text-slate-900">P</span>
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Paws N Claws
              </p>
              <p className="text-[11px] text-slate-500">
                Admin scheduling dashboard
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Bookings overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              See all requested appointments and update their status as you
              work.
            </p>
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Loading bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No bookings found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Pet</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const pet = petsById[booking.Pet_ID];
                    const currentStatus = booking.Status ?? "Pending";

                    return (
                      <tr
                        key={booking.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 align-top text-slate-900">
                          {booking.Appointment_Date}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-900">
                          {booking.Start_Time}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-slate-900">
                            {pet?.Pet_Name ?? "Unknown pet"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              currentStatus === "Completed"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : currentStatus === "Confirmed"
                                  ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                                  : currentStatus === "Cancelled"
                                    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top max-w-xs text-slate-700">
                          <p className="line-clamp-3">
                            {booking.Special_Notes || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <div className="inline-flex gap-1">
                            {STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() =>
                                  handleStatusChange(booking, status)
                                }
                                disabled={updatingId === booking.id}
                                className={`rounded-full px-2 py-1 text-[11px] font-medium transition ${
                                  currentStatus === status
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-xs text-rose-500 text-center">{error}</p>
        )}
      </main>
    </div>
  );
}

