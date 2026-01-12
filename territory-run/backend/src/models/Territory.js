import mongoose from 'mongoose';

const polygonSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  { _id: false }
);

const territorySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true
    },
    polygon: {
      type: polygonSchema,
      required: true
    },
    area: { type: Number, required: true }, // square meters
    strength: { type: Number, default: 100 },
    lastCapturedAt: { type: Date, default: Date.now },
    protectionHours: { type: Number, default: 24 }
  },
  { timestamps: true }
);

// 2dsphere index on polygon
territorySchema.index({ polygon: '2dsphere' }); // Mongo uses GeoJSON 2dsphere.[web:43]

export const Territory = mongoose.model('Territory', territorySchema);
