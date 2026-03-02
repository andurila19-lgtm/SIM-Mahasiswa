import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import { supabase } from '../config/supabase.js';
import { Profile } from '../types.js';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;

        // Fetch user profile from Supabase to attach role
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', decodedToken.uid)
            .single();

        if (error || !profile) {
            console.error('Error fetching profile in middleware:', error);
            return res.status(403).json({ message: 'Forbidden: User profile not found' });
        }

        req.profile = profile as Profile;
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.profile || !roles.includes(req.profile.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
        }
        next();
    };
};
