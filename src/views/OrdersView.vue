<template>
  <div class="orders-view p-4 md:p-6 fade-in">
    <!-- Header -->
    <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-4">
      <div>
        <h1 class="font-bold text-4xl mb-2 tracking-tight">
          <span class="text-primary mr-2">✦</span>Sipariş Lobisi
        </h1>
        <p class="text-secondary text-lg">Anlık masa durumlarını takip edin.</p>
      </div>
      <div class="flex align-items-center gap-3">
        <!-- Bağlantı göstergesi -->
        <div class="flex align-items-center gap-2 px-3 py-2 border-round-xl surface-ground">
          <div
            class="w-1rem h-1rem border-circle"
            :class="connected ? 'bg-green-500' : 'bg-red-400'"
            style="box-shadow: 0 0 6px currentColor"
          />
          <span class="text-sm font-medium" :class="connected ? 'text-green-600' : 'text-red-500'">
            {{ connected ? 'Canlı' : 'Bağlantı kesik' }}
          </span>
        </div>
        <!-- Geçmiş toggle -->
        <Button
          :label="showHistory ? 'Aktif Masalar' : 'Geçmiş'"
          :icon="showHistory ? 'pi pi-bolt' : 'pi pi-history'"
          class="p-button-outlined border-round-xl"
          @click="toggleHistory"
        />
      </div>
    </div>

    <!-- ===== AKTİF LOBİ ===== -->
    <template v-if="!showHistory">
      <div v-if="loading" class="flex justify-content-center align-items-center p-8 card shadow-1" style="min-height: 300px">
        <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
      </div>

      <div v-else-if="activeOrders.length === 0" class="flex flex-column align-items-center justify-content-center p-8 card shadow-1 text-center" style="min-height: 320px">
        <div class="bg-primary-50 border-circle w-6rem h-6rem flex align-items-center justify-content-center mb-4 shadow-1">
          <i class="pi pi-receipt text-primary text-5xl"></i>
        </div>
        <h3 class="font-bold text-2xl mb-2">Şu an açık masa yok</h3>
        <p class="text-secondary">Bir müşteri QR okutunca buraya anlık düşecek.</p>
      </div>

      <div v-else class="grid">
        <div v-for="order in activeOrders" :key="order._id || order._tempId" class="col-12 md:col-6 xl:col-4">
          <div
            class="card border-round-2xl shadow-2 p-0 overflow-hidden cursor-pointer"
            style="border-left: 4px solid var(--primary-color); transition: transform 0.15s, box-shadow 0.15s"
            @click="openDetail(order)"
            @mouseenter="($event.currentTarget as HTMLElement).style.transform='translateY(-2px)'; ($event.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.transform=''; ($event.currentTarget as HTMLElement).style.boxShadow=''"
          >

            <!-- Masa başlığı -->
            <div class="flex justify-content-between align-items-center px-4 pt-4 pb-3">
              <div class="flex align-items-center gap-3">
                <div class="bg-primary-50 border-circle w-3rem h-3rem flex align-items-center justify-content-center shadow-1">
                  <i class="pi pi-table text-primary text-xl"></i>
                </div>
                <div>
                  <div class="font-bold text-xl">{{ order.table?.name || `Masa ${order.table?.tableNumber}` }}</div>
                  <div class="text-secondary text-sm">{{ formatTime(order.createdAt) }}'dan beri açık</div>
                </div>
              </div>
              <!-- Badge alanı -->
              <div class="flex align-items-center gap-2">
                <!-- Yeni sipariş badge'i -->
                <Transition name="pop">
                  <div
                    v-if="newOrderCounts[order._id]"
                    class="new-order-badge flex align-items-center gap-1 px-3 py-1 border-round-2xl font-bold text-white text-xs cursor-pointer"
                    @click.stop="onBadgeClick(order)"
                    v-tooltip.top="'Tıkla → Sipariş Detayı'"
                  >
                    <i class="pi pi-bell badge-bell" style="font-size:12px"></i>
                    <span>+{{ newOrderCounts[order._id] }} yeni sipariş</span>
                  </div>
                </Transition>
                <!-- Canlı badge -->
                <div class="flex align-items-center gap-1 px-2 py-1 border-round-xl" style="background: rgba(34,197,94,0.1)">
                  <div class="border-circle bg-green-500 live-dot" style="width:8px;height:8px"></div>
                  <span class="text-xs font-bold text-green-600">CANLI</span>
                </div>
              </div>
            </div>

            <!-- İstatistikler -->
            <div class="grid mx-0 px-3 pb-3 gap-2">
              <div class="col surface-ground border-round-xl p-3 text-center">
                <div class="text-2xl font-bold text-primary">{{ order.tableSession?.participants?.length || 0 }}</div>
                <div class="text-xs text-secondary mt-1">Kişi</div>
              </div>
              <div class="col surface-ground border-round-xl p-3 text-center">
                <div class="text-2xl font-bold text-primary">{{ itemCount(order) }}</div>
                <div class="text-xs text-secondary mt-1">Ürün</div>
              </div>
              <div class="col surface-ground border-round-xl p-3 text-center">
                <div class="text-lg font-bold text-primary">{{ formatCurrency(order.totalAmount) }}</div>
                <div class="text-xs text-secondary mt-1">Toplam</div>
              </div>
            </div>

            <!-- Son sipariş özeti -->
            <div v-if="order.items && order.items.length" class="px-4 pb-2">
              <div class="text-xs text-secondary font-bold mb-2 uppercase">Sipariş Özeti</div>
              <div class="flex flex-column gap-1">
                <div
                  v-for="item in order.items.slice(0, 4)"
                  :key="item._id"
                  class="flex justify-content-between text-sm"
                >
                  <span class="text-color">{{ item.name }} × {{ item.quantity }}</span>
                  <span class="font-semibold text-primary">{{ formatCurrency(item.price * item.quantity) }}</span>
                </div>
                <div v-if="order.items.length > 4" class="text-xs text-secondary text-center mt-1">
                  +{{ order.items.length - 4 }} ürün daha...
                </div>
              </div>
            </div>

            <!-- Katılımcılar -->
            <div v-if="order.tableSession?.participants?.length" class="px-4 pb-3">
              <div class="text-xs text-secondary font-bold mb-2 uppercase">Katılımcılar</div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="p in order.tableSession.participants"
                  :key="p.displayName"
                  class="flex align-items-center gap-1 px-2 py-1 border-round-xl surface-ground text-sm"
                >
                  <i class="pi pi-user text-xs text-secondary"></i>
                  <span>{{ p.displayName }}</span>
                </div>
              </div>
            </div>

            <!-- Aksiyonlar -->
            <div class="flex gap-2 px-4 pb-4">
              <Button
                label="Detay"
                icon="pi pi-eye"
                outlined
                class="flex-1 p-button-sm border-round-lg"
                @click.stop="openDetail(order)"
              />
              <Button
                label="Hesap Ödendi · Boşalt"
                icon="pi pi-check-circle"
                severity="success"
                class="flex-1 p-button-sm border-round-lg font-bold"
                :loading="clearingId === order._id"
                @click.stop="payAndClear(order)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== GEÇMİŞ ===== -->
    <template v-else>
      <div v-if="loadingHistory" class="flex justify-content-center p-8">
        <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
      </div>
      <div v-else-if="historyOrders.length === 0" class="flex flex-column align-items-center justify-content-center p-8 card shadow-1 text-center" style="min-height:300px">
        <i class="pi pi-history text-5xl text-secondary mb-4"></i>
        <h3 class="font-bold text-2xl">Geçmiş sipariş yok</h3>
      </div>
      <div v-else class="card border-round-2xl shadow-1 overflow-hidden">
        <!-- History tab header with PDF export button -->
        <div class="flex justify-content-between align-items-center px-4 pt-4 pb-2">
          <span class="font-bold text-lg">Geçmiş Siparişler</span>
          <Button
            label="Rapor İndir"
            icon="pi pi-chart-bar"
            class="p-button-outlined border-round-xl"
            @click="openAnalyticsDialog"
          />
        </div>
        <DataTable :value="historyOrders" :paginator="true" :rows="15" dataKey="_id" :rowHover="true">
          <Column header="Masa" field="table.tableNumber">
            <template #body="{ data }">
              <span class="font-bold">{{ data.table?.name || `Masa ${data.table?.tableNumber}` }}</span>
            </template>
          </Column>
          <Column header="Tutar">
            <template #body="{ data }">
              <span class="font-bold text-primary">{{ formatCurrency(data.totalAmount) }}</span>
            </template>
          </Column>
          <Column header="Durum">
            <template #body="{ data }">
              <Tag :value="data.status === 'paid' ? 'Ödendi' : 'İptal'" :severity="data.status === 'paid' ? 'success' : 'danger'" />
            </template>
          </Column>
          <Column header="Tarih">
            <template #body="{ data }">
              <span class="text-secondary text-sm">{{ formatDate(data.updatedAt) }}</span>
            </template>
          </Column>
          <Column header="">
            <template #body="{ data }">
              <div class="flex align-items-center gap-1">
                <Button icon="pi pi-eye" text rounded @click="openDetail(data)" v-tooltip.top="'Detay'" />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  v-tooltip.top="'Sil'"
                  :loading="deletingOrderId === data._id"
                  @click="confirmDeleteHistory(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <!-- ===== DELETE CONFIRMATION DIALOG ===== -->
    <Dialog
      v-model:visible="showDeleteConfirm"
      modal
      header="Siparişi Sil"
      :style="{ width: '400px' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="flex flex-column gap-3">
        <div class="flex align-items-center gap-3">
          <div class="bg-red-50 border-circle w-3rem h-3rem flex align-items-center justify-content-center flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
          </div>
          <div>
            <p class="font-semibold text-lg mb-1">Bu siparişi silmek istediğinize emin misiniz?</p>
            <p class="text-secondary text-sm">Bu işlem geri alınamaz.</p>
          </div>
        </div>
        <div class="flex gap-2 justify-content-end mt-2">
          <Button label="Vazgeç" outlined class="border-round-lg" @click="showDeleteConfirm = false" />
          <Button
            label="Sil"
            icon="pi pi-trash"
            severity="danger"
            class="border-round-lg"
            :loading="deletingOrderId !== null"
            @click="deleteHistoryOrder"
          />
        </div>
      </div>
    </Dialog>

    <!-- ===== ANALYTICS / PDF DIALOG ===== -->
    <Dialog
      v-model:visible="showAnalyticsDialog"
      modal
      header="Sipariş Analiz Raporu"
      :style="{ width: '480px' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="flex flex-column gap-4">
        <!-- Period shortcuts -->
        <div>
          <div class="text-sm font-bold mb-2 text-secondary uppercase">Hızlı Dönem</div>
          <div class="flex gap-2 flex-wrap">
            <Button label="Bu Ay" size="small" outlined class="border-round-xl" @click="setAnalyticsPeriod('thisMonth')" />
            <Button label="Son 30 Gün" size="small" outlined class="border-round-xl" @click="setAnalyticsPeriod('last30')" />
            <Button label="Bu Yıl" size="small" outlined class="border-round-xl" @click="setAnalyticsPeriod('thisYear')" />
          </div>
        </div>

        <!-- Date range -->
        <div class="grid">
          <div class="col-6">
            <label class="text-sm font-semibold block mb-1">Başlangıç</label>
            <Calendar
              v-model="analyticsFrom"
              dateFormat="dd.mm.yy"
              showIcon
              class="w-full"
              :maxDate="analyticsTo"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-semibold block mb-1">Bitiş</label>
            <Calendar
              v-model="analyticsTo"
              dateFormat="dd.mm.yy"
              showIcon
              class="w-full"
              :minDate="analyticsFrom"
            />
          </div>
        </div>

        <!-- Generate button -->
        <Button
          label="Raporu Oluştur"
          icon="pi pi-file-pdf"
          class="w-full border-round-xl font-bold"
          :loading="generatingPdf"
          @click="generatePdf"
        />
      </div>
    </Dialog>

    <!-- ===== DETAY DIALOG ===== -->
    <Dialog
      v-model:visible="showDetail"
      modal
      :header="`${selectedOrder?.table?.name || `Masa ${selectedOrder?.table?.tableNumber}`} — Sipariş Detayı`"
      :style="{ width: '560px' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div v-if="detailData" class="flex flex-column gap-4">
        <!-- Kişi bazlı -->
        <div>
          <div class="flex justify-content-between align-items-center mb-3">
            <div class="font-bold text-lg">Kişi Bazlı Döküm</div>
            <!-- Toplu onayla butonu -->
            <Button
              v-if="detailData.order.status === 'active' && hasPendingItems"
              label="Tümünü Onayla"
              icon="pi pi-check-circle"
              severity="info"
              size="small"
              class="border-round-lg"
              :loading="bulkConfirming"
              @click="confirmAll"
            />
          </div>

          <!-- Henüz sipariş yok -->
          <div v-if="!detailData.perPerson || detailData.perPerson.every((p: any) => !p.items?.length)" class="flex flex-column align-items-center py-4">
            <i class="pi pi-shopping-cart text-4xl text-secondary mb-3" style="opacity:0.3"></i>
            <span class="text-secondary">Henüz sipariş eklenmemiş.</span>
            <span class="text-xs text-secondary mt-1">Müşteriler menüden ürün ekleyince burada görünecek.</span>
          </div>
          <div v-for="person in detailData.perPerson" :key="person.name" class="mb-4">
            <div class="flex justify-content-between align-items-center mb-2">
              <div class="flex align-items-center gap-2">
                <div class="bg-primary-50 border-circle w-2rem h-2rem flex align-items-center justify-content-center">
                  <i class="pi pi-user text-primary text-sm"></i>
                </div>
                <span class="font-semibold">{{ person.name }}</span>
              </div>
              <span class="font-bold text-primary text-lg">{{ formatCurrency(person.total) }}</span>
            </div>
            <div
              v-for="item in person.items"
              :key="item._id || (item.name + item.quantity)"
              class="flex justify-content-between align-items-center pl-4 mb-2 py-2 border-round-lg"
              :class="itemRowClass(item.itemStatus)"
              :style="item.itemStatus === 'cancelled' ? 'opacity:0.5' : ''"
            >
              <div class="flex flex-column">
                <span
                  class="text-sm font-medium"
                  :class="item.itemStatus === 'cancelled' ? 'text-secondary line-through' : 'text-color'"
                >{{ item.name }} × {{ item.quantity }}</span>
                <span class="text-xs text-secondary">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
              <div class="flex align-items-center gap-2">
                <!-- Status badge -->
                <Tag
                  :value="statusLabel(item.itemStatus)"
                  :severity="statusSeverity(item.itemStatus)"
                  class="text-xs"
                />
                <!-- Durum butonları (sadece aktif siparişlerde, iptal edilmemişler) -->
                <template v-if="detailData.order._id && detailData.order.status === 'active' && item.itemStatus !== 'cancelled'">
                  <Button
                    v-if="!item.itemStatus || item.itemStatus === 'pending'"
                    icon="pi pi-check"
                    severity="info"
                    text rounded size="small"
                    v-tooltip.top="'Onayla'"
                    :loading="updatingItemId === item._id"
                    @click="updateItemStatus(item._id, 'confirmed')"
                  />
                  <Button
                    v-if="item.itemStatus === 'confirmed'"
                    icon="pi pi-sync"
                    severity="warning"
                    text rounded size="small"
                    v-tooltip.top="'Hazırlanıyor'"
                    :loading="updatingItemId === item._id"
                    @click="updateItemStatus(item._id, 'preparing')"
                  />
                  <Button
                    v-if="item.itemStatus === 'preparing'"
                    icon="pi pi-send"
                    severity="success"
                    text rounded size="small"
                    v-tooltip.top="'Teslim Edildi'"
                    :loading="updatingItemId === item._id"
                    @click="updateItemStatus(item._id, 'delivered')"
                  />
                  <!-- İptal butonu: teslim edilmediyse her durumda görünür -->
                  <Button
                    v-if="item.itemStatus !== 'delivered'"
                    icon="pi pi-times"
                    severity="danger"
                    text rounded size="small"
                    v-tooltip.top="'İptal Et'"
                    :loading="cancellingItemId === item._id"
                    @click="cancelItem(item._id, item.name)"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>
        <Divider />
        <div class="flex justify-content-between align-items-center">
          <span class="font-bold text-xl">Genel Toplam</span>
          <span class="font-bold text-primary text-2xl">{{ formatCurrency(detailData.order.totalAmount) }}</span>
        </div>

        <!-- Ödeme butonu (sadece aktif) -->
        <div v-if="detailData.order.status === 'active' && detailData.order._id" class="mt-2">
          <Button
            label="Hesap Ödendi · Masayı Boşalt"
            icon="pi pi-check-circle"
            severity="success"
            class="w-full border-round-lg font-bold"
            :loading="clearingId === detailData.order._id"
            @click="payAndClear(detailData.order); showDetail = false"
          />
        </div>
      </div>
      <div v-else class="flex justify-content-center p-4">
        <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
      </div>
    </Dialog>

    <Toast />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../stores/auth.store';
