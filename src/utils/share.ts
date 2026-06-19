import { PriceListUpdate } from "../types";

/**
 * Encodes the entire premium gold prices schema into a tight, web-safe Base64 string.
 * Uses TextEncoder/Decoder to handle rich Turkish character mappings flawlessly.
 */
export function encodePriceList(data: PriceListUpdate): string {
  try {
    const compact = {
      d: data.date,
      t: data.title,
      s: data.subtitle,
      n: data.note,
      p: data.prices.map(item => [item.id, item.sell, item.buy])
    };
    const str = JSON.stringify(compact);
    const utf8Bytes = new TextEncoder().encode(str);
    const base64 = btoa(String.fromCharCode(...utf8Bytes));
    // Strip padding and make base64 perfectly URL-safe
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (e) {
    console.error("Failed to encode price list:", e);
    return "";
  }
}

/**
 * Decodes a web-safe Base64 string back into the fully hydrated price list update schema.
 */
export function decodePriceList(encoded: string, fallback: PriceListUpdate): PriceListUpdate {
  try {
    // Restore base64 standard alphabet
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decodedStr = new TextDecoder().decode(bytes);
    const compact = JSON.parse(decodedStr);
    
    // Map compact arrays back into complete PriceMetadata items
    const rebuiltPrices = fallback.prices.map(def => {
      const found = compact.p.find((p: any) => p[0] === def.id);
      if (found) {
        return {
          id: def.id,
          name: def.name,
          sell: found[1] === "" || found[1] === undefined ? null : found[1] === null ? null : parseFloat(found[1]),
          buy: found[2] === "" || found[2] === undefined ? null : found[2] === null ? null : parseFloat(found[2]),
          lastUpdated: new Date().toISOString()
        };
      }
      return def;
    });

    return {
      date: compact.d || fallback.date,
      title: compact.t || fallback.title,
      subtitle: compact.s || fallback.subtitle,
      note: compact.n || fallback.note,
      prices: rebuiltPrices
    };
  } catch (e) {
    console.error("Failed to decode custom price link:", e);
    return fallback;
  }
}
