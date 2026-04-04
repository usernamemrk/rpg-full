export declare function useAuth(): {
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<string>;
    register: (email: string, password: string, name: string) => Promise<string>;
    logout: () => Promise<void>;
    token: string | null;
    userId: string | null;
    characterId: string | null;
};
//# sourceMappingURL=useAuth.d.ts.map