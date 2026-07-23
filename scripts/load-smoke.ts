const target = process.env.LOAD_URL ?? "http://127.0.0.1:3001/health";
const requests = Number(process.env.LOAD_REQUESTS ?? 200);
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 20);

if (
  !Number.isInteger(requests) ||
  !Number.isInteger(concurrency) ||
  requests < 1 ||
  requests > 10_000 ||
  concurrency < 1 ||
  concurrency > 200
) {
  throw new Error("LOAD_REQUESTS or LOAD_CONCURRENCY is outside safe bounds");
}

const durations: number[] = [];
let next = 0;
let failures = 0;
async function worker() {
  while (next < requests) {
    next += 1;
    const started = performance.now();
    try {
      const response = await fetch(target, {
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) failures += 1;
    } catch {
      failures += 1;
    }
    durations.push(performance.now() - started);
  }
}
await Promise.all(Array.from({ length: concurrency }, () => worker()));
durations.sort((a, b) => a - b);
const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
console.info(
  JSON.stringify({
    target,
    requests,
    concurrency,
    failures,
    p95Ms: Math.round(p95),
  }),
);
if (failures > 0 || p95 > 500) process.exitCode = 1;
