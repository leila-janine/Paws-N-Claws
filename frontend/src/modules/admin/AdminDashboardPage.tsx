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
  Total_Price?: number | null;
  Status: string | null;
  Special_Notes: string | null;
};

type Pet = {
  Pet_ID: string;
  Pet_Name: string;
};

const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Cancelled"];
const PAYMENT_METHODS = ["Cash", "GCash", "Card on site"];

function parseServiceAndNotes(specialNotes: string | null) {
  if (!specialNotes) return { service: "—", notes: "—" };
  const lines = specialNotes.split("\n").map((l) => l.trim());
  const serviceLine = lines.find((l) => l.toLowerCase().startsWith("service:"));
  const notesLine = lines.find((l) => l.toLowerCase().startsWith("notes:"));
  const service = serviceLine ? serviceLine.replace(/service:/i, "").trim() : "—";
  const notes = notesLine ? notesLine.replace(/notes:/i, "").trim() : specialNotes;
  return { service: service || "—", notes: notes || "—" };
}

type Payment = {
  Appointment_ID: string;
  Amount: number;
  Payment_Method: string;
};

type Customer = {
  Customer_ID: string;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone_Number: string | null;
};

function formatPhp(amount: number) {
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AdminDashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [petsById, setPetsById] = useState<Record<string, Pet>>({});
  const [paymentsByAppointmentId, setPaymentsByAppointmentId] = useState<
    Record<string, Payment>
  >({});
  const [customersById, setCustomersById] = useState<Record<string, Customer>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState<string>(
    PAYMENT_METHODS[0],
  );

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
              "Appointment_ID, Customer_ID, Pet_ID, Appointment_Date, Start_Time, Total_Price, Status, Special_Notes",
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
        Total_Price: b.Total_Price ?? null,
        Status: b.Status ?? null,
        Special_Notes: b.Special_Notes ?? null,
      })) as Booking[];

      setBookings(normalizedBookings);

      const petLookup: Record<string, Pet> = {};
      (petData ?? []).forEach((p: any) => {
        petLookup[p.Pet_ID] = p;
      });
      setPetsById(petLookup);

      const ids = normalizedBookings.map((b) => b.id);
      if (ids.length) {
        const [{ data: paymentData }, { data: customerData }] =
          await Promise.all([
            supabase
              .from("PAYMENT")
              .select("Appointment_ID, Amount, Payment_Method")
              .in("Appointment_ID", ids),
            supabase
              .from("CUSTOMER")
              .select("Customer_ID, First_Name, Last_Name, Email, Phone_Number"),
          ]);

        const paymentMap: Record<string, Payment> = {};
        (paymentData ?? []).forEach((p: any) => {
          paymentMap[String(p.Appointment_ID)] = {
            Appointment_ID: String(p.Appointment_ID),
            Amount: Number(p.Amount),
            Payment_Method: String(p.Payment_Method),
          };
        });
        setPaymentsByAppointmentId(paymentMap);

        const customerMap: Record<string, Customer> = {};
        (customerData ?? []).forEach((c: any) => {
          customerMap[String(c.Customer_ID)] = {
            Customer_ID: String(c.Customer_ID),
            First_Name: String(c.First_Name),
            Last_Name: String(c.Last_Name),
            Email: String(c.Email),
            Phone_Number: c.Phone_Number == null ? null : String(c.Phone_Number),
          };
        });
        setCustomersById(customerMap);
      } else {
        setPaymentsByAppointmentId({});
        setCustomersById({});
      }

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

  const handleMarkPaid = async (booking: Booking) => {
    setUpdatingId(booking.id);
    setError(null);

    const amount = Number(booking.Total_Price ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("This appointment has no valid Total_Price to mark as paid.");
      setUpdatingId(null);
      return;
    }

    const { error: insertError } = await supabase.from("PAYMENT").insert({
      Appointment_ID: booking.id,
      Amount: amount,
      Payment_Method: markPaidMethod,
    });

    if (insertError) {
      setError(insertError.message);
      setUpdatingId(null);
      return;
    }

    setPaymentsByAppointmentId((prev) => ({
      ...prev,
      [booking.id]: {
        Appointment_ID: booking.id,
        Amount: amount,
        Payment_Method: markPaidMethod,
      },
    }));
    setMarkPaidId(null);
    setUpdatingId(null);
  };

  const reportRows = useMemo(() => {
    const byCustomer: Record<
      string,
      {
        Customer_ID: string;
        Name: string;
        Email: string;
        Phone: string;
        Appointments: number;
        Unpaid_Appointments: number;
        Paid_Amount_PHP: number;
      }
    > = {};

    Object.values(customersById).forEach((c) => {
      byCustomer[c.Customer_ID] = {
        Customer_ID: c.Customer_ID,
        Name: `${c.First_Name} ${c.Last_Name}`.trim(),
        Email: c.Email,
        Phone: c.Phone_Number ?? "",
        Appointments: 0,
        Unpaid_Appointments: 0,
        Paid_Amount_PHP: 0,
      };
    });

    bookings.forEach((b) => {
      const row =
        byCustomer[b.Customer_ID] ??
        (byCustomer[b.Customer_ID] = {
          Customer_ID: b.Customer_ID,
          Name: "Unknown",
          Email: "",
          Phone: "",
          Appointments: 0,
          Unpaid_Appointments: 0,
          Paid_Amount_PHP: 0,
        });

      row.Appointments += 1;
      const payment = paymentsByAppointmentId[b.id];
      if (payment) {
        row.Paid_Amount_PHP += Number(payment.Amount) || 0;
      } else {
        row.Unpaid_Appointments += 1;
      }
    });

    return Object.values(byCustomer).sort((a, b) =>
      a.Name.localeCompare(b.Name),
    );
  }, [bookings, customersById, paymentsByAppointmentId]);

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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Customer report
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Summary of customers and payment totals.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `paws-n-claws-customer-report-${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`,
                  reportRows.map((r) => ({
                    Customer_ID: r.Customer_ID,
                    Name: r.Name,
                    Email: r.Email,
                    Phone: r.Phone,
                    Appointments: r.Appointments,
                    Unpaid_Appointments: r.Unpaid_Appointments,
                    Paid_Amount_PHP: r.Paid_Amount_PHP,
                  })),
                )
              }
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Download CSV
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Appointments</th>
                  <th className="px-4 py-3 font-medium">Unpaid</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.slice(0, 20).map((r) => (
                  <tr
                    key={r.Customer_ID}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {r.Name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.Email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {r.Appointments}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {r.Unpaid_Appointments}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-semibold">
                      {formatPhp(r.Paid_Amount_PHP)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportRows.length > 20 && (
              <p className="mt-3 text-xs text-slate-500">
                Showing first 20 customers. Download CSV for full report.
              </p>
            )}
          </div>
        </div>

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
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const pet = petsById[booking.Pet_ID];
                    const currentStatus = booking.Status ?? "Pending";
                    const parsed = parseServiceAndNotes(booking.Special_Notes);
                    const payment = paymentsByAppointmentId[booking.id];
                    const isPaid = Boolean(payment);

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
                        <td className="px-4 py-3 align-top text-slate-900">
                          {parsed.service}
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
                            {parsed.notes}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {isPaid ? (
                            <div className="text-xs text-slate-700">
                              <p className="font-semibold text-emerald-700">
                                Paid
                              </p>
                              <p className="text-slate-500">
                                {payment.Payment_Method} •{" "}
                                {formatPhp(payment.Amount)}
                              </p>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-700">
                              <p className="font-semibold text-rose-700">
                                Unpaid
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <div className="inline-flex gap-1">
                            {!isPaid &&
                              (currentStatus === "Pending" ||
                                currentStatus === "Confirmed") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMarkPaidId(booking.id);
                                    setMarkPaidMethod(PAYMENT_METHODS[0]);
                                  }}
                                  className="rounded-full px-2 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                  Mark paid
                                </button>
                              )}
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

        {markPaidId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-semibold text-slate-900">
                Mark appointment as paid
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose a payment method to record.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Payment method
                </label>
                <select
                  value={markPaidMethod}
                  onChange={(e) => setMarkPaidMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const booking = bookings.find((b) => b.id === markPaidId);
                    if (booking) void handleMarkPaid(booking);
                  }}
                  disabled={updatingId === markPaidId}
                  className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(to right, #01e7e5, #d90097)",
                  }}
                >
                  {updatingId === markPaidId ? "Saving..." : "Confirm paid"}
                </button>
                <button
                  type="button"
                  onClick={() => setMarkPaidId(null)}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs text-rose-500 text-center">{error}</p>
        )}
      </main>
    </div>
  );
}