import { io, Socket } from 'socket.io-client';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import api from '../services/api';
import { exportPdf } from '../services/export.service';
import type { PdfSection } from '../services/export.service';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

// AudioContext module-level'da tutulur — Vue Proxy'sinden kaçınmak için
// (Vue 3 reaktivitesi native Web Audio API nesnelerini bozuyor)
let _audioCtx: AudioContext | null = null;
let _audioUnlocked = false;

function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _audioCtx;
}

function unlockAudio() {
  if (_audioUnlocked) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => { _audioUnlocked = true; }).catch(() => {});
    } else {
      _audioUnlocked = true;
    }
    // Sessiz warmup — kanalı 'ısıtır'
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(ctx.currentTime + 0.001);
  } catch (_) {}
}

function playBeep() {
  try {
    const ctx = getAudioCtx();
    const play = () => {
      const now = ctx.currentTime;
      ([[1046.50, 0], [1318.51, 0.12]] as [number, number][]).forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(0.55, now + delay + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.5);
      });
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch (_) {}
}

export default defineComponent({
  name: 'OrdersView',
  components: { Button, Dialog, Tag, Divider, Toast, DataTable, Column, Calendar },
  setup() {
    const toast = useToast();
    const authStore = useAuthStore();
    return { toast, authStore };
  },
  data() {
    return {
      activeOrders: [] as any[],
      historyOrders: [] as any[],
      loading: true,
      loadingHistory: false,
      showHistory: false,
      clearingId: null as string | null,
      showDetail: false,
      selectedOrder: null as any,
      detailData: null as any,
      connected: false,
      socket: null as Socket | null,
      newOrderCounts: {} as Record<string, number>,
      updatingItemId: null as string | null,
      cancellingItemId: null as string | null,
      bulkConfirming: false,
      // Delete history
      showDeleteConfirm: false,
      orderToDelete: null as any,
      deletingOrderId: null as string | null,
      // Analytics / PDF
      showAnalyticsDialog: false,
      analyticsFrom: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })(),
      analyticsTo: new Date(),
      generatingPdf: false,
    };
  },
  computed: {
    hasPendingItems(): boolean {
      if (!this.detailData?.perPerson) return false;
      return this.detailData.perPerson.some((p: any) =>
        p.items?.some((i: any) => !i.itemStatus || i.itemStatus === 'pending')
      );
    }
  },
  async mounted() {
    await this.fetchActive();
    this.connectSocket();
    // İlk kullanıcı etkileşiminde AudioContext'i unlock et
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
  },
  beforeUnmount() {
    this.disconnectSocket();
  },
  methods: {
    // ---- Socket.io ----
    connectSocket() {
      const businessId = this.authStore.user?.businessId;
      if (!businessId || !SOCKET_URL) return;

      this.socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

      this.socket.on('connect', () => {
        this.connected = true;
        this.socket!.emit('join_business', businessId);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });

      // Yeni masa açıldı → direkt lobiye ekle (Order oluşmamış olsa bile)
      this.socket.on('session_opened', (data: any) => {
        // Zaten listede var mı kontrol et
        const exists = this.activeOrders.some(
          o => String(o.tableSession?._id) === String(data.sessionId)
        );
        if (!exists) {
          // Placeholder entry oluştur (Order yokken de masayı göstersin)
          this.activeOrders.unshift({
            _tempId: `temp_${data.sessionId}`,
            _id: null,
            table: { _id: data.tableId, tableNumber: data.tableNumber, name: data.tableName },
            tableSession: { _id: data.sessionId, participants: data.participants || [], createdAt: new Date().toISOString() },
            items: [],
            totalAmount: data.totalAmount || 0,
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }
        // Yedek olarak HTTP'den de çek (Order oluşmuşsa gerçek veriyle değiştir)
        setTimeout(() => this.fetchActive(), 2000);
      });

      // Katılımcı katıldı → ilgili order'ın participant listesini güncelle
      this.socket.on('session_participant_joined', (data: any) => {
        const idx = this.activeOrders.findIndex(o => String(o.tableSession?._id) === String(data.sessionId));
        if (idx >= 0 && this.activeOrders[idx]?.tableSession) {
          // Tüm objeyi yeni referansla replace et → Vue 3 reactivity kesin algılar
          this.activeOrders[idx] = {
            ...this.activeOrders[idx],
            tableSession: {
              ...this.activeOrders[idx].tableSession,
              participants: data.participants,
            },
          };
        }
      });

      // Kullanıcı sepetini gönderdi → ilgili kartın üstünde badge artır + verileri güncelle
      this.socket.on('order_submitted', (data: any) => {
        // 🔔 Zil sesi çal
        this.playNotificationSound();

        // Placeholder varsa _id'yi hemen güncelle (key hesabından ÖNCE)
        let order = this.activeOrders.find(
          o => String(o.tableSession?._id) === String(data.sessionId) ||
               String(o._id) === String(data.orderId)
        );
        if (order && !order._id && data.orderId) {
          order._id = data.orderId;
        }

        // Badge key olarak her zaman gerçek orderId'yi kullan
        // (placeholder _tempId değil — fetchActive sonrası da tutarlı kalır)
        const badgeKey = data.orderId || order?._tempId;
        if (badgeKey) {
          this.newOrderCounts[badgeKey] = (this.newOrderCounts[badgeKey] || 0) + 1;
        }

        // Veriyi güncelle (order oluşmuş olabilir)
        this.fetchActive();
      });

      // Sipariş güncellendi → tutar/adet güncelle
      this.socket.on('order_updated', (data: any) => {
        const order = this.activeOrders.find(
          o => String(o.tableSession?._id) === String(data.sessionId) || String(o._id) === String(data.orderId)
        );
        if (order) {
          order.totalAmount = data.totalAmount;
          // itemCount sadece gösterim için: items array'i yok elimizde, re-fetch'e gerek yok
          order._liveItemCount = data.itemCount;
        }
      });

      // Masa boşaltıldı → listeden kaldır
      this.socket.on('session_closed', (data: any) => {
        this.activeOrders = this.activeOrders.filter(
          o => String(o.tableSession?._id) !== String(data.sessionId)
        );
        if (this.selectedOrder && String(this.selectedOrder.tableSession?._id) === String(data.sessionId)) {
          this.showDetail = false;
        }
      });
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },

    // ---- Data ----
    async fetchActive() {
      try {
        const res = await api.get('/orders/business/active');
        const realOrders = res.data;

        // Placeholder → gerçek order geçişinde badge count'u taşı
        for (const placeholder of this.activeOrders.filter(o => !o._id && o._tempId)) {
          const realMatch = realOrders.find((r: any) =>
            String(r.tableSession?._id) === String(placeholder.tableSession?._id)
          );
          if (realMatch && placeholder._tempId && this.newOrderCounts[placeholder._tempId]) {
            // _tempId altındaki count'u gerçek orderId'ye taşı
            const tempCount = this.newOrderCounts[placeholder._tempId] ?? 0;
            this.newOrderCounts[realMatch._id] = (this.newOrderCounts[realMatch._id] || 0) + tempCount;
            delete this.newOrderCounts[placeholder._tempId];
          }
        }

        // Placeholder masaları koru (henüz Order oluşmamış olanlar)
        const placeholders = this.activeOrders.filter(o =>
          !o._id && o._tempId &&
          !realOrders.some((r: any) => String(r.tableSession?._id) === String(o.tableSession?._id))
        );

        this.activeOrders = [...realOrders, ...placeholders];
      } catch {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: 'Siparişler yüklenemedi.', life: 3000 });
      } finally {
        this.loading = false;
      }
    },

    async fetchHistory() {
      this.loadingHistory = true;
      try {
        const res = await api.get('/orders/business/history');
        this.historyOrders = res.data.orders;
      } catch {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: 'Geçmiş yüklenemedi.', life: 3000 });
      } finally {
        this.loadingHistory = false;
      }
    },

    async toggleHistory() {
      this.showHistory = !this.showHistory;
      if (this.showHistory) await this.fetchHistory();
    },

    async openDetail(order: any) {
      this.selectedOrder = order;
      this.detailData = null;
      this.showDetail = true;

      // Placeholder masa (henüz Order yok)
      if (!order._id) {
        this.detailData = {
          order: { ...order, totalAmount: 0, status: 'active' },
          perPerson: (order.tableSession?.participants || []).map((p: any) => ({
            name: p.displayName || 'Misafir',
            total: 0,
            items: []
          }))
        };
        return;
      }

      try {
        const res = await api.get(`/orders/business/${order._id}`);
        this.detailData = res.data;
      } catch {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: 'Detay yüklenemedi.', life: 3000 });
      }
    },

    // Badge tıklanınca detay aç + badge'i temizle
    clearBadge(orderId: string) {
      delete this.newOrderCounts[orderId];
    },

    onBadgeClick(order: any) {
      this.clearBadge(order._id || order._tempId);
      this.openDetail(order);
    },

    playNotificationSound() {
      playBeep();
    },

    async payAndClear(order: any) {
      // Placeholder masa (henüz sipariş yok) → sadece kaldır
      if (!order._id) {
        this.activeOrders = this.activeOrders.filter(o => (o._id || o._tempId) !== (order._id || order._tempId));
        this.toast.add({ severity: 'info', summary: 'Bilgi', detail: 'Masa kaldırıldı (sipariş yoktu).', life: 3000 });
        return;
      }

      this.clearingId = order._id;
      try {
        await api.post(`/orders/business/${order._id}/pay-and-clear`, {});
        // Socket eventi zaten listeyi güncelleyecek; fallback olarak manuel kaldır
        this.activeOrders = this.activeOrders.filter(o => o._id !== order._id);
        delete this.newOrderCounts[order._id];
        this.toast.add({ severity: 'success', summary: 'Tamamlandı', detail: 'Hesap ödendi, masa boşaltıldı.', life: 3000 });
      } catch (e: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'İşlem başarısız.', life: 3000 });
      } finally {
        this.clearingId = null;
      }
    },

    // ---- Helpers ----
    itemCount(order: any) {
      if (order._liveItemCount !== undefined) return order._liveItemCount;
      return (order.items || []).reduce((s: number, i: any) => s + i.quantity, 0);
    },

    formatCurrency(val: number) {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
    },

    formatTime(date: string) {
      return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    },

    formatDate(date: string) {
      return new Date(date).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    },

    // ---- Item Status ----
    statusLabel(status: string) {
      const map: Record<string, string> = {
        pending: 'Bekliyor',
        confirmed: 'Onaylandı',
        preparing: 'Hazırlanıyor',
        delivered: 'Teslim Edildi',
        cancelled: 'İptal Edildi',
      };
      return map[status] || map.pending;
    },

    statusSeverity(status: string) {
      const map: Record<string, string> = {
        pending: 'warning',
        confirmed: 'info',
        preparing: 'warning',
        delivered: 'success',
        cancelled: 'danger',
      };
      return map[status] || 'warning';
    },

    itemRowClass(status: string) {
      const map: Record<string, string> = {
        pending: 'surface-ground',
        confirmed: '',
        preparing: '',
        delivered: 'bg-green-50',
        cancelled: 'bg-red-50',
      };
      return map[status] || 'surface-ground';
    },

    async cancelItem(itemId: string, itemName: string) {
      if (!this.detailData?.order?._id) return;
      this.cancellingItemId = itemId;
      try {
        await api.patch(`/orders/business/${this.detailData.order._id}/items/${itemId}/status`, { status: 'cancelled' });
        const res = await api.get(`/orders/business/${this.detailData.order._id}`);
        this.detailData = res.data;
        this.toast.add({ severity: 'warn', summary: 'İptal Edildi', detail: `"${itemName}" siparişten çıkarıldı.`, life: 2500 });
      } catch (e: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'İptal başarısız.', life: 3000 });
      } finally {
        this.cancellingItemId = null;
      }
    },

    async updateItemStatus(itemId: string, status: string) {
      if (!this.detailData?.order?._id) return;
      this.updatingItemId = itemId;
      try {
        await api.patch(`/orders/business/${this.detailData.order._id}/items/${itemId}/status`, { status });
        // Detayı yenile
        const res = await api.get(`/orders/business/${this.detailData.order._id}`);
        this.detailData = res.data;
        this.toast.add({ severity: 'success', summary: 'Güncellendi', detail: `Ürün: ${this.statusLabel(status)}`, life: 2000 });
      } catch (e: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'Durum güncellenemedi.', life: 3000 });
      } finally {
        this.updatingItemId = null;
      }
    },

    async confirmAll() {
      if (!this.detailData?.order?._id) return;
      this.bulkConfirming = true;
      try {
        const res = await api.post(`/orders/business/${this.detailData.order._id}/confirm-all`, {});
        // Detayı yenile
        const detailRes = await api.get(`/orders/business/${this.detailData.order._id}`);
        this.detailData = detailRes.data;
        this.toast.add({ severity: 'success', summary: 'Onaylandı', detail: res.data.message, life: 2000 });
      } catch (e: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'Toplu onay başarısız.', life: 3000 });
      } finally {
        this.bulkConfirming = false;
      }
    },

    // ---- Delete History Order ----
    confirmDeleteHistory(order: any) {
      this.orderToDelete = order;
      this.showDeleteConfirm = true;
    },

    async deleteHistoryOrder() {
      if (!this.orderToDelete?._id) return;
      this.deletingOrderId = this.orderToDelete._id;
      try {
        await api.delete(`/orders/business/history/${this.orderToDelete._id}`);
        this.historyOrders = this.historyOrders.filter((o: any) => o._id !== this.orderToDelete._id);
        this.showDeleteConfirm = false;
        this.orderToDelete = null;
        this.toast.add({ severity: 'success', summary: 'Silindi', detail: 'Sipariş başarıyla silindi.', life: 2500 });
      } catch (e: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'Sipariş silinemedi.', life: 3000 });
      } finally {
        this.deletingOrderId = null;
      }
    },

    // ---- Analytics / PDF ----
    openAnalyticsDialog() {
      this.showAnalyticsDialog = true;
    },

    setAnalyticsPeriod(period: string) {
      const now = new Date();
      if (period === 'thisMonth') {
        this.analyticsFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        this.analyticsTo = new Date();
      } else if (period === 'last30') {
        const from = new Date();
        from.setDate(from.getDate() - 30);
        this.analyticsFrom = from;
        this.analyticsTo = new Date();
      } else if (period === 'thisYear') {
        this.analyticsFrom = new Date(now.getFullYear(), 0, 1);
        this.analyticsTo = new Date();
      }
    },

    async generatePdf() {
      this.generatingPdf = true;
      try {
        // Türkiye saat dilimine göre tarih aralığı (YYYY-MM-DD)
        const toTRDateStr = (d: Date) => {
          const tr = new Date(d.getTime() + 3 * 60 * 60 * 1000);
          const y = tr.getUTCFullYear();
          const m = String(tr.getUTCMonth() + 1).padStart(2, '0');
          const day = String(tr.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const from = toTRDateStr(this.analyticsFrom);
        const to = toTRDateStr(this.analyticsTo);

        const res = await api.get(`/orders/business/analytics?from=${from}&to=${to}`);
        const data = res.data;

        const fmt = (n: number) =>
          new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n || 0);
        const fmtDateLong = (d: Date) =>
          d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

        const businessName: string =
          (this.authStore.user as any)?.businessName ||
          (this.authStore.user as any)?.name ||
          'İşletme';

        // ── Bölümler ──────────────────────────────────────────────────
        const sections: PdfSection[] = [];

        // 1. Özet
        sections.push({
          title: '1. Genel Özet',
          headers: ['Gösterge', 'Değer'],
          rows: [
            ['Toplam Ciro',          fmt(data.totalRevenue)],
            ['Toplam Sipariş',       String(data.totalOrders)],
            ['Ortalama Sipariş Tutarı', fmt(data.avgOrderValue)],
            ['Zirve Saat',           data.peakHour || '-'],
            ['Rapor Dönemi',         `${fmtDateLong(this.analyticsFrom)} – ${fmtDateLong(this.analyticsTo)}`],
          ],
          summary: [
            { label: 'Toplam Ciro',    value: fmt(data.totalRevenue) },
            { label: 'Sipariş Sayısı', value: data.totalOrders },
            { label: 'Ort. Sipariş',   value: fmt(data.avgOrderValue) },
            { label: 'Zirve Saat',     value: data.peakHour || '-' },
          ],
        });

        // 2. Masa Performansı
        sections.push({
          title: '2. Masa Performansı',
          headers: ['Masa', 'Sipariş Adedi', 'Ürün Adedi', 'Ciro'],
          rows: data.byTable.map((t: any) => [
            t.name,
            String(t.orders),
            String(t.items ?? '-'),
            fmt(t.revenue),
          ]),
        });

        // 3. En Çok Sipariş Edilen Ürünler
        sections.push({
          title: '3. En Çok Sipariş Edilen Ürünler',
          headers: ['Ürün Adı', 'Adet', 'Sipariş Sayısı', 'Ciro'],
          rows: (data.byProduct || []).map((p: any) => [
            p.name,
            String(p.quantity),
            String(p.orders),
            fmt(p.revenue),
          ]),
        });

        // 4. Kişi Bazlı Harcama
        sections.push({
          title: '4. Kişi Bazlı Harcama',
          headers: ['Kişi', 'Adet', 'Toplam Harcama'],
          rows: (data.byPerson || []).map((p: any) => [
            p.name,
            String(p.quantity),
            fmt(p.revenue),
          ]),
        });

        // 5. Saatlik Dağılım (Türkiye Saati)
        const hourRows = (data.byHour as any[])
          .filter((h) => h.orders > 0)
          .map((h) => [
            `${String(h.hour).padStart(2, '0')}:00 – ${String(h.hour + 1).padStart(2, '0')}:00`,
            String(h.orders),
            fmt(h.revenue),
          ]);
        sections.push({
          title: '5. Saatlik Dağılım (Türkiye Saati)',
          headers: ['Saat Aralığı', 'Sipariş Adedi', 'Ciro'],
          rows: hourRows.length ? hourRows : [['Veri yok', '-', '-']],
        });

        // 6. Günlük Döküm
        sections.push({
          title: '6. Günlük Döküm',
          headers: ['Tarih', 'Sipariş Adedi', 'Ciro'],
          rows: (data.byDay as any[]).map((d) => [
            new Date(d.date + 'T00:00:00').toLocaleDateString('tr-TR', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            }),
            String(d.orders),
            fmt(d.revenue),
          ]),
        });

        await exportPdf(`siparis-raporu-${businessName}`, {
          title: 'Sipariş Analiz Raporu',
          subtitle: `${businessName} · ${fmtDateLong(this.analyticsFrom)} – ${fmtDateLong(this.analyticsTo)}`,
          meta: [
            { label: 'İşletme',  value: businessName },
            { label: 'Dönem',    value: `${from} → ${to}` },
            { label: 'Oluşturulma', value: new Date().toLocaleString('tr-TR') },
          ],
          sections,
        });

        this.showAnalyticsDialog = false;
        this.toast.add({ severity: 'success', summary: 'Rapor Hazır', detail: 'PDF indirildi.', life: 3000 });
      } catch (e: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'Rapor oluşturulamadı.', life: 3000 });
      } finally {
        this.generatingPdf = false;
      }
    },
  }
});
</script>

<style scoped>
.orders-view { max-width: 1400px; margin: 0 auto; }
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Canlı nokta animasyonu */
.live-dot {
  animation: pulse 1.8s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.8); }
}


/* Badge giriş animasyonu */
.pop-enter-active { animation: pop-in 0.25s ease-out; }
.pop-leave-active { animation: pop-in 0.2s ease-in reverse; }
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}

/* Yeni sipariş badge */
.new-order-badge {
  background: linear-gradient(135deg, #ef4444, #f97316);
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.45);
  animation: badge-glow 1.5s ease-in-out infinite;
}
@keyframes badge-glow {
  0%, 100% { box-shadow: 0 2px 12px rgba(239, 68, 68, 0.45); transform: scale(1); }
  50%      { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.7); transform: scale(1.04); }
}
.badge-bell {
  animation: bell-ring 0.8s ease-in-out infinite;
}
@keyframes bell-ring {
  0%, 100% { transform: rotate(0deg); }
  15%      { transform: rotate(12deg); }
  30%      { transform: rotate(-12deg); }
  45%      { transform: rotate(6deg); }
  60%      { transform: rotate(0deg); }
}
</style>
