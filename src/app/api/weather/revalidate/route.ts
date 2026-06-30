import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

export async function POST(request: Request) {
	const { searchParams } = new URL(request.url)
	const spotId = searchParams.get("spotId")
	const secret = request.headers.get("x-revalidate-secret")

	if (secret !== process.env.REVALIDATE_SECRET) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	if (!spotId) {
		return NextResponse.json(
			{ error: "Missing spotId query parameter" },
			{ status: 400 },
		)
	}

	revalidateTag(`weather:spot:${spotId}`, "max")

	return NextResponse.json({
		revalidated: true,
		tag: `weather:spot:${spotId}`,
		now: Date.now(),
	})
}
