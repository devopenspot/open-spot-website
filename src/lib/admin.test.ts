import { describe, it, expect } from "vitest"
import { isAdminUser } from "./admin"
import { DEV_USER_ID, type User } from "./user"

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    initials: "TU",
    avatarUrl: null,
    isAdmin: false,
    ...overrides,
  }
}

describe("isAdminUser", () => {
  it("returns true for the dev placeholder user regardless of admin emails", () => {
    const dev = makeUser({ id: DEV_USER_ID, email: "anything@anywhere.test" })
    expect(isAdminUser(dev, [])).toBe(true)
    expect(isAdminUser(dev, ["someone-else@example.com"])).toBe(true)
  })

  it("returns true when the email is in the allow-list (case-insensitive)", () => {
    const user = makeUser({ email: "Admin@Example.com" })
    expect(isAdminUser(user, ["admin@example.com"])).toBe(true)
  })

  it("returns false when the email is not in the allow-list", () => {
    const user = makeUser({ email: "regular@example.com" })
    expect(isAdminUser(user, ["admin@example.com"])).toBe(false)
  })

  it("returns false when the allow-list is empty", () => {
    const user = makeUser({ email: "admin@example.com" })
    expect(isAdminUser(user, [])).toBe(false)
  })

  it("ignores whitespace and empty entries in the allow-list", () => {
    const user = makeUser({ email: "admin@example.com" })
    expect(
      isAdminUser(user, ["", "  ", "admin@example.com", "  other@example.com  "]),
    ).toBe(true)
  })

  it("matches when there are multiple admins in the list", () => {
    const user = makeUser({ email: "second@example.com" })
    expect(
      isAdminUser(user, ["first@example.com", "second@example.com"]),
    ).toBe(true)
  })
})
