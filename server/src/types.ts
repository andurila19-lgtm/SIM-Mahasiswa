export interface Profile {
    id: string;
    full_name: string;
    role: 'super_admin' | 'lecturer' | 'student';
    nim_nip?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    status: 'active' | 'suspended';
    created_at?: string;
}

export interface Student extends Profile {
    nim: string;
    study_program_id: string;
    current_semester: number;
    entry_year: number;
    advisor_id?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: any; // Firebase user decoded token
            profile?: Profile;
        }
    }
}
