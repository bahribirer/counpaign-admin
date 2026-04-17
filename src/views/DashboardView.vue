<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

// New analytics components
import DateRangePicker from '../components/dashboard/DateRangePicker.vue';
import KpiDelta from '../components/dashboard/KpiDelta.vue';
import TopFirmsTable from '../components/dashboard/TopFirmsTable.vue';
import FirmHealthCard from '../components/dashboard/FirmHealthCard.vue';
import GrowthChart from '../components/dashboard/GrowthChart.vue';
import CustomerSegmentsCard from '../components/dashboard/CustomerSegmentsCard.vue';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap.vue';
import TopCustomersTable from '../components/dashboard/TopCustomersTable.vue';
import HeatmapDrillDownDialog from '../components/dashboard/HeatmapDrillDownDialog.vue';
import KpiSkeleton from '../components/dashboard/KpiSkeleton.vue';

import {
    exportSuperAdminPdf,
    exportFirmPdf
} from '../services/report.service';


const API_URL = import.meta.env.VITE_API_URL;

const authStore = useAuthStore();

// ---------- Analytics state (new — doesn't touch existing) ----------
const range = ref<'7d' | '30d' | '90d'>('30d');

// Super admin analytics
const adminOverview = ref<any>(null);
const topFirms = ref<any[]>([]);
const firmHealth = ref<any>(null);
const growthSeries = ref<any[]>([]);
const analyticsLoading = ref(false);

// Firm admin analytics
const firmOverview = ref<any>(null);
const firmSegments = ref<any>(null);
const firmHeatmap = ref<any>(null);
const topCustomers = ref<any[]>([]);
const firmAnalyticsLoading = ref(false);

// Heatmap drill-down state
const drillDownOpen = ref(false);
const drillDownCell = ref<{ day: string; dayIndex: number; hour: number } | null>(null);

const onHeatmapCellClick = (payload: { day: string; dayIndex: number; hour: number }) => {
    drillDownCell.value = payload;
    drillDownOpen.value = true;
};

// ---------- Export state ----------
const toast = useToast();
const exporting = ref(false);

const handleExport = async (role: 'super' | 'firm') => {
    if (exporting.value) return;
    exporting.value = true;
    try {
        if (role === 'super') {
            await exportSuperAdminPdf(range.value);
        } else {
            const bid = authStore.user?.businessId;
            const bname = authStore.user?.businessName || 'isletme';
            if (!bid) throw new Error('İşletme bilgisi bulunamadı');
            await exportFirmPdf(bid, bname, range.value);
        }
        toast.add({ severity: 'success', summary: 'Rapor hazır', detail: 'PDF dosyası indirildi', life: 3000 });
    } catch (err: any) {
        console.error('Export error:', err);
        toast.add({ severity: 'error', summary: 'Rapor hatası', detail: err?.message || 'Rapor üretilemedi', life: 4000 });
    } finally {
        exporting.value = false;
    }
};

// No longer needed: adminExportItems, firmExportItems

// Super Admin Stats
const stats = ref({
    users: { total: 0, today: 0 },
    firms: { total: 0, month: 0 },
    transactions: { total: 0, today: 0, chart: [] as any[] },
    campaigns: { total: 0, active: 0 },
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
    transactions: { daily: 0, monthly: 0 },
    rewards: { weeklyPoints: 0, weeklyStamps: 0, weeklyCoffee: 0 },
    reviews: { total: 0, avgRating: 0 },
    gifts: { total: 0, redeemed: 0 },
    charts: {
        walletAdds: [] as any[],
        transactions: [] as any[]
    }
});



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
        const response = await fetch(`${API_URL}/dashboard/stats`);
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
        const response = await fetch(`${API_URL}/dashboard/firm-stats?businessId=${authStore.user.businessId}`);
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
    const sliceCount = 7; // Last 7 days
    
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



