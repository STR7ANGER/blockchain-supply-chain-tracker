export class Metrics {
  private counters = new Map<string, number>();
  increment(name: string, labels: Record<string, string> = {}) {
    const suffix = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value.replaceAll('"', "")}"`)
      .join(",");
    const metric = `provenance_${name}${suffix ? `{${suffix}}` : ""}`;
    this.counters.set(metric, (this.counters.get(metric) ?? 0) + 1);
  }
  render() {
    return `${[
      "# Supply-chain tracker metrics",
      ...[...this.counters]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key} ${value}`),
    ].join("\n")}\n`;
  }
}
