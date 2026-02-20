<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import api from '../services/api';

interface Notification {
    _id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
}

const toast = useToast();

// Notification State
const notifications = ref<Notification[]>([]);
const isLoading = ref(true);
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

const fetchNotifications = async () => {
    isLoading.value = true;
    try {
        const res = await api.get(`/notifications/my-notifications`);
        if (Array.isArray(res.data)) {
            notifications.value = res.data;
        } else {
            notifications.value = [];
        }
    } catch (e) {
        console.error("Fetch Notifications Error:", e);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Bildirimler yüklenemedi', life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

const markAsRead = async (notification: Notification) => {
    if (notification.isRead) return;
    try {
        await api.put(`/notifications/${notification._id}/read`, {});
        notification.isRead = true;
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Bildirim okundu olarak işaretlendi', life: 2000 });
    } catch (e) {
        console.error("Mark Read Error:", e);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'İşlem başarısız', life: 3000 });
    }
};

const markAllAsRead = async () => {
    const unreadNotifications = notifications.value.filter(n => !n.isRead);
    for (const notif of unreadNotifications) {
        await markAsRead(notif);
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

onMounted(() => {
    fetchNotifications();
});
</script>

<template>
    <div class="notifications-management">
        <Toast />
        
        <div class="page-header">
            <h1>Bildirimler</h1>
            <p class="text-secondary">Tüm sistem bildirimleriniz burada listelenir</p>
        </div>

        <div class="card">
            <DataTable 
                :value="notifications" 
                :loading="isLoading"
                :paginator="true" 
                :rows="10"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                dataKey="_id"
                responsiveLayout="scroll"
                class="p-datatable-notifications"
            >
                <template #header>
                    <div class="flex justify-content-between align-items-center">
                        <div class="flex align-items-center gap-2">
                            <Tag v-if="unreadCount > 0" :value="`${unreadCount} Okunmamış`" severity="danger" />
                        </div>
                        <Button 
                            v-if="unreadCount > 0"
                            label="Tümünü Okundu Yap" 
                            icon="pi pi-check-double" 
                            severity="success" 
                            outlined
                            @click="markAllAsRead"
                        />
                    </div>
                </template>
                
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                        <p>Henüz bildirim bulunmuyor</p>
                    </div>
                </template>

                <Column field="title" header="Başlık" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="notification-title-cell">
                            <div 
                                class="status-indicator" 
                                :class="{ 'unread': !data.isRead, 'read': data.isRead }"
                            ></div>
                            <span class="font-semibold" :class="{ 'text-secondary': data.isRead }">{{ data.title }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="body" header="Mesaj" style="min-width: 300px">
                    <template #body="{ data }">
                        <span class="text-secondary notification-body">{{ data.body }}</span>
                    </template>
                </Column>

                <Column field="isRead" header="Durum" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <Tag 
                            :value="data.isRead ? 'Okundu' : 'Yeni'" 
                            :severity="data.isRead ? 'secondary' : 'info'" 
                        />
                    </template>
                </Column>

                <Column field="createdAt" header="Tarih" sortable style="min-width: 180px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ formatDate(data.createdAt) }}</span>
                    </template>
                </Column>

                <Column header="İşlem" style="min-width: 80px; text-align: center;">
                    <template #body="{ data }">
                        <Button 
                            v-if="!data.isRead"
                            icon="pi pi-check" 
                            severity="success" 
                            text 
                            rounded 
                            @click="markAsRead(data)"
                            v-tooltip.left="'Okundu İşaretle'"
                        />
                        <i v-else class="pi pi-check-circle" style="font-size: 1.2rem; color: var(--green-500);"></i>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.notifications-management {
    padding: 1.5rem;
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-color);
}

.page-header .text-secondary {
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
}

.card {
    background: var(--surface-card);
    border-radius: 12px;
    border: 1px solid var(--surface-border);
    padding: 1.5rem;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.empty-state i {
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-state p {
    color: var(--text-color-secondary);
    font-size: 1.1rem;
}

.notification-title-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-indicator.unread {
    background-color: var(--blue-500);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

.status-indicator.read {
    background-color: var(--surface-400);
}

.notification-body {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
}

:deep(.p-datatable-notifications .p-datatable-tbody > tr) {
    transition: background-color 0.2s;
}

:deep(.p-datatable-notifications .p-datatable-tbody > tr:hover) {
    background-color: var(--surface-hover) !important;
}
</style>
