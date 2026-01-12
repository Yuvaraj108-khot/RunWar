import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Handle duplicate key errors
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Email already registered'));
  } else {
    next(error);
  }
});

export const User = mongoose.model('User', userSchema);
