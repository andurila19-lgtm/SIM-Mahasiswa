import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false // Required for some Vercel setups
}));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (Update paths to use src prefix since Vercel builds from root)
import studentRoutes from '../src/routes/studentRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import reportRoutes from '../src/routes/reportRoutes.js';
import superadminRoutes from '../src/routes/superadminRoutes.js';
import akademikRoutes from '../src/routes/akademikRoutes.js';

app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/akademik', akademikRoutes);

// Basic Route
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'SIM Mahasiswa API is running on Vercel.' });
});

// For Vercel, we export the app instead of calling app.listen()
export default app;
