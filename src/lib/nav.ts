import type { TabType } from "@/lib/types";
import { Compass, Map, Heart, PlusCircle, Trophy, type LucideIcon } from "lucide-react";

export const NAV_ITEMS: readonly {
  id: TabType;
  path: "/" | "/map" | "/saved" | "/post" | "/sport-events";
  label: string;
  shortLabel: string;
  drawerLabel: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "explore",
    path: "/",
    label: "Explore",
    shortLabel: "Explore",
    drawerLabel: "Explore Archive",
    Icon: Compass,
  },
  {
    id: "map",
    path: "/map",
    label: "Spot Map",
    shortLabel: "Map",
    drawerLabel: "Spot Map",
    Icon: Map,
  },
  {
    id: "saved",
    path: "/saved",
    label: "Saved",
    shortLabel: "Saved",
    drawerLabel: "Saved Locations",
    Icon: Heart,
  },
  {
    id: "post",
    path: "/post",
    label: "Post Spot",
    shortLabel: "Post",
    drawerLabel: "Register Plot",
    Icon: PlusCircle,
  },
  {
    id: "events",
    path: "/sport-events",
    label: "Events",
    shortLabel: "Events",
    drawerLabel: "Sport Events",
    Icon: Trophy,
  },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

export const ROUTES = {
  explore: "/",
  map: "/map",
  saved: "/saved",
  post: "/post",
  events: "/sport-events",
  spot: (id: string) => `/spots/${id}`,
} as const;

export function isActivePath(currentPath: string, itemPath: string): boolean {
  if (itemPath === "/") return currentPath === "/";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function getActiveTabFromPath(pathname: string): TabType {
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/saved")) return "saved";
  if (pathname.startsWith("/post")) return "post";
  if (pathname.startsWith("/events")) return "events";
  return "explore";
}
