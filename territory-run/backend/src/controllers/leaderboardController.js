import { Session } from '../models/Session.js';
import { Territory } from '../models/Territory.js';

export async function getLeaderboards(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    const now = new Date();
    const dayAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get daily distance
    const dailyDistance = await Session.aggregate([
      { $match: { startedAt: { $gte: dayAgo } } },
      {
        $group: {
          _id: '$userId',
          distanceMeters: { $sum: '$totalDistanceMeters' }
        }
      },
      { $sort: { distanceMeters: -1 } },
      { $limit: 50 }
    ]);

    // Ensure current user is in daily distance
    if (userId && !dailyDistance.find(d => d._id === userId)) {
      dailyDistance.unshift({ _id: userId, distanceMeters: 0 });
    }

    // Get monthly distance
    const monthlyDistance = await Session.aggregate([
      { $match: { startedAt: { $gte: monthStart } } },
      {
        $group: {
          _id: '$userId',
          distanceMeters: { $sum: '$totalDistanceMeters' }
        }
      },
      { $sort: { distanceMeters: -1 } },
      { $limit: 50 }
    ]);

    // Ensure current user is in monthly distance
    if (userId && !monthlyDistance.find(d => d._id === userId)) {
      monthlyDistance.unshift({ _id: userId, distanceMeters: 0 });
    }

    // Get monthly territory area
    const monthlyArea = await Territory.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: '$ownerId',
          area: { $sum: '$area' }
        }
      },
      { $sort: { area: -1 } },
      { $limit: 50 }
    ]);

    // Ensure current user is in monthly area
    if (userId && !monthlyArea.find(d => d._id === userId)) {
      monthlyArea.unshift({ _id: userId, area: 0 });
    }

    // Get combined score
    const combined = await Session.aggregate([
      { $match: { startedAt: { $gte: monthStart } } },
      {
        $group: {
          _id: '$userId',
          distanceMeters: { $sum: '$totalDistanceMeters' },
          points: { $sum: '$pointsEarned' }
        }
      },
      { $sort: { points: -1 } },
      { $limit: 50 }
    ]);

    // Ensure current user is in combined score
    if (userId && !combined.find(d => d._id === userId)) {
      combined.unshift({ _id: userId, distanceMeters: 0, points: 0 });
    }

    res.json({
      dailyDistance,
      monthlyDistance,
      monthlyArea,
      combined
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}
