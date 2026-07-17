import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { LatLonEditor, type LatLonEditorMode } from "./LatLonEditor"
import type { ProjectedAddress } from "@/lib/geocode/project"

const sampleAddress: ProjectedAddress = {
  displayName: "Some Place, Lyon, France",
  name: null,
  road: "Rue de la République",
  houseNumber: "10",
  city: "Lyon",
  suburb: null,
  state: "Auvergne-Rhône-Alpes",
  country: "France",
  countryCode: "FR",
  lat: 45.7686,
  lon: 4.8369,
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

function setupFetch(impl: (url: string) => Promise<Response> | Response) {
  fetchMock.mockImplementation((input) => {
    const url = typeof input === "string" ? input : (input as Request).url
    return Promise.resolve(impl(url))
  })
}

interface HarnessProps {
  mode?: LatLonEditorMode
  initialLat?: number
  initialLon?: number
  onAutoFillResult?: (a: ProjectedAddress) => void
  onError?: (message: string) => void
  disabled?: boolean
}

function Harness({
  mode = "preview",
  initialLat = 0,
  initialLon = 0,
  onAutoFillResult,
  onError,
  disabled = false,
}: HarnessProps) {
  const [lat, setLat] = useState(initialLat)
  const [lon, setLon] = useState(initialLon)
  return (
    <LatLonEditor
      lat={lat}
      lon={lon}
      mode={mode}
      onChange={(nextLat, nextLon) => {
        setLat(nextLat)
        setLon(nextLon)
      }}
      onAutoFillResult={onAutoFillResult}
      onError={onError}
      disabled={disabled}
    />
  )
}

describe("<LatLonEditor>", () => {
  it("pre-populates the paste field with 'lat, lon' from props", () => {
    render(<Harness initialLat={3.4148330629420376} initialLon={-76.55256421903898} />)
    const paste = screen.getByLabelText(/paste coordinates/i) as HTMLInputElement
    expect(paste.value).toBe("3.4148330629420376, -76.55256421903898")
  })

  it("calls /api/geocode/reverse and surfaces the result in auto-fill mode", async () => {
    const onAutoFillResult = vi.fn()
    const onError = vi.fn()
    setupFetch((url) => {
      if (url.includes("/api/geocode/reverse")) {
        return new Response(JSON.stringify({ address: sampleAddress }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response("not found", { status: 404 })
    })

    render(
      <Harness
        mode="auto-fill"
        initialLat={45.7686}
        initialLon={4.8369}
        onAutoFillResult={onAutoFillResult}
        onError={onError}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /look up/i }))

    await waitFor(() => {
      expect(onAutoFillResult).toHaveBeenCalledWith(sampleAddress)
    })
    expect(onError).not.toHaveBeenCalled()
    expect(
      screen.getByText(/reverse-geocode result/i),
    ).toBeInTheDocument()
  })

  it("does not invoke onAutoFillResult in preview mode", async () => {
    const onAutoFillResult = vi.fn()
    setupFetch((url) => {
      if (url.includes("/api/geocode/reverse")) {
        return new Response(JSON.stringify({ address: sampleAddress }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response("not found", { status: 404 })
    })

    render(
      <Harness
        mode="preview"
        initialLat={45.7686}
        initialLon={4.8369}
        onAutoFillResult={onAutoFillResult}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /look up/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/reverse-geocode result/i),
      ).toBeInTheDocument()
    })
    expect(onAutoFillResult).not.toHaveBeenCalled()
  })

  it("surfaces a 5xx error as 'service unavailable'", async () => {
    const onError = vi.fn()
    setupFetch((url) => {
      if (url.includes("/api/geocode/reverse")) {
        return new Response(
          JSON.stringify({ error: "Reverse geocode failed" }),
          { status: 502, headers: { "content-type": "application/json" } },
        )
      }
      return new Response("not found", { status: 404 })
    })

    render(
      <Harness
        mode="auto-fill"
        initialLat={45.7}
        initialLon={4.8}
        onError={onError}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /look up/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /unavailable/i,
    )
    expect(onError).toHaveBeenCalled()
  })

  it("surfaces a 404 as 'no address found' and does not toast", async () => {
    const onError = vi.fn()
    setupFetch((url) => {
      if (url.includes("/api/geocode/reverse")) {
        return new Response(
          JSON.stringify({ error: "No address found for these coordinates" }),
          { status: 404, headers: { "content-type": "application/json" } },
        )
      }
      return new Response("not found", { status: 404 })
    })

    render(
      <Harness
        mode="auto-fill"
        initialLat={45.7}
        initialLon={4.8}
        onError={onError}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /look up/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /no address found/i,
    )
  })

  it("surfaces a client-side error when coordinates are out of range", async () => {
    const onError = vi.fn()
    render(
      <Harness
        mode="auto-fill"
        initialLat={200}
        initialLon={4.8}
        onError={onError}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /look up/i }))

    expect(
      await screen.findByText(/coordinates out of range/i),
    ).toBeInTheDocument()
    expect(onError).toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("short-circuits the (0, 0) sentinel with an inline error and no API call", async () => {
    const onError = vi.fn()
    render(
      <Harness
        mode="auto-fill"
        initialLat={0}
        initialLon={0}
        onError={onError}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /look up/i }))

    expect(
      await screen.findByText(/placeholder/i),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalled()
  })

  it("disables the lookup button when lat/lon are non-finite", async () => {
    const onError = vi.fn()
    render(
      <Harness
        mode="auto-fill"
        initialLat={Number.NaN}
        initialLon={4.8}
        onError={onError}
      />,
    )
    const button = screen.getByRole("button", { name: /look up/i })
    expect(button).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
