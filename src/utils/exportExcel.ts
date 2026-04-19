import * as XLSX from 'xlsx';
import type { FakturPajak } from '../types';
import { formatCurrency } from './formatCurrency';

export function exportToExcel(data: any[], filename: string = 'export', sheetName: string = 'Data') {
  if (data.length === 0) return;

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map((row) => String(row[key as keyof typeof row] || '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function parseImportFile(file: File): Promise<Partial<FakturPajak>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        const parsed: Partial<FakturPajak>[] = json.map((row) => ({
          tanggalPengajuan: row['Tanggal Pengajuan'] || '',
          tanggalFaktur: row['Tanggal Faktur'] || '',
          noMVP: row['No MVP'] || '',
          nomorFakturPajak: row['Nomor Faktur Pajak'] || '',
          kodeFakturSAP: (row['Kode Faktur SAP'] as 'BV' | 'BZ') || 'BV',
          npwpVendor: row['NPWP Vendor'] || '',
          namaPerusahaan: row['Nama Perusahaan'] || '',
          nilaiPPN: parseInt(String(row['Nilai PPN'] || '0').replace(/[^\d]/g, ''), 10) || 0,
          verifikator: row['Verifikator'] || '',
          status: (row['Status'] as FakturPajak['status']) || 'Pending',
          keterangan: row['Keterangan'] || '',
          tanggalApprove: row['Tanggal Approve'] || '',
        }));

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}
