import {
  startSession,
  pushLocation,
  endSession
} from '../services/sessionService.js';

export async function postStartSession(req, res) {
  try {
    const session = await startSession(req.user.id);
    res.status(201).json({ sessionId: session._id, startedAt: session.startedAt });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export async function postLocation(req, res) {
  try {
    const { sessionId, lat, lng, accuracy, timestamp } = req.body;
    if (!sessionId || lat == null || lng == null) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const session = await pushLocation(req.user.id, sessionId, {
      lat,
      lng,
      accuracy,
      timestamp
    });
    res.json({
      totalDistanceMeters: session.totalDistanceMeters,
      points: session.points.length
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export async function postEndSession(req, res) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Missing sessionId' });
    }
    const session = await endSession(req.user.id, sessionId);
    res.json({
      totalDistanceMeters: session.totalDistanceMeters,
      pointsEarned: session.pointsEarned,
      endedAt: session.endedAt
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}
