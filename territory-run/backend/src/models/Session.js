import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    accuracy: Number,
    timestamp: Number
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    totalDistanceMeters: { type: Number, default: 0 },
    points: [pointSchema],
    pointsEarned: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
