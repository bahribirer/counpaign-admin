<template>
  <div class="gifts-view">
    <div class="page-header">
      <div>
        <h1>Hediyeler</h1>
        <p class="subtitle">Müşterilerin puanlarıyla alabileceği hediyeleri yönetin</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        <span class="material-icons">add</span>
        Yeni Hediye Ekle
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Hediyeler yükleniyor...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="gifts.length === 0" class="empty-state">
      <div class="empty-icon">
        <span class="material-icons">card_giftcard</span>
      </div>
      <h3>Henüz hediye eklemediniz</h3>
      <p>Müşterilerinizin puanlarını harcayabilmesi için ilk hediyenizi oluşturun.</p>
      <button @click="showAddModal = true" class="btn-secondary">Hediye Oluştur</button>
    </div>

    <!-- Gifts Grid -->
    <div v-else class="gifts-grid">
      <div v-for="gift in gifts" :key="gift._id" class="gift-card">
        <div class="gift-icon">
          <span class="material-icons">local_cafe</span>
        </div>
        <div class="gift-info">
          <h3>{{ gift.title }}</h3>
          <div class="point-badge">
            <span class="material-icons">stars</span>
            {{ gift.pointCost }} Puan
          </div>
        </div>
        <button @click="deleteGift(gift._id)" class="btn-icon delete" title="Sil">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>

    <!-- Add Gift Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Yeni Hediye Ekle</h2>
          <button @click="showAddModal = false" class="close-btn">
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <form @submit.prevent="createGift">
          <div class="form-group">
            <label>Hediye Adı</label>
            <input 
              v-model="newGift.title" 
              type="text" 
              placeholder="Örn: Filtre Kahve" 
              required
              autofocus
            >
          </div>

          <div class="form-group">
            <label>Puan Bedeli</label>
            <input 
              v-model.number="newGift.pointCost" 
              type="number" 
              min="1" 
              placeholder="Örn: 400" 
              required
            >
            <small>Bu hediyeyi almak için gereken puan miktarı</small>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn-text">İptal</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Ekleniyor...' : 'Ekle' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { defineComponent } from 'vue';

// Local API Helper
const API_URL = 'https://counpaign.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const api = {
  get: async (url: string) => {
    const res = await fetch(`${API_URL}${url}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return { data: await res.json() };
  },
  post: async (url: string, data: any) => {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return { data: await res.json() };
  },
  delete: async (url: string) => {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return { data: await res.json() };
  }
};

interface Gift {
  _id: string;
  title: string;
  pointCost: number;
}

export default defineComponent({
  name: 'GiftsView',
  data() {
    return {
      gifts: [] as Gift[],
      loading: true,
      showAddModal: false,
      submitting: false,
      newGift: {
        title: '',
        pointCost: null as number | null
      }
    };
  },
  async created() {
    await this.fetchGifts();
  },
  methods: {
    async fetchGifts() {
      try {
        this.loading = true;
        const response = await api.get('/gifts/my');
        this.gifts = response.data;
      } catch (error) {
        console.error('Error fetching gifts:', error);
      } finally {
        this.loading = false;
      }
    },
    async createGift() {
      if (!this.newGift.title || !this.newGift.pointCost) return;

      try {
        this.submitting = true;
        await api.post('/gifts', this.newGift);
        
        // Reset and Refresh
        this.newGift.title = '';
        this.newGift.pointCost = null;
        this.showAddModal = false;
        await this.fetchGifts();
        
      } catch (error) {
        console.error('Error creating gift:', error);
        alert('Hediye eklenirken bir hata oluştu.');
      } finally {
        this.submitting = false;
      }
    },
    async deleteGift(id: string) {
      if (!confirm('Bu hediyeyi silmek istediğinize emin misiniz?')) return;

      try {
        await api.delete(`/gifts/${id}`);
        this.gifts = this.gifts.filter(g => g._id !== id);
      } catch (error) {
        console.error('Error deleting gift:', error);
        alert('Hediye silinemedi.');
      }
    }
  }
});
</script>

<style scoped>
.gifts-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #fff0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.empty-icon .material-icons {
  font-size: 40px;
  color: #ee2c2c;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
  margin-bottom: 24px;
}

/* Grid */
.gifts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.gift-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.gift-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.gift-icon {
  width: 56px;
  height: 56px;
  background: #f8f9fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ee2c2c;
}

.gift-info {
  flex: 1;
}

.gift-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #1a1a1a;
}

.point-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff4e6;
  color: #ff9800;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.point-badge .material-icons {
  font-size: 16px;
}

.btn-icon.delete {
  color: #999;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-icon.delete:hover {
  color: #ef4444;
  background: #fee2e2;
}

/* Buttons */
.btn-primary {
  background: #ee2c2c;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #d62525;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 1px solid #ee2c2c;
  color: #ee2c2c;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-text {
  background: transparent;
  border: none;
  color: #666;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #ee2c2c;
  outline: none;
}

.form-group small {
  display: block;
  margin-top: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}
</style>
