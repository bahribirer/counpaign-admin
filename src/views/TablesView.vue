<template>
  <div class="tables-view p-4 md:p-6 fade-in">
    <!-- Header -->
    <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4">
      <div>
        <h1 class="font-bold text-4xl mb-2 tracking-tight">
          <span class="text-primary mr-2">✦</span>Masalar
        </h1>
        <p class="text-secondary text-lg">İşletmenizin masalarını ve QR kodlarını yönetin.</p>
      </div>
      <Button
        label="Yeni Masa Ekle"
        icon="pi pi-plus"
        @click="showAddModal = true"
        class="p-button-primary p-button-lg shadow-4 hover:shadow-6 transition-all transition-duration-300 border-round-xl px-4"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-content-center align-items-center p-8 card shadow-1" style="min-height: 300px">
      <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
    </div>

    <!-- Empty -->
    <div v-else-if="tables.length === 0" class="flex flex-column align-items-center justify-content-center p-8 card shadow-1 text-center" style="min-height: 300px">
      <div class="bg-primary-50 border-circle w-6rem h-6rem flex align-items-center justify-content-center mb-4 shadow-1">
        <i class="pi pi-table text-primary text-5xl"></i>
      </div>
      <h3 class="font-bold text-2xl mb-2">Henüz masa eklenmemiş</h3>
      <p class="text-secondary text-lg mb-4">Müşterileriniz için ilk masayı oluşturun.</p>
      <Button label="Masa Oluştur" icon="pi pi-plus" @click="showAddModal = true" class="p-button-outlined border-round-xl" />
    </div>

    <!-- Table Grid -->
    <div v-else class="grid">
      <div v-for="table in tables" :key="table._id" class="col-12 md:col-6 lg:col-4 xl:col-3">
        <div class="card border-round-2xl shadow-1 hover:shadow-3 transition-all transition-duration-300 p-4 flex flex-column gap-3">
          <!-- Table header -->
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-2">
              <div class="bg-primary-50 border-circle w-3rem h-3rem flex align-items-center justify-content-center">
                <i class="pi pi-table text-primary text-xl"></i>
              </div>
              <div>
                <div class="font-bold text-lg">{{ table.name || `Masa ${table.tableNumber}` }}</div>
                <div class="text-secondary text-sm">No: {{ table.tableNumber }}</div>
              </div>
            </div>
            <Tag :value="table.isActive ? 'Aktif' : 'Pasif'" :severity="table.isActive ? 'success' : 'danger'" class="border-round-xl" />
          </div>

          <!-- QR Code display -->
          <div class="border-round-xl surface-ground p-3 text-center">
            <div class="text-xs text-secondary mb-2">QR Kodu</div>
            <img
              :src="getQRImageUrl(table.qrCode)"
              :alt="`Masa ${table.tableNumber} QR`"
              class="w-8rem h-8rem mx-auto block border-round-lg shadow-1"
              @error="handleQrError"
            />
            <div class="text-xs text-secondary mt-2 font-mono" style="word-break: break-all; font-size: 9px;">
              {{ table.qrCode.slice(0, 20) }}...
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <Button
              icon="pi pi-download"
              label="QR İndir"
              class="flex-1 p-button-outlined p-button-sm border-round-lg"
              @click="downloadQR(table)"
            />
            <Button
              icon="pi pi-pencil"
              text
              rounded
              class="text-secondary"
              @click="openEdit(table)"
              v-tooltip.top="'Düzenle'"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="confirmDelete(table)"
              v-tooltip.top="'Sil'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <Dialog
      v-model:visible="showAddModal"
      modal
      :header="editingTable ? 'Masayı Düzenle' : 'Yeni Masa Ekle'"
      :style="{ width: '400px' }"
      :breakpoints="{ '640px': '90vw' }"
      @hide="resetModal"
    >
      <div class="flex flex-column gap-4 py-3">
        <div class="field">
          <label class="font-bold mb-2 block">Masa Numarası</label>
          <InputNumber v-model="form.tableNumber" placeholder="Örn: 1" class="w-full" :disabled="!!editingTable" />
        </div>
        <div class="field">
          <label class="font-bold mb-2 block">Masa Adı <small class="text-secondary">(opsiyonel)</small></label>
          <InputText v-model="form.name" placeholder="Örn: Balkon 1, Teras 2" class="w-full" />
        </div>
        <div v-if="editingTable" class="field">
          <label class="font-bold mb-2 block">Durum</label>
          <div class="flex align-items-center gap-2">
            <ToggleSwitch v-model="form.isActive" />
            <span>{{ form.isActive ? 'Aktif' : 'Pasif' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <Button label="Vazgeç" text plain @click="resetModal" />
          <Button
            :label="editingTable ? 'Kaydet' : 'Oluştur'"
            icon="pi pi-check"
            @click="saveTable"
            :loading="submitting"
            :disabled="!form.tableNumber"
            class="border-round-lg"
          />
        </div>
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import api from '../services/api';


export default defineComponent({
  name: 'TablesView',
  components: { Button, Dialog, InputText, InputNumber, Toast, ConfirmDialog, Tag, ToggleSwitch },
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    return { toast, confirm };
  },
  data() {
    return {
      tables: [] as any[],
      loading: true,
      showAddModal: false,
      editingTable: null as any,
      submitting: false,
      form: { tableNumber: null as number | null, name: '', isActive: true }
    };
  },
  async created() {
    await this.fetchTables();
  },
  methods: {
    async fetchTables() {
      try {
        this.loading = true;
        const res = await api.get('/tables');
        this.tables = res.data;
      } catch (e) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: 'Masalar yüklenemedi.', life: 3000 });
      } finally {
        this.loading = false;
      }
    },

    openEdit(table: any) {
      this.editingTable = table;
      this.form = { tableNumber: table.tableNumber, name: table.name || '', isActive: table.isActive };
      this.showAddModal = true;
    },

    resetModal() {
      this.showAddModal = false;
      this.editingTable = null;
      this.form = { tableNumber: null, name: '', isActive: true };
    },

    async saveTable() {
      if (!this.form.tableNumber) return;
      this.submitting = true;
      try {
        if (this.editingTable) {
          const res = await api.put(`/tables/${this.editingTable._id}`, {
            name: this.form.name,
            isActive: this.form.isActive
          });
          const idx = this.tables.findIndex(t => t._id === this.editingTable._id);
          if (idx !== -1) this.tables[idx] = res.data;
          this.toast.add({ severity: 'success', summary: 'Güncellendi', detail: 'Masa güncellendi.', life: 3000 });
        } else {
          const res = await api.post('/tables', {
            tableNumber: this.form.tableNumber,
            name: this.form.name || `Masa ${this.form.tableNumber}`
          });
          this.tables.push(res.data);
          this.tables.sort((a, b) => a.tableNumber - b.tableNumber);
          this.toast.add({ severity: 'success', summary: 'Oluşturuldu', detail: 'Masa oluşturuldu.', life: 3000 });
        }
        this.resetModal();
      } catch (e: any) {
        this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'İşlem başarısız.', life: 4000 });
      } finally {
        this.submitting = false;
      }
    },

    confirmDelete(table: any) {
      this.confirm.require({
        message: `"${table.name || `Masa ${table.tableNumber}`}" silinecek. Emin misiniz?`,
        header: 'Silme Onayı',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Evet, Sil',
        rejectLabel: 'Vazgeç',
        accept: async () => {
          try {
            await api.delete(`/tables/${table._id}`);
            this.tables = this.tables.filter(t => t._id !== table._id);
            this.toast.add({ severity: 'success', summary: 'Silindi', detail: 'Masa silindi.', life: 3000 });
          } catch (e: any) {
            this.toast.add({ severity: 'error', summary: 'Hata', detail: e.response?.data?.error || 'Silinemedi.', life: 4000 });
          }
        }
      });
    },

    getQRImageUrl(qrCode: string) {
      // QR görsel üretimi için Google Charts API
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;
    },

    handleQrError(e: Event) {
      const img = e.target as HTMLImageElement;
      img.style.display = 'none';
    },

    downloadQR(table: any) {
      const url = this.getQRImageUrl(table.qrCode);
      const a = document.createElement('a');
      a.href = url;
      a.download = `masa-${table.tableNumber}-qr.png`;
      a.target = '_blank';
      a.click();
    }
  }
});
</script>

<style scoped>
.tables-view { max-width: 1600px; margin: 0 auto; }
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
