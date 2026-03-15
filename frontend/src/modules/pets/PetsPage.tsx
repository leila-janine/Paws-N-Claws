"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PET_SIZES = ["Small", "Medium", "Large", "Extra Large"];
const PET_TYPES = ["Canine", "Feline"];

export function PetsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    Pet_Name: "",
    Pet_Type: "",
    Pet_Breed: "",
    Pet_Size: "",
    Special_Notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to add a pet.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("PET").insert({
      Customer_id: user.id,
      Pet_Name: form.Pet_Name,
      Pet_Type: form.Pet_Type,
      Pet_Breed: form.Pet_Breed,
      Pet_size: form.Pet_Size,
      Special_notes: form.Special_Notes,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10">
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
            Add your pet details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Name, breed, size, and special notes—so groomers can follow your
            care needs.
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🐾</div>
            <h2 className="text-lg font-semibold text-slate-800">Pet added!</h2>
            <p className="text-sm text-slate-500 mt-1">
              Your pet's details have been saved.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setForm({
                  Pet_Name: "",
                  Pet_Type: "",
                  Pet_Breed: "",
                  Pet_Size: "",
                  Special_Notes: "",
                });
              }}
              className="mt-5 text-sm font-medium text-blue-500 hover:text-blue-600 transition"
            >
              + Add another pet
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pet Name */}
            <div>
              <label
                htmlFor="Pet_Name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Pet Name
              </label>
              <input
                id="Pet_Name"
                name="Pet_Name"
                type="text"
                required
                value={form.Pet_Name}
                onChange={handleChange}
                placeholder="e.g. Buddy"
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-slate-400 transition"
              />
            </div>

            {/* Pet Type */}
            <div>
              <label
                htmlFor="Pet_Type"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Pet Type
              </label>
              <select
                id="Pet_Type"
                name="Pet_Type"
                required
                value={form.Pet_Type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              >
                <option value="" disabled>
                  Select type
                </option>
                {PET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Breed */}
            <div>
              <label
                htmlFor="Pet_Breed"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Breed
              </label>
              <input
                id="Pet_Breed"
                name="Pet_Breed"
                type="text"
                required
                value={form.Pet_Breed}
                onChange={handleChange}
                placeholder="e.g. Golden Retriever"
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-slate-400 transition"
              />
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PET_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setForm({ ...form, Pet_Size: size })}
                    className={`py-2 text-xs font-medium rounded-lg border transition ${
                      form.Pet_Size === size
                        ? "border-transparent text-white"
                        : "border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300"
                    }`}
                    style={
                      form.Pet_Size === size
                        ? {
                            background:
                              "linear-gradient(to right, #01e7e5, #d90097)",
                          }
                        : {}
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Notes */}
            <div>
              <label
                htmlFor="Special_Notes"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Special Notes{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="Special_Notes"
                name="Special_Notes"
                rows={3}
                value={form.Special_Notes}
                onChange={handleChange}
                placeholder="e.g. Sensitive skin, afraid of water, allergic to certain shampoos..."
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
              disabled={loading || !form.Pet_Size}
              style={{
                background: "linear-gradient(to right, #01e7e5, #d90097)",
              }}
              className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Pet"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
