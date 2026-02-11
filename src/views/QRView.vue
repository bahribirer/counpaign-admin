<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useAuthStore } from '../stores/auth.store';

const toast = useToast();
const authStore = useAuthStore();
const qrDataUrl = ref('');
const loading = ref(true);
const staticQRToken = ref('');
const companyName = ref('');
const showSelectionDialog = ref(false);
const showGiftDialog = ref(false);
const customer = ref<any>(null);
const participations = ref<any[]>([]);
const giftRedemption = ref<any>(null);
const selectedParticipation = ref<any>(null);
const confirming = ref(false);
const qrTokenId = ref('');
const noQR = ref(false);
const generatingQR = ref(false);
let statusPollingInterval: number | null = null;

// Fetch the firm's permanent static QR
const fetchStaticQR = async () => {
    loading.value = true;
    noQR.value = false;
    try {
        const businessId = authStore.user?.businessId;
        if (!businessId) {
            throw new Error('Business ID bulunamadı');
        }

        const response = await fetch(`https://counpaign.com/api/firms/${businessId}/qr`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.status === 404) {
            noQR.value = true;
            return;
        }

        if (!response.ok) throw new Error('QR alınamadı');

        const data = await response.json();
        staticQRToken.value = data.staticQR;
        companyName.value = data.companyName;

        // Generate QR code image from static token
        qrDataUrl.value = await QRCode.toDataURL(data.staticQR, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Start polling for scans
        startStaticPolling();
    } catch (error: any) {
        console.error('Fetch static QR error:', error);
        if (!noQR.value) {
            toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
        }
    } finally {
        loading.value = false;
    }
};

// Generate QR for firms that don't have one yet
const generateStaticQR = async () => {
    generatingQR.value = true;
    try {
        const businessId = authStore.user?.businessId;
        const response = await fetch(`https://counpaign.com/api/firms/${businessId}/generate-qr`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'QR oluşturulamadı');
        }

        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'QR kod oluşturuldu!', life: 2000 });
        await fetchStaticQR();
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    } finally {
        generatingQR.value = false;
    }
};

// Poll for scans of the static QR
const startStaticPolling = () => {
    stopPolling();
    statusPollingInterval = window.setInterval(async () => {
        if (showSelectionDialog.value || showGiftDialog.value) return; // Don't poll while dialog is open

        try {
            const response = await fetch('https://counpaign.com/api/qr/poll-static', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.status === 'scanned') {
                customer.value = data.customer;
                qrTokenId.value = data.qrTokenId;

                // Check scan type: Gift Redemption vs Campaign
                if (data.scanType === 'gift_redemption') {
                    giftRedemption.value = data.giftRedemption;
                    showGiftDialog.value = true;
                } else {
                    participations.value = data.participations;
                    showSelectionDialog.value = true;
                }
            }
        } catch (error) {
            console.error('Static QR polling error:', error);
        }
    }, 2000);
};

const stopPolling = () => {
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
        toast.add({ severity: 'error', summary: 'Hata', detail: 'QR Token ID bulunamadı.', life: 3000 });
        confirming.value = false;
        return;
    }

    try {
        const response = await fetch('https://counpaign.com/api/qr/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
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
        qrTokenId.value = '';
        selectedParticipation.value = null;
        showSelectionDialog.value = false;
    } catch (error: any) {
        console.error('Confirmation error:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    } finally {
        confirming.value = false;
    }
};

const confirmGiftRedemption = async () => {
    confirming.value = true;

    if (!qrTokenId.value) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'QR Token ID bulunamadı.', life: 3000 });
        confirming.value = false;
        return;
    }

    try {
        const response = await fetch('https://counpaign.com/api/gifts/complete-redemption', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                qrTokenId: qrTokenId.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Onaylama başarısız');
        }

        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Hediye teslim edildi!', life: 3000 });
        qrTokenId.value = '';
        giftRedemption.value = null;
        showGiftDialog.value = false;
    } catch (error: any) {
        console.error('Gift Confirmation error:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
    } finally {
        confirming.value = false;
    }
};

