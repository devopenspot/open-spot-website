import { HeroSection } from "@/components/explore/HeroSection";
import ExploreTab from "@/components/explore/ExploreTab";
import {
  findFeaturedEvent,
  listEvents,
} from "@/lib/services/events";

export default async function HomePage() {
  const [events, featured] = await Promise.all([
    listEvents(),
    findFeaturedEvent(),
  ]);
  return (
    <div className="space-y-8">
      <HeroSection />
      <ExploreTab events={events} featured={featured} />
    </div>
  );
}
