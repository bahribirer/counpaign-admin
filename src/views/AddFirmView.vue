<template>
    <div class="add-firm-container">
        <div class="add-firm-card">
            <h1>Firma Ekle</h1>
            <p class="subtitle">Yeni bir kafe hesabı oluşturun</p>

            <form @submit.prevent="handleSubmit" class="firm-form">
                <!-- Temel Bilgiler -->
                <div class="form-section">
                    <h3>Temel Bilgiler</h3>
                    
                    <div class="form-group">
                        <label for="name">Firma İsmi *</label>
                        <InputText 
                            id="name" 
                            v-model="formData.name" 
                            placeholder="Örn: Kahve Diyarı"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="email">E-posta *</label>
                        <InputText 
                            id="email" 
                            v-model="formData.email" 
                            type="email"
                            placeholder="info@firma.com"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="password">Şifre *</label>
                        <Password 
                            id="password" 
                            v-model="formData.password" 
                            :feedback="true"
                            toggleMask
                            placeholder="Güvenli bir şifre girin"
                            required
                        />
                    </div>
                </div>

                <!-- Ayarlar -->
                <div class="form-section">
                    <h3>Firma Ayarları</h3>

                    <div class="form-group">
                        <label for="category">Kategori</label>
                        <InputText 
                            id="category" 
                            v-model="formData.settings.category" 
                            disabled
                            class="locked-field"
                        />
                        <small>Bu alan kilitlidir</small>
                    </div>

                    <div class="form-group">
                        <label for="logo">Logo *</label>
                        <input 
                            type="file" 
                            id="logo" 
                            @change="handleFileChange"
                            accept="image/*"
                            required
                            class="file-input"
                        />
                        <small>Logo dosyası seçin (PNG, JPG)</small>
                    </div>

                    <div class="form-group">
                        <label for="cardColor">Firma Rengi *</label>
                        <div class="color-picker-wrapper">
                            <input 
                                type="color" 
                                id="cardColor" 
                                v-model="formData.settings.cardColor"
                                class="color-input"
                            />
                            <InputText 
                                v-model="formData.settings.cardColor" 
                                placeholder="#FF5733"
                                class="color-text"
                            />
                        </div>
                        <small>Kartlarda kullanılacak renk</small>
                    </div>

                    <div class="form-group">
                        <label for="cardIcon">Kart İkonu</label>
                        <InputText 
                            id="cardIcon" 
                            v-model="formData.settings.cardIcon" 
                            disabled
                            class="locked-field"
                        />
                        <small>Bu alan kilitlidir</small>
                    </div>

                    <div class="form-group">
                        <label for="stampsTarget">Hediye İçin Damga Sayısı</label>
                        <InputNumber 
                            id="stampsTarget" 
                            v-model="formData.settings.stampsTarget" 
                            showButtons
                            buttonLayout="horizontal"
                            :min="1"
                            :max="20"
                            decrementButtonClass="p-button-secondary"
                            incrementButtonClass="p-button-secondary"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus"
                        />
                        <small>Bir hediye kazanmak için gereken damga sayısı (Varsayılan: 6)</small>
                    </div>
                </div>

                <!-- Konum Bilgileri -->
                <div class="form-section">
                    <h3>Konum Bilgileri</h3>

                    <div class="form-group">
                        <label for="city">Şehir</label>
                        <InputText 
                            id="city" 
                            v-model="formData.settings.city" 
                            disabled
                            class="locked-field"
                        />
                        <small>Bu alan kilitlidir</small>
                    </div>

                    <div class="form-group">
                        <label for="district">İlçe *</label>
                        <Dropdown 
                            id="district" 
                            v-model="formData.settings.district" 
                            :options="districts"
                            placeholder="İlçe seçin"
                            @change="onDistrictChange"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="neighborhood">Semt *</label>
                        <Dropdown 
                            id="neighborhood" 
                            v-model="formData.settings.neighborhood" 
                            :options="neighborhoods"
                            placeholder="Önce ilçe seçin"
                            :disabled="!formData.settings.district"
                            required
                        />
                    </div>
                </div>

                <div class="form-actions">
                    <Button 
                        type="button" 
                        label="İptal" 
                        severity="secondary" 
                        @click="handleCancel"
                        :disabled="loading"
                    />
                    <Button 
                        type="submit" 
                        label="Firma Ekle" 
                        :loading="loading"
                    />
                </div>

                <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
                <Message v-if="success" severity="success" :closable="false">{{ success }}</Message>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Password from 'primevue/password';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { getDistrictNames, getNeighborhoods } from '../data/locations';

