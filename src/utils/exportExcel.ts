import * as XLSX from 'xlsx';
import type { FakturPajak } from '../types';
import { formatCurrency } from './formatCurrency';

export function exportToExcel(data: FakturPajak[], filename: string = 'faktur-pajak') {
  const exportData = data.map((item) => ({
    'No': item.no,
    'Tanggal': item.tanggal,
    'No MVP': item.noMVP,
    'Nomor Faktur Pajak': item.nomorFakturPajak,
    'Kode Faktur SAP': item.kodeFakturSAP,
    'Nama Perusahaan': item.namaPerusahaan,
    'Nilai PPN': formatCurrency(item.nilaiPPN),
    'Verifikator': item.verifikator,
    'Status': item.status,
    'Keterangan': item.keterangan || '',
    'Tanggal Approve': item.tanggalApprove || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faktur Pajak');

  // Auto-size columns
  const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...exportData.map((row) => String(row[key as keyof typeof row]).length)) + 2,
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
          tanggal: row['Tanggal'] || '',
          noMVP: row['No MVP'] || '',
          nomorFakturPajak: row['Nomor Faktur Pajak'] || '',
          kodeFakturSAP: (row['Kode Faktur SAP'] as 'BV' | 'BZ') || 'BV',
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
