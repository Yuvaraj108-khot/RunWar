import { Session } from '../models/Session.js';
import { Territory } from '../models/Territory.js';
import { haversineDistanceMeters } from '../utils/haversine.js';
import { bufferPathToPolygon, polygonAreaSquareMeters } from '../utils/geo.js';

const MAX_SPEED_KMH = 15;
const MAX_ACCURACY_METERS = 30;
const POINTS_PER_KM = 10;
const CAPTURE_BONUS = 50;
const PROTECTION_HOURS = 24;

export async function startSession(userId) {
  const active = await Session.findOne({ userId, endedAt: null });
  if (active) {
    throw new Error('Active session already exists');
  }
  const session = await Session.create({ userId });
  return session;
}

export async function pushLocation(userId, sessionId, point) {
  const session = await Session.findOne({ _id: sessionId, userId, endedAt: null });
  if (!session) throw new Error('Session not found or already ended');

  const { lat, lng, accuracy, timestamp } = point;
  if (accuracy && accuracy > MAX_ACCURACY_METERS) {
    throw new Error('Low GPS accuracy');
  }

  const p = { lat, lng, accuracy, timestamp: timestamp || Date.now() };

  const points = session.points;
  if (points.length > 0) {
    const last = points[points.length - 1];
    const dtSec = (p.timestamp - last.timestamp) / 1000;
    if (dtSec <= 0) {
      throw new Error('Invalid timestamp');
    }
    const distMeters = haversineDistanceMeters(
      { lat: last.lat, lng: last.lng },
      { lat: p.lat, lng: p.lng }
    );
    const speedKmh = (distMeters / dtSec) * 3.6;
    if (speedKmh > MAX_SPEED_KMH) {
      throw new Error('Speed too high, possible cheating');
    }

    session.totalDistanceMeters += distMeters;
  }

  session.points.push(p);
  await session.save();
  return session;
}

export async function endSession(userId, sessionId) {
  const session = await Session.findOne({ _id: sessionId, userId, endedAt: null });
  if (!session) throw new Error('Session not found or already ended');

  session.endedAt = new Date();

  const distanceKm = session.totalDistanceMeters / 1000;
  const basePoints = Math.floor(distanceKm * POINTS_PER_KM);
  session.pointsEarned = basePoints;

  await session.save();

  // Create territory polygon from path
  if (session.points.length >= 2) {
    const coords = session.points.map(p => ({ lat: p.lat, lng: p.lng }));
    const polygon = bufferPathToPolygon(coords, 8);
    const area = polygonAreaSquareMeters(polygon);

    // create or steal territories based on overlap
    const capturedBonus = await processTerritoryCapture(userId, polygon, area);
    session.pointsEarned += capturedBonus;
    await session.save();
  }

  return session;
}

async function processTerritoryCapture(userId, polygon, area) {
  const now = new Date();
  let bonusPoints = 0;

  const overlapping = await Territory.find({
    polygon: {
      $geoIntersects: {
        $geometry: polygon
      }
    }
  });

  if (overlapping.length === 0) {
    await Territory.create({
      ownerId: userId,
      polygon,
      area,
      strength: 100,
      lastCapturedAt: now,
      protectionHours: PROTECTION_HOURS
    });
    bonusPoints += CAPTURE_BONUS;
    return bonusPoints;
  }

  for (const terr of overlapping) {
    const protectionEnds = new Date(
      terr.lastCapturedAt.getTime() + terr.protectionHours * 3600 * 1000
    );

    if (protectionEnds > now) {
      continue;
    }

    const hoursSinceCapture = (now - terr.lastCapturedAt) / 3600000;
    const decay = hoursSinceCapture * 10;
    terr.strength = Math.max(0, terr.strength - decay);

    if (terr.strength <= 0 && terr.ownerId.toString() !== userId.toString()) {
      terr.ownerId = userId;
      terr.strength = 100;
      terr.lastCapturedAt = now;
      terr.protectionHours = PROTECTION_HOURS;
      bonusPoints += CAPTURE_BONUS;
    }
    await terr.save();
  }

  return bonusPoints;
}
