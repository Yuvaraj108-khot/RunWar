// coords: [{lat,lng}, ...]
// returns GeoJSON Polygon
export function bufferPathToPolygon(coords, bufferMeters = 8) {
  if (coords.length < 2) {
    throw new Error('Need at least 2 points');
  }

  const EARTH_RADIUS = 6378137;
  const bufferRad = bufferMeters / EARTH_RADIUS;

  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;

  const left = [];
  const right = [];

  for (let i = 0; i < coords.length; i++) {
    const p = coords[i];
    const prev = coords[Math.max(i - 1, 0)];
    const next = coords[Math.min(i + 1, coords.length - 1)];

    const bearing = Math.atan2(
      toRad(next.lng - prev.lng) * Math.cos(toRad((prev.lat + next.lat) / 2)),
      toRad(next.lat - prev.lat)
    );

    const leftBearing = bearing - Math.PI / 2;
    const rightBearing = bearing + Math.PI / 2;

    const latRad = toRad(p.lat);
    const lngRad = toRad(p.lng);

    const leftLat = Math.asin(
      Math.sin(latRad) * Math.cos(bufferRad) +
      Math.cos(latRad) * Math.sin(bufferRad) * Math.cos(leftBearing)
    );
    const leftLng = lngRad + Math.atan2(
      Math.sin(leftBearing) * Math.sin(bufferRad) * Math.cos(latRad),
      Math.cos(bufferRad) - Math.sin(latRad) * Math.sin(leftLat)
    );

    const rightLat = Math.asin(
      Math.sin(latRad) * Math.cos(bufferRad) +
      Math.cos(latRad) * Math.sin(bufferRad) * Math.cos(rightBearing)
    );
    const rightLng = lngRad + Math.atan2(
      Math.sin(rightBearing) * Math.sin(bufferRad) * Math.cos(latRad),
      Math.cos(bufferRad) - Math.sin(latRad) * Math.sin(rightLat)
    );

    left.push([toDeg(leftLng), toDeg(leftLat)]);
    right.unshift([toDeg(rightLng), toDeg(rightLat)]);
  }

  const ring = [...left, ...right, left[0]];
  return {
    type: 'Polygon',
    coordinates: [ring]
  };
}

// approximate polygon area (spherical excess method)
export function polygonAreaSquareMeters(polygon) {
  const R = 6378137;
  const coords = polygon.coordinates[0];
  if (coords.length < 4) return 0;

  const toRad = d => d * Math.PI / 180;
  let area = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i].map(toRad);
    const [lon2, lat2] = coords[i + 1].map(toRad);
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs(area * R * R / 2);
}
