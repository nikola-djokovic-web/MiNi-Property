

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tenants } from '@/lib/data';

export type UserRole = 'admin' | 'worker' | 'tenant';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  // Note: These are property IDs the worker is *primarily* responsible for, 
  // but they can also be assigned to other properties ad-hoc.
  assignedPropertyIds?: string[];
};

export const adminUser: User = {
  id: 'user-admin',
  name: 'Admin User',
  role: 'admin',
  email: 'admin@example.com',
};

export const workerUser: User = {
  id: 'user-worker-1',
  name: 'Bob the Builder',
  role: 'worker',
  email: 'worker@example.com',
  assignedPropertyIds: ['prop-1', 'prop-2', 'prop-8'],
};

// We can create tenant user objects from the main data file
const tenantUsers: User[] = tenants.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    role: 'tenant',
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
}

export const useCurrentUser = create<CurrentUserState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            login: (user) => set({ user, isAuthenticated: true }),
            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'current-user-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.isLoading = false;
                }
            },
        }
    )
);

    

