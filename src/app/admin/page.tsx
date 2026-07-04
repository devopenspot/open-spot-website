import { AdminOverviewCards } from "@/components/admin/AdminOverviewCards"

export const metadata = {
  title: "Admin · Overview",
}

export default function AdminOverviewPage() {
  return (
    <section
      id="admin-overview"
      aria-labelledby="admin-overview-heading"
      className="space-y-8 animate-fade-in"
    >
      <header className="border-b border-outline-variant pb-5">
        <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
          Curate the catalogue
        </span>
        <h1
          id="admin-overview-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface sm:text-3xl"
        >
          Overview
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-secondary leading-relaxed">
          A snapshot of the network. Use the sidebar to drill into spots or
          events, or jump straight to a new entry.
        </p>
      </header>

      <AdminOverviewCards />

      <section
        id="admin-quick-start"
        aria-labelledby="admin-quick-start-heading"
        className="rounded-xl border border-outline-variant bg-surface-container-low p-5"
      >
        <h2
          id="admin-quick-start-heading"
          className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-secondary"
        >
          Quick start
        </h2>
        <ul className="space-y-1.5 text-xs text-on-surface leading-relaxed">
          <li>
            Add a new spot by pasting its latitude and longitude. We
            reverse-geocode the coordinates through Nominatim and let you
            edit the result before saving.
          </li>
          <li>
            Curate the sport events calendar from the{" "}
            <span className="font-bold">Events</span> section. The existing
            public listing reflects any change immediately.
          </li>
        </ul>
      </section>
    </section>
  )
}
