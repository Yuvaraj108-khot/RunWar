import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export async function registerUser({ email, password, displayName }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('Email already registered');
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ 
    email: normalizedEmail, 
    passwordHash: hash, 
    displayName: displayName.trim()
  });
  console.log('✓ User created:', normalizedEmail);
  const token = createToken(user._id.toString());
  return { user, token };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  console.log('🔍 Looking for user:', normalizedEmail);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    console.log('❌ User not found:', normalizedEmail);
    throw new Error('Invalid credentials');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    console.log('❌ Password mismatch for:', normalizedEmail);
    throw new Error('Invalid credentials');
  }
  console.log('✓ User authenticated:', normalizedEmail);
  const token = createToken(user._id.toString());
  return { user, token };
}

function createToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}
