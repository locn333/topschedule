// Server-side geocoding proxy — Google Geocoding API only.
// GOOGLE_MAPS_API_KEY is read from a Netlify environment variable, never from this file.
exports.handler = async function (event) {
  const q = (event.queryStringParameters && event.queryStringParameters.q || "").trim();
  if (!q) {
    return { statusCode: 400, body: JSON.stringify({ error: "missing q" }) };
  }
  const headers = { "Content-Type": "application/json" };
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) {
    return { statusCode: 200, headers, body: JSON.stringify(null) };
  }
  try {
    const url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(q) + "&key=" + googleKey;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.status === "OK" && data.results && data.results[0]) {
      const loc = data.results[0].geometry.location;
      return { statusCode: 200, headers, body: JSON.stringify({ lat: loc.lat, lon: loc.lng, source: "google" }) };
    }
  } catch (e) { /* fall through */ }
  return { statusCode: 200, headers, body: JSON.stringify(null) };
};
