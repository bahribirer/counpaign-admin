<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import api from '../services/api';

interface UserNotification {
    _id: string;
    title: string;
    body: string;
    isRead: boolean;
    isDeleted: boolean;
    createdAt: string;
    targetCustomer: {
        _id: string;
        name: string;
        surname: string;
        phoneNumber: string;
        email: string;
    } | null;
}

const toast = useToast();

const notifications = ref<UserNotification[]>([]);
const isLoading = ref(true);
const deleteDialog = ref(false);
const notificationToDelete = ref<UserNotification | null>(null);
const deleting = ref(false);

const readCount = computed(() => notifications.value.filter(n => n.isRead && !n.isDeleted).length);
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead && !n.isDeleted).length);
const deletedCount = computed(() => notifications.value.filter(n => n.isDeleted).length);

const fetchNotifications = async () => {
    isLoading.value = true;
    try {
        const res = await api.get(`/notifications/all-users`);
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

const confirmDelete = (notif: UserNotification) => {
    notificationToDelete.value = notif;
    deleteDialog.value = true;
};

const deleteNotification = async () => {
    if (!notificationToDelete.value) return;

    deleting.value = true;
    try {
        await api.delete(`/notifications/${notificationToDelete.value._id}`);
        
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Bildirim kalıcı olarak silindi', life: 3000 });
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

const getCustomerName = (customer: UserNotification['targetCustomer']) => {
    if (!customer) return 'Tüm Kullanıcılar';
    return `${customer.name} ${customer.surname}`;
};

const getStatusLabel = (notif: UserNotification) => {
    if (notif.isDeleted) return 'Silindi';
    if (notif.isRead) return 'Okundu';
    return 'Okunmadı';
};

const getStatusSeverity = (notif: UserNotification) => {
    if (notif.isDeleted) return 'danger';
    if (notif.isRead) return 'success';
    return 'warning';
};

onMounted(() => {
    fetchNotifications();
});
</script>

<template>
    <div class="notifications-management">
        <Toast />
        
        <div class="page-header">
            <h1>Kullanıcı Bildirimleri</h1>
            <p class="text-secondary">Kullanıcılara gönderilen tüm bildirimleri görüntüle ve yönet</p>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <i class="pi pi-users text-purple-500"></i>
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
            <div class="stat-card">
                <i class="pi pi-trash text-red-500"></i>
                <div>
                    <span class="stat-value">{{ deletedCount }}</span>
                    <span class="stat-label">Silindi</span>
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
                :rowClass="(data) => data.isDeleted ? 'deleted-row' : ''"
            >
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                        <p>Henüz kullanıcı bildirimi bulunmuyor</p>
                    </div>
                </template>

                <Column header="Kullanıcı" sortable style="min-width: 180px">
                    <template #body="{ data }">
                        <div class="user-cell" :class="{ 'deleted': data.isDeleted }">
                            <i class="pi pi-user text-purple-400"></i>
                            <div class="user-info">
                                <span class="font-semibold">{{ getCustomerName(data.targetCustomer) }}</span>
                                <span class="text-secondary text-xs" v-if="data.targetCustomer">{{ data.targetCustomer.phoneNumber }}</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="title" header="Başlık" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <span class="font-medium" :class="{ 'deleted-text': data.isDeleted }">{{ data.title }}</span>
                    </template>
                </Column>

                <Column field="body" header="Mesaj" style="min-width: 250px">
                    <template #body="{ data }">
                        <span class="text-secondary notification-body" :class="{ 'deleted-text': data.isDeleted }">{{ data.body }}</span>
                    </template>
                </Column>

                <Column field="isRead" header="Durum" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <Tag 
                            :value="getStatusLabel(data)" 
                            :severity="getStatusSeverity(data)" 
                        />
                    </template>
                </Column>

                <Column field="createdAt" header="Tarih" sortable style="min-width: 180px">
                    <template #body="{ data }">
                        <span class="text-secondary" :class="{ 'deleted-text': data.isDeleted }">{{ formatDate(data.createdAt) }}</span>
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
                            v-tooltip.left="'Kalıcı Sil'"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Delete Confirmation Dialog -->
        <Dialog 
            v-model:visible="deleteDialog" 
            :style="{ width: '450px' }" 
            header="Bildirim Kalıcı Silme Onayı" 
            :modal="true"
        >
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500);"></i>
                <div class="confirmation-text">
                    <p>Bu bildirimi <strong>kalıcı olarak</strong> silmek istediğinizden emin misiniz?</p>
                    <p class="text-secondary" v-if="notificationToDelete">
                        <strong>{{ notificationToDelete.title }}</strong>
                    </p>
                </div>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Kalıcı Sil" icon="pi pi-trash" severity="danger" @click="deleteNotification" :loading="deleting" />
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
    flex-wrap: wrap;
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

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-cell.deleted {
    opacity: 0.5;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.notification-body {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
}

.deleted-text {
    opacity: 0.5;
    text-decoration: line-through;
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

:deep(.p-datatable-notifications .p-datatable-tbody > tr.deleted-row) {
    background-color: rgba(239, 68, 68, 0.05);
}
</style>
