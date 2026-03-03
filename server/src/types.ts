export interface Profile {
    id: string;
    full_name: string;
    role: 'platform_admin' | 'superadmin' | 'mahasiswa' | 'dosen' | 'akademik' | 'keuangan';
    nim_nip?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    status: 'active' | 'suspended';
    campus_id?: string;
    created_at?: string;
    deleted_at?: string;
}

export interface Subscription {
    id: string;
    campus_id: string;
    plan_name: 'Basic' | 'Pro' | 'Enterprise';
    price: number;
    max_students: number;
    start_date: string;
    end_date: string;
    status: 'active' | 'expired' | 'suspended';
}

export interface Campus {
    id: string;
    name: string;
    domain?: string;
    subscription_plan: string;
    status: 'active' | 'suspended';
}

// Pembatasan fitur per paket
export const PLAN_FEATURES: Record<string, {
    maxStudents: number;
    exportPDF: boolean;
    exportExcel: boolean;
    auditLogs: boolean;
    apiAccess: boolean;
    darkMode: boolean;
    customBranding: boolean;
    multiAdmin: boolean;
    advancedReporting: boolean;
    prioritySupport: boolean;
}> = {
    Basic: {
        maxStudents: 200,
        exportPDF: true,
        exportExcel: false,
        auditLogs: false,
        apiAccess: false,
        darkMode: true,
        customBranding: false,
        multiAdmin: false,
        advancedReporting: false,
        prioritySupport: false,
    },
    Pro: {
        maxStudents: 2000,
        exportPDF: true,
        exportExcel: true,
        auditLogs: true,
        apiAccess: false,
        darkMode: true,
        customBranding: true,
        multiAdmin: true,
        advancedReporting: true,
        prioritySupport: false,
    },
    Enterprise: {
        maxStudents: 99999,
        exportPDF: true,
        exportExcel: true,
        auditLogs: true,
        apiAccess: true,
        darkMode: true,
        customBranding: true,
        multiAdmin: true,
        advancedReporting: true,
        prioritySupport: true,
    }
};

declare global {
    namespace Express {
        interface Request {
            user?: any; // Firebase user decoded token
            profile?: Profile;
            campus?: Campus;
            subscription?: Subscription;
            subdomainContext?: Campus;
        }
    }
}
