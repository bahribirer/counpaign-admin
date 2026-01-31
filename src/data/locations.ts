// Ankara İlçeleri ve Semtleri
export const ankaraDistricts = {
    'Çankaya': ['Kızılay', 'Bahçelievler', 'Çankaya Merkez', 'Dikmen', 'Ayrancı', 'Kavaklıdere'],
    'Keçiören': ['Keçiören Merkez', 'Etlik', 'Aktepe', 'Ovacık', 'Bağlum'],
    'Mamak': ['Mamak Merkez', 'Ege Mahallesi', 'Tuzluçayır', 'Akdere'],
    'Yenimahalle': ['Yenimahalle Merkez', 'Demetevler', 'Batıkent', 'Eryaman', 'Sincan Yolu'],
    'Etimesgut': ['Etimesgut Merkez', 'Eryaman', 'Elvankent', 'Güzelkent'],
    'Sincan': ['Sincan Merkez', 'Yenikent', 'Fatih Mahallesi'],
    'Altındağ': ['Altındağ Merkez', 'Ulus', 'Hacıbayram', 'Hamamönü'],
    'Pursaklar': ['Pursaklar Merkez', 'Saray Mahallesi'],
    'Gölbaşı': ['Gölbaşı Merkez', 'Eymir'],
    'Polatlı': ['Polatlı Merkez'],
    'Beypazarı': ['Beypazarı Merkez'],
    'Elmadağ': ['Elmadağ Merkez'],
    'Akyurt': ['Akyurt Merkez'],
    'Çubuk': ['Çubuk Merkez']
};

export const getDistrictNames = (): string[] => {
    return Object.keys(ankaraDistricts);
};

export const getNeighborhoods = (district: string): string[] => {
    return ankaraDistricts[district as keyof typeof ankaraDistricts] || [];
};
