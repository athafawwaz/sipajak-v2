# Panduan Commit & Push SI PAJAK

Gunakan dokumen ini sebagai acuan standar pesan commit dan penomoran versi (Versioning) untuk proyek **SI PAJAK v2** — Sistem Informasi Pajak PT. Pupuk Sriwidjaja Palembang.

> [!IMPORTANT]
> **Trigger Otomatis**: Jika USER menyebutkan (mention) file ini atau memberikan instruksi "@git_guidelines", AI wajib melakukan proses `git add`, `git commit`, dan `git push` secara otomatis mengikuti prosedur yang tertulis di sini.

## Format Pesan Commit

Pesan commit harus mengikuti template berikut:

```
[Update Major.Minor.Patch] - Deskripsi singkat perubahan
```

## Aturan Penomoran Versi (SemVer)

Struktur versi: `Angka1.Angka2.Angka3`

### 1. MAJOR (Angka Pertama)
Naikkan jika ada perubahan besar yang tidak kompatibel dengan versi sebelumnya (Breaking Changes).
- *Contoh: Rombak total UI, ganti framework, hapus modul inti, migrasi ke backend real.*

### 2. MINOR (Angka Kedua)
Naikkan jika menambah fitur baru atau fungsionalitas baru yang tidak merusak fitur lama.
- *Contoh: Tambah fitur Export Excel, tambah modul baru, integrasi SSO Keycloak.*
- **Catatan**: Jika Minor naik, Patch direset ke `0`.

### 3. PATCH (Angka Ketiga)
Naikkan untuk perbaikan bug, refactor kode, atau perubahan UI kecil.
- *Contoh: Fix logic approval VP, update dummy data, perbaikan typo, fix build error.*

---

## Alur Kerja Git (Step-by-Step)

1. **Cek Status**:
    ```bash
    git status
    ```

2. **Staging (Tambah File)**:
    ```bash
    git add .
    ```

3. **Commit (Gunakan Template)**:
    ```bash
    git commit -m "[Update X.Y.Z] - Penjelasan singkat"
    ```

4. **Push**:
    ```bash
    git push origin main
    ```

---

## Kewajiban Update Changelog (PENTING)

Sebelum melakukan push ke GitHub, AI atau Developer **WAJIB** memperbarui file `src/store/changelogStore.ts` agar versi di UI sinkron dengan riwayat commit.

### Langkah Update Changelog:

1. Buka `src/store/changelogStore.ts`.
2. Update konstanta `APP_VERSION` ke versi terbaru (sesuai aturan SemVer).
3. Tambahkan entry baru di bagian **paling atas** array `CHANGELOG`:
    ```ts
    {
      version: "X.Y.Z",
      date: "YYYY-MM-DD",
      type: "major" | "minor" | "patch",
      description: "Deskripsi perubahan yang sama dengan pesan commit"
    },
    ```
4. Lanjutkan dengan proses `git add`, `git commit`, dan `git push`.

---

## Contoh Skenario

| Versi Sekarang | Jenis Perubahan | Contoh Commit |
|---|---|---|
| `2.0.0` | Fix logic VP approval | `[Update 2.0.1] - Fix VP approval action not showing on detail modal` |
| `2.0.1` | Tambah fitur Changelog UI | `[Update 2.1.0] - Add version changelog modal in sidebar` |
| `2.1.0` | Integrasi SSO Keycloak | `[Update 2.2.0] - Integrate SSO Keycloak authentication` |
| `2.2.0` | Rombak UI total | `[Update 3.0.0] - Revamp full UI to new design system` |

---

## Tipe Perubahan yang Valid

| Tipe | Kapan Digunakan |
|---|---|
| `major` | Breaking changes, perubahan arsitektur besar |
| `minor` | Fitur baru, penambahan modul |
| `patch` | Bug fix, refactor, update data, perbaikan UI kecil |
