import ExploreTab from "@/components/explore/ExploreTab";
import { findFeaturedEvent, listEvents } from "@/lib/services/events";

export default async function ExplorePage() {
  const [events, featured] = await Promise.all([
    listEvents(),
    findFeaturedEvent(),
  ]);
  return <ExploreTab events={events} featured={featured} />;
}
