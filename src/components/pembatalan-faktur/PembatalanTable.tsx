import React from 'react';
import { FileText, Inbox } from 'lucide-react';

import type { PembatalanFakturPajak } from '../../types';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import StatusBadgeBatal from './StatusBadgeBatal';

interface Props {
  data: PembatalanFakturPajak[];
  onReviewApprove: (item: PembatalanFakturPajak) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  columnFilters: Record<string, string>;
  onColumnFilterChange: (key: string, value: string) => void;
}

const headerClass = 'px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase tracking-wider whitespace-nowrap';
const filterClass = 'px-4 py-1.5';
const cellClass = 'px-4 py-3 text-sm text-gray-700 whitespace-nowrap';

const filterInputClass =
  'w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white';

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

const PembatalanTable: React.FC<Props> = ({
  data,
  onReviewApprove,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  columnFilters,
  onColumnFilterChange,
}) => {
  const checkDuplicateSO = (so: string, id: string) => {
    return data.filter((d) => d.noSONoDoc === so && d.id !== id).length > 0;
  };

  const getFormatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short' }).format(new Date(d));
    } catch {
      return d;
    }
  };

  const renderFilter = (key: string, placeholder = 'Filter...') => (
    <input
      type="text"
      value={columnFilters[key] || ''}
      onChange={(e) => onColumnFilterChange(key, e.target.value)}
      placeholder={placeholder}
      className={filterInputClass}
    />
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[2400px]">
        <thead>
          <tr className="bg-gray-50/80">
            <th className={cn(headerClass, 'w-10 text-center')}>
              <input
                type="checkbox"
                checked={data.length > 0 && selectedIds.length === data.length}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
              />
            </th>
            <th className={headerClass}>No</th>
            <th className={headerClass}>Tgl Request FP</th>
            <th className={headerClass}>No. SO / Doc SAP</th>
            <th className={headerClass}>Tanggal SO</th>
            <th className={headerClass}>Nama Customer</th>
            <th className={headerClass}>Jenis</th>
            <th className={headerClass}>NPWP</th>
            <th className={cn(headerClass, 'text-right')}>Total Tagihan</th>
            <th className={cn(headerClass, 'text-right')}>Nilai Transaksi</th>
            <th className={cn(headerClass, 'text-right bg-amber-50')}>DPP</th>
            <th className={cn(headerClass, 'text-right bg-amber-50')}>PPN</th>
            <th className={headerClass}>Keterangan Transaksi</th>
            <th className={headerClass}>Quantity</th>
            <th className={headerClass}>Alamat</th>
            <th className={headerClass}>Requester</th>
            <th className={headerClass}>Unit Kerja</th>
            <th className={headerClass}>HP/Ext</th>
            <th className={headerClass}>Nomor Faktur Pajak</th>
            <th className={headerClass}>Tgl Faktur Pajak</th>
            <th className={headerClass}>Alasan Pembatalan</th>
            <th className={headerClass}>Tgl Pengajuan Batal</th>
            <th className={headerClass}>Status Pembatalan</th>
            <th className={cn(headerClass, 'text-center')}>PDF</th>
            <th className={headerClass}>Aksi</th>
          </tr>
          <tr className="bg-gray-50/40 border-b border-gray-100">
            <th className={filterClass} />
            <th className={filterClass} />
            <th className={filterClass}>{renderFilter('tanggalRequestFP')}</th>
            <th className={filterClass}>{renderFilter('noSONoDoc')}</th>
            <th className={filterClass}>{renderFilter('tanggalSO')}</th>
            <th className={filterClass}>{renderFilter('namaCustomer')}</th>
            <th className={filterClass}>{renderFilter('jenisFaktur')}</th>
            <th className={filterClass}>{renderFilter('npwp')}</th>
            <th className={filterClass}>{renderFilter('totalTagihan')}</th>
            <th className={filterClass}>{renderFilter('nilaiTransaksi')}</th>
            <th className={filterClass}>{renderFilter('dpp')}</th>
            <th className={filterClass}>{renderFilter('ppn')}</th>
            <th className={filterClass}>{renderFilter('keteranganTransaksi')}</th>
            <th className={filterClass}>{renderFilter('quantity')}</th>
            <th className={filterClass}>{renderFilter('alamat')}</th>
            <th className={filterClass}>{renderFilter('requester')}</th>
            <th className={filterClass}>{renderFilter('unitKerja')}</th>
            <th className={filterClass}>{renderFilter('hp')}</th>
            <th className={filterClass}>{renderFilter('nomorFakturPajak')}</th>
            <th className={filterClass}>{renderFilter('tanggalFakturPajak')}</th>
            <th className={filterClass}>{renderFilter('alasanPembatalan')}</th>
            <th className={filterClass}>{renderFilter('createdAt')}</th>
            <th className={filterClass}>{renderFilter('status')}</th>
            <th className={filterClass} />
            <th className={filterClass} />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={25} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Inbox className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-normal text-gray-600">Data tidak ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Belum ada pengajuan pembatalan faktur pajak.</p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const isDuplicate = checkDuplicateSO(row.noSONoDoc, row.id);
              const isDisetujui = row.status === 'Pembatalan Disetujui';
              const rowClass = cn(
                'hover:bg-blue-50/40 transition-colors',
                isDisetujui && 'bg-emerald-50/50',
                row.status === 'Pembatalan Ditolak' && 'bg-red-50/50',
                isDuplicate && 'bg-fuchsia-50 hover:bg-fuchsia-100/80'
              );

              return (
                <tr key={row.id} className={rowClass}>
                  <td className={cn(cellClass, 'text-center')}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleSelect(row.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                    />
                  </td>
                  <td className={cn(cellClass)}>{index + 1}</td>
                  <td className={cellClass}>{row.tanggalRequestFP}</td>
                  <td className={cn(cellClass, 'text-blue-800')}>{row.noSONoDoc}</td>
                  <td className={cellClass}>{row.tanggalSO}</td>
                  <td className={cn(cellClass, 'max-w-xs truncate')} title={row.namaCustomer}>{row.namaCustomer}</td>
                  <td className={cn(cellClass, 'text-center')}>
                    <span className={cn(
                      'px-2 py-1 text-[10px] uppercase font-normal rounded-md border',
                      row.jenisFaktur === 'Subsidi'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    )}>
                      {row.jenisFaktur}
                    </span>
                  </td>
                  <td className={cn(cellClass, 'text-xs')}>{row.npwp}</td>
                  <td className={cn(cellClass, 'text-right text-gray-900 tabular-nums', isDisetujui && 'line-through text-gray-400')}>{formatRupiah(row.totalTagihan)}</td>
                  <td className={cn(cellClass, 'text-right tabular-nums', isDisetujui && 'line-through text-gray-400')}>{formatRupiah(row.nilaiTransaksi)}</td>
                  <td className={cn(cellClass, 'text-right bg-yellow-50/60 text-yellow-900 tabular-nums', isDisetujui && 'line-through opacity-50')}>{formatRupiah(row.dpp)}</td>
                  <td className={cn(cellClass, 'text-right bg-yellow-50/60 text-yellow-900 tabular-nums', isDisetujui && 'line-through opacity-50')}>{formatRupiah(row.ppn)}</td>
                  <td className={cn(cellClass, 'max-w-[200px] truncate')} title={row.keteranganTransaksi}>{row.keteranganTransaksi || '-'}</td>
                  <td className={cn(cellClass, 'text-center')}>{row.quantity || '-'}</td>
                  <td className={cn(cellClass, 'max-w-[200px] truncate')} title={row.alamat}>{row.alamat || '-'}</td>
                  <td className={cellClass}>{row.requesterNama}/{row.requesterBadge}</td>
                  <td className={cellClass}>{row.unitKerja}</td>
                  <td className={cellClass}>{row.hp}</td>
                  <td className={cn(cellClass)}>{row.nomorFakturPajak || '-'}</td>
                  <td className={cellClass}>{row.tanggalFakturPajak || '-'}</td>
                  <td className={cn(cellClass, 'max-w-[200px] truncate group relative bg-amber-50/30')}>
                    {row.alasanPembatalan}
                    <div className="absolute z-30 invisible group-hover:visible bg-black text-white p-2 rounded text-xs whitespace-normal w-64 mt-1">
                      {row.alasanPembatalan}
                    </div>
                  </td>
                  <td className={cellClass}>{getFormatDate(row.createdAt)}</td>
                  <td className={cn(cellClass, 'min-w-[170px]')}>
                    <StatusBadgeBatal status={row.status} />
                  </td>
                  <td className={cn(cellClass, 'text-center')}>
                    <a
                      href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      title="Lihat PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                  </td>
                  <td className={cn(cellClass, 'text-center')}>
                    <Button size="sm" variant="outline" onClick={() => onReviewApprove(row)}>Detail</Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PembatalanTable;
