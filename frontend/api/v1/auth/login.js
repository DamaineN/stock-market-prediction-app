import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  
  if (!MONGODB_URI) {
    throw new Error('MongoDB URI not provided');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Hardcoded admin user
    if (email === 'admin@stolckr.com' && password === 'admin123') {
      const token = jwt.sign(
        {
          sub: 'admin_hardcoded',
          email: 'admin@stolckr.com',
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        JWT_SECRET
      );

      return res.status(200).json({
        access_token: token,
        refresh_token: token,
        expires_in: 24 * 60 * 60,
        token_type: 'bearer'
      });
    }

    // Test user
    if (email === 'test@stolckr.com' && password === 'password123') {
      const token = jwt.sign(
        {
          sub: 'test_user',
          email: 'test@stolckr.com',
          role: 'beginner',
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        },
        JWT_SECRET
      );

      return res.status(200).json({
        access_token: token,
        refresh_token: token,
        expires_in: 24 * 60 * 60,
        token_type: 'bearer'
      });
    }

    // Database user lookup (optional if MongoDB is configured)
    try {
      const client = await connectToDatabase();
      const db = client.db('stock_prediction_app');
      const users = db.collection('users');
      
      const user = await users.findOne({ email });
      
      if (user && bcrypt.compareSync(password, user.hashed_password)) {
        const token = jwt.sign(
          {
            sub: user._id.toString(),
            email: user.email,
            role: user.role || 'beginner',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
          },
          JWT_SECRET
        );

        return res.status(200).json({
          access_token: token,
          refresh_token: token,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        });
      }
    } catch (dbError) {
      console.log('Database connection failed, using hardcoded users only:', dbError.message);
    }

    return res.status(401).json({ error: 'Invalid email or password' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}