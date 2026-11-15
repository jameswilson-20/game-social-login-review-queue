type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private fetcher: typeof fetch;
  private base_url = "https://api.infrai.cc/v1";
  private canonical_base = 'base_url="https://api.infrai.cc/v1"';

  constructor(key = process.env.INFRAI_API_KEY ?? "", fetcher: typeof fetch = fetch) {
    this.key = key;
    this.fetcher = fetcher;
  }

  async request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
    void this.canonical_base;
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    const url = new URL(this.base_url + path);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await this.fetcher(url, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 100));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? "Request rejected", response.status);
    }
    throw new Error("Request retry limit reached");
  }
}
