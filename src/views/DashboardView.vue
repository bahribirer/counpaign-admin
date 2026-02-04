<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton'; // Needed for Chart filtering

const authStore = useAuthStore();

// Super Admin Stats
const stats = ref({
    users: { total: 0, today: 0 },
    firms: { total: 0, month: 0 },
    transactions: { total: 0, today: 0, chart: [] as any[] },
    campaigns: { total: 0, active: 0 },
    participations: { total: 0, won: 0 },
    rewards: {
        points: 0,
        stamps: 0,
        gifts: 0
    },
    notifications: { total: 0, unread: 0 },
    reviews: { total: 0, avgRating: 0 },
    gifts: { redeemed: 0 }
});

// Firm Stats
const firmStats = ref({
    customers: { total: 0 },
    participations: { total: 0 },
    transactions: { daily: 0, monthly: 0 },
    rewards: { weeklyPoints: 0, weeklyStamps: 0, weeklyCoffee: 0 },
    reviews: { total: 0, avgRating: 0 },
    gifts: { total: 0, redeemed: 0 },
    charts: {
        walletAdds: [] as any[],
        transactions: [] as any[]
    }
});

const chartRange = ref('Haftalık');
const rangeOptions = ['Haftalık', 'Aylık'];

// Chart options
const chartOptions = ref({
    plugins: {
        legend: { display: false }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: { precision: 0 }
        },
        x: {
            grid: { display: false }
        }
    },
    responsive: true,
    maintainAspectRatio: false
});

// Chart Data Refs
const superAdminChartData = ref();
const firmWalletChartData = ref();
const firmTxChartData = ref();

const fetchSuperAdminStats = async () => {
    try {
        const response = await fetch('https://counpaign.com/api/dashboard/stats');
        const data = await response.json();
        stats.value = data;
        
        superAdminChartData.value = {
            labels: data.transactions.chart.map((d: any) => d.day),
            datasets: [{
                label: 'İşlem Sayısı',
                data: data.transactions.chart.map((d: any) => d.count),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1,
                borderRadius: 8,
                barPercentage: 0.6
            }]
        };
    } catch (error) {
        console.error('Error fetching admin stats:', error);
    }
};

const fetchFirmStats = async () => {
    if (!authStore.user?.businessId) return;
    try {
        const response = await fetch(`https://counpaign.com/api/dashboard/firm-stats?businessId=${authStore.user.businessId}`);
        if (!response.ok) {
            console.error('Firm stats API error:', response.status);
            return;
        }
        const data = await response.json();
        if (data && data.charts) {
            firmStats.value = data;
            updateFirmCharts();
        }
    } catch (error) {
        console.error('Error fetching firm stats:', error);
    }
};

const updateFirmCharts = () => {
    const isWeekly = chartRange.value === 'Haftalık';
    const sliceCount = isWeekly ? 7 : 30; // Last 7 or 30 days
    
    // Wallet Adds Chart
    const walletData = firmStats.value.charts.walletAdds.slice(-sliceCount);
    firmWalletChartData.value = {
        labels: walletData.map((d: any) => d.day),
        datasets: [{
            label: 'Cüzdana Ekleme',
            data: walletData.map((d: any) => d.count),
            backgroundColor: 'rgba(34, 197, 94, 0.2)', // Green
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
            fill: true
        }]
    };

    // Transaction Chart
    const txData = firmStats.value.charts.transactions.slice(-sliceCount);
    firmTxChartData.value = {
        labels: txData.map((d: any) => d.day),
        datasets: [{
            label: 'İşlem Adeti',
            data: txData.map((d: any) => d.count),
            backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            tension: 0.4, // Curve
            fill: true
        }]
    };
};

watch(chartRange, () => {
    updateFirmCharts();
});

onMounted(() => {
    if (authStore.user?.role === 'super_admin') {
        fetchSuperAdminStats();
    } else if (authStore.user?.role === 'business') {
        fetchFirmStats();
    }
});
</script>

