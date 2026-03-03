export interface Profile {
    id: string;
    full_name: string;
    role: 'superadmin' | 'mahasiswa' | 'dosen' | 'akademik' | 'keuangan';
    nim_nip?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    status: 'active' | 'suspended';
    semester?: number;
    faculty?: string;
    study_program?: string;
    batch_year?: string;
    created_at?: string;
}

export interface Student extends Profile {
    nim: string;
    study_program_id: string;
    current_semester: number;
    entry_year: number;
    advisor_id?: string;
}

export interface AuthContextType {
    user: any | null; // Firebase user
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

export interface Course {
    id: string;
    code: string;
    name: string;
    sks: number;
    semester?: number;
    lecturer?: string;
    schedule?: string;
    room?: string;
}
