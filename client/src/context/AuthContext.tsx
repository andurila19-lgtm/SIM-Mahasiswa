import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { Profile, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: () => Promise.resolve(),
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        console.log('AuthContext: Initializing onAuthStateChanged');

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!isMounted) return;

            console.log('AuthContext: User state changed:', currentUser?.email);
            setUser(currentUser);

            if (currentUser) {
                try {
                    console.log('AuthContext: Fetching profile from Supabase for UID:', currentUser.uid);
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.uid)
                        .single();

                    if (isMounted) {
                        if (!error && data) {
                            console.log('AuthContext: Profile loaded successfully:', data.full_name);
                            setProfile(data as Profile);
                        } else if (error || !data) {
                            console.warn('AuthContext: Profile not found, checking if it is a demo account...');
                            // Auto-seed for demo accounts
                            const demoEmails: Record<string, any> = {
                                'superadmin@sim.ac.id': { full_name: 'Super Admin', role: 'superadmin', nim_nip: 'ADM001' },
                                'mahasiswa@sim.ac.id': { full_name: 'Budi Raharjo', role: 'mahasiswa', nim_nip: '2105001' },
                                'dosen@sim.ac.id': { full_name: 'Dr. Ahmad Subarjo', role: 'dosen', nim_nip: 'DSN001' },
                                'akademik@sim.ac.id': { full_name: 'Staff Akademik', role: 'akademik', nim_nip: 'AKD001' },
                                'keuangan@sim.ac.id': { full_name: 'Staff Keuangan', role: 'keuangan', nim_nip: 'KEU001' },
                            };

                            if (currentUser.email && demoEmails[currentUser.email]) {
                                console.log('AuthContext: Seeding demo profile for:', currentUser.email);
                                const demoData = demoEmails[currentUser.email];
                                const { data: newProfile, error: seedError } = await supabase
                                    .from('profiles')
                                    .upsert({
                                        id: currentUser.uid,
                                        email: currentUser.email,
                                        status: 'active',
                                        ...demoData
                                    })
                                    .select()
                                    .single();

                                if (!seedError && newProfile) {
                                    console.log('AuthContext: Demo profile seeded successfully');
                                    setProfile(newProfile as Profile);
                                } else {
                                    console.error('AuthContext: Failed to seed demo profile:', seedError?.message);
                                }
                            } else {
                                console.error('AuthContext: Profile not found and not a demo account');
                            }
                        }
                    }
                } catch (e) {
                    console.error('AuthContext: Exception during profile fetch:', e);
                }
            } else {
                setProfile(null);
            }

            if (isMounted) {
                console.log('AuthContext: Setting loading to false');
                setLoading(false);
            }
        });

        // Timeout fallback - Improved check
        const timer = setTimeout(() => {
            if (isMounted) {
                setLoading(currentLoading => {
                    if (currentLoading) {
                        console.warn('AuthContext: Auth initialization timed out after 10s. Forcing loading to false.');
                    }
                    return false;
                });
            }
        }, 10000);

        return () => {
            isMounted = false;
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const value: AuthContextType = {
        user,
        profile,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
