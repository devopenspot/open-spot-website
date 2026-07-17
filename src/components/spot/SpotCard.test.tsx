import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ExploreSpotCard } from "./SpotCard"
import type { Spot } from "@/lib/types"

function fakeSpot(): Spot {
  return {
    id: "spot-1",
    slug: "spot-1",
    name: "TEST SPOT",
    city: "Los Angeles",
    citySlug: "los-angeles",
    address: "1 Main St",
    types: [{ slug: "plaza", name: "Plaza" }],
    sports: [],
    image: "https://example.com/img.png",
    crowdLevel: 25,
    country: "United States",
    countryCode: "US",
    location: { lat: 0, lon: 0 },
    createdBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  }
}

describe("<ExploreSpotCard>", () => {
  it("toggles aria-pressed and fires onToggleSave when the heart is clicked", async () => {
    const onOpen = vi.fn()
    const onToggleSave = vi.fn()
    render(
      <ExploreSpotCard
        spot={fakeSpot()}
        isSaved={false}
        onOpen={onOpen}
        onToggleSave={onToggleSave}
      />,
    )

    const saveButton = screen.getByRole("button", { name: /Save TEST SPOT/ })
    expect(saveButton).toHaveAttribute("aria-pressed", "false")

    await userEvent.click(saveButton)
    expect(onToggleSave).toHaveBeenCalledWith("spot-1")
  })

  it("reflects isSaved=true via aria-pressed and label", () => {
    const onOpen = vi.fn()
    const onToggleSave = vi.fn()
    render(
      <ExploreSpotCard
        spot={fakeSpot()}
        isSaved={true}
        onOpen={onOpen}
        onToggleSave={onToggleSave}
      />,
    )
    const saveButton = screen.getByRole("button", { name: /Remove TEST SPOT from saved spots/ })
    expect(saveButton).toHaveAttribute("aria-pressed", "true")
  })

  it("does not call onToggleSave when the open button is clicked", async () => {
    const onOpen = vi.fn()
    const onToggleSave = vi.fn()
    render(
      <ExploreSpotCard
        spot={fakeSpot()}
        isSaved={false}
        onOpen={onOpen}
        onToggleSave={onToggleSave}
      />,
    )
    const openButton = screen.getByRole("button", { name: /Open TEST SPOT/ })
    await userEvent.click(openButton)
    expect(onOpen).toHaveBeenCalledWith(fakeSpot())
    expect(onToggleSave).not.toHaveBeenCalled()
  })
})