<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import QRCode from 'qrcode';

const toast = useToast();
const qrDataUrl = ref('');
const generating = ref(false);
const token = ref('');
const showSelectionDialog = ref(false);
const customer = ref<any>(null);
const participations = ref<any[]>([]);
const selectedParticipation = ref<any>(null);
const confirming = ref(false);
const qrTokenId = ref('');
let refreshInterval: number | null = null;
let statusPollingInterval: number | null = null;

const generateQR = async () => {
    generating.value = true;
    try {
        const authToken = localStorage.getItem('token');
        const headers: any = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch('https://counpaign.com/api/qr/generate', {
            method: 'POST',
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'QR oluşturulamadı');
        }

        token.value = data.token;
        qrTokenId.value = ''; // Reset on new QR

        // Generate QR code image from token
        qrDataUrl.value = await QRCode.toDataURL(data.token, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        startStatusPolling();
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'QR kod oluşturuldu', life: 2000 });
    } catch (error: any) {
        console.error('QR generation error:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    } finally {
        generating.value = false;
    }
};

const startStatusPolling = () => {
    stopStatusPolling();
    statusPollingInterval = window.setInterval(async () => {
        if (!token.value || showSelectionDialog.value) return;

        try {
            const authToken = localStorage.getItem('token');
            const headers: any = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch(`https://counpaign.com/api/qr/status/${token.value}`, { headers });
            const data = await response.json();
            
            console.log('🔍 QR Poll Status:', data.status, data);

            if (data.status === 'scanned') {
                console.log('✅ QR Scanned detected manually!');
                customer.value = data.customer;
                participations.value = data.participations;
                qrTokenId.value = data.qrTokenId;
                stopStatusPolling();
                showSelectionDialog.value = true;
            }
        } catch (error) {
            console.error('❌ Status polling error:', error);
        }
    }, 2000);
};

const checkManualStatus = async () => {
    if (!token.value) return;
    try {
        const authToken = localStorage.getItem('token');
        const headers: any = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`https://counpaign.com/api/qr/status/${token.value}`, { headers });
        const data = await response.json();
        
        console.log('🔍 Manual Status Check:', data);

        if (data.status === 'scanned') {
            customer.value = data.customer;
            participations.value = data.participations;
            qrTokenId.value = data.qrTokenId;
            stopStatusPolling();
            showSelectionDialog.value = true;
            toast.add({ severity: 'info', summary: 'Bilgi', detail: 'Müşteri taraması algılandı!', life: 2000 });
        } else {
            toast.add({ severity: 'info', summary: 'Bilgi', detail: `Mevcut durum: ${data.status}`, life: 2000 });
        }
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    }
};

const stopStatusPolling = () => {
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        statusPollingInterval = null;
    }
};

const confirmParticipation = async () => {
    if (!selectedParticipation.value) {
        toast.add({ severity: 'warn', summary: 'Uyarı', detail: 'Lütfen bir kampanya seçin', life: 2000 });
        return;
    }

    confirming.value = true;
    
    if (!qrTokenId.value) {
        console.error('❌ Missing QR Token ID');
        toast.add({ severity: 'error', summary: 'Hata', detail: 'QR Token ID bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.', life: 3000 });
        confirming.value = false;
        return;
    }

    console.log('🚀 Confirming participation with QR ID:', qrTokenId.value);

    try {
        const authToken = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch('https://counpaign.com/api/qr/confirm', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                qrTokenId: qrTokenId.value,
                customerId: customer.value._id,
                campaignId: selectedParticipation.value.campaign._id
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Onaylama başarısız');
        }

        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Kampanya katılımı onaylandı', life: 3000 });
        showSelectionDialog.value = false;
        qrDataUrl.value = ''; // Success, clear QR
    } catch (error: any) {
        console.error('Confirmation error:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    } finally {
        confirming.value = false;
    }
};

const startAutoRefresh = () => {
    // Auto-refresh every 60 seconds
    refreshInterval = window.setInterval(() => {
        if (qrDataUrl.value && !showSelectionDialog.value) {
            generateQR();
        }
    }, 60000);
};

const stopAutoRefresh = () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    stopStatusPolling();
};

onMounted(() => {
    startAutoRefresh();
});

onUnmounted(() => {
    stopAutoRefresh();
});
</script>

