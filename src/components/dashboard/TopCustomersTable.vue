<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

defineProps<{ rows: any[]; loading?: boolean }>();

const formatDate = (d: string) => {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    } catch {
        return '-';
    }
};

const initials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
};
</script>

<template>
    <div class="card p-4 h-full">
        <div class="flex align-items-center justify-content-between mb-3">
            <h5 class="text-lg font-bold m-0">En Sadık Müşteriler</h5>
            <span class="text-500 text-sm">Ziyaret sayısı</span>
        </div>
        <DataTable :value="rows" :loading="loading" size="small" striped-rows responsive-layout="scroll">
            <Column field="name" header="Müşteri">
                <template #body="{ data }">
                    <div class="flex align-items-center gap-2">
                        <div class="bg-primary-100 text-primary-500 border-circle flex align-items-center justify-content-center" style="width:30px;height:30px;font-size:0.7rem;font-weight:600">
                            {{ initials(data.name || 'Misafir') }}
                        </div>
                        <div>
                            <div class="font-semibold text-sm">{{ data.name || 'Misafir' }}</div>
                            <div class="text-500 text-xs">{{ data.phone || data.email || '—' }}</div>
                        </div>
                    </div>
                </template>
            </Column>
            <Column field="transactions" header="Ziyaret" :style="{ width: '90px' }">
                <template #body="{ data }">
                    <span class="font-bold">{{ data.transactions }}</span>
                </template>
            </Column>
            <Column field="lastVisit" header="Son" :style="{ width: '90px' }">
                <template #body="{ data }">
                    <span class="text-sm">{{ formatDate(data.lastVisit) }}</span>
                </template>
            </Column>
        </DataTable>
        <div v-if="!rows?.length && !loading" class="empty-state">
            <i class="pi pi-users text-3xl mb-2 block text-400"></i>
            <div class="text-500">Bu dönemde müşteri aktivitesi yok</div>
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
