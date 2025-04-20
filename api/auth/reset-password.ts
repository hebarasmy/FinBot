import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db'; 
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { email, newPassword } = req.body;
            if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required' });

            const { db } = await connectToDatabase(); 
            const users = db.collection('users');

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await users.updateOne({ email }, { $set: { password: hashedPassword } });

            const token = sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

            return res.json({ message: 'Password reset successful.', token });
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    } else {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
}
