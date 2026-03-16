"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Pet = {
  Pet_ID: string;
  Pet_Name: string;
};

type Appointment = {
  Appointment_ID: string;
  Pet_ID: string;
  Appointment_Date: string;
  Start_Time: string;
  Status: string | null;
  Special_Notes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

function timeOptions() {
  const opts: string[] = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m > 0) continue;
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    }
  }
  return opts;
}

export function AppointmentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [petsById, setPetsById] = useState<Record<string, Pet>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const times = useMemo(() => timeOptions(), []);

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

    const [{ data: pets }, { data: appts, error: apptError }] =
      await Promise.all([
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

    if (apptError) {
      setError(apptError.message);
      setLoading(false);
      return;
    }

    const petMap: Record<string, Pet> = {};
    (pets ?? []).forEach((p: any) => {
      petMap[p.Pet_ID] = p;
    });
    setPetsById(petMap);
    setAppointments(((appts ?? []) as any[]).map((a: any) => ({ ...a, Appointment_ID: String(a.Appointment_ID) })));

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = async (appt: Appointment) => {
    setError(null);
    setEditingId(appt.Appointment_ID);
    setEditDate(appt.Appointment_Date);
    setEditTime(appt.Start_Time);

    const { data } = await supabase
      .from("APPOINTMENT")
      .select("Start_Time")
      .eq("Appointment_Date", appt.Appointment_Date);

    const occupied = new Set<string>(
      (data ?? []).map((r: any) => String(r.Start_Time)).filter(Boolean),
    );

    occupied.delete(appt.Start_Time);
    setBookedTimes(occupied);
  };

  const onEditDateChange = async (date: string, currentTime?: string) => {
    setEditDate(date);
    setEditTime("");

    if (!date) {
      setBookedTimes(new Set());
      return;
    }

    const { data } = await supabase
      .from("APPOINTMENT")
      .select("Start_Time")
      .eq("Appointment_Date", date);

    const occupied = new Set<string>(
      (data ?? []).map((r: any) => String(r.Start_Time)).filter(Boolean),
    );
    if (currentTime) occupied.delete(currentTime);
    setBookedTimes(occupied);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDate("");
    setEditTime("");
    setBookedTimes(new Set());
  };

  const handleCancel = async (apptId: string) => {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("APPOINTMENT")
      .update({ Status: "Cancelled" })
      .eq("Appointment_ID", apptId);
    if (updateError) setError(updateError.message);
    await load();
    setSaving(false);
  };

  const handleReschedule = async (apptId: string) => {
    if (!editDate || !editTime) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("APPOINTMENT")
      .update({ Appointment_Date: editDate, Start_Time: editTime, Status: "Pending" })
      .eq("Appointment_ID", apptId);
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    cancelEdit();
    await load();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              My appointments
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Reschedule or cancel your upcoming bookings.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Home
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              style={{
                background: "linear-gradient(to right, #01e7e5, #d90097)",
              }}
            >
              Book new
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Loading your appointments…</p>
        ) : appointments.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-700 font-medium">
              No appointments yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Book your first grooming visit anytime.
            </p>
            <Link
              href="/booking"
              className="mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              style={{
                background: "linear-gradient(to right, #01e7e5, #d90097)",
              }}
            >
              Go to booking
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {appointments.map((appt) => {
              const petName = petsById[appt.Pet_ID]?.Pet_Name ?? "Unknown pet";
              const status = STATUS_LABELS[appt.Status ?? "Pending"] ?? (appt.Status ?? "Pending");
              const isEditing = editingId === appt.Appointment_ID;
              const isLocked = status === "Cancelled" || status === "Completed";

              return (
                <div
                  key={appt.Appointment_ID}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {appt.Appointment_Date} at {String(appt.Start_Time).slice(0, 5)} • {petName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Status: {status}
                      </p>
                      {appt.Special_Notes && (
                        <p className="mt-2 text-sm text-slate-600">
                          {appt.Special_Notes}
                        </p>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={saving || isLocked}
                          onClick={() => startEdit(appt)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          disabled={saving || isLocked}
                          onClick={() => handleCancel(appt.Appointment_ID)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="w-full sm:w-[20rem] space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => onEditDateChange(e.target.value, appt.Start_Time)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                          <select
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          >
                            <option value="" disabled>
                              Select time
                            </option>
                            {times.map((t) => {
                              const isBooked = bookedTimes.has(t);
                              return (
                                <option key={t} value={t} disabled={isBooked}>
                                  {t.slice(0, 5)}
                                  {isBooked ? " • booked" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving || !editDate || !editTime}
                            onClick={() => handleReschedule(appt.Appointment_ID)}
                            className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: "linear-gradient(to right, #01e7e5, #d90097)",
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={cancelEdit}
                            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="mt-6 text-xs text-rose-500 text-center">{error}</p>}
      </div>
    </div>
  );
}