const router = useRouter();

const formData = ref({
    name: '',
    email: '',
    password: '',
    settings: {
        category: 'Kafe',
        logo: null as File | null,
        cardColor: '#EE2C2C',
        cardIcon: 'local_cafe_rounded',
        city: 'Ankara',
        district: '',
        neighborhood: '',
        stampsTarget: 6
    }
});

const districts = ref(getDistrictNames());
const neighborhoods = ref<string[]>([]);

const loading = ref(false);
const error = ref('');
const success = ref('');

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        try {
            const compressedFile = await compressImage(target.files[0]);
            formData.value.settings.logo = compressedFile;
            // Preview logic could go here if needed
        } catch (e) {
            console.error("Compression failed", e);
            error.value = "Resim işlenirken hata oluştu.";
        }
    }
};

// Helper: Compress Image to prevent 413 Errors
const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                // Resume logic
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error('Canvas to Blob failed'));
                    }
                }, 'image/jpeg', 0.7); // 0.7 Quality
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const onDistrictChange = () => {
    formData.value.settings.neighborhood = '';
    neighborhoods.value = getNeighborhoods(formData.value.settings.district);
};

const handleSubmit = async () => {
    loading.value = true;
    error.value = '';
    success.value = '';

    try {
        const submitData = new FormData();
        submitData.append('name', formData.value.name);
        submitData.append('email', formData.value.email);
        submitData.append('password', formData.value.password);
        submitData.append('settings', JSON.stringify({
            category: formData.value.settings.category,
            cardColor: formData.value.settings.cardColor,
            cardIcon: formData.value.settings.cardIcon,
            city: formData.value.settings.city,
            district: formData.value.settings.district,
            neighborhood: formData.value.settings.neighborhood,
            stampsTarget: formData.value.settings.stampsTarget
        }));
        
        if (formData.value.settings.logo) {
            submitData.append('logo', formData.value.settings.logo);
        }

        const response = await fetch('https://counpaign.com/api/firms', {
            method: 'POST',
            body: submitData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Firma oluşturulamadı');
        }

        success.value = `${formData.value.name} başarıyla oluşturuldu!`;
        
        // Reset form
        formData.value = {
            name: '',
            email: '',
            password: '',
            settings: {
                category: 'Kafe',
                logo: null,
                cardColor: '#EE2C2C',
                cardIcon: 'local_cafe_rounded',
                city: 'Ankara',
                district: '',
                neighborhood: '',
                stampsTarget: 6
            }
        };
        neighborhoods.value = [];

        // Redirect after 2 seconds
        setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
    } catch (err: any) {
        error.value = err.message || 'Bir hata oluştu';
    } finally {
        loading.value = false;
    }
};

const handleCancel = () => {
    router.push('/dashboard');
};
</script>

<style scoped>
.add-firm-container {
    max-width: 700px;
    margin: 0 auto;
}

.add-firm-card {
    background: var(--surface-card);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

h1 {
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
}

.subtitle {
    color: var(--text-color-secondary);
    margin: 0 0 2rem 0;
}

.firm-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.form-section:last-of-type {
    border-bottom: none;
}

.form-section h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.1rem;
    font-weight: 600;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: 500;
    color: var(--text-color);
}

.form-group small {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.locked-field {
    background-color: var(--surface-100) !important;
    cursor: not-allowed;
}

.file-input {
    padding: 0.75rem;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    background: var(--surface-card);
    color: var(--text-color);
    cursor: pointer;
}

.file-input:hover {
    border-color: var(--primary-color);
}

.color-picker-wrapper {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.color-input {
    width: 60px;
    height: 40px;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    cursor: pointer;
}

.color-text {
    flex: 1;
}

.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
}
</style>
