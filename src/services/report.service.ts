// Report Service — Super Admin (kapsamlı) + Firma Admin (özet) rapor üreticileri
// Mevcut analytics endpoint'lerinden veri toplar, export.service.ts ile dışa aktarır.

import {
    exportPdf,
    fmtNum,
    fmtPct,
    fmtDate,
    rangeLabel,
    type PdfSection
} from './export.service';

const API_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// Veri toplama
// ---------------------------------------------------------------------------
async function fetchJson(path: string): Promise<any> {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(`Fetch failed: ${path} → ${res.status}`);
    return res.json();
}

// ---------------------------------------------------------------------------
// SUPER ADMIN — Kapsamlı rapor
// Mevcut /api/dashboard/stats + /api/analytics/admin/* endpoint'lerinden derler
// ---------------------------------------------------------------------------
async function collectSuperAdminData(range: string) {
    const [overview, topFirms, firmHealth, growth, dashboard, firmBreakdown, allCustomers] = await Promise.all([
        fetchJson(`/analytics/admin/overview?range=${range}`),
        fetchJson(`/analytics/admin/top-firms?range=${range}&limit=20`),
        fetchJson(`/analytics/admin/firm-health`),
        fetchJson(`/analytics/admin/growth?range=${range}`),
        fetchJson(`/dashboard/stats`),
        fetchJson(`/analytics/admin/firm-breakdown?range=${range}&limit=200`).catch(() => []),
        fetchJson(`/analytics/admin/all-customers?range=${range}&limit=100`).catch(() => [])
    ]);
    return { overview, topFirms, firmHealth, growth, dashboard, firmBreakdown, allCustomers };
}

