import mongoose from 'mongoose';
import { env } from './env.js';

async function startInMemoryMongo() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const m = await MongoMemoryServer.create();
  return m.getUri();
}

export async function connectDB() {
  mongoose.set('strictQuery', true);

  let uri = env.MONGO_URI;

  // If explicitly requested, use in-memory MongoDB
  if (!uri || uri === 'inmemory') {
    console.log('🚀 Starting in-memory MongoDB for development...');
    uri = await startInMemoryMongo();
    await mongoose.connect(uri);
    console.log('✓ In-memory MongoDB ready');
    return;
  }

  // Try connecting to provided URI with SHORT timeout, fall back to in-memory quickly
  try {
    console.log('⏳ Attempting to connect to Atlas (5 sec timeout)...');
    const connectPromise = mongoose.connect(uri);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Atlas timeout')), 5000)
    );
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('✓ MongoDB Atlas connected');
  } catch (err) {
    console.log('⚡ Atlas unavailable, using in-memory MongoDB...');
    // Disconnect from failed Atlas connection if partially connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const memUri = await startInMemoryMongo();
    await mongoose.connect(memUri);
    console.log('✓ In-memory MongoDB ready');
  }
}
