import { describe, it, expect } from "vitest"
import { userFromClaims, type AuthClaims } from "./auth"

describe("userFromClaims", () => {
  it("returns null when sub is missing", () => {
    expect(userFromClaims({ email: "a@b.com" })).toBeNull()
  })

  it("returns null when claims is empty", () => {
    expect(userFromClaims({})).toBeNull()
  })

  it("prefers display_name from user_metadata", () => {
    const claims: AuthClaims = {
      sub: "user-1",
      email: "ada@example.com",
      user_metadata: {
        display_name: "Ada Lovelace",
        full_name: "Ada Byron Lovelace",
        name: "ada",
      },
    }
    expect(userFromClaims(claims)).toMatchObject({
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
    })
  })

  it("falls back through full_name -> name -> email-local-part -> 'Scout'", () => {
    expect(
      userFromClaims({
        sub: "u",
        email: "ada@example.com",
        user_metadata: { full_name: "Ada L." },
      })?.name,
    ).toBe("Ada L.")
    expect(
      userFromClaims({
        sub: "u",
        email: "ada@example.com",
        user_metadata: { name: "ada-name" },
      })?.name,
    ).toBe("ada-name")
    expect(
      userFromClaims({ sub: "u", email: "ada@example.com" })?.name,
    ).toBe("ada")
    expect(userFromClaims({ sub: "u", email: "" })?.name).toBe("Scout")
  })

  it("derives initials from name parts", () => {
    expect(
      userFromClaims({ sub: "u", email: "a@b.c", user_metadata: { name: "Ada Lovelace" } })
        ?.initials,
    ).toBe("AL")
    expect(
      userFromClaims({ sub: "u", email: "a@b.c", user_metadata: { name: "ada" } })
        ?.initials,
    ).toBe("A")
    // Final fallback derives initials from "Scout" rather than the literal
    // "OS" string.
    expect(
      userFromClaims({ sub: "u", email: "" })?.initials,
    ).toBe("S")
  })

  it("uses explicit initials when provided", () => {
    expect(
      userFromClaims({
        sub: "u",
        email: "a@b.c",
        user_metadata: { name: "Ada Lovelace", initials: "AD" },
      })?.initials,
    ).toBe("AD")
  })

  it("picks avatar_url over picture", () => {
    expect(
      userFromClaims({
        sub: "u",
        email: "a@b.c",
        user_metadata: { avatar_url: "https://a", picture: "https://b" },
      })?.avatarUrl,
    ).toBe("https://a")
    expect(
      userFromClaims({
        sub: "u",
        email: "a@b.c",
        user_metadata: { picture: "https://b" },
      })?.avatarUrl,
    ).toBe("https://b")
    expect(
      userFromClaims({ sub: "u", email: "a@b.c" })?.avatarUrl,
    ).toBeNull()
  })
})
