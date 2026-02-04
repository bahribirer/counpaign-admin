<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

interface BusinessNotification {
    _id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    targetBusiness: {
        _id: string;
        companyName: string;
        email: string;
    } | null;
}

const authStore = useAuthStore();
const toast = useToast();

const notifications = ref<BusinessNotification[]>([]);
const isLoading = ref(true);
const deleteDialog = ref(false);
const notificationToDelete = ref<BusinessNotification | null>(null);
const deleting = ref(false);

const readCount = computed(() => notifications.value.filter(n => n.isRead).length);
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

const fetchNotifications = async () => {
    isLoading.value = true;
    try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/all-business`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
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

const confirmDelete = (notif: BusinessNotification) => {
    notificationToDelete.value = notif;
    deleteDialog.value = true;
};

const deleteNotification = async () => {
    if (!notificationToDelete.value) return;

    deleting.value = true;
    try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/notifications/${notificationToDelete.value._id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Bildirim silindi', life: 3000 });
        notifications.value = notifications.value.filter(n => n._id !== notificationToDelete.value?._id);
        deleteDialog.value = false;
        notificationToDelete.value = null;
    } catch (error) {
        console.error('Error deleting notification:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Bildirim silinemedi', life: 3000 });
    } finally {
        deleting.value = false;
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
            <h1>Firma Bildirimleri</h1>
            <p class="text-secondary">Firmalara gönderilen tüm bildirimleri görüntüle ve yönet</p>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <i class="pi pi-envelope text-blue-500"></i>
                <div>
                    <span class="stat-value">{{ notifications.length }}</span>
                    <span class="stat-label">Toplam</span>
                </div>
            </div>
            <div class="stat-card">
                <i class="pi pi-check-circle text-green-500"></i>
                <div>
                    <span class="stat-value">{{ readCount }}</span>
                    <span class="stat-label">Okundu</span>
                </div>
            </div>
            <div class="stat-card">
                <i class="pi pi-circle text-orange-500"></i>
                <div>
                    <span class="stat-value">{{ unreadCount }}</span>
                    <span class="stat-label">Okunmadı</span>
                </div>
            </div>
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
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                        <p>Henüz firma bildirimi bulunmuyor</p>
                    </div>
                </template>

                <Column field="targetBusiness.companyName" header="Firma" sortable style="min-width: 180px">
                    <template #body="{ data }">
                        <div class="firm-cell">
                            <i class="pi pi-building text-blue-400"></i>
                            <span class="font-semibold">{{ data.targetBusiness?.companyName || 'Bilinmiyor' }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="title" header="Başlık" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <span class="font-medium">{{ data.title }}</span>
                    </template>
                </Column>

                <Column field="body" header="Mesaj" style="min-width: 250px">
                    <template #body="{ data }">
                        <span class="text-secondary notification-body">{{ data.body }}</span>
                    </template>
                </Column>

                <Column field="isRead" header="Durum" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <Tag 
                            :value="data.isRead ? 'Okundu' : 'Okunmadı'" 
                            :severity="data.isRead ? 'success' : 'warning'" 
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
                            icon="pi pi-trash" 
                            severity="danger" 
                            text 
                            rounded 
                            @click="confirmDelete(data)"
                            v-tooltip.left="'Sil'"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Delete Confirmation Dialog -->
        <Dialog 
            v-model:visible="deleteDialog" 
            :style="{ width: '450px' }" 
            header="Bildirim Silme Onayı" 
            :modal="true"
        >
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500);"></i>
                <div class="confirmation-text">
                    <p>Bu bildirimi silmek istediğinizden emin misiniz?</p>
                    <p class="text-secondary" v-if="notificationToDelete">
                        <strong>{{ notificationToDelete.title }}</strong>
                    </p>
                </div>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Sil" icon="pi pi-trash" severity="danger" @click="deleteNotification" :loading="deleting" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.notifications-management {
    padding: 1.5rem;
}

.page-header {
    margin-bottom: 1.5rem;
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

.stats-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    min-width: 150px;
}

.stat-card i {
    font-size: 1.5rem;
}

.stat-card div {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
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

.firm-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.notification-body {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
}

.confirmation-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 0;
}

.confirmation-text p {
    margin: 0 0 0.5rem 0;
}

:deep(.p-datatable-notifications .p-datatable-tbody > tr) {
    transition: background-color 0.2s;
}

:deep(.p-datatable-notifications .p-datatable-tbody > tr:hover) {
    background-color: var(--surface-hover) !important;
}
</style>