// ---------- New analytics fetchers ----------
const fetchAdminAnalytics = async () => {
    analyticsLoading.value = true;
    try {
        const [ov, tf, fh, gr] = await Promise.all([
            fetch(`${API_URL}/analytics/admin/overview?range=${range.value}`).then((r) => r.json()),
            fetch(`${API_URL}/analytics/admin/top-firms?range=${range.value}&limit=10`).then((r) => r.json()),
            fetch(`${API_URL}/analytics/admin/firm-health`).then((r) => r.json()),
            fetch(`${API_URL}/analytics/admin/growth?range=${range.value}`).then((r) => r.json())
        ]);
        adminOverview.value = ov;
        topFirms.value = Array.isArray(tf) ? tf : [];
        firmHealth.value = fh;
        growthSeries.value = Array.isArray(gr) ? gr : [];
    } catch (err) {
        console.error('Admin analytics error:', err);
    } finally {
        analyticsLoading.value = false;
    }
};

const fetchFirmAnalytics = async () => {
    if (!authStore.user?.businessId) return;
    const bid = authStore.user.businessId;
    firmAnalyticsLoading.value = true;
    try {
        const [ov, seg, hm, tc] = await Promise.all([
            fetch(`${API_URL}/analytics/firm/overview?businessId=${bid}&range=${range.value}`).then((r) => r.json()),
            fetch(`${API_URL}/analytics/firm/segments?businessId=${bid}`).then((r) => r.json()),
            fetch(`${API_URL}/analytics/firm/heatmap?businessId=${bid}&range=${range.value}`).then((r) => r.json()),
            fetch(`${API_URL}/analytics/firm/top-customers?businessId=${bid}&range=${range.value}&limit=10`).then((r) => r.json())
        ]);
        firmOverview.value = ov;
        firmSegments.value = seg;
        firmHeatmap.value = hm;
        topCustomers.value = Array.isArray(tc) ? tc : [];
    } catch (err) {
        console.error('Firm analytics error:', err);
    } finally {
        firmAnalyticsLoading.value = false;
    }
};

// Refetch on range change
watch(range, () => {
    if (authStore.user?.role === 'super_admin') {
        fetchAdminAnalytics();
    } else if (authStore.user?.role === 'business') {
        fetchFirmAnalytics();
    }
});


