const TWOGIS_KEY = process.env.TWOGIS_API_KEY || "";

export interface AddressSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

/**
 * 2GIS Suggest API — address autocomplete with excellent Kazakhstan coverage.
 */
export async function searchAddress(
  query: string,
  limit = 5,
  city?: string,
): Promise<AddressSuggestion[]> {
  if (!TWOGIS_KEY) {
    console.error("TWOGIS_API_KEY not set");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: city ? `${city} ${query}` : query,
      key: TWOGIS_KEY,
      locale: "ru_KZ",
      fields: "items.point,items.full_name",
    });

    const url = `https://catalog.api.2gis.com/3.0/suggests?${params}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const items = json.result?.items;
    if (!items || items.length === 0) return [];

    return items
      .filter((item: any) => item.point)
      .slice(0, limit)
      .map((item: any) => ({
        displayName: item.full_name || item.name || "",
        latitude: item.point.lat,
        longitude: item.point.lon,
      }));
  } catch (err) {
    console.error("2GIS suggest failed:", err);
    return [];
  }
}

/**
 * Geocoder — get coordinates for an address.
 * Prioritizes Nominatim. If < 3 high-confidence results are found,
 * it falls back to 2GIS to save costs and handle highly specific addresses.
 */
export async function geocodeAddress(
  address: string,
): Promise<{ latitude: number; longitude: number } | null> {
  // 1. Try Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FIRE-Hackathon/1.0 (hackathon@freedom.kz)" },
      signal: AbortSignal.timeout(4000),
    });
    
    if (res.ok) {
      const data = await res.json() as Array<{ lat: string; lon: string; importance?: number }>;
      
      // If we have 3 or more results, OR we have at least one highly confident result (importance > 0.6)
      // we trust Nominatim and return the best one.
      if (data.length >= 3 || (data.length > 0 && (data[0].importance || 0) > 0.6)) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    }
  } catch (err) {
    console.error("Nominatim geocode failed/timed out, falling back to 2GIS:", err);
  }

  // 2. Fallback to 2GIS
  if (!TWOGIS_KEY) {
    console.error("TWOGIS_API_KEY not set");
    return null;
  }

  try {
    const params = new URLSearchParams({
      q: address,
      key: TWOGIS_KEY,
      fields: "items.point",
    });

    const url = `https://catalog.api.2gis.com/3.0/items/geocode?${params}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const items = json.result?.items;
    if (!items || items.length === 0) return null;

    const point = items[0].point;
    if (!point) return null;

    return {
      latitude: point.lat,
      longitude: point.lon,
    };
  } catch (err) {
    console.error("2GIS geocode failed:", err);
    return null;
  }
}

/**
 * Reverse Geocoder - Get address from coordinates.
 * Prioritizes Nominatim. If Nominatim fails or returns nothing, falls back to 2GIS.
 */
export async function reverseGeocodeAddress(
  lat: number,
  lon: number
): Promise<string | null> {
  // 1. Try Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FIRE-Hackathon/1.0 (hackathon@freedom.kz)" },
      signal: AbortSignal.timeout(4000),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (err) {
    console.error("Nominatim reverse geocode failed, falling back to 2GIS:", err);
  }

  // 2. Fallback to 2GIS
  if (!TWOGIS_KEY) return null;

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      key: TWOGIS_KEY,
      fields: "items.full_name",
    });

    const url = `https://catalog.api.2gis.com/3.0/items/geocode?${params}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const items = json.result?.items;
    
    if (!items || items.length === 0) return null;
    
    return items[0].full_name || items[0].name || null;
  } catch (err) {
    console.error("2GIS reverse geocode failed:", err);
    return null;
  }
}
