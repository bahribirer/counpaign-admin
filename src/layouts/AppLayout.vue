<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import Menu from 'primevue/menu';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import api from '../services/api';
import SidebarCoffeeAnimation from '../components/SidebarCoffeeAnimation.vue';
import PanelCoffeeDecorations from '../components/PanelCoffeeDecorations.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
// Initialize sidebar based on screen width
const sidebarVisible = ref(window.innerWidth > 991);

// Notification State
const notifications = ref<any[]>([]);
const unreadCount = computed(() => notifications.value.filter((n: any) => !n.isRead).length);

const fetchNotifications = async () => {
    if (authStore.user?.role !== 'business') return;
    try {
        const res = await api.get(`/notifications/my-notifications`);
        if (Array.isArray(res.data)) {
            notifications.value = res.data;
        } else {
            console.warn("Notifications response is not an array:", res.data);
            notifications.value = [];
        }
    } catch (e) {
        console.error("Fetch Notifications Error:", e);
    }
};

onMounted(() => {
    fetchNotifications();
    // Refresh every 30s
    setInterval(fetchNotifications, 30000);
});

// Close sidebar on route change (mobile only)
watch(route, () => {
    if (window.innerWidth <= 991) {
        sidebarVisible.value = false;
    }
});

const items = computed(() => {
    const menuItems = [
        {
            label: 'Home',
            items: [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-home',
                    command: () => router.push('/dashboard')
                }
            ]
        }
    ];

    // Add Firma Ekle only for super_admin
    if (authStore.user?.role === 'super_admin') {
        menuItems.push({
            label: 'Firma Yönetimi',
            items: [
                {
                    label: 'Firma Ekle',
                    icon: 'pi pi-plus-circle',
                    command: () => router.push('/add-firm')
                },
                {
                    label: 'Firmaları Yönet',
                    icon: 'pi pi-list',
                    command: () => router.push('/manage-firms')
                },
                {
                    label: 'Kampanya Yönetimi',
                    icon: 'pi pi-ticket',
                    command: () => router.push('/manage-campaigns')
                }
            ]
        });

        // Add Bildirim Yönetimi for super_admin
        menuItems.push({
            label: 'Bildirim Yönetimi',
            items: [
                {
                    label: 'Firma Bildirimleri',
                    icon: 'pi pi-building',
                    command: () => router.push('/admin/business-notifications')
                },
                {
                    label: 'Kullanıcı Bildirimleri',
                    icon: 'pi pi-users',
                    command: () => router.push('/admin/user-notifications')
                }
            ]
        });
    }

    menuItems.push({
        label: 'Management',
        items: [
            {
                label: 'Kullanıcılar',
                icon: 'pi pi-users',
                command: () => router.push('/users')
            },
            // Only show for Super Admin here
            ...(authStore.user?.role === 'super_admin' ? [{
                label: 'Değerlendirmeler',
                icon: 'pi pi-star',
                command: () => router.push('/reviews')
            }] : [])
        ]
    });

    // Add Business Menu
    if (authStore.user?.role === 'business') {
        const insertionIndex = menuItems.length - 1; // Insert before 'Management' or just at the beginning/end
        // Let's insert it before Management (Settings etc)
        menuItems.splice(insertionIndex, 0, {
            label: 'İşletme Yönetimi',
            items: [
                {
                    label: 'QR Okutma',
                    icon: 'pi pi-qrcode',
                    command: () => router.push('/qr')
                },
                {
                    label: 'Menü Yönetimi',
                    icon: 'pi pi-book',
                    command: () => router.push('/menu')
                },
                {
                    label: 'Hediyeler',
                    icon: 'pi pi-gift',
                    command: () => router.push('/gifts')
                },
                {
                    label: 'Kampanyalar',
                    icon: 'pi pi-ticket',
                    command: () => router.push(`/manage-campaigns/${authStore.user?.businessId}`)
                },
                {
                    label: 'Değerlendirmeler',
                    icon: 'pi pi-star',
                    command: () => router.push('/reviews')
                }
            ]
        });
    }

    return menuItems;
});

const toggleSidebar = () => {
    sidebarVisible.value = !sidebarVisible.value;
};

const userInitial = computed(() => {
    return authStore.user?.username?.charAt(0).toUpperCase() || 'U';
});

const pageTitle = computed(() => {
    // If user is super_admin, show COUNPAIGN
    if (authStore.user?.role === 'super_admin') {
        return 'COUNPAIGN';
    }
    // If user is business, show their business name
    if (authStore.user?.role === 'business') {
        return authStore.user?.businessName || 'ADMIN PANEL';
    }
    // Default fallback
    return 'COUNPAIGN';
});
</script>

