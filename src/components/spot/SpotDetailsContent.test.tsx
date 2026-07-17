import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpotDetailsContent } from "./SpotDetailsContent";
import { useUserLocationStore } from "@/stores/user-location-store";
import type { Spot } from "@/lib/types";
import type { SpotWeather } from "@/lib/weather/weather-cached";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
}));

vi.mock("@/hooks/useUserLocation", async () => {
  const actual =
    await vi.importActual<typeof import("@/hooks/useUserLocation")>(
      "@/hooks/useUserLocation",
    );
  return actual;
});

function fakeSpot(): Spot {
  return {
    id: "spot-1",
    slug: "spot-1",
    name: "Test Spot",
    city: "Los Angeles",
    citySlug: "los-angeles",
    address: "1 Main St",
    types: [{ slug: "plaza", name: "Plaza" }],
    sports: [],
    image: "https://example.com/img.png",
    crowdLevel: 25,
    country: "United States",
    countryCode: "US",
    location: { lat: 34.0522, lon: -118.2437 },
    createdBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

function fakeWeather(): SpotWeather {
  return {
    current: 22,
    description: "Sunny",
    wind: 3.5,
    humidity: 40,
    tempMin: 18,
    tempMax: 26,
    precipitationMm: 0,
    fetchedAt: Date.now(),
    forecast: [
      {
        day: "Mon",
        slot: "morning",
        icon: "sunny",
        temp: 19,
        description: "Clear",
      },
      {
        day: "Mon",
        slot: "afternoon",
        icon: "partly_cloudy_day",
        temp: 24,
        description: "Partly cloudy",
      },
      {
        day: "Mon",
        slot: "night",
        icon: "cloudy",
        temp: 20,
        description: "Cloudy",
      },
    ],
  };
}

function stubGeolocation(result: {
  ok: boolean;
  code?: number;
  coords?: { latitude: number; longitude: number; accuracy: number };
}): void {
  const { coords } = result;
  Object.defineProperty(window, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition: (
          success: PositionCallback,
          error?: PositionErrorCallback | null,
        ): void => {
          if (result.ok && coords) {
            queueMicrotask(() =>
              success({
                coords: {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  accuracy: coords.accuracy,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                },
                timestamp: Date.now(),
              } as unknown as GeolocationPosition),
            );
            return;
          }
          if (error) {
            queueMicrotask(() =>
              error({
                code: result.code ?? 1,
                message: "stub",
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
              } as unknown as GeolocationPositionError),
            );
          }
        },
      },
    },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "isSecureContext", {
    value: true,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  useUserLocationStore.setState({
    status: "idle",
    location: null,
    radiusMiles: 50,
  });
  Object.defineProperty(window, "isSecureContext", {
    value: true,
    configurable: true,
    writable: true,
  });
});

describe("<SpotDetailsContent>", () => {
  it("renders the miles-away label when user location is granted", () => {
    useUserLocationStore.setState({
      status: "granted",
      location: { lat: 34.0622, lon: -118.2437, accuracy: 5 },
      radiusMiles: 50,
    });
    render(
      <SpotDetailsContent
        spot={fakeSpot()}
        isSaved={false}
        onToggleSave={vi.fn()}
        weather={fakeWeather()}
      />,
    );
    expect(screen.getByText(/MILES AWAY$/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Share your location to see distance from this spot/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("requests location when the CTA is clicked and updates the label on grant", async () => {
    stubGeolocation({
      ok: true,
      coords: { latitude: 34.0622, longitude: -118.2437, accuracy: 5 },
    });
    const user = userEvent.setup();
    render(
      <SpotDetailsContent
        spot={fakeSpot()}
        isSaved={false}
        onToggleSave={vi.fn()}
        weather={fakeWeather()}
      />,
    );

    const cta = screen.getByRole("button", {
      name: /Share your location to see distance from this spot/i,
    });
    await user.click(cta);

    await waitFor(() => {
      expect(useUserLocationStore.getState().status).toBe("granted");
    });
    await waitFor(() => {
      expect(screen.getByText(/MILES AWAY$/)).toBeInTheDocument();
    });
  });

  it("renders the weather status row in a single flex row with truncation utility classes", () => {
    const { container } = render(
      <SpotDetailsContent
        spot={fakeSpot()}
        isSaved={false}
        onToggleSave={vi.fn()}
        weather={fakeWeather()}
      />,
    );
    const rows = container.querySelectorAll(
      ".flex.items-center.gap-3.md\\:gap-4.min-w-0",
    );
    expect(rows.length).toBeGreaterThan(0);
    const row = rows[0] as HTMLElement;
    expect(row.className).toContain("flex");
    expect(row.className).toContain("items-center");
    expect(row.className).toContain("min-w-0");
    expect(row.className).toContain("overflow-hidden");
  });

  it("renders forecast unavailable when weather has no forecast entries", () => {
    const weather = { ...fakeWeather(), forecast: [] };
    render(
      <SpotDetailsContent
        spot={fakeSpot()}
        isSaved={false}
        onToggleSave={vi.fn()}
        weather={weather}
      />,
    );
    expect(screen.getByText(/forecast unavailable/i)).toBeInTheDocument();
  });

  it("renders the weather accuracy note in the weather status block", () => {
    render(
      <SpotDetailsContent
        spot={fakeSpot()}
        isSaved={false}
        onToggleSave={vi.fn()}
        weather={fakeWeather()}
      />,
    );
    const note = screen.getByTestId("weather-accuracy-note-block");
    expect(note).toBeInTheDocument();
    expect(note).toHaveTextContent(/forecast is approximate/i);
    expect(note.closest("div.rounded-xl")).not.toBeNull();
  });

  it("renders a live precipitation link bound to the spot's lat/lon", () => {
    render(
      <SpotDetailsContent
        spot={fakeSpot()}
        isSaved={false}
        onToggleSave={vi.fn()}
        weather={fakeWeather()}
      />,
    );
    const link = screen.getByRole("link", {
      name: /View live precipitation on zoom\.earth/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://zoom.earth/maps/precipitation/#view=34.0522,-118.2437,10z/model=icon",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