<template>
    <div class="qr-view">
        <Toast />
        
        <div class="page-header mb-5">
            <h1 class="text-900 font-bold">QR Okutma</h1>
            <p class="text-secondary">Müşteri QR kodunu okutması için kod oluşturun</p>
        </div>

        <div class="grid justify-content-center">
            <div class="col-12 md:col-8 lg:col-6">
                <div class="qr-card">
                    <div v-if="!qrDataUrl" class="qr-empty-state">
                        <i class="pi pi-qrcode qr-icon"></i>
                        <h3>QR Kod Oluşturun</h3>
                        <p class="text-secondary mb-4">
                            Müşterinizin mobil uygulamadan taratması için bir QR kod oluşturun. 
                            Kod 60 saniyede bir otomatik yenilenir.
                        </p>
                        <Button 
                            label="QR Kod Oluştur" 
                            icon="pi pi-qrcode" 
                            @click="generateQR"
                            :loading="generating"
                            size="large"
                            class="generate-btn"
                        />
                    </div>

                    <div v-else class="qr-display">
                        <div class="qr-image-container">
                            <img :src="qrDataUrl" alt="QR Code" class="qr-image" />
                        </div>
                        <div class="qr-info">
                            <i class="pi pi-info-circle mr-2"></i>
                            <span>QR kod 60 saniyede bir otomatik yenilenir</span>
                        </div>
                        <Button 
                            label="Yeni QR Oluştur" 
                            icon="pi pi-refresh" 
                            @click="generateQR"
                            :loading="generating"
                            outlined
                            class="mt-3 w-full"
                        />
                        <Button 
                            label="Taramayı Elle Kontrol Et" 
                            icon="pi pi-search" 
                            @click="checkManualStatus"
                            outlined
                            severity="secondary"
                            class="mt-2 w-full"
                        />
                    </div>
                </div>

                <div class="instructions-card mt-4">
                    <h4 class="mb-3">📱 Nasıl Kullanılır?</h4>
                    <ol class="instruction-list">
                        <li>Müşterinize mobil uygulamayı açmasını söyleyin</li>
                        <li>QR kod tarama özelliğini kullansın</li>
                        <li>Bu ekrandaki QR kodu taratsın</li>
                        <li>Kampanya seçim ekranı görünecek</li>
                        <li>Kampanyayı seçip onaylayın</li>
                        <li>Otomatik olarak damga/hediye güncellenecek</li>
                    </ol>
                </div>
            </div>
        </div>

        <!-- Campaign Selection Dialog -->
        <Dialog v-model:visible="showSelectionDialog" header="Kampanya Onaylama" :style="{ width: '500px' }" modal>
            <div class="p-4 pt-0">
                <div v-if="customer" class="customer-info mb-4 p-3 surface-100 border-round">
                    <div class="flex align-items-center gap-3">
                        <i class="pi pi-user text-2xl text-primary"></i>
                        <div>
                            <div class="font-bold text-lg">{{ customer.name }} {{ customer.surname }}</div>
                            <div class="text-secondary text-sm">{{ customer.email }}</div>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block font-bold mb-2">Kampanya Seçin</label>
                    <Dropdown 
                        v-model="selectedParticipation" 
                        :options="participations" 
                        optionLabel="campaign.title" 
                        placeholder="Kampanya Seçin" 
                        class="w-full"
                    >
                        <template #option="slotProps">
                            <div class="flex flex-column">
                                <div class="font-bold">{{ slotProps.option.campaign.title }}</div>
                                <div class="text-sm text-secondary">
                                    Mevcut: {{ slotProps.option.currentStamps }} Damga, {{ slotProps.option.currentGifts }} Hediye
                                </div>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <div class="info-alert p-3 bg-blue-50 text-blue-700 border-round mb-2 flex align-items-start gap-2">
                    <i class="pi pi-info-circle mt-1"></i>
                    <span>Onayladığınızda müşteriye 1 damga eklenecek ve kampanya hediye koşulu kontrol edilecektir.</span>
                </div>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="showSelectionDialog = false" :disabled="confirming" />
                <Button label="Katılımı Onayla" icon="pi pi-check" @click="confirmParticipation" :loading="confirming" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.qr-view {
    padding: 1rem;
    min-height: calc(100vh - 100px);
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
}

.text-secondary {
    color: var(--text-color-secondary);
}

.qr-card {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 3rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    text-align: center;
}

.qr-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.qr-icon {
    font-size: 5rem;
    color: var(--primary-color);
    opacity: 0.7;
}

.qr-empty-state h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.qr-empty-state p {
    margin: 0;
    max-width: 400px;
}

.generate-btn {
    padding: 1rem 2rem;
    font-size: 1.1rem;
}

.qr-display {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.qr-image-container {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
}

.qr-image {
    display: block;
    max-width: 100%;
    height: auto;
}

.qr-info {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.25rem;
    background: var(--highlight-bg);
    border-radius: 8px;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
}

.instructions-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.instructions-card h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
}

.instruction-list {
    margin: 0;
    padding-left: 1.5rem;
    color: var(--text-color-secondary);
    line-height: 1.8;
}

.instruction-list li {
    margin-bottom: 0.5rem;
}
</style>