// TL formatı
function fmtTl(n: number | null | undefined): string {
    const v = Number(n || 0);
    return `${v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

export async function exportStampsDetailPdf(title: string, data: any[]): Promise<void> {
    const sections: PdfSection[] = [{
        title: 'Pul Kazanım Detayları',
        headers: ['Müşteri', 'Telefon', 'Pul', 'Puan', 'Detay', 'Durum', 'Tarih'],
        rows: data.map(tx => [
            tx.customerName || 'Misafir',
            tx.customerPhone || '-',
            `+${tx.stamps}`,
            tx.points ? `+${tx.points}` : '-',
            tx.campaign || '-',
            tx.status || '-',
            new Date(tx.date).toLocaleString('tr-TR')
        ])
    }];

    await exportPdf(`counpaign_pul_detay_${new Date().getTime()}`, {
        title,
        subtitle: 'Pul Kazanım ve Müşteri Sadakat Raporu',
        sections,
        meta: [
            { label: 'Toplam Kayıt', value: String(data.length) },
            { label: 'Toplam Pul', value: String(data.reduce((s, tx) => s + (tx.stamps || 0), 0)) }
        ]
    });
}

export async function exportGiftsDetailPdf(title: string, data: any[]): Promise<void> {
    const sections: PdfSection[] = [{
        title: 'Hediye Kullanım Detayları',
        headers: ['Müşteri', 'Telefon', 'Hediye', 'Durum', 'Tarih'],
        rows: data.map(tx => [
            tx.customerName || 'Misafir',
            tx.customerPhone || '-',
            tx.giftName || '-',
            tx.status || '-',
            new Date(tx.date).toLocaleString('tr-TR')
        ])
    }];

    await exportPdf(`counpaign_hediye_detay_${new Date().getTime()}`, {
        title,
        subtitle: 'Hediye Kullanım ve Ödül Raporu',
        sections,
        meta: [
            { label: 'Toplam Kullanılan Hediye', value: String(data.length) }
        ]
    });
}

export async function exportSuperAdminPdf(range: string): Promise<void> {
    const { overview, topFirms, firmHealth, growth, dashboard, firmBreakdown, allCustomers } = await collectSuperAdminData(range);

    const sections: PdfSection[] = [];

    // 1. Genel Özet
    sections.push({
        title: '1. Platform Geneli',
        headers: ['Metrik', 'Değer'],
        rows: [
            ['Toplam Kullanıcı', fmtNum(dashboard.users?.total)],
            ['Bugünkü Yeni Kullanıcı', fmtNum(dashboard.users?.today)],
            ['Toplam İşletme', fmtNum(dashboard.firms?.total)],
            ['Bu Ayki Yeni İşletme', fmtNum(dashboard.firms?.month)],
            ['Toplam İşlem', fmtNum(dashboard.transactions?.total)],
            ['Bugünkü İşlem', fmtNum(dashboard.transactions?.today)],
            ['Aktif Kampanya', fmtNum(dashboard.campaigns?.active)],
            ['Ortalama Yorum Puanı', String(dashboard.reviews?.avgRating ?? 0)]
        ]
    });

    // 2. Dönem Karşılaştırma
    sections.push({
        title: `2. Dönem Karşılaştırma (${rangeLabel(range)})`,
        headers: ['Metrik', 'Bu Dönem', 'Önceki Dönem', 'Değişim'],
        rows: [
            ['Yeni Kullanıcı', fmtNum(overview.users.current), fmtNum(overview.users.previous), fmtPct(overview.users.delta)],
            ['Yeni İşletme', fmtNum(overview.firms.current), fmtNum(overview.firms.previous), fmtPct(overview.firms.delta)],
            ['İşlem', fmtNum(overview.transactions.current), fmtNum(overview.transactions.previous), fmtPct(overview.transactions.delta)],
            ['Hediye Kullanımı', fmtNum(overview.gifts.current), fmtNum(overview.gifts.previous), fmtPct(overview.gifts.delta)]
        ]
    });

    // 3. En Aktif Firmalar
    sections.push({
        title: '3. En Aktif Firmalar',
        headers: ['#', 'Firma', 'Şehir', 'Kategori', 'İşlem', 'Müşteri'],
        rows: topFirms.map((f: any, i: number) => [
            i + 1,
            f.name || '-',
            f.city || '-',
            f.category || '-',
            fmtNum(f.transactions),
            fmtNum(f.customers)
        ])
    });

    // 4. Firma Sağlığı
    const totalF = firmHealth.total || 1;
    sections.push({
        title: '4. Firma Sağlığı',
        headers: ['Durum', 'Sayı', 'Oran'],
        rows: [
            ['Aktif (Son 7 Gün)', fmtNum(firmHealth.active), `${Math.round((firmHealth.active / totalF) * 100)}%`],
            ['Risk Altında (7-30 Gün)', fmtNum(firmHealth.atRisk), `${Math.round((firmHealth.atRisk / totalF) * 100)}%`],
            ['Pasif (30+ Gün)', fmtNum(firmHealth.dormant), `${Math.round((firmHealth.dormant / totalF) * 100)}%`]
        ],
        summary: [{ label: 'Toplam Firma', value: fmtNum(firmHealth.total) }]
    });

    // 5. Büyüme Trendi (compact tail to fit)
    const trendRows = growth.slice(-30).map((g: any) => [
        g.date,
        fmtNum(g.users),
        fmtNum(g.firms),
        fmtNum(g.transactions)
    ]);
    sections.push({
        title: '5. Günlük Büyüme Trendi (Son 30 Gün)',
        headers: ['Tarih', 'Yeni Kullanıcı', 'Yeni Firma', 'İşlem'],
        rows: trendRows
    });

    // 6. Firma Harcama Özeti (TL + Puan + Pul)
    const breakdownTop = (firmBreakdown || []).slice(0, 30);
    const totSpent = (firmBreakdown || []).reduce((s: number, f: any) => s + Number(f.totalSpent || 0), 0);
    const totPoints = (firmBreakdown || []).reduce((s: number, f: any) => s + Number(f.pointsEarned || 0), 0);
    const totStamps = (firmBreakdown || []).reduce((s: number, f: any) => s + Number(f.stampsEarned || 0), 0);
    const totGifts = (firmBreakdown || []).reduce((s: number, f: any) => s + Number(f.giftsRedeemed || 0), 0);
    sections.push({
        title: '6. Firma Harcama Özeti (Top 30 — TL)',
        headers: ['#', 'Firma', 'İşlem', 'Harcama (TL)', 'Puan', 'Pul', 'Hediye', 'Müşteri'],
        rows: breakdownTop.map((f: any, i: number) => [
            i + 1,
            f.name || '-',
            fmtNum(f.transactions),
            fmtTl(f.totalSpent),
            fmtNum(f.pointsEarned),
            fmtNum(f.stampsEarned),
            fmtNum(f.giftsRedeemed),
            fmtNum(f.uniqueCustomers)
        ]),
        summary: [
            { label: 'Platform Toplam Harcama', value: fmtTl(totSpent) },
            { label: 'Dağıtılan Puan', value: fmtNum(totPoints) },
            { label: 'Dağıtılan Pul', value: fmtNum(totStamps) },
            { label: 'Kullanılan Hediye', value: fmtNum(totGifts) }
        ]
    });

    // 7. Platform Müşteri Ranking (Top 30 — TL)
    const topCust = (allCustomers || []).slice(0, 30);
    sections.push({
        title: '7. Platform Müşteri Ranking (Top 30 — TL Harcama)',
        headers: ['#', 'Müşteri', 'Telefon', 'İşlem', 'Harcama (TL)', 'Puan', 'Pul', 'Firma'],
        rows: topCust.map((c: any, i: number) => [
            i + 1,
            ((c.name || '').trim()) || 'Misafir',
            c.phone || '-',
            fmtNum(c.transactions),
            fmtTl(c.totalSpent),
            fmtNum(c.pointsEarned),
            fmtNum(c.stampsEarned),
            fmtNum(c.businessCount)
        ])
    });

    await exportPdf(`counpaign_super_admin_raporu_${range}`, {
        title: 'Counpaign Platform Raporu',
        subtitle: `Süper Admin · ${rangeLabel(range)}`,
        meta: [
            { label: 'Üretim Tarihi', value: new Date().toLocaleString('tr-TR') },
            { label: 'Dönem', value: rangeLabel(range) }
        ],
        sections
    });
}

// ---------------------------------------------------------------------------
// FIRMA ADMIN — Özet rapor
// ---------------------------------------------------------------------------
async function collectFirmData(businessId: string, range: string) {
    const [overview, segments, heatmap, topCustomers, firmStats, customerBreakdown, rewardEconomy, transactions] = await Promise.all([
        fetchJson(`/analytics/firm/overview?businessId=${businessId}&range=${range}`),
        fetchJson(`/analytics/firm/segments?businessId=${businessId}`),
        fetchJson(`/analytics/firm/heatmap?businessId=${businessId}&range=${range}`),
        fetchJson(`/analytics/firm/top-customers?businessId=${businessId}&range=${range}&limit=20`),
        fetchJson(`/dashboard/firm-stats?businessId=${businessId}`),
        fetchJson(`/analytics/firm/customer-breakdown?businessId=${businessId}&range=${range}&limit=500`).catch(() => []),
        fetchJson(`/analytics/firm/reward-economy?businessId=${businessId}&range=${range}`).catch(() => ({})),
        fetchJson(`/analytics/firm/transactions?businessId=${businessId}&range=${range}&limit=2000`).catch(() => [])
    ]);
    return { overview, segments, heatmap, topCustomers, firmStats, customerBreakdown, rewardEconomy, transactions };
}

export async function exportFirmPdf(businessId: string, businessName: string, range: string): Promise<void> {
    const { overview, segments, heatmap, topCustomers, firmStats, customerBreakdown, rewardEconomy } = await collectFirmData(businessId, range);

    const sections: PdfSection[] = [];

    // 1. Genel Özet
    sections.push({
        title: '1. Genel Özet',
        headers: ['Metrik', 'Değer'],
        rows: [
            ['Toplam Müşteri', fmtNum(firmStats.customers?.total)],
            ['Bugünkü İşlem', fmtNum(firmStats.transactions?.daily)],
            ['Aylık İşlem', fmtNum(firmStats.transactions?.monthly)],
            ['Haftalık Pul Dağıtımı', fmtNum(firmStats.rewards?.weeklyStamps)],
            ['Haftalık Hediye Kullanımı', fmtNum(firmStats.rewards?.weeklyCoffee)],
            ['Ortalama Yorum Puanı', String(firmStats.reviews?.avgRating ?? 0)],
            ['Toplam Yorum', fmtNum(firmStats.reviews?.total)],
            ['Kullanılan Hediye', fmtNum(firmStats.gifts?.redeemed)]
        ]
    });

    // 2. Dönem Karşılaştırma
    sections.push({
        title: `2. Dönem Karşılaştırma (${rangeLabel(range)})`,
        headers: ['Metrik', 'Bu Dönem', 'Önceki Dönem', 'Değişim'],
        rows: [
            ['İşlem', fmtNum(overview.transactions.current), fmtNum(overview.transactions.previous), fmtPct(overview.transactions.delta)],
            ['Aktif Müşteri', fmtNum(overview.activeCustomers.current), fmtNum(overview.activeCustomers.previous), fmtPct(overview.activeCustomers.delta)],
            ['Yeni Müşteri', fmtNum(overview.newCustomers.current), fmtNum(overview.newCustomers.previous), fmtPct(overview.newCustomers.delta)],
            ['Hediye Kullanımı', fmtNum(overview.gifts.current), fmtNum(overview.gifts.previous), fmtPct(overview.gifts.delta)]
        ]
    });

    // 3. Müşteri Segmentleri
    const totalC = segments.total || 1;
    sections.push({
        title: '3. Müşteri Segmentleri',
        headers: ['Segment', 'Açıklama', 'Sayı', 'Oran'],
        rows: [
            ['VIP', '30 günde 5+ ziyaret', fmtNum(segments.vip), `${Math.round((segments.vip / totalC) * 100)}%`],
            ['Aktif', '30 günde 1-4 ziyaret', fmtNum(segments.active), `${Math.round((segments.active / totalC) * 100)}%`],
            ['Risk', '30-60 gün sessiz', fmtNum(segments.risk), `${Math.round((segments.risk / totalC) * 100)}%`],
            ['Kayıp', '60+ gün veya hiç gelmedi', fmtNum(segments.lost), `${Math.round((segments.lost / totalC) * 100)}%`]
        ],
        summary: [{ label: 'Toplam Müşteri', value: fmtNum(segments.total) }]
    });

    // 4. En Sadık Müşteriler
    sections.push({
        title: '4. En Sadık Müşteriler',
        headers: ['#', 'Müşteri', 'Telefon', 'Ziyaret', 'Son Ziyaret'],
        rows: topCustomers.map((c: any, i: number) => [
            i + 1,
            c.name || 'Misafir',
            c.phone || '-',
            fmtNum(c.transactions),
            fmtDate(c.lastVisit)
        ])
    });

    // 5. En Yoğun 10 Saat
    if (heatmap?.grid) {
        const peaks: any[] = [];
        heatmap.grid.forEach((row: number[], di: number) => {
            row.forEach((v, hi) => {
                if (v > 0) peaks.push({ day: heatmap.dayLabels[di], hour: hi, count: v });
            });
        });
        peaks.sort((a, b) => b.count - a.count);
        sections.push({
            title: '5. En Yoğun Saatler (Top 10)',
            headers: ['#', 'Gün', 'Saat', 'İşlem'],
            rows: peaks.slice(0, 10).map((p, i) => [i + 1, p.day, `${p.hour}:00`, fmtNum(p.count)])
        });
    }

    // 6. Müşteri Detay (Top 30 — TL + Puan + Pul)
    const custTop = (customerBreakdown || []).slice(0, 30);
    sections.push({
        title: '6. Müşteri Detay (Top 30 — TL Harcama)',
        headers: ['#', 'Müşteri', 'Telefon', 'İşlem', 'Harcama (TL)', 'Puan', 'Pul', 'Son Ziyaret'],
        rows: custTop.map((c: any, i: number) => [
            i + 1,
            ((c.name || '').trim()) || 'Misafir',
            c.phone || '-',
            fmtNum(c.transactions),
            fmtTl(c.totalSpent),
            fmtNum(c.pointsEarned),
            fmtNum(c.stampsEarned),
            fmtDate(c.lastVisit)
        ]),
        summary: [
            { label: 'Toplam Müşteri Harcaması', value: fmtTl((customerBreakdown || []).reduce((s: number, c: any) => s + Number(c.totalSpent || 0), 0)) }
        ]
    });

    // 7. Ödül Ekonomisi
    const re = rewardEconomy || {};
    sections.push({
        title: '7. Ödül Ekonomisi',
        headers: ['Metrik', 'Değer'],
        rows: [
            ['Toplam İşlem', fmtNum(re.totalTransactions)],
            ['Toplam Harcama', fmtTl(re.totalSpent)],
            ['Benzersiz Müşteri', fmtNum(re.uniqueCustomers)],
            ['Dağıtılan Puan', fmtNum(re.pointsDistributed)],
            ['Harcanan Puan', fmtNum(re.pointsRedeemed)],
            ['Dağıtılan Pul', fmtNum(re.stampsDistributed)],
            ['Kullanılan Hediye', fmtNum(re.giftsRedeemed)],
            ['Cüzdanlarda Bekleyen Puan', fmtNum(re.walletPoints)],
            ['Cüzdanlarda Bekleyen Pul', fmtNum(re.walletStamps)],
            ['Aktif Cüzdan', fmtNum(re.activeWallets)],
            ['Ort. Harcama / İşlem', re.totalTransactions ? fmtTl(Number(re.totalSpent || 0) / re.totalTransactions) : fmtTl(0)]
        ]
    });

    await exportPdf(`counpaign_${businessName}_raporu_${range}`, {
        title: 'İşletme Performans Raporu',
        subtitle: `${businessName} · ${rangeLabel(range)}`,
        meta: [
            { label: 'Üretim Tarihi', value: new Date().toLocaleString('tr-TR') },
            { label: 'İşletme', value: businessName },
            { label: 'Dönem', value: rangeLabel(range) }
        ],
        sections
    });
}
