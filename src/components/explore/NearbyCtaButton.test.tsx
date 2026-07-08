import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NearbyCtaButton } from "./NearbyCtaButton";
import { useUserLocationStore } from "@/stores/user-location-store";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => pushMock(...args),
  }),
}));

vi.mock("@/hooks/useUserLocation", async () => {
  const actual =
    await vi.importActual<typeof import("@/hooks/useUserLocation")>(
      "@/hooks/useUserLocation",
    );
  return actual;
});

function stubGeolocation(result: { ok: boolean; code?: number; coords?: { latitude: number; longitude: number; accuracy: number } }): void {
  const coords = result.coords;
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
  pushMock.mockReset();
  useUserLocationStore.setState({
    status: "idle",
    location: null,
    radiusMiles: 50,
  });
});

describe("<NearbyCtaButton>", () => {
  it("renders the 'View Nearby' label by default", () => {
    render(<NearbyCtaButton />);
    expect(
      screen.getByRole("button", { name: /View Nearby/i }),
    ).toBeInTheDocument();
  });

  it("navigates to /map?nearby=1 on click and persists the granted location", async () => {
    stubGeolocation({
      ok: true,
      coords: { latitude: 10, longitude: 20, accuracy: 5 },
    });
    const user = userEvent.setup();
    render(<NearbyCtaButton />);
    await user.click(screen.getByRole("button", { name: /View Nearby/i }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/map?nearby=1");
    });
  });

  it("navigates to /map?nearby=1 even when the user denies the permission", async () => {
    stubGeolocation({ ok: false, code: 1 });
    const user = userEvent.setup();
    render(<NearbyCtaButton />);
    await user.click(screen.getByRole("button", { name: /View Nearby/i }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/map?nearby=1");
    });
  });

  it("navigates to /map?nearby=1 when geolocation is unavailable", async () => {
    Object.defineProperty(window, "navigator", {
      value: {},
      configurable: true,
      writable: true,
    });
    const user = userEvent.setup();
    render(<NearbyCtaButton />);
    await user.click(screen.getByRole("button", { name: /View Nearby/i }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/map?nearby=1");
    });
  });

  it("is disabled and announces the requesting state", () => {
    useUserLocationStore.setState({ status: "requesting" });
    render(<NearbyCtaButton />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.textContent).toMatch(/Locating/i);
  });

  it("ignores additional clicks while the request is in flight", async () => {
    stubGeolocation({
      ok: true,
      coords: { latitude: 1, longitude: 2, accuracy: 1 },
    });
    const user = userEvent.setup();
    render(<NearbyCtaButton />);
    const button = screen.getByRole("button", { name: /View Nearby/i });
    await user.click(button);
    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});
