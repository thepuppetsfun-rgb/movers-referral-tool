import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const LIST_URL = "https://www.chabad.org/api/v2/chabadorg/centers";
const DETAIL_URL = "https://www.chabad.org/api/v2/chabadorg/centers";

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

interface DirectoryEntry {
  id: string;
  name: string;
  shliach: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  type: string;
  url: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanZip(zip: string | undefined): string {
  if (!zip) return "";
  const match = String(zip).match(/^(\d{5})/);
  return match ? match[1] : String(zip).trim();
}

function extractShliach(personnel: any[] | undefined): string {
  if (!personnel || personnel.length === 0) return "";
  const director = personnel.find((p: any) => p["is-director"] === true);
  const person = director || personnel[0];
  const parts = [person.title, person["first-name"], person["last-name"]].filter(Boolean);
  return parts.join(" ");
}

async function main() {
  const outPath = resolve(import.meta.dirname!, "../src/data/directory.json");
  mkdirSync(dirname(outPath), { recursive: true });

  let existingMap = new Map<string, DirectoryEntry>();
  if (existsSync(outPath)) {
    try {
      const existing: DirectoryEntry[] = JSON.parse(readFileSync(outPath, "utf-8"));
      for (const e of existing) {
        existingMap.set(e.id, e);
      }
      console.log(`Loaded existing directory.json with ${existingMap.size} entries`);
      const alreadyFetched = existing.filter((e) => e.state !== "").length;
      console.log(`  ${alreadyFetched} already have detail data (will be skipped)`);
    } catch {
      console.log("Could not parse existing directory.json, starting fresh");
    }
  }

  let entries: DirectoryEntry[];

  let usedExisting = false;
  console.log("Fetching center list...");
  try {
    const listResp = await fetch(LIST_URL, { headers: FETCH_HEADERS });
    if (!listResp.ok) {
      throw new Error(`HTTP ${listResp.status} ${listResp.statusText}`);
    }
    const json = await listResp.json();
    const allCenters: any[] = json.data || json;
    console.log(`Total centers from API: ${allCenters.length}`);

    const filtered = allCenters.filter((c) => {
      const lat = c.coordinates?.latitude;
      const lng = c.coordinates?.longitude;
      if (lat && lng) {
        if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return true;
        if (lat >= 51 && lat <= 72 && lng >= -180 && lng <= -129) return true;
        if (lat >= 18 && lat <= 23 && lng >= -161 && lng <= -154) return true;
      }
      return false;
    });

    console.log(`US centers with valid coordinates: ${filtered.length}`);

    entries = filtered.map((c) => {
      const lat = c.coordinates?.latitude || 0;
      const lng = c.coordinates?.longitude || 0;
      const cityRaw = c.city || c.address?.city || "";
      const typeName = c["center-type"]?.name || "";
      const staticUrl = c["static-url"] || "";
      const id = String(c.id || c["mosad-aid"] || "");

      const existing = existingMap.get(id);
      if (existing && existing.state !== "") {
        return existing;
      }

      return {
        id,
        name: c.name || "",
        shliach: "",
        phone: "",
        website: "",
        address: "",
        city: cityRaw,
        state: "",
        zip: "",
        lat,
        lng,
        type: typeName,
        url: staticUrl
          ? (staticUrl.startsWith("http") ? staticUrl : `https://www.chabad.org/jewish-centers/${staticUrl}`)
          : "",
      };
    });
  } catch (err: any) {
    console.log(`List API unavailable (${err.message}), using existing directory.json entries`);
    if (existingMap.size === 0) {
      throw new Error("No existing directory.json and list API unavailable. Cannot proceed.");
    }
    entries = Array.from(existingMap.values());
    usedExisting = true;
  }

  const needsFetch: { idx: number; aid: string }[] = [];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].state === "") {
      needsFetch.push({ idx: i, aid: entries[i].id });
    }
  }

  console.log(`\nNeed to fetch details for ${needsFetch.length} centers (skipping ${entries.length - needsFetch.length} already fetched)`);

  writeFileSync(outPath, JSON.stringify(entries, null, 2));
  console.log(`Wrote initial file with ${entries.length} entries\n`);

  let consecutiveFails = 0;
  async function fetchDetail(aid: any, idx: number): Promise<boolean> {
    const delays = [0, 3000, 10000];
    for (let attempt = 0; attempt < 3; attempt++) {
      if (delays[attempt] > 0) await sleep(delays[attempt]);
      try {
        const resp = await fetch(`${DETAIL_URL}/${aid}`, { headers: FETCH_HEADERS });
        if (resp.ok) {
          consecutiveFails = 0;
          return applyDetail(await resp.json(), idx);
        }
        if (resp.status === 403) {
          consecutiveFails++;
          if (consecutiveFails > 5) {
            console.log(`  Rate limited (403 x${consecutiveFails}), pausing 30s...`);
            await sleep(30000);
            consecutiveFails = 0;
          }
        }
      } catch {
      }
    }
    return false;
  }

  function applyDetail(detail: any, idx: number): boolean {
    entries[idx].shliach = extractShliach(detail.personnel);

    const phone = detail["phone-number"];
    entries[idx].phone = typeof phone === "object" ? (phone?.number || "") : (phone || "");

    entries[idx].website = detail.url || "";

    const addr = detail.address || {};
    entries[idx].address = addr["address-line1"] || addr["address-line-1"] || addr.street || "";
    if (addr.city) entries[idx].city = addr.city;
    if (addr.state) {
      entries[idx].state = addr.state.toUpperCase().trim();
    }
    entries[idx].zip = cleanZip(addr["zip-code"] || addr.zip || addr["postal-code"]);

    return true;
  }

  const DELAY_BETWEEN_REQUESTS = 1000;

  let fetched = 0;
  let failed = 0;

  for (let i = 0; i < needsFetch.length; i++) {
    const { aid, idx } = needsFetch[i];
    const ok = await fetchDetail(aid, idx);
    if (ok) {
      fetched++;
    } else {
      failed++;
    }

    const total = i + 1;
    if (total % 50 === 0 || total === needsFetch.length) {
      console.log(`Progress: ${total}/${needsFetch.length} (fetched: ${fetched}, failed: ${failed})`);
      writeFileSync(outPath, JSON.stringify(entries, null, 2));
    }

    if (i < needsFetch.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  writeFileSync(outPath, JSON.stringify(entries, null, 2));
  const totalWithShliach = entries.filter((e) => e.shliach !== "").length;
  console.log(`\n=== DONE ===`);
  console.log(`Total entries: ${entries.length}`);
  console.log(`Entries with shliach data: ${totalWithShliach}`);
  console.log(`Newly fetched: ${fetched}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output: ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
