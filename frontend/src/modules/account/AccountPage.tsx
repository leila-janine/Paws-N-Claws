"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  email: string | null;
  username?: string | null;
};

export function AccountPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      setProfile({
        email: user.email,
        username: (user.user_metadata as any)?.username ?? null,
      });
      setLoading(false);
    };

    load();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10">
        <div className="flex justify-center mb-6">
          <img
            src="/pawsnclawslogo.jpg"
            alt="Paws n Claws Logo"
            className="w-10 h-10 object-contain"
          />
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your profile details and sign out.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading your account...</p>
        ) : error ? (
          <p className="text-sm text-red-500 text-center">{error}</p>
        ) : profile ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900">
                  {profile.email}
                </p>
              </div>
              {profile.username && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Username
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {profile.username}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

