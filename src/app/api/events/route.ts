import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { SportEventQuerySchema } from "@/lib/schemas/event"
import { listEvents } from "@/lib/services/events"
import { log } from "@/lib/log"

// `limit` arrives as a query string (always a string), and
// `SportEventQuerySchema` requires `z.number()`. We coerce here
// rather than at the schema level so the schema stays a single
// source of truth for the domain contract.
const Query = z
  .object({
    q: SportEventQuerySchema.shape.q,
    country: SportEventQuerySchema.shape.country,
    tier: SportEventQuerySchema.shape.tier,
    discipline: SportEventQuerySchema.shape.discipline,
    featured: z
      .string()
      .optional()
      .transform((v) => v === "true" || v === "1"),
    from: SportEventQuerySchema.shape.from,
    to: SportEventQuerySchema.shape.to,
    cursor: SportEventQuerySchema.shape.cursor,
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(SportEventQuerySchema.shape.limit),
  })
  .strict()

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const raw: Record<string, string> = {}
  for (const [k, v] of url.searchParams.entries()) raw[k] = v

  const parsed = Query.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const events = await listEvents(parsed.data)
    return NextResponse.json({ items: events })
  } catch (err) {
    log.error(
      "api.events.list_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
