import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LatLonLookupPanel } from "./LatLonLookupPanel"
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

describe("<LatLonLookupPanel>", () => {
  it("renders the two inputs and the lookup button", () => {
    render(<LatLonLookupPanel onResult={vi.fn()} />)
    expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /look up/i })).toBeInTheDocument()
  })

  it("calls /api/geocode/reverse and surfaces the result", async () => {
    const onResult = vi.fn()
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

    render(<LatLonLookupPanel onResult={onResult} onError={onError} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/latitude/i), "45.7686")
    await user.type(screen.getByLabelText(/longitude/i), "4.8369")
    await user.click(screen.getByRole("button", { name: /look up/i }))

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({ address: sampleAddress }),
      )
    })
    expect(onError).not.toHaveBeenCalled()
    expect(
      screen.getByText(/reverse-geocode result/i),
    ).toBeInTheDocument()
  })

  it("surfaces an inline error when the API returns non-OK", async () => {
    const onResult = vi.fn()
    const onError = vi.fn()
    setupFetch((url) => {
      if (url.includes("/api/geocode/reverse")) {
        return new Response(JSON.stringify({ error: "Reverse geocode failed" }), {
          status: 502,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response("not found", { status: 404 })
    })

    render(<LatLonLookupPanel onResult={onResult} onError={onError} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/latitude/i), "45.7")
    await user.type(screen.getByLabelText(/longitude/i), "4.8")
    await user.click(screen.getByRole("button", { name: /look up/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /reverse geocode failed/i,
    )
    expect(onResult).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalled()
  })

  it("surfaces a client-side error when coordinates are out of range", async () => {
    const onResult = vi.fn()
    const onError = vi.fn()
    render(<LatLonLookupPanel onResult={onResult} onError={onError} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/latitude/i), "200")
    await user.type(screen.getByLabelText(/longitude/i), "4.8")
    await user.click(screen.getByRole("button", { name: /look up/i }))

    expect(
      await screen.findByText(/coordinates out of range/i),
    ).toBeInTheDocument()
    expect(onResult).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalled()
  })
})