<template>
    <div class="layout-wrapper" :class="{ 'layout-static-inactive': !sidebarVisible }">
        <!-- Topbar -->
        <div class="layout-topbar">
            <div class="topbar-start">
                <Button icon="pi pi-bars" text rounded @click="toggleSidebar" class="mr-2" />
                <span class="logo-text">{{ pageTitle }}</span>
            </div>
            
            <div class="topbar-end">
                <!-- Notifications (Business Only) -->
                <div v-if="authStore.user?.role === 'business'" class="mr-3 relative">
                     <Button icon="pi pi-bell" text rounded severity="secondary" @click="router.push('/notifications')">
                        <Badge v-if="unreadCount > 0" :value="unreadCount" severity="danger" class="absolute -top-1 -right-1" />
                     </Button>
                </div>

                <div class="user-profile">
                    <span class="mr-2 font-medium">{{ authStore.user?.username }}</span>
                    <Avatar :label="userInitial" shape="circle" size="normal" style="background-color: var(--primary-color); color: var(--primary-color-text)" />
                    <Button icon="pi pi-sign-out" text rounded severity="danger" class="ml-2" @click="authStore.logout()" />
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <div class="layout-sidebar">
            <Menu :model="items" class="w-full border-none bg-transparent" />
            <SidebarCoffeeAnimation />
        </div>

        <!-- Main Content -->
        <div class="layout-main-container">
            <PanelCoffeeDecorations />
            <div class="layout-main">
                <router-view />
            </div>
        </div>
    </div>
</template>

<style scoped>
.layout-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.layout-topbar {
    position: fixed;
    height: 5rem;
    z-index: 997;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0 2rem;
    background-color: var(--surface-card); /* White topbar */
    transition: left 0.2s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--surface-border);
    box-shadow: 0 4px 15px rgba(62, 39, 35, 0.05); /* Soft shadow */
}

.topbar-start, .topbar-end {
    display: flex;
    align-items: center;
}

.logo-text {
    font-size: 1.75rem;
    font-weight: 900;
    background: linear-gradient(135deg, #3E2723 0%, #DAA520 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.03em;
    transition: opacity 0.2s ease;
}

.layout-sidebar {
    position: fixed;
    width: 260px;
    height: calc(100vh - 5rem);
    z-index: 999;
    overflow-y: auto;
    user-select: none;
    top: 5rem;
    left: 0;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s;
    background: linear-gradient(180deg, #FDFBF7 0%, #FFF8E1 50%, #FDFBF7 100%);
    border-right: 1px solid #F0EBE3;
    padding: 1.25rem 1rem;
}

.layout-main-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: space-between;
    padding: 7rem 2rem 2rem 2rem;
    padding-left: 280px;
    transition: margin-left 0.2s;
}

/* Desktop: Inactive means Hidden */
.layout-static-inactive .layout-sidebar {
    transform: translateX(-100%);
    left: 0;
}

.layout-static-inactive .layout-main-container {
    padding-left: 2rem;
}

@media (max-width: 991px) {
    .layout-sidebar {
        transform: translateX(0);
        left: 0;
        box-shadow: 4px 0 25px rgba(62, 39, 35, 0.08);
    }
    
    .layout-main-container {
        padding-left: 2rem;
    }
    
    .layout-static-inactive .layout-sidebar {
        transform: translateX(-100%);
        box-shadow: none;
    }
}

/* ===== PREMIUM SIDEBAR MENU STYLING ===== */

/* Section headers (Home, İşletme Yönetimi, Management) */
:deep(.p-submenu-header) {
    font-family: 'Outfit', sans-serif !important;
    font-size: 0.65rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.12em !important;
    color: #A1887F !important;
    padding: 1.25rem 0.75rem 0.5rem !important;
    background: transparent !important;
    border: none !important;
}

/* Menu items */
:deep(.p-menuitem) {
    margin: 2px 0;
}

:deep(.p-menuitem-link) {
    border-radius: 12px !important;
    padding: 0.7rem 0.85rem !important;
    color: #5D4037 !important;
    font-family: 'Outfit', sans-serif !important;
    font-size: 0.9rem !important;
    font-weight: 500 !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    gap: 0.75rem !important;
    position: relative;
    overflow: hidden;
}

/* Icon styling */
:deep(.p-menuitem-link .p-menuitem-icon) {
    color: #8D6E63 !important;
    font-size: 1.05rem !important;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    min-width: 1.25rem;
}

/* Hover state */
:deep(.p-menuitem-link:hover) {
    background: linear-gradient(135deg, #FFF3E0 0%, #FFF8E1 100%) !important;
    color: #3E2723 !important;
    border-radius: 12px !important;
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(218, 165, 32, 0.08);
}

:deep(.p-menuitem-link:hover .p-menuitem-icon) {
    color: #DAA520 !important;
    transform: scale(1.2) rotate(-8deg);
}

:deep(.p-menuitem-link:hover .p-menuitem-text) {
    color: #3E2723 !important;
    font-weight: 600 !important;
}

/* Active (router-link-active) state */
:deep(.p-menuitem-link.router-link-active) {
    background: linear-gradient(135deg, #DAA520 0%, #B8860B 100%) !important;
    color: #FFFFFF !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 15px rgba(218, 165, 32, 0.3);
    transform: translateX(2px);
}

:deep(.p-menuitem-link.router-link-active .p-menuitem-icon) {
    color: #FFFFFF !important;
    transform: scale(1.1);
}

:deep(.p-menuitem-link.router-link-active .p-menuitem-text) {
    color: #FFFFFF !important;
    font-weight: 700 !important;
}

:deep(.p-menuitem-link.router-link-active:hover) {
    background: linear-gradient(135deg, #C49419 0%, #A07710 100%) !important;
    box-shadow: 0 6px 20px rgba(218, 165, 32, 0.35);
}
</style>

