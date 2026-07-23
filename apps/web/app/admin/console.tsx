"use client";
import Image from "next/image";
import { type FormEvent, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export function OnboardingConsole() {
  const [key, setKey] = useState("");
  const [org, setOrg] = useState("");
  const [status, setStatus] = useState(
    "Create an organization or enter an existing ID.",
  );
  const [qr, setQr] = useState<string | null>(null);
  async function send(path: string, body: Record<string, unknown>) {
    const response = await fetch(`${api}/v1/admin/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": key },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as {
      id?: unknown;
      qrDataUrl?: unknown;
      error?: { code?: string };
    };
    if (!response.ok) {
      setStatus(`Failed: ${result.error?.code ?? "REQUEST_FAILED"}`);
      return null;
    }
    setStatus(`${path} saved.`);
    return result;
  }
  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await send("organizations", {
      name: data.get("name"),
      slug: data.get("slug"),
    });
    if (result?.id) setOrg(String(result.id));
  }
  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const type = String(data.get("type"));
    const common = { organizationId: org };
    let body: Record<string, unknown> = common;
    if (type === "facilities")
      body = {
        ...common,
        name: data.get("name"),
        code: data.get("code"),
        countryCode: data.get("countryCode"),
      };
    if (type === "suppliers")
      body = {
        ...common,
        name: data.get("name"),
        externalRef: data.get("externalRef"),
        contactEmail: data.get("contactEmail"),
      };
    if (type === "products")
      body = { ...common, name: data.get("name"), sku: data.get("sku") };
    if (type === "batches")
      body = {
        ...common,
        productId: data.get("productId"),
        facilityId: data.get("facilityId"),
        lotCode: data.get("lotCode"),
        manufacturedAt: new Date(
          String(data.get("manufacturedAt")),
        ).toISOString(),
      };
    if (type === "items")
      body = {
        ...common,
        batchId: data.get("batchId"),
        serial: data.get("serial"),
      };
    const result = await send(type, body);
    if (result?.qrDataUrl) setQr(String(result.qrDataUrl));
  }
  return (
    <section className="admin-grid">
      <form className="panel form" onSubmit={createOrganization}>
        <h2>Tenant bootstrap</h2>
        <label>
          Admin key
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </label>
        <label>
          Organization name
          <input name="name" required />
        </label>
        <label>
          Slug
          <input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
        </label>
        <button type="submit">Create organization</button>
        <label>
          Organization ID
          <input value={org} onChange={(e) => setOrg(e.target.value)} />
        </label>
      </form>
      <form className="panel form" onSubmit={createRecord}>
        <h2>Catalog registration</h2>
        <label>
          Record type
          <select name="type" required>
            <option value="facilities">Facility</option>
            <option value="suppliers">Supplier</option>
            <option value="products">Product</option>
            <option value="batches">Batch</option>
            <option value="items">Serialized item</option>
          </select>
        </label>
        <label>
          Name
          <input name="name" />
        </label>
        <label>
          Code / serial
          <input name="code" />
          <input name="serial" />
        </label>
        <label>
          Country
          <input name="countryCode" defaultValue="IN" />
        </label>
        <label>
          External ref / SKU
          <input name="externalRef" />
          <input name="sku" />
        </label>
        <label>
          Contact email
          <input name="contactEmail" type="email" />
        </label>
        <label>
          Product ID
          <input name="productId" />
        </label>
        <label>
          Facility ID
          <input name="facilityId" />
        </label>
        <label>
          Batch ID
          <input name="batchId" />
        </label>
        <label>
          Lot code
          <input name="lotCode" />
        </label>
        <label>
          Manufactured at
          <input name="manufacturedAt" type="datetime-local" />
        </label>
        <button type="submit">Save record</button>
        <p aria-live="polite">{status}</p>
      </form>
      {qr && (
        <section className="panel">
          <h2>Public identity</h2>
          <Image
            className="qr"
            src={qr}
            alt="QR code for public product verification"
            width={360}
            height={360}
            unoptimized
          />
        </section>
      )}
    </section>
  );
}
