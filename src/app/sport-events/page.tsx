import { Suspense } from "react";
import { SportEventsTab } from "@/components/sport-events/SportEventsTab";
import { findFeaturedEvent, listEvents } from "@/lib/services/events";

export const metadata = {
  title: "Sport Events",
  description:
    "The official circuit for action sports: Street League, FISE, Winterclash, X Games, and the World Skate Games. Live, upcoming, and past events in one place.",
};

async function SportEventsContent() {
  const [events, featured] = await Promise.all([
    listEvents(),
    findFeaturedEvent(),
  ]);
  return <SportEventsTab featured={featured} events={events} />;
}

export default function SportEventsPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading sport events"
          className="space-y-6 animate-fade-in"
        >
          <div className="h-10 w-48 rounded-none-none bg-surface-container animate-pulse" />
          <div className="h-[420px] rounded-none-none bg-surface-container animate-pulse" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-80 rounded-none-none bg-surface-container animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <SportEventsContent />
    </Suspense>
  );
}
