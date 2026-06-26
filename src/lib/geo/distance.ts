const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OSRM_BASE = "https://router.project-osrm.org";

interface Coordinates {
  lat: number;
  lng: number;
}

async function geocode(ville: string): Promise<Coordinates> {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(ville)}&format=json&limit=1&countrycodes=fr,be,lu,ch,de,es,it,nl,pt,gb`;

  const res = await fetch(url, {
    headers: { "User-Agent": "NeoTravel/1.0 (devis@neotravel.fr)" },
  });

  if (!res.ok) {
    throw new Error(`Nominatim error: ${res.status}`);
  }

  const data = await res.json();
  if (!data[0]) {
    throw new Error(`Ville introuvable : ${ville}`);
  }

  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  console.log(`  📍 Géocodage "${ville}" → ${lat.toFixed(4)}, ${lng.toFixed(4)} (${data[0].display_name.split(",")[0]})`);
  return { lat, lng };
}

export async function calculerDistanceKm(
  villeDepart: string,
  villeArrivee: string,
): Promise<number> {
  console.log(`🗺️  Calcul distance : ${villeDepart} → ${villeArrivee}`);

  const [depart, arrivee] = await Promise.all([
    geocode(villeDepart),
    geocode(villeArrivee),
  ]);

  const url = `${OSRM_BASE}/route/v1/driving/${depart.lng},${depart.lat};${arrivee.lng},${arrivee.lat}?overview=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM error: ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(`OSRM: pas de route trouvée (${data.code})`);
  }

  const distanceKm = Math.round(data.routes[0].distance / 1000);
  console.log(`  🛣️  Distance : ${distanceKm} km`);
  return distanceKm;
}
