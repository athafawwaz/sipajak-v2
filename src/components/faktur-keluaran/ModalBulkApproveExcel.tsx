import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Download, Upload, CheckCircle2, XCircle, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import type { PenerbitanFakturKeluaran, DokumenPDF } from '../../types';
import DokumenUploader from './DokumenUploader';

interface ModalBulkApproveExcelProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItems: PenerbitanFakturKeluaran[];
  onBulkApprove: (results: BulkApproveRow[], docs: DokumenPDF[]) => void;
  selectedIds?: string[];
}

export interface BulkApproveRow {
  noSO: string;
  nomorFakturPajak: string;
  tanggalFakturPajak: string;
}

type Step = 'initial' | 'preview' | 'result';

interface ParsedRow {
  noSO: string;
  namaCustomer: string;
  nomorFakturPajak: string;
  tanggalFakturPajak: string;
  matched: boolean;
  matchedItem?: PenerbitanFakturKeluaran;
  error?: string;
}

interface BulkResult {
  total: number;
  success: number;
  failed: number;
  details: { noSO: string; namaCustomer: string; status: 'success' | 'error'; message: string }[];
}

const ModalBulkApproveExcel: React.FC<ModalBulkApproveExcelProps> = ({
  isOpen,
  onClose,
  pendingItems,
  onBulkApprove,
  selectedIds = [],
}) => {
  const [step, setStep] = useState<Step>('initial');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<DokumenPDF[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('initial');
    setParsedRows([]);
    setResult(null);
    setFileName('');
    setUploadedDocs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Determine which items go into the template:
  // - If user selected rows, only include selected items that are in pendingItems
  // - If no selection, include all pendingItems
  const templateItems = selectedIds.length > 0
    ? pendingItems.filter((item) => selectedIds.includes(item.id))
    : pendingItems;

  const hasSelection = selectedIds.length > 0;

  // --- DOWNLOAD TEMPLATE ---
  const handleDownloadTemplate = () => {
    const templateData = templateItems.map((item, idx) => ({
      'No': idx + 1,
      'No SO / No Doc': item.noSONoDoc,
      'Tgl Request FP': item.tanggalRequestFP,
      'Tgl SO': item.tanggalSO,
      'Nama Customer': item.namaCustomer,
      'NPWP': item.npwp,
      'Nilai Transaksi': item.nilaiTransaksi,
      'DPP': item.dpp,
      'PPN': item.ppn,
      'Requester': `${item.requesterNama} / ${item.requesterBadge}`,
      'Unit Kerja': item.unitKerja,
      '★ Nomor Faktur Pajak (ISI)': '',
      '★ Tanggal Faktur Pajak (DD/MM/YYYY)': '',
    }));

    if (templateData.length === 0) {
      return;
    }

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Auto-size columns
    const colWidths = Object.keys(templateData[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...templateData.map((row) => String((row as Record<string, unknown>)[key] || '').length)
      ) + 2,
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Bulk Approve');
    XLSX.writeFile(wb, `template-bulk-approve-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // --- UPLOAD & PARSE ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        const rows: ParsedRow[] = json.map((row) => {
          const noSO = String(row['No SO / No Doc'] || '').trim();
          // Support both old and new column headers
          const nomorFaktur = String(row['★ Nomor Faktur Pajak (ISI)'] || row['Nomor Faktur Pajak'] || '').trim();
          const rawTgl = row['★ Tanggal Faktur Pajak (DD/MM/YYYY)'] ?? row['Tanggal Faktur Pajak'];
          const namaCustomer = String(row['Nama Customer'] || '').trim();

          // Convert Excel serial date number to DD/MM/YYYY string
          let tglFaktur = '';
          if (rawTgl != null && rawTgl !== '') {
            const num = Number(rawTgl);
            if (!isNaN(num) && num > 10000) {
              // Excel serial number → JS Date
              const date = new Date(Math.round((num - 25569) * 86400 * 1000));
              const dd = String(date.getUTCDate()).padStart(2, '0');
              const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
              const yyyy = date.getUTCFullYear();
              tglFaktur = `${dd}/${mm}/${yyyy}`;
            } else {
              tglFaktur = String(rawTgl).trim();
            }
          }

          // Find matching item in pending list by noSONoDoc
          const matchedItem = pendingItems.find((item) => item.noSONoDoc === noSO);

          let error: string | undefined;
          if (!noSO) {
            error = 'No SO kosong';
          } else if (!matchedItem) {
            error = 'No SO tidak ditemukan dalam data pending';
          } else if (!nomorFaktur) {
            error = 'Nomor Faktur Pajak belum diisi';
          } else if (!tglFaktur) {
            error = 'Tanggal Faktur Pajak belum diisi';
          }

          return {
            noSO,
            namaCustomer: matchedItem?.namaCustomer || namaCustomer,
            nomorFakturPajak: nomorFaktur,
            tanggalFakturPajak: tglFaktur,
            matched: !!matchedItem && !!nomorFaktur && !!tglFaktur,
            matchedItem,
            error,
          };
        });

        // Filter out completely empty rows
        const nonEmptyRows = rows.filter((r) => r.noSO || r.nomorFakturPajak || r.tanggalFakturPajak);

        setParsedRows(nonEmptyRows);
        setStep('preview');
      } catch {
        setParsedRows([]);
        setStep('initial');
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- PROCESS BULK APPROVE ---
  const handleProcessApprove = () => {
    const validRows = parsedRows.filter((r) => r.matched);
    const invalidRows = parsedRows.filter((r) => !r.matched);

    // Call parent handler with valid rows + uploaded documents
    onBulkApprove(
      validRows.map((r) => ({
        noSO: r.noSO,
        nomorFakturPajak: r.nomorFakturPajak,
        tanggalFakturPajak: r.tanggalFakturPajak,
      })),
      uploadedDocs
    );

    const details = [
      ...validRows.map((r) => ({
        noSO: r.noSO,
        namaCustomer: r.namaCustomer,
        status: 'success' as const,
        message: `Approved - Faktur: ${r.nomorFakturPajak}`,
      })),
      ...invalidRows.map((r) => ({
        noSO: r.noSO,
        namaCustomer: r.namaCustomer,
        status: 'error' as const,
        message: r.error || 'Data tidak valid',
      })),
    ];

    setResult({
      total: parsedRows.length,
      success: validRows.length,
      failed: invalidRows.length,
      details,
    });
    setStep('result');
  };

  const validCount = parsedRows.filter((r) => r.matched).length;
  const invalidCount = parsedRows.filter((r) => !r.matched).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Approval via Excel"
      size="lg"
    >
      {/* Step 1: Initial - Download & Upload */}
      {step === 'initial' && (
        <div className="space-y-6 pb-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Petunjuk Penggunaan
            </h4>
            <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside">
              <li>Klik <strong>"Download Template"</strong> untuk mengunduh file Excel.</li>
              <li>Buka sheet <strong>"Petunjuk Pengisian"</strong> untuk membaca panduan lengkap.</li>
              <li>Buka sheet <strong>"Template Bulk Approve"</strong>, isi kolom bertanda <strong>★ (bintang)</strong>:</li>
            </ol>
            <div className="mt-2 ml-4 space-y-1">
              <div className="flex items-start gap-2 text-xs text-blue-700">
                <span className="text-amber-600 font-bold">★</span>
                <span><strong>Nomor Faktur Pajak</strong> — contoh: <code className="bg-blue-100 px-1 rounded">010.008-24.24104051</code></span>
              </div>
              <div className="flex items-start gap-2 text-xs text-blue-700">
                <span className="text-amber-600 font-bold">★</span>
                <span><strong>Tanggal Faktur Pajak</strong> — format: <code className="bg-blue-100 px-1 rounded">DD/MM/YYYY</code>, contoh: <code className="bg-blue-100 px-1 rounded">13/07/2024</code></span>
              </div>
            </div>
            <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside mt-2" start={4}>
              <li>Upload kembali file Excel yang sudah diisi ke sistem.</li>
              <li>Upload dokumen PDF pendukung, lalu klik <strong>"Proses Approve"</strong>.</li>
            </ol>
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>💡 Tips:</strong> Ketik tanda kutip satu (<code className="bg-amber-100 px-1 rounded">'</code>) sebelum tanggal agar Excel tidak mengubah formatnya. Contoh: <code className="bg-amber-100 px-1 rounded">'13/07/2024</code>
            </div>
          </div>

          {/* Pending count info */}
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              {hasSelection ? (
                <>Template akan berisi <strong>{templateItems.length}</strong> data terpilih dari <strong>{pendingItems.length}</strong> data yang menunggu approval.{templateItems.length === 0 && ' (Tidak ada data terpilih yang berstatus menunggu approval.)'}</>
              ) : (
                <>Terdapat <strong>{pendingItems.length}</strong> data yang menunggu approval Keuangan untuk Subsidi. Semua data akan dimasukkan ke template.</>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Download Template */}
            <button
              onClick={handleDownloadTemplate}
              disabled={templateItems.length === 0}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">Download Template</p>
                <p className="text-xs text-gray-500 mt-1">Unduh file Excel untuk diisi</p>
              </div>
            </button>

            {/* Upload File */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 hover:bg-green-50 hover:border-green-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">Upload File Excel</p>
                <p className="text-xs text-gray-500 mt-1">Unggah template yang sudah diisi</p>
              </div>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex justify-end border-t pt-4">
            <Button variant="outline" onClick={handleClose}>Tutup</Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview parsed data */}
      {step === 'preview' && (
        <div className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              File: <strong>{fileName}</strong>
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> {invalidCount} error
                </span>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="max-h-[400px] overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left font-normal text-gray-600">No SO</th>
                  <th className="px-3 py-2.5 text-left font-normal text-gray-600">Nama Customer</th>
                  <th className="px-3 py-2.5 text-left font-normal text-gray-600">No Faktur Pajak</th>
                  <th className="px-3 py-2.5 text-left font-normal text-gray-600">Tgl Faktur Pajak</th>
                  <th className="px-3 py-2.5 text-center font-normal text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className={row.matched ? 'bg-green-50/50' : 'bg-red-50/50'}>
                    <td className="px-3 py-2 text-gray-800">{row.noSO || '-'}</td>
                    <td className="px-3 py-2 text-gray-800">{row.namaCustomer || '-'}</td>
                    <td className="px-3 py-2 text-gray-800">{row.nomorFakturPajak || '-'}</td>
                    <td className="px-3 py-2 text-gray-800">{row.tanggalFakturPajak || '-'}</td>
                    <td className="px-3 py-2 text-center">
                      {row.matched ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-[10px] font-normal">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-[10px] font-normal" title={row.error}>
                          <XCircle className="w-3 h-3" /> {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Document Upload Section */}
          {validCount > 0 && (
            <div className="space-y-3">
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Upload Dokumen PDF</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Upload dokumen pendukung (PDF) yang akan dilampirkan ke semua data yang di-approve.
                  Minimal 1 dokumen wajib diunggah.
                </p>
                <DokumenUploader
                  value={uploadedDocs}
                  onChange={setUploadedDocs}
                  maxFiles={10}
                  maxSizeMB={10}
                />
              </div>
              {uploadedDocs.length === 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">Upload minimal 1 dokumen PDF untuk melanjutkan proses approval.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => { resetState(); }}>
              Kembali
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>Batal</Button>
              <Button
                variant="primary"
                onClick={handleProcessApprove}
                disabled={validCount === 0 || uploadedDocs.length === 0}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Proses Approve ({validCount})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Result summary */}
      {step === 'result' && result && (
        <div className="space-y-4 pb-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{result.total}</p>
              <p className="text-xs text-blue-600 mt-1">Total Data</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{result.success}</p>
              <p className="text-xs text-green-600 mt-1">Berhasil</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{result.failed}</p>
              <p className="text-xs text-red-600 mt-1">Gagal</p>
            </div>
          </div>

          {/* Detail Table */}
          <div className="max-h-[300px] overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left font-normal text-gray-600">No SO</th>
                  <th className="px-3 py-2.5 text-left font-normal text-gray-600">Nama Customer</th>
                  <th className="px-3 py-2.5 text-left font-normal text-gray-600">Keterangan</th>
                  <th className="px-3 py-2.5 text-center font-normal text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.details.map((d, idx) => (
                  <tr key={idx} className={d.status === 'success' ? 'bg-green-50/30' : 'bg-red-50/30'}>
                    <td className="px-3 py-2 text-gray-800">{d.noSO || '-'}</td>
                    <td className="px-3 py-2 text-gray-800">{d.namaCustomer || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{d.message}</td>
                    <td className="px-3 py-2 text-center">
                      {d.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button variant="primary" onClick={handleClose}>Selesai</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ModalBulkApproveExcel;
