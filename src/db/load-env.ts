import { readFileSync, existsSync } from "node:fs"
import path from "node:path"

function loadEnvFile(file: string, override = false) {
  if (!existsSync(file)) return
  const content = readFileSync(file, "utf8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!override && process.env[key] !== undefined) continue
    process.env[key] = value
  }
}

const root = process.cwd()
loadEnvFile(path.join(root, ".env.local"), true)
loadEnvFile(path.join(root, ".env"), false)