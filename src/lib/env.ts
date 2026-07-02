export function getSpotsDataSource(): "json" | "db" {
  const value = process.env.SPOTS_DATA_SOURCE ?? "json"
  return value === "db" ? "db" : "json"
}