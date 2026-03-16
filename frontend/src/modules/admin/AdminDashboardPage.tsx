"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  id: string;
  Customer_id: string;
  Pet_id: string;
  Service_type: string;
  Appointment_date: string;
  Appointment_time: string;
  Status: string | null;
  Notes: string | null;
  created_at?: string;
};

type Pet = {
  id: string;
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

      const [{ data: bookingData, error: bookingError }, { data: petData, error: petError }] =
        await Promise.all([
          supabase
            .from("BOOKING")
            .select(
              "id, Customer_id, Pet_id, Service_type, Appointment_date, Appointment_time, Status, Notes, created_at",
            )
            .order("Appointment_date", { ascending: true })
            .order("Appointment_time", { ascending: true }),
          supabase.from("PET").select("id, Pet_Name"),
        ]);

      if (bookingError) {
        setError(bookingError.message);
        setLoading(false);
        return;
      }

      if (petError) {
        setError(petError.message);
      }

      setBookings((bookingData ?? []) as Booking[]);

      const petLookup: Record<string, Pet> = {};
      (petData ?? []).forEach((p: any) => {
        petLookup[p.id] = p;
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
      .from("BOOKING")
      .update({ Status: nextStatus })
      .eq("id", booking.id);

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
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 text-slate-950 text-sm font-semibold">
              P
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Paws N Claws
              </p>
              <p className="text-[11px] text-slate-400">
                Admin scheduling dashboard
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Bookings overview
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              See all requested appointments and update their status as you
              work.
            </p>
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
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

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              Loading bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              No bookings found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Pet</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const pet = petsById[booking.Pet_id];
                    const currentStatus = booking.Status ?? "Pending";

                    return (
                      <tr
                        key={booking.id}
                        className="border-b border-slate-800/80 last:border-0 hover:bg-slate-900/60"
                      >
                        <td className="px-4 py-3 align-top text-slate-100">
                          {booking.Appointment_date}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-100">
                          {booking.Appointment_time}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-slate-50">
                            {pet?.Pet_Name ?? "Unknown pet"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-100">
                          {booking.Service_type}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              currentStatus === "Completed"
                                ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40"
                                : currentStatus === "Confirmed"
                                  ? "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/40"
                                  : currentStatus === "Cancelled"
                                    ? "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/40"
                                    : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/40"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top max-w-xs text-slate-200">
                          <p className="line-clamp-3">
                            {booking.Notes || "—"}
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
                                    ? "bg-slate-50 text-slate-900"
                                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
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
          <p className="mt-4 text-xs text-rose-400 text-center">{error}</p>
        )}
      </main>
    </div>
  );
}

