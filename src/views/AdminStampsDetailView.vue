<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

interface StampTransaction {
    _id: string;
    businessName: string;
    customerName: string;
    customerPhone: string;
    stamps: number;
    campaign: string;
    status: string;
    date: string;
}

const router = useRouter();
const transactions = ref<StampTransaction[]>([]);
const isLoading = ref(true);
const totalStamps = ref(0);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await fetch('https://counpaign.com/api/dashboard/admin/stamps-details');
        if (!response.ok) return;
        const data = await response.json();
        transactions.value = data;
        totalStamps.value = data.reduce((sum: number, tx: StampTransaction) => sum + tx.stamps, 0);
    } catch (error) {
        console.error('Error fetching admin stamps details:', error);
    } finally {
        isLoading.value = false;
    }
};

const formatDate = (dateString: string) => {
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
    <div class="detail-page p-4">
        <div class="flex align-items-center gap-3 mb-4">
            <Button icon="pi pi-arrow-left" text rounded @click="router.push('/dashboard')" />
            <div>
                <h1 class="text-2xl font-bold m-0">Tüm Kazanılan Pullar</h1>
                <p class="text-secondary m-0">Tüm firmaların kampanyalarından kazanılan pul detayları</p>
            </div>
        </div>

        <div class="stats-card mb-4">
            <div class="flex align-items-center gap-3">
                <div class="bg-yellow-100 border-circle p-3">
                    <i class="pi pi-box text-yellow-500 text-2xl"></i>
                </div>
                <div>
                    <span class="text-500 text-sm">Toplam Kazanılan Pul</span>
                    <div class="text-900 font-bold text-3xl">{{ totalStamps.toLocaleString('tr-TR') }}</div>
                </div>
            </div>
        </div>

        <div class="card">
            <DataTable 
                :value="transactions" 
                :loading="isLoading"
                :paginator="true" 
                :rows="20"
                :rowsPerPageOptions="[10, 20, 50, 100]"
                dataKey="_id"
                responsiveLayout="scroll"
            >
                <template #empty>
                    <div class="text-center py-5 text-secondary">
                        <i class="pi pi-inbox text-4xl mb-3" style="opacity: 0.5;"></i>
                        <p>Henüz pul kazanımı bulunmuyor</p>
                    </div>
                </template>

                <Column field="businessName" header="Firma" sortable style="min-width: 150px">
                    <template #body="{ data }">
                        <span class="font-medium text-primary">{{ data.businessName }}</span>
                    </template>
                </Column>

                <Column field="customerName" header="Müşteri" sortable style="min-width: 160px">
                    <template #body="{ data }">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-user text-yellow-400"></i>
                            <span>{{ data.customerName }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="customerPhone" header="Telefon" style="min-width: 130px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ data.customerPhone }}</span>
                    </template>
                </Column>

                <Column field="stamps" header="Pul" sortable style="min-width: 90px">
                    <template #body="{ data }">
                        <span class="font-bold text-yellow-500">+{{ data.stamps }}</span>
                    </template>
                </Column>

                <Column field="campaign" header="Kampanya" style="min-width: 180px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ data.campaign }}</span>
                    </template>
                </Column>

                <Column field="status" header="Durum" style="min-width: 110px">
                    <template #body="{ data }">
                        <span 
                            class="px-2 py-1 border-round text-sm font-medium"
                            :class="{
                                'bg-green-100 text-green-700': data.status === 'Aktif',
                                'bg-orange-100 text-orange-700': data.status === 'Sona Ermiş',
                                'bg-red-100 text-red-700': data.status === 'Silinmiş'
                            }"
                        >{{ data.status }}</span>
                    </template>
                </Column>

                <Column field="date" header="Tarih" sortable style="min-width: 150px">
                    <template #body="{ data }">
                        <span class="text-secondary">{{ formatDate(data.date) }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.detail-page {
    max-width: 1400px;
    margin: 0 auto;
}
.stats-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 1.5rem;
}
.card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 1rem;
}
</style>