<template>
    <div class="dashboard">
        <!-- Super Admin Dashboard -->
        <div v-if="authStore.user?.role === 'super_admin'">
            <!-- ... EXISTING SUPER ADMIN CONTENT ... -->
             <div class="page-header mb-5">
                <h1 class="text-900 font-bold">Dashboard</h1>
                <p class="text-secondary">Sistem genelindeki istatistikler ve özet bilgiler</p>
            </div>

            <div class="grid">
                <!-- 1. Toplam Kullanıcı -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Toplam Kullanıcı</span>
                                <div class="text-900 font-bold text-4xl">{{ stats.users.total }}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-indigo-500-10 border-round" style="width:3rem;height:3rem; background: rgba(99, 102, 241, 0.1)">
                                <i class="pi pi-users text-indigo-400 text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-indigo-400 font-medium">+{{ stats.users.today }} </span>
                        <span class="text-500 text-sm">bugün katılan</span>
                    </div>
                </div>
                
                <!-- 2. Toplam İşletme -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Toplam İşletme</span>
                                <div class="text-900 font-bold text-4xl">{{ stats.firms.total }}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-red-500-10 border-round" style="width:3rem;height:3rem; background: rgba(238, 44, 44, 0.1)">
                                <i class="pi pi-building text-red-500 text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-red-400 font-medium">+{{ stats.firms.month }} </span>
                        <span class="text-500 text-sm">bu ay</span>
                    </div>
                </div>

                <!-- 3. Toplam İşlem -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Toplam İşlem</span>
                                <div class="text-900 font-bold text-4xl">{{ stats.transactions.total }}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center bg-teal-500-10 border-round" style="width:3rem;height:3rem; background: rgba(0, 150, 136, 0.1)">
                                <i class="pi pi-sync text-teal-400 text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-teal-400 font-medium">+{{ stats.transactions.today }} </span>
                        <span class="text-500 text-sm">bugün</span>
                    </div>
                </div>

                <!-- 4. Aktif Kampanya -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Aktif Kampanya</span>
                                <div class="text-900 font-bold text-4xl">{{ stats.campaigns.active }}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:3rem;height:3rem; background: rgba(255, 152, 0, 0.1)">
                                <i class="pi pi-ticket text-orange-400 text-2xl"></i>
                            </div>
                        </div>
                        <div class="h-1rem"></div>
                    </div>
                </div>

                <!-- 5. Kampanya Katılım (New) -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full">
                        <div class="flex justify-content-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-3">Kampanya Katılım</span>
                                <div class="text-900 font-bold text-4xl">{{ stats.participations.total }}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:3rem;height:3rem; background: rgba(33, 150, 243, 0.1)">
                                <i class="pi pi-check-circle text-blue-400 text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-blue-400 font-medium">{{ stats.participations.won }} </span>
                        <span class="text-500 text-sm">kampanya kazanımı</span>
                    </div>
                </div>

                <!-- 6. Ödül Özeti (Clickable KPI Cards) -->
                <div class="col-12 md:col-12 lg:col-9">
                    <div class="card p-4 h-full flex flex-column justify-content-center">
                        <span class="block text-500 font-medium mb-3">Ödül Özeti</span>
                        <div class="grid">
                            <div class="col-12 md:col-4">
                                <div class="p-3 border-round kpi-card surface-100" @click="$router.push('/admin/points-detail')">
                                    <div class="flex align-items-center gap-3">
                                        <div class="bg-purple-100 border-circle p-2">
                                            <i class="pi pi-star text-purple-500"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="text-500 text-sm">Kazanılan Puan</div>
                                            <div class="text-xl font-bold text-purple-500">{{ stats.rewards.points?.toLocaleString('tr-TR') || 0 }}</div>
                                        </div>
                                        <i class="pi pi-chevron-right text-400"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 md:col-4">
                                <div class="p-3 border-round kpi-card surface-100" @click="$router.push('/admin/stamps-detail')">
                                    <div class="flex align-items-center gap-3">
                                        <div class="bg-yellow-100 border-circle p-2">
                                            <i class="pi pi-box text-yellow-500"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="text-500 text-sm">Kazanılan Pul</div>
                                            <div class="text-xl font-bold text-yellow-500">{{ stats.rewards.stamps?.toLocaleString('tr-TR') || 0 }}</div>
                                        </div>
                                        <i class="pi pi-chevron-right text-400"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 md:col-4">
                                <div class="p-3 border-round kpi-card surface-100" @click="$router.push('/admin/gifts-detail')">
                                    <div class="flex align-items-center gap-3">
                                        <div class="bg-teal-100 border-circle p-2">
                                            <i class="pi pi-gift text-teal-500"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="text-500 text-sm">Kullanılan Hediye</div>
                                            <div class="text-xl font-bold text-teal-500">{{ stats.rewards.gifts?.toLocaleString('tr-TR') || 0 }}</div>
                                        </div>
                                        <i class="pi pi-chevron-right text-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 7. Günlük İşlemler Grafiği (Weekly Chart) -->
                 <div class="col-12 xl:col-8 mt-4">
                    <div class="card h-full">
                        <div class="flex align-items-center justify-content-between mb-4">
                            <h5 class="text-xl font-bold m-0">Günlük İşlem Hacmi (Son 7 Gün)</h5>
                            <Button icon="pi pi-ellipsis-v" text rounded aria-label="Options" />
                        </div>
                        <div class="relative" style="height: 300px; overflow-x: auto;">
                             <Chart type="bar" :data="superAdminChartData" :options="chartOptions" class="h-full" />
                        </div>
                    </div>
                </div>

                <!-- 8. Özet İstatistikler -->
                <div class="col-12 xl:col-4 mt-4">
                    <div class="card h-full p-4">
                        <h5 class="text-xl font-bold mb-4">Özet İstatistikler</h5>
                        
                        <!-- Reviews -->
                        <div class="flex align-items-center mb-4 pb-3 border-bottom-1 surface-border">
                            <div class="mr-3 bg-yellow-100 border-circle p-3">
                                <i class="pi pi-star-fill text-yellow-500 text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <span class="text-500 text-sm">Değerlendirmeler</span>
                                <div class="flex align-items-center gap-2 mt-1">
                                    <span class="text-900 font-bold text-xl">{{ stats.reviews?.total || 0 }}</span>
                                    <span class="text-yellow-500 font-medium">⭐ {{ stats.reviews?.avgRating || 0 }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Notifications -->
                        <div class="flex align-items-center mb-4 pb-3 border-bottom-1 surface-border">
                            <div class="mr-3 bg-blue-100 border-circle p-3">
                                <i class="pi pi-bell text-blue-500 text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <span class="text-500 text-sm">Bildirimler</span>
                                <div class="flex align-items-center gap-2 mt-1">
                                    <span class="text-900 font-bold text-xl">{{ stats.notifications?.total || 0 }}</span>
                                    <span class="text-orange-500 font-medium text-sm">{{ stats.notifications?.unread || 0 }} okunmadı</span>
                                </div>
                            </div>
                        </div>

                        <!-- Gifts -->
                        <div class="flex align-items-center">
                            <div class="mr-3 bg-pink-100 border-circle p-3">
                                <i class="pi pi-gift text-pink-500 text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <span class="text-500 text-sm">Kullanılan Hediyeler</span>
                                <div class="text-900 font-bold text-xl mt-1">{{ stats.gifts?.redeemed || 0 }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Business Dashboard -->
        <div v-else class="p-4">
             <div class="page-header mb-5 flex justify-content-between align-items-center">
                <div>
                    <h1 class="text-900 font-bold">{{ authStore.user?.businessName }}</h1>
                    <p class="text-secondary">İşletmenizin performans özetleri</p>
                </div>
                <SelectButton v-model="chartRange" :options="rangeOptions" aria-label="Zaman Aralığı" />
            </div>

            <!-- Stats Cards Row 1 -->
            <div class="grid mb-4">
                <!-- Customer Count -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full border-left-3 border-primary">
                        <span class="block text-500 font-medium mb-3">Müşteri Sayısı</span>
                        <div class="flex justify-content-between align-items-center">
                            <div class="text-900 font-bold text-3xl">{{ firmStats?.customers?.total || 0 }}</div>
                            <i class="pi pi-users text-primary text-2xl"></i>
                        </div>
                        <p class="mt-2 mb-0 text-sm text-500">Cüzdanına ekleyenler</p>
                    </div>
                </div>
                <!-- Participation Count -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full border-left-3 border-orange-500">
                        <span class="block text-500 font-medium mb-3">Kampanya Katılım</span>
                         <div class="flex justify-content-between align-items-center">
                            <div class="text-900 font-bold text-3xl">{{ firmStats?.participations?.total || 0 }}</div>
                            <i class="pi pi-ticket text-orange-500 text-2xl"></i>
                        </div>
                         <p class="mt-2 mb-0 text-sm text-500">Toplam katılım</p>
                    </div>
                </div>
                <!-- Daily Transactions -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full border-left-3 border-green-500">
                        <span class="block text-500 font-medium mb-3">Günlük İşlem</span>
                         <div class="flex justify-content-between align-items-center">
                            <div class="text-900 font-bold text-3xl">{{ firmStats?.transactions?.daily || 0 }}</div>
                            <i class="pi pi-calendar-times text-green-500 text-2xl"></i>
                        </div>
                         <p class="mt-2 mb-0 text-sm text-500">Bugünkü işlemler</p>
                    </div>
                </div>
                <!-- Monthly Transactions -->
                <div class="col-12 md:col-6 lg:col-3">
                    <div class="card p-4 h-full border-left-3 border-blue-500">
                        <span class="block text-500 font-medium mb-3">Aylık İşlem</span>
                         <div class="flex justify-content-between align-items-center">
                            <div class="text-900 font-bold text-3xl">{{ firmStats?.transactions?.monthly || 0 }}</div>
                            <i class="pi pi-calendar text-blue-500 text-2xl"></i>
                        </div>
                         <p class="mt-2 mb-0 text-sm text-500">Bu ayki işlemler</p>
                    </div>
                </div>
            </div>

            <!-- Stats Cards Row 2 (Weekly Rewards) - Clickable -->
            <div class="grid mb-4">
                 <div class="col-12 md:col-4">
                    <div class="card p-4 h-full flex align-items-center kpi-card" @click="$router.push('/points-detail')">
                        <div class="mr-3 bg-purple-100 border-circle p-3">
                            <i class="pi pi-star text-purple-500 text-xl"></i>
                        </div>
                         <div class="flex-1">
                             <span class="text-500 font-medium text-sm">Kazandırdığı Puan (Haftalık)</span>
                             <div class="text-900 font-bold text-xl mt-1">{{ firmStats?.rewards?.weeklyPoints || 0 }} Puan</div>
                        </div>
                        <i class="pi pi-chevron-right text-400"></i>
                    </div>
                 </div>
                 <div class="col-12 md:col-4">
                    <div class="card p-4 h-full flex align-items-center kpi-card" @click="$router.push('/stamps-detail')">
                        <div class="mr-3 bg-yellow-100 border-circle p-3">
                            <i class="pi pi-box text-yellow-500 text-xl"></i>
                        </div>
                        <div class="flex-1">
                             <span class="text-500 font-medium text-sm">Kazandırdığı Pul (Haftalık)</span>
                             <div class="text-900 font-bold text-xl mt-1">{{ firmStats?.rewards?.weeklyStamps || 0 }} Pul</div>
                        </div>
                        <i class="pi pi-chevron-right text-400"></i>
                    </div>
                 </div>
                 <div class="col-12 md:col-4">
                    <div class="card p-4 h-full flex align-items-center kpi-card" @click="$router.push('/gifts-detail')">
                         <div class="mr-3 bg-teal-100 border-circle p-3">
                            <i class="pi pi-gift text-teal-500 text-xl"></i>
                        </div>
                        <div class="flex-1">
                             <span class="text-500 font-medium text-sm">Kazandırdığı Hediye (Haftalık)</span>
                             <div class="text-900 font-bold text-xl mt-1">{{ firmStats?.rewards?.weeklyCoffee || 0 }} Adet</div>
                        </div>
                        <i class="pi pi-chevron-right text-400"></i>
                    </div>
                 </div>
            </div>

            <!-- Reviews & Gifts Row -->
            <div class="grid mb-4">
                 <div class="col-12 md:col-6">
                    <div class="card p-4 h-full flex align-items-center">
                        <div class="mr-3 bg-orange-100 border-circle p-3">
                            <i class="pi pi-star-fill text-orange-500 text-xl"></i>
                        </div>
                         <div class="flex-1">
                             <span class="text-500 font-medium text-sm">Değerlendirmeler</span>
                             <div class="flex align-items-center gap-3 mt-1">
                                 <span class="text-900 font-bold text-xl">{{ firmStats?.reviews?.total || 0 }} Yorum</span>
                                 <span class="text-orange-500 font-medium">⭐ {{ firmStats?.reviews?.avgRating || 0 }}</span>
                             </div>
                        </div>
                    </div>
                 </div>
                 <div class="col-12 md:col-6">
                    <div class="card p-4 h-full flex align-items-center">
                        <div class="mr-3 bg-pink-100 border-circle p-3">
                            <i class="pi pi-gift text-pink-500 text-xl"></i>
                        </div>
                        <div class="flex-1">
                             <span class="text-500 font-medium text-sm">Hediyeler</span>
                             <div class="flex align-items-center gap-3 mt-1">
                                 <span class="text-900 font-bold text-xl">{{ firmStats?.gifts?.total || 0 }} Toplam</span>
                                 <span class="text-green-500 font-medium">{{ firmStats?.gifts?.redeemed || 0 }} Kullanıldı</span>
                             </div>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Charts -->
            <div class="grid">
                <!-- Wallet Adds Chart -->
                <div class="col-12 lg:col-6">
                    <div class="card h-full p-4">
                        <h5 class="text-lg font-bold mb-4">Cüzdana Eklenme Sayısı</h5>
                        <div style="height: 300px;">
                            <Chart type="bar" :data="firmWalletChartData" :options="chartOptions" class="h-full" />
                        </div>
                    </div>
                </div>
                <!-- Transactions Chart -->
                 <div class="col-12 lg:col-6">
                    <div class="card h-full p-4">
                        <h5 class="text-lg font-bold mb-4">İşlem Adeti</h5>
                         <div style="height: 300px;">
                            <Chart type="line" :data="firmTxChartData" :options="chartOptions" class="h-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
    padding: 0;
}
.card {
    border: 1px solid var(--surface-border);
    box-shadow: none !important;
}
.kpi-card {
    cursor: pointer;
    transition: all 0.2s ease;
}
.kpi-card:hover {
    background: var(--surface-hover);
    transform: translateY(-2px);
}
</style>
