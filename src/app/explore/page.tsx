import ExploreTab from "@/components/explore/ExploreTab";
import { getFeaturedSportEvent, getSportEvents } from "@/lib/sport-events/loader";

export default async function ExplorePage() {
  const [events, featured] = await Promise.all([
    getSportEvents(),
    getFeaturedSportEvent(),
  ]);
  return <ExploreTab events={events} featured={featured} />;
}
