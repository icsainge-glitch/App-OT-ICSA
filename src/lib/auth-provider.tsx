"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { getSession, getUserProfile as fetchUserProfile } from '@/actions/auth-actions';

interface UserAuthState {
    user: any | null;
    isUserLoading: boolean;
    userError: Error | null;
}

export const AuthContext = createContext<UserAuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<UserAuthState>({
        user: null,
        isUserLoading: true,
        userError: null
    });

    useEffect(() => {
        let mounted = true;
        getSession().then((session) => {
            if (mounted) {
                setAuthState({
                    user: session ? { uid: session.uid, email: session.email, ...session } : null,
                    isUserLoading: false,
                    userError: null
                });
            }
        }).catch((err) => {
            if (mounted) {
                setAuthState({ user: null, isUserLoading: false, userError: err });
            }
        });
        return () => { mounted = false; };
    }, []);

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUser must be used within an AuthProvider.');
    }
    return context;
};

export const useUserProfile = () => {
    const { user, isUserLoading } = useUser();
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isUserLoading) return;

        let mounted = true;

        if (user && user.uid) {
            fetchUserProfile(user.uid).then(dbProfile => {
                if (mounted && dbProfile) {
                    setProfile({
                        ...user,
                        ...dbProfile,
                        rol_t: dbProfile.rol_t || user.role,
                        nombre_t: dbProfile.nombre_t || user.name,
                        rut_t: dbProfile.rut_t || user.rut
                    });
                }
                if (mounted) setIsLoading(false);
            }).catch(() => {
                if (mounted) setIsLoading(false);
            });
        } else {
            setProfile(null);
            setIsLoading(false);
        }
        return () => { mounted = false; };
    }, [user, isUserLoading]);

    return { userProfile: profile, isProfileLoading: isLoading };
};
