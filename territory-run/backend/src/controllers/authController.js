import { registerUser, loginUser } from '../services/authService.js';
import { User } from '../models/User.js';

export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    console.log('📝 Registration attempt:', { email, displayName });
    const { user, token } = await registerUser({ email, password, displayName });
    console.log('✓ User registered:', { id: user._id, email: user.email });
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName }
    });
  } catch (e) {
    console.error('✗ Registration error:', e.message);
    res.status(400).json({ message: e.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    console.log('🔓 Login attempt:', { email });
    const { user, token } = await loginUser({ email, password });
    console.log('✓ User logged in:', { id: user._id, email: user.email });
    res.json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName }
    });
  } catch (e) {
    console.error('✗ Login error:', e.message);
    res.status(400).json({ message: e.message });
  }
}

export async function listUsers(_req, res) {
  try {
    const users = await User.find({}, 'email displayName createdAt');
    console.log('📋 Listed', users.length, 'users');
    res.json({ users });
  } catch (e) {
    console.error('✗ List users error:', e.message);
    res.status(500).json({ message: e.message });
  }
}
