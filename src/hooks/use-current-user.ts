

import { create } from 'zustand';
import { tenants } from '@/lib/data';

export type UserRole = 'admin' | 'worker' | 'tenant';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  tenantId?: string;
  profileImage?: string;
  companyName?: string;
  companyLogo?: string;
  // Note: These are property IDs the worker is *primarily* responsible for, 
  // but they can also be assigned to other properties ad-hoc.
  assignedPropertyIds?: string[];
};

export const adminUser: User = {
  id: 'user-admin',
  name: 'Admin User',
  role: 'admin',
  email: 'admin@example.com',
  tenantId: 'default-tenant',
  // Remove test data - users should upload their own logo
  // companyName: 'Test Company',
  // companyLogo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM0ODhGRiIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCI+VEM8L3RleHQ+Cjwvc3ZnPgo=',
};

export const workerUser: User = {
  id: 'user-worker-1',
  name: 'Bob the Builder',
  role: 'worker',
  email: 'worker@example.com',
  tenantId: 'default-tenant',
  assignedPropertyIds: ['prop-1', 'prop-2', 'prop-8'],
};

// We can create tenant user objects from the main data file
const tenantUsers: User[] = tenants.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    role: 'tenant',
    tenantId: 'default-tenant',
}));


// For the prototype, we can use a hardcoded tenant or select one
export const tenantUser: User = tenantUsers[0];

export const allMockUsers: User[] = [
    adminUser,
    workerUser,
    ...tenantUsers,
]

interface CurrentUserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

export const useCurrentUser = create<CurrentUserState>()((set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            login: (user) => {
                set({ user, isAuthenticated: true, isLoading: false });
            },
            logout: () => {
                set({ user: null, isAuthenticated: false, isLoading: false });
            },
            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null
            })),
            hydrate: async () => {
                try {
                    const response = await fetch('/api/auth/me', { cache: 'no-store' });
                    if (!response.ok) throw new Error('Unauthenticated');
                    const data = await response.json();
                    set({ user: data.user, isAuthenticated: true, isLoading: false });
                } catch {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },
        }));

    

