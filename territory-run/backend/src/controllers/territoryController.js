import { Territory } from '../models/Territory.js';

export async function getTerritoriesInView(req, res) {
  try {
    const { minLng, minLat, maxLng, maxLat } = req.query;
    if (
      [minLng, minLat, maxLng, maxLat].some(v => v == null)
    ) {
      return res.status(400).json({ message: 'Missing bounds' });
    }

    const polygon = {
      type: 'Polygon',
      coordinates: [[
        [parseFloat(minLng), parseFloat(minLat)],
        [parseFloat(maxLng), parseFloat(minLat)],
        [parseFloat(maxLng), parseFloat(maxLat)],
        [parseFloat(minLng), parseFloat(maxLat)],
        [parseFloat(minLng), parseFloat(minLat)]
      ]]
    };

    const territories = await Territory.find({
      polygon: {
        $geoIntersects: {
          $geometry: polygon
        }
      }
    }).lean();

    const now = new Date();

    const response = territories.map(t => {
      const protectionEnds = new Date(
        t.lastCapturedAt.getTime() + t.protectionHours * 3600 * 1000
      );
      const remainingProtectionMs = Math.max(0, protectionEnds - now);

      return {
        id: t._id,
        ownerId: t.ownerId,
        polygon: t.polygon,
        area: t.area,
        strength: t.strength,
        lastCapturedAt: t.lastCapturedAt,
        protectionEndsAt: protectionEnds,
        protectionRemainingMs: remainingProtectionMs
      };
    });

    res.json(response);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}