const cancelProcess = async () => {
    if (!qrTokenId.value) return;

    try {
        await fetch('https://counpaign.com/api/qr/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ qrTokenId: qrTokenId.value })
        });
    } catch (error) {
        console.error('Cancel error:', error);
    } finally {
        qrTokenId.value = '';
    }
};

const onDialogHide = () => {
    if (qrTokenId.value) {
        cancelProcess();
    }
};

onMounted(() => {
    fetchStaticQR();
});

onUnmounted(() => {
    stopPolling();
});

const downloadQRAsPDF = async () => {
    if (!qrDataUrl.value || !companyName.value) return;

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const centerX = pageWidth / 2;

        // Background
        doc.setFillColor(250, 250, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Top accent bar
        doc.setFillColor(238, 44, 44);
        doc.rect(0, 0, pageWidth, 8, 'F');

        // Company Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(30, 30, 30);
        doc.text(companyName.value, centerX, 40, { align: 'center' });

        // Subtitle
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(120, 120, 120);
        doc.text('QR Kodu Taratarak Puan Kazanin!', centerX, 52, { align: 'center' });

        // Divider line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(40, 60, pageWidth - 40, 60);

        // QR Code - large and centered
        const qrSize = 120;
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = 72;

        // QR border/shadow
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 4, 4, 'F');
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 4, 4, 'S');

        // QR image
        doc.addImage(qrDataUrl.value, 'PNG', qrX, qrY, qrSize, qrSize);

        // Instructions
        const instructionY = qrY + qrSize + 30;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(50, 50, 50);
        doc.text('Scan & Earn Points', centerX, instructionY, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        const steps = [
            '1. Open the Counpaign app',
            '2. Tap the QR Scan button',
            '3. Scan this QR code',
            '4. Your points will be added after confirmation'
        ];
        steps.forEach((step, i) => {
            doc.text(step, centerX, instructionY + 12 + (i * 8), { align: 'center' });
        });

        // Bottom branding
        doc.setFillColor(238, 44, 44);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('COUNPAIGN', centerX, pageHeight - 8, { align: 'center' });

        // Save
        doc.save(`${companyName.value}_QR_Kod.pdf`);

        toast.add({ severity: 'success', summary: 'Basarili', detail: 'QR kod PDF olarak indirildi', life: 2000 });
    } catch (error: any) {
        console.error('PDF generation error:', error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'PDF olu\u015fturulamad\u0131', life: 3000 });
    }
};
</script>

