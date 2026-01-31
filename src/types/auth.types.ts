export interface UserInfo {
    id: string;
    username: string;
    role: 'super_admin' | 'business';
    businessName?: string;
    businessId?: string;
    theme?: string; // e.g., 'stock', 'starbucks', 'default'
    logoUrl?: string; // Mock logo URL
}

export const MOCK_USERS: UserInfo[] = [
    {
        id: '1',
        username: 'admin',
        role: 'super_admin',
        theme: 'default',
        businessName: 'Super Admin',
    },
    {
        id: '2',
        username: 'stock',
        role: 'business',
        businessName: 'Stock',
        theme: 'stock', // Triggers Green/Dark theme
    },
    {
        id: '3',
        username: 'starbucks',
        role: 'business',
        businessName: 'Starbucks',
        theme: 'starbucks', // Triggers Green/White theme
    },
];
