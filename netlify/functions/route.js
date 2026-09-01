// Server-side driving-time proxy — Google Routes API only (traffic-aware).
// GOOGLE_MAPS_API_KEY is read from a Netlify environment variable, never from this file.
exports.handler = async function (event) {
  const p = event.queryStringParameters || {};
  const { lat1, lon1, lat2, lon2, departAt } = p;
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return { statusCode: 400, body: JSON.stringify({ error: "missing coordinates" }) };
  }
  const headers = { "Content-Type": "application/json" };
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) {
    return { statusCode: 200, headers, body: JSON.stringify(null) };
  }
  try {
    const body = {
      origin: { location: { latLng: { latitude: parseFloat(lat1), longitude: parseFloat(lon1) } } },
      destination: { location: { latLng: { latitude: parseFloat(lat2), longitude: parseFloat(lon2) } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE"
    };
    if (departAt) body.departureTime = departAt;
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleKey,
        "X-Goog-FieldMask": "routes.duration"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data && data.routes && data.routes[0] && data.routes[0].duration) {
      const seconds = parseInt(String(data.routes[0].duration).replace("s", ""), 10);
      if (!isNaN(seconds)) {
        return { statusCode: 200, headers, body: JSON.stringify({ mins: Math.round(seconds / 60), source: "google" }) };
      }
    }
  } catch (e) { /* fall through */ }
  return { statusCode: 200, headers, body: JSON.stringify(null) };
};
