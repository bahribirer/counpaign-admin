<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Avatar from 'primevue/avatar';

interface SegmentUser {
    _id: string;
    name: string;
    surname: string;
    phoneNumber: string;
    email: string;
    lastVisit: string | null;
    createdAt: string;
    profileImage?: string | null;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL;

// Mobil profil fotoğrafı için (relative path → API origin, base64 → data URL)
const resolveImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (path.length > 500) return `data:image/jpeg;base64,${path}`;
    const base = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
    let cleanPath = path;
    if (!cleanPath.includes('/')) cleanPath = `/uploads/${cleanPath}`;
    else cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${base}${cleanPath}`;
};

const segment = route.params.segment as string;
const users = ref<SegmentUser[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');

const segmentMeta: Record<string, { label: string; color: string; icon: string }> = {
    vip: { label: 'VIP Müşteriler', color: 'purple', icon: 'pi pi-crown' },
    active: { label: 'Aktif Müşteriler', color: 'green', icon: 'pi pi-check-circle' },
    risk: { label: 'Riskli Müşteriler', color: 'orange', icon: 'pi pi-exclamation-triangle' },
    lost: { label: 'Kayıp Müşteriler', color: 'red', icon: 'pi pi-user-minus' }
};

const meta = computed(() => segmentMeta[segment] || { label: 'Müşteriler', color: 'blue', icon: 'pi pi-users' });

const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value;
    const q = searchQuery.value.toLowerCase();
    return users.value.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.surname.toLowerCase().includes(q) || 
        u.phoneNumber.includes(q)
    );
});

const fetchData = async () => {
    if (!authStore.user?.businessId) return;
    isLoading.value = true;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/analytics/firm/segment-users?businessId=${authStore.user.businessId}&segment=${segment}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        users.value = await response.json();
    } catch (error) {
        console.error('Error fetching segment users:', error);
    } finally {
        isLoading.value = false;
    }
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Hiç ziyaret etmedi';
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};


onMounted(() => {
    fetchData();
});
</script>

<template>
    <div class="segment-detail-page p-4">
        <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            <div class="flex align-items-center gap-3">
                <Button icon="pi pi-arrow-left" text rounded @click="router.push('/dashboard')" />
                <div>
                    <div class="flex align-items-center gap-2">
                        <i :class="[meta.icon, `text-${meta.color}-500`]" class="text-xl"></i>
                        <h1 class="text-2xl font-bold m-0">{{ meta.label }}</h1>
                    </div>
                    <p class="text-secondary m-0">Bu segmentteki kullanıcıların detaylı listesi</p>
                </div>
            </div>
            
            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="searchQuery" placeholder="Müşteri Ara..." class="w-full md:w-20rem" />
            </IconField>
        </div>

        <div class="card p-0 overflow-hidden border-round-xl border-1 surface-border">
            <DataTable 
                :value="filteredUsers" 
                :loading="isLoading"
                :paginator="true" 
                :rows="20"
                :rowsPerPageOptions="[10, 20, 50, 100]"
                dataKey="_id"
                responsiveLayout="scroll"
                class="p-datatable-sm"
            >
                <template #empty>
                    <div class="text-center py-6 text-secondary">
                        <i class="pi pi-users text-4xl mb-3" style="opacity: 0.3;"></i>
                        <p>Bu segmentte kullanıcı bulunamadı</p>
                    </div>
                </template>

                <Column field="name" header="Müşteri" sortable style="min-width: 200px">
                    <template #body="{ data }">
                        <div class="flex align-items-center gap-3">
                            <Avatar
                                v-if="data.profileImage"
                                :image="resolveImageUrl(data.profileImage)"
                                shape="circle"
                                @imageError="data.profileImage = null"
                            />
                            <Avatar v-else :label="(data.name?.[0] || '?').toUpperCase()" shape="circle" class="bg-primary-100 text-primary-700" />
                            <div class="flex flex-column">
                                <span class="font-bold text-900">{{ data.name }} {{ data.surname }}</span>
                                <span class="text-xs text-500">{{ data.email }}</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="phoneNumber" header="Telefon" style="min-width: 140px">
                    <template #body="{ data }">
                        <span class="text-700 font-medium">{{ data.phoneNumber }}</span>
                    </template>
                </Column>

                <Column field="lastVisit" header="Son Ziyaret" sortable style="min-width: 180px">
                    <template #body="{ data }">
                        <div class="flex flex-column">
                            <span :class="{'text-red-500': !data.lastVisit, 'text-700': data.lastVisit}">
                                {{ formatDate(data.lastVisit) }}
                            </span>
                        </div>
                    </template>
                </Column>

                <Column field="createdAt" header="Kayıt Tarihi" sortable style="min-width: 150px">
                    <template #body="{ data }">
                        <span class="text-500">{{ new Date(data.createdAt).toLocaleDateString('tr-TR') }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.segment-detail-page {
    max-width: 1200px;
    margin: 0 auto;
}
:deep(.p-datatable-header) {
    background: transparent;
    padding: 0;
}
</style>