onMounted(() => {
    if (authStore.user?.role === 'super_admin') {
        fetchSuperAdminStats();
        fetchAdminAnalytics();
    } else if (authStore.user?.role === 'business') {
        fetchFirmStats();
        fetchFirmAnalytics();
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

                <!-- 5. Ödül Özeti (Clickable KPI Cards) -->
                <div class="col-12 md:col-12 lg:col-12">
                    <div class="card p-4 h-full flex flex-column justify-content-center">
                        <span class="block text-500 font-medium mb-3">Ödül Özeti</span>
                        <div class="grid">
                            <div class="col-12 md:col-6">
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
                            <div class="col-12 md:col-6">
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

            <!-- ============================================== -->
            <!-- YENİ: Gelişmiş Analitik (Super Admin)          -->
            <!-- ============================================== -->
            <div class="analytics-section mt-6">
                <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-3 analytics-header">
                    <div>
                        <h2 class="text-2xl font-bold m-0">Gelişmiş Analitik</h2>
                        <p class="text-secondary m-0 text-sm">Platform performansı ve büyüme trendleri</p>
                    </div>
                    <div class="flex align-items-center gap-2 flex-wrap">
                        <DateRangePicker v-model="range" />
                        <Button
                            label="PDF Raporu İndir"
                            icon="pi pi-file-pdf"
                            severity="info"
                            outlined
                            :loading="exporting"
                            @click="handleExport('super')"
                        />
                    </div>
                </div>

                <!-- KPI row with period comparison -->
                <div class="grid mb-2">
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="adminOverview" title="Yeni Kullanıcı" :value="adminOverview.users.current" :delta="adminOverview.users.delta" icon="pi pi-user-plus" color="indigo" />
                        <KpiSkeleton v-else />
                    </div>
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="adminOverview" title="Yeni İşletme" :value="adminOverview.firms.current" :delta="adminOverview.firms.delta" icon="pi pi-building" color="red" />
                        <KpiSkeleton v-else />
                    </div>
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="adminOverview" title="İşlem Hacmi" :value="adminOverview.transactions.current" :delta="adminOverview.transactions.delta" icon="pi pi-sync" color="teal" />
                        <KpiSkeleton v-else />
                    </div>
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="adminOverview" title="Kullanılan Hediye" :value="adminOverview.gifts.current" :delta="adminOverview.gifts.delta" icon="pi pi-gift" color="pink" />
                        <KpiSkeleton v-else />
                    </div>
                </div>

                <!-- Growth chart + firm health -->
                <div class="grid mt-2">
                    <div class="col-12 xl:col-8">
                        <GrowthChart :series="growthSeries" />
                    </div>
                    <div class="col-12 xl:col-4">
                        <FirmHealthCard :health="firmHealth" />
                    </div>
                </div>

                <!-- Top firms -->
                <div class="grid mt-2">
                    <div class="col-12">
                        <TopFirmsTable :rows="topFirms" :loading="analyticsLoading" />
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
                <!-- Daily Transactions -->
                <div class="col-12 md:col-6 lg:col-4">
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
                 <div class="col-12 md:col-6">
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
                 <div class="col-12 md:col-6">
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

            <!-- ============================================== -->
            <!-- YENİ: Gelişmiş Analitik (Firma Admin)          -->
            <!-- ============================================== -->
            <div class="analytics-section mt-6">
                <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-3 analytics-header">
                    <div>
                        <h2 class="text-2xl font-bold m-0">Gelişmiş Analitik</h2>
                        <p class="text-secondary m-0 text-sm">Müşteri davranışı, yoğunluk analizi ve sadakat</p>
                    </div>
                    <div class="flex align-items-center gap-2 flex-wrap">
                        <DateRangePicker v-model="range" />
                        <Button
                            label="PDF Raporu İndir"
                            icon="pi pi-file-pdf"
                            severity="info"
                            outlined
                            :loading="exporting"
                            @click="handleExport('firm')"
                        />
                    </div>
                </div>

                <!-- KPI row with period comparison -->
                <div class="grid mb-2">
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="firmOverview" title="İşlem" :value="firmOverview.transactions.current" :delta="firmOverview.transactions.delta" icon="pi pi-sync" color="indigo" />
                        <KpiSkeleton v-else />
                    </div>
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="firmOverview" title="Aktif Müşteri" :value="firmOverview.activeCustomers.current" :delta="firmOverview.activeCustomers.delta" icon="pi pi-users" color="green" />
                        <KpiSkeleton v-else />
                    </div>
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="firmOverview" title="Yeni Cüzdan" :value="firmOverview.newCustomers.current" :delta="firmOverview.newCustomers.delta" icon="pi pi-user-plus" color="blue" />
                        <KpiSkeleton v-else />
                    </div>
                    <div class="col-12 md:col-6 lg:col-3">
                        <KpiDelta v-if="firmOverview" title="Kullanılan Hediye" :value="firmOverview.gifts.current" :delta="firmOverview.gifts.delta" icon="pi pi-gift" color="pink" />
                        <KpiSkeleton v-else />
                    </div>
                </div>

                <!-- Segments + Heatmap -->
                <div class="grid mt-2">
                    <div class="col-12 xl:col-5">
                        <CustomerSegmentsCard :segments="firmSegments" />
                    </div>
                    <div class="col-12 xl:col-7">
                        <ActivityHeatmap :data="firmHeatmap" @cell-click="onHeatmapCellClick" />
                    </div>
                </div>

                <!-- Top customers -->
                <div class="grid mt-2">
                    <div class="col-12">
                        <TopCustomersTable :rows="topCustomers" :loading="firmAnalyticsLoading" />
                    </div>
                </div>
            </div>

            <!-- Heatmap drill-down dialog -->
            <HeatmapDrillDownDialog
                v-model:visible="drillDownOpen"
                :cell="drillDownCell"
                :business-id="authStore.user?.businessId"
                :range="range"
            />
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

/* Sticky analytics header */
.analytics-section {
    scroll-margin-top: 1rem;
}
.analytics-header {
    position: sticky;
    top: 0;
    z-index: 5;
    padding: 0.75rem 0;
    background: var(--surface-ground, #fff);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--surface-border);
    margin-bottom: 1rem !important;
}
</style>
