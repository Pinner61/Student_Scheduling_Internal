type LogLevel = "info" | "warn" | "error";

const SECRET_KEY = /password|token|secret|authorization|cookie|service_role|anon_key|apikey/i;

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? "[redacted]" : redact(entry);
    }
    return out;
  }
  return value;
}

function write(level: LogLevel, event: string, meta?: Record<string, unknown>): void {
  const payload = {
    level,
    event,
    ts: new Date().toISOString(),
    ...(meta ? { meta: redact(meta) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info(event: string, meta?: Record<string, unknown>) {
    write("info", event, meta);
  },
  warn(event: string, meta?: Record<string, unknown>) {
    write("warn", event, meta);
  },
  error(event: string, meta?: Record<string, unknown>) {
    write("error", event, meta);
  },
};
