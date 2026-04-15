<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useAuthStore } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL;

const toast = useToast();
const authStore = useAuthStore();
const router = useRouter();
let pollingErrorCount = 0;
const qrDataUrl = ref('');
const loading = ref(true);
const staticQRToken = ref('');
const companyName = ref('');
const showEntryDialog = ref(false);
const showGiftDialog = ref(false);
const customer = ref<any>(null);
const customerBusiness = ref<any>(null);
const giftRedemption = ref<any>(null);
const stampCount = ref<number>(1);
const purchaseAmount = ref<number>(0);
const confirming = ref(false);
const qrTokenId = ref('');
const pollToken = ref('');
const noQR = ref(false);
const generatingQR = ref(false);
let statusPollingInterval: number | null = null;

const resolveImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Raw base64 (no data: prefix) — Flutter sends base64Encode(bytes) without prefix
    if (path.length > 100 && !path.includes('/') && !path.includes('.')) {
        return `data:image/jpeg;base64,${path}`;
    }

    const base = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
    let cleanPath = path;

    if (!cleanPath.includes('/')) {
        cleanPath = `/uploads/${cleanPath}`;
    } else {
        cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    return `${base}${cleanPath}`;
};

// Computed: points to be earned from purchase
const calculatedPoints = computed(() => {
    return Math.floor((purchaseAmount.value || 0) * 0.10);
});

