import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/dashboard',
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/LoginView.vue'),
        },
        {
            path: '/',
            component: () => import('../layouts/AppLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'dashboard',
                    name: 'Dashboard',
                    component: () => import('../views/DashboardView.vue'),
                },
                {
                    path: 'add-firm',
                    name: 'AddFirm',
                    component: () => import('../views/AddFirmView.vue'),
                },
                {
                    path: 'manage-firms',
                    name: 'ManageFirms',
                    component: () => import('../views/ManageFirmsView.vue'),
                },
                {
                    path: 'users',
                    name: 'Users',
                    component: () => import('../views/UsersView.vue'),
                },
                {
                    path: 'users/:id',
                    name: 'UserDetail',
                    component: () => import('../views/UserDetailView.vue'),
                },
                {
                    path: 'manage-campaigns',
                    name: 'ManageCampaigns',
                    component: () => import('../views/ManageCampaignsView.vue'),
                },
                {
                    path: 'manage-campaigns/:businessId',
                    name: 'FirmCampaigns',
                    component: () => import('../views/FirmCampaignsView.vue'),
                },
                {
                    path: 'qr',
                    name: 'QR',
                    component: () => import('../views/QRView.vue'),
                }
            ]
        }
    ],
});

router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem('token');

    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.path === '/login' && token) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router;
