<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';

const props = defineProps<{
    visible: boolean;
    cell: { day: string; dayIndex: number; hour: number } | null;
    businessId: string | undefined;
    range: string;
}>();

const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>();

const API_URL = import.meta.env.VITE_API_URL;

const loading = ref(false);
const transactions = ref<any[]>([]);
const error = ref('');

const fetchData = async () => {
    if (!props.cell || !props.businessId) return;
    loading.value = true;
    error.value = '';
    try {
        const url = `${API_URL}/analytics/firm/cell-transactions?businessId=${props.businessId}&dayOfWeek=${props.cell.dayIndex}&hour=${props.cell.hour}&range=${props.range}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Veri çekilemedi');
        transactions.value = await res.json();
    } catch (err: any) {
        error.value = err?.message || 'Hata';
        transactions.value = [];
    } finally {
        loading.value = false;
    }
};

watch(() => [props.visible, props.cell], ([v]) => {
    if (v && props.cell) fetchData();
});

const formatTime = (d: string) => {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
        return '-';
    }
};

const typeLabel = (t: string) => {
    if (t === 'STAMP') return { label: 'Pul', severity: 'warn' };
    if (t === 'POINT') return { label: 'Puan', severity: 'info' };
    if (t === 'GIFT_REDEEM' || t === 'gift_redemption') return { label: 'Hediye', severity: 'success' };
    return { label: t || '-', severity: 'secondary' };
};
</script>

<template>
    <Dialog
        :visible="visible"
        :header="cell ? `${cell.day} · ${cell.hour}:00 - ${cell.hour + 1}:00 — İşlemler` : 'İşlemler'"
        modal
        :style="{ width: '720px', maxWidth: '95vw' }"
        @update:visible="(v) => emit('update:visible', v)"
    >
        <div v-if="loading" class="flex justify-content-center p-5">
            <ProgressSpinner style="width:40px;height:40px" />
        </div>

        <div v-else-if="error" class="text-center p-4 text-red-500">
            {{ error }}
        </div>

        <div v-else>
            <div class="text-500 text-sm mb-3">
                Toplam {{ transactions.length }} işlem · son 100 kayıt gösteriliyor
            </div>

            <DataTable
                v-if="transactions.length"
                :value="transactions"
                size="small"
                striped-rows
                scrollable
                scroll-height="50vh"
                responsive-layout="scroll"
            >
                <Column header="Zaman" :style="{ width: '140px' }">
                    <template #body="{ data }">
                        <span class="text-sm">{{ formatTime(data.createdAt) }}</span>
                    </template>
                </Column>
                <Column header="Müşteri">
                    <template #body="{ data }">
                        <div>
                            <div class="font-semibold text-sm">{{ data.customerName || 'Misafir' }}</div>
                            <div class="text-500 text-xs">{{ data.customerPhone || '—' }}</div>
                        </div>
                    </template>
                </Column>
                <Column header="Tür" :style="{ width: '100px' }">
                    <template #body="{ data }">
                        <Tag :value="typeLabel(data.type).label" :severity="typeLabel(data.type).severity" />
                    </template>
                </Column>
                <Column header="Kazanım" :style="{ width: '110px' }">
                    <template #body="{ data }">
                        <span v-if="data.pointsEarned > 0" class="text-blue-500 text-sm font-semibold">+{{ data.pointsEarned }} puan</span>
                        <span v-else-if="data.stampsEarned > 0" class="text-yellow-600 text-sm font-semibold">+{{ data.stampsEarned }} pul</span>
                        <span v-else class="text-500 text-sm">—</span>
                    </template>
                </Column>
                <Column header="Tutar" :style="{ width: '90px' }">
                    <template #body="{ data }">
                        <span v-if="data.purchaseAmount > 0" class="text-sm">{{ data.purchaseAmount }} ₺</span>
                        <span v-else class="text-500 text-sm">—</span>
                    </template>
                </Column>
            </DataTable>

            <div v-else class="text-center p-4 text-500">
                <i class="pi pi-inbox text-3xl mb-2 block"></i>
                Bu saatte işlem yok
            </div>
        </div>
    </Dialog>
</template>