// Fetch the firm's permanent static QR
const fetchStaticQR = async () => {
    loading.value = true;
    noQR.value = false;
    try {
        const businessId = authStore.user?.businessId;
        if (!businessId) {
            throw new Error('Business ID bulunamadı');
        }

        const response = await fetch(`${API_URL}/firms/${businessId}/qr`, {
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
        const response = await fetch(`${API_URL}/firms/${businessId}/generate-qr`, {
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
        try {
            // Dialog açıkken mevcut token'ın müşteri tarafından iptal edilip edilmediğini kontrol et
            if ((showEntryDialog.value || showGiftDialog.value) && pollToken.value) {
                const statusRes = await fetch(`${API_URL}/qr/status/${pollToken.value}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.status === 'cancelled') {
                        showEntryDialog.value = false;
                        showGiftDialog.value = false;
                        qrTokenId.value = '';
                        pollToken.value = '';
                        toast.add({ severity: 'warn', summary: 'İptal Edildi', detail: 'İşlem müşteri tarafından iptal edildi.', life: 4000 });
                    }
                }
                return;
            }

            const response = await fetch(`${API_URL}/qr/poll-static`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // 401 = token expired → logout and redirect to login
            if (response.status === 401) {
                console.warn('poll-static 401: token expired, redirecting to login');
                stopPolling();
                authStore.logout();
                router.push('/login');
                return;
            }

            if (!response.ok) {
                pollingErrorCount++;
                if (pollingErrorCount >= 5) {
                    console.error('poll-static repeated errors:', response.status);
                    toast.add({ severity: 'warn', summary: 'Bağlantı Sorunu', detail: 'Tarama dinleme hatası. Sayfayı yenileyin.', life: 5000 });
                    pollingErrorCount = 0;
                }
                return;
            }

            pollingErrorCount = 0;
            const data = await response.json();

            if (data.status === 'scanned') {
                customer.value = data.customer;
                qrTokenId.value = data.qrTokenId;
                pollToken.value = data.pollToken || '';

                // Check scan type: Gift Redemption vs Normal
                if (data.scanType === 'gift_redemption') {
                    giftRedemption.value = data.giftRedemption;
                    showGiftDialog.value = true;
                } else {
                    // Normal scan — show stamp/point entry dialog
                    customerBusiness.value = data.customerBusiness || {
                        stamps: 0, stampsTarget: 6, giftsCount: 0, points: 0, totalVisits: 0
                    };
                    stampCount.value = 1;
                    purchaseAmount.value = 0;
                    showEntryDialog.value = true;
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

const confirmEntry = async () => {
    confirming.value = true;

    if (!qrTokenId.value) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'QR Token ID bulunamadı.', life: 3000 });
        confirming.value = false;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/qr/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                qrTokenId: qrTokenId.value,
                customerId: customer.value._id,
                stampCount: stampCount.value,
                purchaseAmount: purchaseAmount.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Onaylama başarısız');
        }

        const pts = calculatedPoints.value;
        const stmps = stampCount.value;
        let msg = '';
        if (stmps > 0 && pts > 0) msg = `${stmps} damga + ${pts} puan eklendi`;
        else if (stmps > 0) msg = `${stmps} damga eklendi`;
        else if (pts > 0) msg = `${pts} puan eklendi`;
        else msg = 'İşlem onaylandı';

        toast.add({ severity: 'success', summary: 'Başarılı', detail: msg, life: 3000 });
        qrTokenId.value = '';
        showEntryDialog.value = false;
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
        const response = await fetch(`${API_URL}/gifts/complete-redemption`, {
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
        await fetch(`${API_URL}/qr/cancel`, {
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
        toast.add({ severity: 'error', summary: 'Hata', detail: 'PDF oluşturulamadı', life: 3000 });
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
            <div class="col-12 md:col-10 lg:col-8">
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
                        <li>Tarama algılandığında damga/puan giriş ekranı açılır</li>
                        <li>Damga sayısı ve alışveriş tutarını girin</li>
                        <li>Onaylayın — damga ve puan otomatik güncellenir</li>
                    </ol>
                </div>
            </div>
        </div>

        <!-- Stamp/Point Entry Dialog (replaces old Campaign Selection Dialog) -->
        <Dialog v-model:visible="showEntryDialog" header="Damga & Puan Girişi" :style="{ width: '520px' }" modal @hide="onDialogHide">
            <div class="p-4 pt-0">
                <!-- Customer Info -->
                <div v-if="customer" class="customer-info mb-4 p-3 surface-100 border-round">
                    <div class="flex align-items-center gap-3">
                        <img v-if="customer.profileImage" :src="resolveImageUrl(customer.profileImage)" class="w-3rem h-3rem border-circle object-cover shadow-2" />
                        <i v-else class="pi pi-user text-2xl text-primary p-3 bg-primary-50 border-round-circle"></i>
                        <div>
                            <div class="font-bold text-lg">{{ customer.name }} {{ customer.surname }}</div>
                            <div class="text-secondary text-sm">{{ customer.email }}</div>
                        </div>
                    </div>
                </div>

                <!-- Loyalty Status Cards -->
                <div v-if="customerBusiness" class="loyalty-cards mb-4">
                    <div class="grid">
                        <div class="col-4">
                            <div class="loyalty-card stamps-card">
                                <i class="pi pi-ticket"></i>
                                <div class="loyalty-value">{{ customerBusiness.stamps }}/{{ customerBusiness.stampsTarget }}</div>
                                <div class="loyalty-label">Damga</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="loyalty-card gifts-card">
                                <i class="pi pi-gift"></i>
                                <div class="loyalty-value">{{ customerBusiness.giftsCount }}</div>
                                <div class="loyalty-label">Hediye</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="loyalty-card points-card">
                                <i class="pi pi-star-fill"></i>
                                <div class="loyalty-value">{{ customerBusiness.points }}</div>
                                <div class="loyalty-label">Puan</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stamp Count Input -->
                <div class="mb-3">
                    <label class="block font-bold mb-2">🏷️ Damga Sayısı</label>
                    <InputNumber
                        v-model="stampCount"
                        :min="0"
                        :max="20"
                        showButtons
                        buttonLayout="horizontal"
                        class="w-full"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                    />
                </div>

                <!-- Purchase Amount Input -->
                <div class="mb-3">
                    <label class="block font-bold mb-2">💰 Alışveriş Tutarı (TL)</label>
                    <InputNumber
                        v-model="purchaseAmount"
                        :min="0"
                        mode="currency"
                        currency="TRY"
                        locale="tr-TR"
                        class="w-full"
                    />
                </div>

                <!-- Calculated Points Preview -->
                <div class="points-preview p-3 border-round mb-2">
                    <div class="flex align-items-center justify-content-between">
                        <span class="font-medium">Kazanılacak Puan (10%)</span>
                        <span class="text-xl font-bold text-primary">{{ calculatedPoints }}</span>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="İptal" icon="pi pi-times" text @click="showEntryDialog = false" :disabled="confirming" />
                <Button label="Onayla ✓" icon="pi pi-check" @click="confirmEntry" :loading="confirming" />
            </template>
        </Dialog>

        <!-- Gift Redemption Dialog (unchanged) -->
        <Dialog v-model:visible="showGiftDialog" header="Hediye Teslim Onayı" :style="{ width: '500px' }" modal @hide="onDialogHide">
            <div class="p-4 pt-0 text-center">
                <div v-if="customer" class="mb-4">
                    <img v-if="customer.profileImage" :src="resolveImageUrl(customer.profileImage)" class="w-4rem h-4rem border-circle object-cover shadow-2 mb-2" />
                    <i v-else class="pi pi-user text-4xl text-primary mb-2"></i>
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

/* Loyalty Cards in Dialog */
.loyalty-card {
    text-align: center;
    padding: 0.75rem 0.5rem;
    border-radius: 12px;
    cursor: default;
}

.loyalty-card i {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
    display: block;
}

.loyalty-value {
    font-size: 1.25rem;
    font-weight: 700;
}

.loyalty-label {
    font-size: 0.75rem;
    opacity: 0.8;
    margin-top: 0.15rem;
}

.stamps-card {
    background: #EBF5FF;
    color: #1E6FD9;
}

.gifts-card {
    background: #FFF0F5;
    color: #D63384;
}

.points-card {
    background: #FFF8E1;
    color: #E6A919;
}

.points-preview {
    background: var(--highlight-bg);
    border: 1px solid var(--surface-border);
}
</style>
