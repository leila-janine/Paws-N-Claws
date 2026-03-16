import Link from "next/link";
import { DogCarousel } from "@/modules/marketing/DogCarousel";
import { CustomerStatusChip } from "@/modules/home/CustomerStatusChip";
import { CustomerQuickViewCard } from "@/modules/home/CustomerQuickViewCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/pawsnclawslogo.jpg"
                alt="Paws N Claws Logo"
                className="h-7 w-7 object-contain"
              />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Paws N Claws
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-700 sm:flex">
            <a href="#services" className="hover:text-slate-950">
              Services
            </a>
            <a href="#how" className="hover:text-slate-950">
              How it works
            </a>
            <a href="#hours" className="hover:text-slate-950">
              Hours
            </a>
          </nav>

          <CustomerStatusChip />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-200 via-sky-200 to-pink-200 blur-3xl opacity-70" />
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
                Online booking • Pet profiles • Appointment tracking
              </p>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Modern grooming appointments for busy pet parents.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
                Book, reschedule, or cancel your grooming session anytime.
                Keep your pet details in one place so every visit is smooth,
                safe, and consistent.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-white shadow-sm hover:opacity-90"
                  style={{
                    background: "linear-gradient(to right, #01e7e5, #d90097)",
                  }}
                >
                  Start a booking
                </Link>
                <Link
                  href="/pets"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Manage pet profiles
                </Link>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <dt className="text-xs font-medium text-slate-500">
                    Booking access
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">24/7</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <dt className="text-xs font-medium text-slate-500">
                    Updates
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">Real-time</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <dt className="text-xs font-medium text-slate-500">
                    Status
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">Tracked</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <CustomerQuickViewCard />
              <div className="mt-6">
                <DogCarousel />
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Services, simplified
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                Select a service, choose your pet, then pick an available time
                slot. The system helps prevent double-booking and keeps
                everything organized.
              </p>
            </div>
            <Link
              href="/booking"
              className="hidden rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:inline-flex"
            >
              View availability
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Bath & Blow Dry",
                desc: "A fresh reset with gentle products.",
              },
              {
                title: "Full Groom",
                desc: "Trim, tidy, and finish with care.",
              },
              {
                title: "Nail & Ear Care",
                desc: "Quick add-ons for comfort and hygiene.",
              },
              {
                title: "Coat Deshedding",
                desc: "Reduce shedding for a cleaner home.",
              },
              {
                title: "Special Notes",
                desc: "Allergies, behavior, and care preferences.",
              },
              {
                title: "Appointment Status",
                desc: "Pending, confirmed, completed, or canceled.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="border-y border-zinc-200/70 bg-zinc-50">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              How booking works
            </h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Log in and set up your profile",
                  desc: "Keep your contact info up to date for reminders and service accuracy.",
                },
                {
                  step: "02",
                  title: "Add your pet details",
                  desc: "Name, breed, size, and special notes—so groomers can follow your care needs.",
                },
                {
                  step: "03",
                  title: "Choose a service and time",
                  desc: "Pick from available slots and manage changes anytime.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-3xl border border-zinc-200 bg-white p-6"
                >
                  <p className="text-xs font-semibold text-zinc-500">
                    STEP {s.step}
                  </p>
                  <p className="mt-2 text-base font-semibold">{s.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="hours" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Visit hours and location
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Booking is available 24/7 online—even outside salon hours.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                  <p className="text-sm font-semibold">Salon hours</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Mon–Sat: 9:00 AM – 6:00 PM
                    <br />
                    Sun: Closed
                  </p>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-6">
                  <p className="text-sm font-semibold">Need to adjust?</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    You can reschedule or cancel from your account page.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-emerald-50 via-sky-50 to-violet-50 p-8">
              <p className="text-sm font-semibold">Ready to book?</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Jump into the portal, select your service, then choose an
                available time slot.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
                >
                  Go to booking portal
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  Create / access account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Paws N Claws</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/account" className="hover:text-zinc-950">
              Account
            </Link>
            <Link href="/pets" className="hover:text-zinc-950">
              Pet details
            </Link>
            <Link href="/booking" className="hover:text-zinc-950">
              Booking portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
