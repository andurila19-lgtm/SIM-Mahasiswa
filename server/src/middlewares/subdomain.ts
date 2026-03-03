import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { Campus } from '../types.js';

/**
 * Middleware untuk mendeteksi subdomain kampus secara dinamis.
 * 
 * Skenario Frontend Domain:
 * - admin.anduril.web.id -> Platform Admin
 * - itb.anduril.web.id -> Kampus ITB
 * 
 * Frontend selalu mengirim header "x-campus-subdomain" atau Backend mendeteksi "Origin" header.
 */
export const detectSubdomain = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Ambil subdomain dari header kostum (Frontend ngirim ini dari window.location.hostname)
    // Atau bisa fallback parse dari request Origin.
    let subdomainStr = req.headers['x-campus-subdomain'] as string;

    // Fallback: Parse dari header Origin / Host jika dibutuhkan
    if (!subdomainStr) {
        let domainToParse = req.get('Origin') || req.get('Host') || '';
        domainToParse = domainToParse.replace(/^https?:\/\//, ''); // buang http/https
        domainToParse = domainToParse.split(':')[0]; // buang port jika jalan di lcalhost:5173

        // Cek domain anduril.web.id
        if (domainToParse.includes('.anduril.web.id')) {
            subdomainStr = domainToParse.split('.anduril.web.id')[0];
        } else if (domainToParse === 'localhost' || domainToParse === '127.0.0.1') {
            // Untuk development, biarkan lolos dulu / inject default
            // Di prod akan di-block jika butuh subdomain
            subdomainStr = 'dev-campus'; // Or allow fallback mechanism
        }
    }

    if (!subdomainStr) {
        return res.status(400).json({ error: 'Subdomain kampus tidak terdeteksi di permintaan API.', code: 'MISSING_SUBDOMAIN' });
    }

    // Platform admin dan root app tidak lewat validasi kampus
    if (['admin', 'app', 'api', 'www', 'dev-campus'].includes(subdomainStr)) {
        return next();
    }

    try {
        // 2. Query ke Database dengan Redis Cache (jika ada, di sini pakai db normal)
        const { data: campus, error } = await supabase
            .from('campuses')
            .select('*')
            .eq('subdomain', subdomainStr)
            .single();

        if (error || !campus) {
            return res.status(404).json({
                error: `Kampus dengan alamat ${subdomainStr}.anduril.web.id tidak ditemukan.`,
                code: 'CAMPUS_NOT_FOUND'
            });
        }

        // 3. Validasi Status Suspended
        if (campus.status === 'suspended') {
            return res.status(403).json({
                error: 'Akses ditolak. Kampus ini telah ditangguhkan sementara.',
                code: 'CAMPUS_SUSPENDED'
            });
        }

        // 4. Inject campus_id ke request Context
        req.subdomainContext = campus as Campus;

        // PENTING: Bandingkan context subdomain dengan profile login user di auth middleware selanjutnya.

        next();
    } catch (err: any) {
        console.error('Subdomain Detection Error:', err);
        res.status(500).json({ error: 'Gagal mendeteksi informasi kampus' });
    }
};
