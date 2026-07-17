import { HeroSection } from "@/components/explore/HeroSection";
import ExploreTab from "@/components/explore/ExploreTab";
import {
  getFeaturedSportEvent,
  getSportEvents,
} from "@/lib/sport-events/loader";

export default async function HomePage() {
  const [events, featured] = await Promise.all([
    getSportEvents(),
    getFeaturedSportEvent(),
  ]);
  return (
    <>
      <HeroSection />
      <ExploreTab events={events} featured={featured} />
    </>
  );
}
