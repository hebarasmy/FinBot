import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

            const { db } = await connectToDatabase();
            const users = db.collection('users');

            const user = await users.findOne({ email });
            if (!user) return res.status(404).json({ message: 'User not found' });

            // Check if the user is verified
            if (!user.isVerified) {
                return res.status(400).json({ message: 'Please verify your email before logging in.' });
            }

            // Check password
            const isPasswordValid = bcrypt.compareSync(password, user.password);
            if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

            // Generate JWT token
            const token = sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

            return res.json({ message: 'Login successful', token });
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    } else {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
}