<template>
    <div class="qr-view">
        <Toast />

        <div class="page-header mb-5">
            <h1 class="text-900 font-bold">QR Okutma</h1>
            <p class="text-secondary">Müşterilerinizin bu QR kodu taratması yeterli</p>
        </div>

        <div class="grid justify-content-center">
            <div class="col-12 md:col-8 lg:col-6">
                <div class="qr-card">
                    <!-- Loading State -->
                    <div v-if="loading" class="qr-empty-state">
                        <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: var(--primary-color);"></i>
                        <p class="text-secondary">QR kod yükleniyor...</p>
                    </div>

                    <!-- No QR State (for old firms without static QR) -->
                    <div v-else-if="noQR" class="qr-empty-state">
                        <i class="pi pi-qrcode qr-icon"></i>
                        <h3>QR Kod Oluşturun</h3>
                        <p class="text-secondary mb-4">
                            Firmanız için henüz kalıcı bir QR kod oluşturulmamış.
                            Bir kez oluşturulduğunda, müşterileriniz her zaman bu QR kodu kullanabilir.
                        </p>
                        <Button
                            label="Firma QR Oluştur"
                            icon="pi pi-qrcode"
                            @click="generateStaticQR"
                            :loading="generatingQR"
                            size="large"
                            class="generate-btn"
                        />
                    </div>

                    <!-- QR Display -->
                    <div v-else class="qr-display">
                        <div class="firm-badge mb-3">
                            <i class="pi pi-building mr-2"></i>
                            <span class="font-bold">{{ companyName }}</span>
                        </div>
                        <div class="qr-image-container">
                            <img :src="qrDataUrl" alt="Firma QR Kodu" class="qr-image" />
                        </div>
                        <div class="qr-info">
                            <i class="pi pi-lock mr-2"></i>
                            <span>Bu QR kod firmanıza özeldir ve kalıcıdır</span>
                        </div>
                        <div class="polling-indicator mt-3">
                            <div class="pulse-dot"></div>
                            <span>Tarama bekleniyor...</span>
                        </div>
                        <Button
                            label="QR Kodu İndir (PDF)"
                            icon="pi pi-download"
                            severity="secondary"
                            outlined
                            class="mt-4 download-btn"
                            @click="downloadQRAsPDF"
                        />
                    </div>
                </div>

                <div class="instructions-card mt-4">
                    <h4 class="mb-3">📱 Nasıl Kullanılır?</h4>
                    <ol class="instruction-list">
                        <li>Bu QR kodu yazdırın veya ekranda gösterin</li>
                        <li>Müşteriniz mobil uygulamadan QR kodu taratsın</li>
                        <li>Tarama algılandığında kampanya seçim ekranı açılır</li>
                        <li>Kampanyayı seçip onaylayın</li>
                        <li>Damga/puan otomatik güncellenir</li>
                    </ol>
                </div>
            </div>
        </div>

        <!-- Campaign Selection Dialog -->
        <Dialog v-model:visible="showSelectionDialog" header="Kampanya Onaylama" :style="{ width: '500px' }" modal @hide="onDialogHide">
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

        <!-- Gift Redemption Dialog -->
        <Dialog v-model:visible="showGiftDialog" header="Hediye Teslim Onayı" :style="{ width: '500px' }" modal @hide="onDialogHide">
            <div class="p-4 pt-0 text-center">
                <div v-if="customer" class="mb-4">
                    <i class="pi pi-user text-4xl text-primary mb-2"></i>
                    <h2 class="text-xl font-bold m-0">{{ customer.name }} {{ customer.surname }}</h2>
                    <p class="text-secondary m-0">{{ customer.email }}</p>
                </div>

                <div class="surface-card border-1 surface-border border-round-xl p-4 shadow-1 mb-4">
                    <p class="text-500 font-medium mb-2 uppercase text-xs tracking-widest">TESLİM EDİLECEK ÜRÜN</p>
                    <p class="text-900 font-bold text-2xl m-0 mb-3 text-primary">{{ giftRedemption?.title }}</p>
                    
                    <div v-if="giftRedemption?.type === 'GIFT_ENTITLEMENT'" 
                         class="inline-flex align-items-center px-3 py-1 border-round-2xl text-sm font-bold bg-purple-100 text-purple-700">
                        <i class="pi pi-gift mr-2"></i>
                        Hediye Hakkı Kullanımı
                    </div>
                    <div v-else 
                         class="inline-flex align-items-center px-3 py-1 border-round-2xl text-sm font-bold bg-orange-100 text-orange-700">
                        <i class="pi pi-star-fill mr-2"></i>
                        -{{ giftRedemption?.pointCost }} Puan
                    </div>
                </div>

                <p class="text-600 line-height-3 m-0">
                    Bu işlemi onayladığınızda müşteriden ilgili tutar/hak düşülecek ve işlem tamamlanacaktır.
                </p>
            </div>
            <template #footer>
                <Button label="Reddet" icon="pi pi-times" severity="danger" text @click="showGiftDialog = false" :disabled="confirming" />
                <Button label="Teslim Et ve Onayla" icon="pi pi-check-circle" severity="success" @click="confirmGiftRedemption" :loading="confirming" />
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

.firm-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1.25rem;
    background: var(--primary-color);
    color: var(--primary-color-text);
    border-radius: 20px;
    font-size: 0.95rem;
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

.polling-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.85rem;
}

.pulse-dot {
    width: 10px;
    height: 10px;
    background: var(--green-500);
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.3); }
    100% { opacity: 1; transform: scale(1); }
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
