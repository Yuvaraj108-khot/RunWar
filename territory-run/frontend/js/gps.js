import { sendLocation } from './api.js';
import { updateUserPosition, extendPath } from './map.js';
import { updateDistance, showCaptureGlow } from './ui.js';

let watchId = null;
let currentSessionId = null;
let lastPoint = null;
let totalDistanceMeters = 0;

const MAX_SPEED_KMH = 15;
const MAX_ACCURACY_METERS = 30;

const toRad = d => d * Math.PI / 180;

function haversineMeters(p1, p2) {
  const R = 6371000;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function setSessionId(id) {
  currentSessionId = id;
  lastPoint = null;
  totalDistanceMeters = 0;
}

export function clearSession() {
  currentSessionId = null;
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
  watchId = null;
  lastPoint = null;
  totalDistanceMeters = 0;
}

export function startGPS() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported');
    return;
  }
  watchId = navigator.geolocation.watchPosition(
    onPosition,
    err => {
      console.error(err);
      alert('Failed to get GPS');
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000
    }
  );
}

async function onPosition(position) {
  if (!currentSessionId) return;

  const { latitude, longitude, accuracy } = position.coords;
  const timestamp = position.timestamp;

  if (accuracy && accuracy > MAX_ACCURACY_METERS) {
    return;
  }

  const p = { lat: latitude, lng: longitude, accuracy, timestamp };

  if (lastPoint) {
    const dtSec = (p.timestamp - lastPoint.timestamp) / 1000;
    if (dtSec <= 0) return;
    const dist = haversineMeters(lastPoint, p);
    const speedKmh = (dist / dtSec) * 3.6;
    if (speedKmh > MAX_SPEED_KMH) {
      return;
    }
    if (dist > 1) {
      totalDistanceMeters += dist;
      updateDistance(totalDistanceMeters);
      extendPath(longitude, latitude);
      showCaptureGlow();
    }
  } else {
    extendPath(longitude, latitude);
  }

  lastPoint = p;
  updateUserPosition(longitude, latitude);

  try {
    await sendLocation(currentSessionId, {
      lat: latitude,
      lng: longitude,
      accuracy,
      timestamp
    });
  } catch (err) {
    console.error(err);
  }
}
