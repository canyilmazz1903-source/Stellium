export interface LocationSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

// Nominatim OpenStreetMap API - Geocoding search (free, zero-key)
// Requires a descriptive User-Agent header to comply with usage guidelines.
export async function searchLocation(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=tr,en`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CosmicCoreAstrologyApp/1.0.0 (osmancan.yilmaz@gmail.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned status: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => {
      const address = item.address || {};
      const city = address.city || address.town || address.village || address.suburb || '';
      const country = address.country || '';
      
      return {
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: city,
        country: country,
      };
    });
  } catch (error) {
    console.warn('Geocoding search warning:', error);
    return [];
  }
}

// TimeAPI.io coordinate-to-timezone API (free, zero-key)
export async function getTimezoneForCoordinates(lat: number, lon: number): Promise<string> {
  const url = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CosmicCoreAstrologyApp/1.0.0',
      },
    });

    if (!response.ok) {
      throw new Error(`TimeAPI returned status: ${response.status}`);
    }

    const data = await response.json();
    return data.timeZone || 'UTC'; // E.g., "Europe/Istanbul"
  } catch (error) {
    console.warn('Timezone resolution error, falling back to UTC/GMT offset calculation:', error);
    
    // Fallback: estimate timezone offset from longitude (15 degrees = 1 hour offset)
    const estimatedOffset = Math.round(lon / 15);
    const prefix = estimatedOffset >= 0 ? '+' : '';
    return `Etc/GMT${prefix}${estimatedOffset}`;
  }
}
