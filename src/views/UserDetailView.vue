<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store'; // [NEW] Import
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

import Breadcrumb from 'primevue/breadcrumb';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

interface User {
    _id: string;
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    gender: string;
    createdAt: string;
}

interface WalletCafe {
    _id: string;
    business: {
        _id: string;
        companyName: string;
        category: string;
        cardColor: string;
    };
    points: number;
    stamps: number;
    giftsCount: number;
    joinedAt: string;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const userId = route.params.id as string;

const user = ref<User | null>(null);
const cafes = ref<WalletCafe[]>([]);
const loading = ref(true);
const breadcrumbItems = ref([
    { label: 'Kullanıcılar', to: '/users' },
    { label: 'Kullanıcı Detayı' }
]);

const authStore = useAuthStore(); // [NEW] Use Store

const fetchUserData = async () => {
    // [SECURITY] Redirect if not superadmin
    if (authStore.user?.role !== 'super_admin') {
        toast.add({ severity: 'error', summary: 'Yetkisiz Erişim', detail: 'Bu sayfaya erişim yetkiniz yok.', life: 3000 });
        router.push('/users'); // Redirect back
        return;
    }

    loading.value = true;
    try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const [userRes, cafesRes] = await Promise.all([
            fetch(`https://counpaign.com/api/users/${userId}`, { headers }),
            fetch(`https://counpaign.com/api/users/${userId}/cafes`, { headers })
        ]);

        if (!userRes.ok || !cafesRes.ok) throw new Error('Failed to fetch data');

        user.value = await userRes.json();
        cafes.value = await cafesRes.json();
    } catch (error) {
        console.error('Error fetching user detail:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Veriler yüklenemedi', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const onCellEditComplete = async (event: any) => {
    let { data, newValue, field, value: originalValue } = event;

    if (newValue === originalValue) return;

    try {
        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`https://counpaign.com/api/users/${userId}/wallet/${data._id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                [field]: newValue
            })
        });

        if (!response.ok) throw new Error('Failed to update wallet');

        const result = await response.json();
        
        // Update local state with server response to reflect auto-calculated values (like gifts/stamps)
        const updatedIdx = cafes.value.findIndex(c => c._id === data._id);
        if (updatedIdx !== -1) {
            cafes.value[updatedIdx] = {
                ...cafes.value[updatedIdx],
                points: result.record.points,
                stamps: result.record.stamps,
                giftsCount: result.record.giftsCount
            } as WalletCafe;
        }

        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Cüzdan güncellendi', life: 2000 });
    } catch (error) {
        console.error('Error updating wallet:', error);
        data[field] = originalValue; // Rollback
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Güncelleme yapılamadı', life: 3000 });
    }
};

const confirmDeleteRecord = (record: WalletCafe) => {
    confirm.require({
        message: `${record.business.companyName} bu kullanıcının cüzdanından silinsin mi?`,
        header: 'Kayıt Silme Onayı',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Sil',
        rejectLabel: 'İptal',
        accept: () => deleteWalletRecord(record._id)
    });
};

const deleteWalletRecord = async (recordId: string) => {
    try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`https://counpaign.com/api/users/${userId}/wallet/${recordId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) throw new Error('Failed to delete record');

        cafes.value = cafes.value.filter(c => c._id !== recordId);
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'İşletme cüzdandan çıkarıldı', life: 3000 });
    } catch (error) {
        console.error('Error deleting wallet record:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Kayıt silinemedi', life: 3000 });
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

onMounted(fetchUserData);
</script>

<template>
    <div class="user-detail">
        <Toast />
        <ConfirmDialog />
        
        <div class="mb-4">
            <Breadcrumb :model="breadcrumbItems" />
        </div>

        <div v-if="user" class="header-section mb-5">
            <div class="flex align-items-center gap-4">
                <Button icon="pi pi-arrow-left" severity="secondary" rounded @click="router.push('/users')" />
                <div>
                    <h1 class="text-900 font-bold m-0">{{ user.name }} {{ user.surname }}</h1>
                    <p class="text-secondary m-0">{{ user.email }} | {{ user.phoneNumber }}</p>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="col-12">
                <div class="card p-0 overflow-hidden">
                    <div class="p-4 border-bottom-1 surface-border">
                        <h2 class="text-xl font-bold m-0">Cüzdan ve İşletme Bilgileri</h2>
                    </div>
                    <div class="p-0">
                        <DataTable 
                            :value="cafes" 
                            :loading="loading" 
                            editMode="cell" 
                            @cell-edit-complete="onCellEditComplete"
                            responsiveLayout="scroll"
                            class="editable-cells-table"
                        >
                            <template #empty>
                                <div class="p-4 text-center text-secondary">Bu kullanıcının cüzdanında henüz bir kafe bulunmuyor.</div>
                            </template>
                            
                            <Column field="business.companyName" header="İşletme Adı" style="width: 30%"></Column>
                            
                            <Column field="points" header="Puan" style="width: 15%">
                                <template #editor="{ data, field }">
                                    <InputNumber v-model="data[field]" autofocus />
                                </template>
                            </Column>
                            
                            <Column field="stamps" header="Damga" style="width: 15%">
                                <template #editor="{ data, field }">
                                    <InputNumber v-model="data[field]" autofocus />
                                </template>
                            </Column>
                            
                            <Column field="giftsCount" header="Hediye" style="width: 15%">
                                <template #editor="{ data, field }">
                                    <InputNumber v-model="data[field]" autofocus />
                                </template>
                                <template #body="{ data }">
                                    <Tag :value="data.giftsCount || 0" severity="warning" />
                                </template>
                            </Column>
                            
                            <Column field="joinedAt" header="Eklenme" style="width: 15%">
                                <template #body="{ data }">
                                    {{ formatDate(data.joinedAt) }}
                                </template>
                            </Column>

                            <Column style="width: 10%">
                                <template #body="{ data }">
                                    <Button 
                                        icon="pi pi-trash" 
                                        severity="danger" 
                                        text 
                                        rounded 
                                        @click="confirmDeleteRecord(data)"
                                        v-tooltip.top="'Cüzdandan Sil'"
                                    />
                                </template>
                            </Column>
                        </DataTable>
                        <div class="p-4 text-xs text-secondary italic border-top-1 surface-border">
                            * Değerleri değiştirmek için hücreye tıklayın, sayıyı girin ve Enter'a basın.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.user-detail {
    padding: 1rem;
}

.text-secondary {
    color: var(--text-color-secondary);
}

:deep(.p-breadcrumb) {
    background: transparent;
    border: none;
    padding: 0;
}

:deep(.p-card) {
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>
