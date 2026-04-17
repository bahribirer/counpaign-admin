<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

defineProps<{ rows: any[]; loading?: boolean }>();

const API_URL = import.meta.env.VITE_API_URL;
// Uploads live on the backend root, not under /api
const UPLOAD_BASE = API_URL ? API_URL.replace(/\/api\/?$/, '') : '';

const logoUrl = (logo: string | null) => {
    if (!logo) return '';
    if (logo.startsWith('http')) return logo;
    return `${UPLOAD_BASE}${logo}`;
};
</script>

<template>
    <div class="card p-4 h-full">
        <div class="flex align-items-center justify-content-between mb-3">
            <h5 class="text-lg font-bold m-0">En Aktif Firmalar</h5>
            <span class="text-500 text-sm">İşlem sayısına göre</span>
        </div>
        <DataTable :value="rows" :loading="loading" size="small" striped-rows responsive-layout="scroll">
            <Column field="name" header="Firma">
                <template #body="{ data }">
                    <div class="flex align-items-center gap-2">
                        <img v-if="data.logo" :src="logoUrl(data.logo)" class="border-circle" style="width:28px;height:28px;object-fit:cover" />
                        <div v-else class="bg-indigo-100 text-indigo-500 border-circle flex align-items-center justify-content-center" style="width:28px;height:28px;font-size:0.75rem">
                            {{ (data.name || '?').slice(0, 2).toUpperCase() }}
                        </div>
                        <div>
                            <div class="font-semibold text-sm">{{ data.name }}</div>
                            <div class="text-500 text-xs">{{ data.city }}</div>
                        </div>
                    </div>
                </template>
            </Column>
            <Column field="transactions" header="İşlem" :style="{ width: '110px' }">
                <template #body="{ data }">
                    <span class="font-bold">{{ data.transactions?.toLocaleString('tr-TR') }}</span>
                </template>
            </Column>
            <Column field="customers" header="Müşteri" :style="{ width: '110px' }">
                <template #body="{ data }">
                    <span>{{ data.customers?.toLocaleString('tr-TR') }}</span>
                </template>
            </Column>
        </DataTable>
        <div v-if="!rows?.length && !loading" class="empty-state">
            <i class="pi pi-inbox text-3xl mb-2 block text-400"></i>
            <div class="text-500">Bu dönemde firma aktivitesi yok</div>
        </div>
    </div>
</template>

<style scoped>
.card {
    border: 1px solid var(--surface-border);
    box-shadow: none !important;
}
.empty-state {
    text-align: center;
    padding: 2rem 1rem;
}
</style>
