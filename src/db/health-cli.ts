import "./load-env"
import { checkDbHealth } from "../lib/db/health"

async function main() {
  const result = await checkDbHealth()
  const status = result.ok ? "ok" : "fail"
  console.log(
    `db:health → ${status}  source=${result.source}  latencyMs=${result.latencyMs}` +
      (result.error ? `  error=${result.error}` : ""),
  )
  process.exit(result.ok ? 0 : 1)
}

main().catch((err) => {
  console.error("db:health crashed:", err instanceof Error ? err.message : err)
  process.exit(1)
})
