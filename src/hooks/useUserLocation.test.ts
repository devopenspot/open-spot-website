import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUserLocation } from "./useUserLocation";
import { useUserLocationStore } from "@/stores/user-location-store";

type GeoResult = {
  ok: boolean;
  code?: number;
  message?: string;
  coords?: { latitude: number; longitude: number; accuracy: number };
};

function installGeolocationMock(result: GeoResult): {
  getCurrentPosition: ReturnType<typeof vi.fn>;
} {
  const getCurrentPosition = vi.fn(
    (
      success: PositionCallback,
      error?: PositionErrorCallback | null,
    ): void => {
      if (result.ok && result.coords) {
        const pos = {
          coords: {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            accuracy: result.coords.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as unknown as GeolocationPosition;
        queueMicrotask(() => success(pos));
        return;
      }
      if (error) {
        const err = {
          code: result.code ?? 2,
          message: result.message ?? "error",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as unknown as GeolocationPositionError;
        queueMicrotask(() => error(err));
      }
    },
  );
  const geo = { getCurrentPosition };
  Object.defineProperty(window, "navigator", {
    value: { geolocation: geo },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "isSecureContext", {
    value: true,
    configurable: true,
    writable: true,
  });
  return { getCurrentPosition };
}

function resetStore() {
  act(() => {
    useUserLocationStore.setState({
      status: "idle",
      location: null,
      grantedAt: null,
      radiusMiles: 50,
    });
  });
  window.sessionStorage.clear();
  Object.defineProperty(window, "isSecureContext", {
    value: true,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "navigator", {
    value: { geolocation: undefined },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useUserLocation", () => {
  it("returns idle state and a request function on first render", () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.status).toBe("idle");
    expect(result.current.location).toBeNull();
    expect(result.current.radiusMiles).toBe(50);
    expect(typeof result.current.request).toBe("function");
  });

  it("granted flow stores the location and timestamp", async () => {
    installGeolocationMock({
      ok: true,
      coords: { latitude: 40.7, longitude: -74.0, accuracy: 50 },
    });
    const { result } = renderHook(() => useUserLocation());
    let status: string = "idle";
    await act(async () => {
      status = await result.current.request();
    });
    expect(status).toBe("granted");
    expect(result.current.status).toBe("granted");
    expect(result.current.location).toEqual({
      lat: 40.7,
      lon: -74.0,
      accuracy: 50,
    });
    expect(result.current.grantedAt).not.toBeNull();
  });

  it("maps PERMISSION_DENIED to denied status", async () => {
    installGeolocationMock({ ok: false, code: 1, message: "denied" });
    const { result } = renderHook(() => useUserLocation());
    let status: string = "idle";
    await act(async () => {
      status = await result.current.request();
    });
    expect(status).toBe("denied");
    expect(result.current.status).toBe("denied");
  });

  it("maps POSITION_UNAVAILABLE to unavailable status", async () => {
    installGeolocationMock({ ok: false, code: 2, message: "unavailable" });
    const { result } = renderHook(() => useUserLocation());
    const status = await act(async () => result.current.request());
    expect(status).toBe("unavailable");
    expect(result.current.status).toBe("unavailable");
  });

  it("maps TIMEOUT to unavailable status", async () => {
    installGeolocationMock({ ok: false, code: 3, message: "timeout" });
    const { result } = renderHook(() => useUserLocation());
    const status = await act(async () => result.current.request());
    expect(status).toBe("unavailable");
  });

  it("returns unavailable when geolocation is not on the navigator", async () => {
    Object.defineProperty(window, "navigator", {
      value: {},
      configurable: true,
      writable: true,
    });
    const { result } = renderHook(() => useUserLocation());
    const status = await act(async () => result.current.request());
    expect(status).toBe("unavailable");
    expect(result.current.status).toBe("unavailable");
  });

  it("returns unavailable in insecure contexts", async () => {
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true,
    });
    Object.defineProperty(window, "navigator", {
      value: {
        geolocation: {
          getCurrentPosition: vi.fn(),
        },
      },
      configurable: true,
      writable: true,
    });
    const { result } = renderHook(() => useUserLocation());
    const status = await act(async () => result.current.request());
    expect(status).toBe("unavailable");
  });

  it("re-prompts when the previous grant is stale (>=10 min)", async () => {
    const { getCurrentPosition } = installGeolocationMock({
      ok: true,
      coords: { latitude: 1, longitude: 2, accuracy: 10 },
    });
    act(() => {
      useUserLocationStore.setState({
        status: "granted",
        location: { lat: 0, lon: 0, accuracy: 0 },
        grantedAt: Date.now() - 11 * 60 * 1000,
        radiusMiles: 50,
      });
    });
    const { result } = renderHook(() => useUserLocation());
    await act(async () => {
      await result.current.request();
    });
    expect(getCurrentPosition).toHaveBeenCalled();
  });

  it("does not re-prompt when the previous grant is fresh (<10 min)", async () => {
    const { getCurrentPosition } = installGeolocationMock({
      ok: true,
      coords: { latitude: 1, longitude: 2, accuracy: 10 },
    });
    act(() => {
      useUserLocationStore.setState({
        status: "granted",
        location: { lat: 10, lon: 20, accuracy: 5 },
        grantedAt: Date.now() - 60_000,
        radiusMiles: 50,
      });
    });
    const { result } = renderHook(() => useUserLocation());
    let status: string = "idle";
    await act(async () => {
      status = await result.current.request();
    });
    expect(status).toBe("granted");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("setRadiusMiles only accepts values in the allowed set", () => {
    const { result } = renderHook(() => useUserLocation());
    act(() => {
      result.current.setRadiusMiles(25);
    });
    expect(result.current.radiusMiles).toBe(25);
    act(() => {
      result.current.setRadiusMiles(75 as never);
    });
    expect(result.current.radiusMiles).toBe(25);
  });

  it("clear() resets status, location, and grantedAt", () => {
    act(() => {
      useUserLocationStore.setState({
        status: "granted",
        location: { lat: 1, lon: 2, accuracy: 5 },
        grantedAt: Date.now(),
        radiusMiles: 50,
      });
    });
    const { result } = renderHook(() => useUserLocation());
    act(() => {
      result.current.clear();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.location).toBeNull();
    expect(result.current.grantedAt).toBeNull();
  });

  it("persists granted location to sessionStorage", async () => {
    installGeolocationMock({
      ok: true,
      coords: { latitude: 12, longitude: 34, accuracy: 1 },
    });
    const { result } = renderHook(() => useUserLocation());
    await act(async () => {
      await result.current.request();
    });
    await waitFor(() => {
      const raw = window.sessionStorage.getItem("openspot-user-location-v1");
      expect(raw).not.toBeNull();
    });
  });
});
