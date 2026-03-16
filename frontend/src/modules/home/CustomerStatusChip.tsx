"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CustomerStatusChip() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEmail(null);
        setUsername(null);
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);
      setUsername((user.user_metadata as any)?.username ?? null);
      setLoading(false);
    };

    load();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
          Loading…
        </span>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex"
        >
          Log in
        </Link>
        <Link
          href="/booking"
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          style={{
            background: "linear-gradient(to right, #01e7e5, #d90097)",
          }}
        >
          Book now
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account"
        className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          C
        </span>
        <span className="max-w-[14rem] truncate">
          {username ?? email.split("@")[0] ?? "Customer"}
        </span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
      >
        Sign out
      </button>
      <Link
        href="/booking"
        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        style={{
          background: "linear-gradient(to right, #01e7e5, #d90097)",
        }}
      >
        Book now
      </Link>
    </div>
  );
}

