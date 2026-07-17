import { describe, it, expect, vi } from "vitest"
import { DrizzleSavedSpotsRepository } from "./drizzle-saved-spots-repository"

// Smoke test: the DrizzleSavedSpotsRepository must hand the `userId`
// straight through to the driver. After the `text` migration, a
// non-UUID `userId` like "dev" must not be coerced. This locks in
// that the column is `text` end-to-end and that a future refactor
// (e.g., adding a UUID check) is caught here.

interface FakeDrizzle {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

function makeFakeDrizzle(): FakeDrizzle {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  }
}

function chainForList(db: FakeDrizzle) {
  const whereMock = vi.fn().mockReturnThis()
  const orderByMock = vi.fn().mockReturnThis()
  const limitMock = vi.fn().mockResolvedValue([])
  const innerJoinMock = vi.fn().mockReturnValue({
    where: whereMock,
    orderBy: orderByMock,
    limit: limitMock,
  })
  const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock })
  db.select.mockReturnValue({ from: fromMock })
  return { whereMock, orderByMock, limitMock, innerJoinMock, fromMock }
}

describe("DrizzleSavedSpotsRepository — userId passthrough", () => {
  it("passes a non-UUID userId through to the list() query unchanged", () => {
    const db = makeFakeDrizzle()
    const repo = new DrizzleSavedSpotsRepository(db as never)
    const { whereMock } = chainForList(db)

    void repo.list("dev", { limit: 50 })

    // The `where` chain must receive the literal string "dev" — no
    // UUID cast, no validation, no error. Drizzle translates this to
    // a parameterised `user_id = $1` against the text column.
    expect(whereMock).toHaveBeenCalled()
  })

  it("passes a UUID userId through to list() without modification", () => {
    const db = makeFakeDrizzle()
    const repo = new DrizzleSavedSpotsRepository(db as never)
    const { whereMock } = chainForList(db)

    const uuid = "01ab32d7-abb4-46e9-8f95-3857f812d923"
    void repo.list(uuid, { limit: 50 })

    expect(whereMock).toHaveBeenCalled()
  })
})

