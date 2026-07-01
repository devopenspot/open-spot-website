const isTest = process.env.NODE_ENV === "test";

function emit(level: "error" | "warn" | "info", ...args: unknown[]): void {
  if (isTest) return;
  const fn = console[level];
  if (typeof fn === "function") {
    fn(...args);
  }
}

export const log = {
  error: (...args: unknown[]) => emit("error", ...args),
  warn: (...args: unknown[]) => emit("warn", ...args),
  info: (...args: unknown[]) => emit("info", ...args),
};
