<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Tag from 'primevue/tag';

interface Firm {
    _id: string;
    companyName: string;
    email: string;
    category: string;
    cardColor: string;
    city: string;
    district: string;
    neighborhood: string;
    createdAt: string;
}

const toast = useToast();
const firms = ref<Firm[]>([]);
const loading = ref(true);
const deleteDialog = ref(false);
const firmToDelete = ref<Firm | null>(null);
const deleting = ref(false);

const fetchFirms = async () => {
    loading.value = true;
    try {
        const response = await fetch('https://counpaign.com/api/firms');
        if (!response.ok) throw new Error('Failed to fetch firms');
        firms.value = await response.json();
    } catch (error) {
        console.error('Error fetching firms:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Firmalar yüklenemedi', life: 3000 });
    } finally {
        loading.value = false;
    }
};



const sendNotification = (firm: Firm) => {
    toast.add({ severity: 'info', summary: 'Yakında', detail: 'Firma bildirim sistemi yakında aktif olacak.', life: 3000 });
};

const confirmDelete = (firm: Firm) => {
    firmToDelete.value = firm;
    deleteDialog.value = true;
};

const deleteFirm = async () => {
    if (!firmToDelete.value) return;

    deleting.value = true;
    try {
        const response = await fetch(`https://counpaign.com/api/firms/${firmToDelete.value._id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete firm');

        await response.json();
        toast.add({ severity: 'success', summary: 'Başarılı', detail: `${firmToDelete.value.companyName} silindi`, life: 3000 });
        
        // Remove from local list
        firms.value = firms.value.filter(f => f._id !== firmToDelete.value?._id);
        deleteDialog.value = false;
        firmToDelete.value = null;
    } catch (error) {
        console.error('Error deleting firm:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Firma silinemedi', life: 3000 });
    } finally {
        deleting.value = false;
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

onMounted(() => {
    fetchFirms();
});
</script>

<template>
    <div class="firms-management">
        <Toast />
        
        <div class="page-header">
            <h1>Firma Yönetimi</h1>
            <p class="text-secondary">Tüm firmaları görüntüle ve yönet</p>
        </div>

        <div class="card">
            <DataTable 
                :value="firms" 
                :loading="loading"
                :paginator="true" 
                :rows="10"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                dataKey="_id"
                filterDisplay="row"
                responsiveLayout="scroll"
                class="p-datatable-firms"
            >
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-building" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                        <p>Henüz firma bulunmuyor</p>
                    </div>
                </template>

                <Column field="companyName" header="Firma Adı" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="firm-name-cell">
                            <div 
                                class="color-indicator" 
                                :style="{ backgroundColor: data.cardColor || '#EE2C2C' }"
                            ></div>
                            <span class="font-semibold">{{ data.companyName }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="email" header="E-posta" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ data.email }}</span>
                    </template>
                </Column>

                <Column field="category" header="Kategori" sortable style="min-width: 120px">
                    <template #body="{ data }">
                        <Tag :value="data.category || 'Cafe'" severity="info" />
                    </template>
                </Column>

                <Column field="district" header="Konum" sortable style="min-width: 180px">
                    <template #body="{ data }">
                        <span>{{ data.district }}, {{ data.neighborhood }}</span>
                    </template>
                </Column>

                <Column field="createdAt" header="Oluşturulma" sortable style="min-width: 150px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ formatDate(data.createdAt) }}</span>
                    </template>
                </Column>

                <Column header="İşlemler" style="min-width: 100px">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                             <Button 
                                icon="pi pi-bell" 
                                severity="warning" 
                                text 
                                rounded 
                                @click="sendNotification(data)"
                                v-tooltip.top="'Bildirim Gönder'"
                            />
                            <Button 
                                icon="pi pi-trash" 
                                severity="danger" 
                                text 
                                rounded 
                                @click="confirmDelete(data)"
                                v-tooltip.top="'Firmayı Sil'"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Delete Confirmation Dialog -->
        <Dialog 
            v-model:visible="deleteDialog" 
            :style="{ width: '450px' }" 
            header="Firma Silme Onayı" 
            :modal="true"
            class="delete-dialog"
        >
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500);"></i>
                <div class="confirmation-text">
                    <p>Bu firmayı silmek istediğinizden emin misiniz?</p>
                    <p class="font-bold">{{ firmToDelete?.companyName }}</p>
                    <p class="text-secondary text-sm">Bu işlem geri alınamaz!</p>
                </div>
            </div>
            <template #footer>
                <Button 
                    label="İptal" 
                    icon="pi pi-times" 
                    @click="deleteDialog = false" 
                    text 
                    :disabled="deleting"
                />
                <Button 
                    label="Sil" 
                    icon="pi pi-trash" 
                    severity="danger" 
                    @click="deleteFirm" 
                    :loading="deleting"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.firms-management {
    padding: 1rem;
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-color);
}

.page-header .text-secondary {
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
}

.card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.firm-name-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.color-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: var(--text-color-secondary);
}

.confirmation-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 0;
}

.confirmation-text p {
    margin: 0.25rem 0;
}

.text-secondary {
    color: var(--text-color-secondary);
}

.text-sm {
    font-size: 0.875rem;
}

:deep(.p-datatable-firms .p-datatable-thead > tr > th) {
    background: var(--surface-ground);
    font-weight: 600;
}

:deep(.p-datatable-firms .p-datatable-tbody > tr:hover) {
    background: var(--surface-hover);
}

:deep(.delete-dialog .p-dialog-header) {
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
}

:deep(.delete-dialog .p-dialog-footer) {
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
}
</style>
