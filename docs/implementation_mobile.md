# Mobile Responsiveness — SIPAJAK v2

> **Scope:** Make the application fully usable on mobile devices (≥320px) without changing any desktop layout, styling, or behavior.
> **Strategy:** Additive-only. All changes use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Desktop breakpoints remain untouched.

---

## Status Saat Ini

| Area | Status |
|------|--------|
| `index.html` viewport meta | ✅ Sudah ada |
| `MainLayout` — mobile sidebar overlay | ✅ Sudah ada (skeleton) |
| `MainLayout` — sidebar slide-in | ✅ Sudah ada |
| `Topbar` — hamburger mobile | ✅ Sudah ada |
| `Topbar` — user info mobile | ✅ Sudah ada (avatar only) |
| `Login` — mobile logo fallback | ✅ Sudah ada |
| `Sidebar` — collapsed state | ✅ Sudah ada |
| Data table — `overflow-x-auto` | ✅ Sudah ada |
| `Pagination` — `flex-col sm:flex-row` | ✅ Sudah ada |
| `Modal` — `p-4` padding | ✅ Sudah ada |
| Dashboard stat grid `grid-cols-2` | ✅ Sudah ada |
| Toolbar buttons wrapping | ⚠️ Perlu perbaikan |
| Table toolbar — search full-width mobile | ⚠️ Perlu perbaikan |
| `StatCard` mobile padding/text | ⚠️ Perlu perbaikan |
| Form grid dalam modal (2 col) | ⚠️ Perlu perbaikan |
| `Pagination` info text overflow | ⚠️ Perlu perbaikan |
| Bottom safe area (notch devices) | ❌ Belum ada |
| Touch tap targets (min 44px) | ⚠️ Beberapa perlu penyesuaian |

---

## File yang Diubah

### 1. `index.html`
Tambah `viewport-fit=cover` untuk support notch/safe area iPhone.

```diff
- <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+ <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

---

### 2. `src/index.css`
Tambah CSS utility untuk safe area insets (iPhone notch/bottom bar).

```css
@layer utilities {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
}
```

---

### 3. `src/components/layout/MainLayout.tsx`
- Tambah `pb-safe` pada `<main>` untuk safe area iOS bottom.
- Pastikan main content tidak tertimpa sidebar overlay saat mobile.

```diff
- <main className="p-4 lg:p-6">
+ <main className="p-4 lg:p-6 pb-safe">
```

---

### 4. `src/components/ui/StatCard.tsx`
Sesuaikan padding dan ukuran teks agar nyaman di layar kecil.

```diff
- className="p-5"
+ className="p-4 sm:p-5"
```

---

### 5. `src/components/ui/Pagination.tsx`
Sederhanakan info text agar tidak overflow di mobile (< 375px).

```diff
- <span>dari {totalItems} data (menampilkan {startItem}–{endItem})</span>
+ <span className="hidden sm:inline">dari {totalItems} data (menampilkan {startItem}–{endItem})</span>
+ <span className="sm:hidden">{startItem}–{endItem} / {totalItems}</span>
```

---

### 6. `src/components/ui/Modal.tsx`
Modal saat ini sudah `p-4` di container, tapi padding header/body perlu dikurangi di mobile.

```diff
- 'px-6 py-4 border-b ...'   (header)
+ 'px-4 sm:px-6 py-3 sm:py-4 border-b ...'

- 'flex-1 overflow-y-auto px-6 py-4'  (body)
+ 'flex-1 overflow-y-auto px-4 sm:px-6 py-4'

- 'max-h-[90vh]'
+ 'max-h-[95dvh] sm:max-h-[90vh]'   (gunakan dvh untuk mobile browser chrome)
```

---

### 7. `src/pages/FakturPajak.tsx` & `src/pages/FakturPajakSetor.tsx`
Toolbar action buttons: tambah `flex-wrap` dan buat search full-width di mobile.

```diff
- <div className="flex items-center gap-2 flex-wrap">
+ <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">

- <div className="relative max-w-xs w-full">
+ <div className="relative w-full lg:max-w-xs">
```

Form grid di dalam modal (`FakturModal`): ubah 2-col grid agar single-col di mobile.

```diff
- className="grid grid-cols-2 gap-4"
+ className="grid grid-cols-1 sm:grid-cols-2 gap-4"
```

---

### 8. `src/pages/KalkulatorPPH21.tsx`, `EditProfil.tsx`, `MasterVendor.tsx`, `MasterUser.tsx`, `MasterUnitKerja.tsx`
Audit masing-masing untuk grid form 2-col → ubah ke `grid-cols-1 sm:grid-cols-2`.

---

### 9. `src/pages/PenerbitanFakturKeluaran.tsx` & `PembatalanFakturPajak.tsx`
Sama — audit grid dan toolbar button wrap.

---

## Urutan Pengerjaan

1. `index.html` — viewport-fit
2. `src/index.css` — safe area utilities
3. `src/components/layout/MainLayout.tsx` — pb-safe
4. `src/components/ui/Modal.tsx` — responsive padding + dvh
5. `src/components/ui/Pagination.tsx` — compact info text
6. `src/components/ui/StatCard.tsx` — padding responsive
7. `src/pages/FakturPajak.tsx` — toolbar + form grid
8. `src/pages/FakturPajakSetor.tsx` — toolbar + form grid
9. `src/pages/KalkulatorPPH21.tsx` — form grid
10. `src/pages/EditProfil.tsx` — form grid
11. `src/pages/MasterVendor.tsx` — toolbar + form grid
12. `src/pages/MasterUser.tsx` — toolbar + form grid
13. `src/pages/MasterUnitKerja.tsx` — toolbar + form grid
14. `src/pages/PenerbitanFakturKeluaran.tsx` — grid audit
15. `src/pages/PembatalanFakturPajak.tsx` — grid audit

---

## Prinsip

- **Zero desktop regression** — semua perubahan menggunakan prefix `sm:` atau `lg:` sebagai guard.
- **No new components** — tidak ada komponen baru, hanya perubahan Tailwind class.
- **Table tetap horizontal-scroll** — tidak diubah menjadi card layout; `overflow-x-auto` sudah cukup.
- **Sidebar mobile** — sudah ada slide-in overlay, tidak perlu diubah.

---

## Pengujian

| Device | Breakpoint | Target |
|--------|-----------|--------|
| iPhone SE | 375px | Login, Dashboard, Table scroll, Modal form |
| iPhone 14 Pro | 390px | Semua halaman |
| Android mid-range | 412px | Semua halaman |
| iPad | 768px | Sidebar desktop tampil |
| Desktop | 1280px | Tidak ada perubahan visual |
