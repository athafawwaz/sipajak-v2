import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePembatalanFakturStore } from '../store/pembatalanFakturStore';
import type { PembatalanFakturPajak } from '../types';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import PembatalanTable from '../components/pembatalan-faktur/PembatalanTable';
import ModalDetailApprovalBatal from '../components/pembatalan-faktur/ModalDetailApprovalBatal';
import ModalRevisiBatalan from '../components/pembatalan-faktur/ModalRevisiBatalan';
import ModalAssignVP from '../components/faktur-keluaran/ModalAssignVP';
import Pagination from '../components/ui/Pagination';
import { Download, Trash2, FileX, Clock, CheckCircle, Search } from 'lucide-react';
import { useToastStore } from '../store/toastStore';

const PembatalanFakturPajakPage: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    getByRole, bulkDelete, 
    approveVP, rejectVP, assignVP, approveKeuangan, rejectKeuangan, submitRevisi
  } = usePembatalanFakturStore();
  const addToast = useToastStore(s => s.addToast);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  
  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRevisiOpen, setIsRevisiOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PembatalanFakturPajak | null>(null);

  const role = user?.role || 'requester';
  const badge = user?.badge || '';
  const unitKerja = user?.unitKerja || '';

  const data = getByRole(role, badge, unitKerja);

  // Summary stats
  const stats = useMemo(() => {
    let pending = 0;
    if (role === 'vp') pending = data.filter(d => d.status === 'Menunggu Approval VP' && d.assignedVPId === badge).length;
    else if (role === 'keuangan') pending = data.filter(d => d.status === 'Menunggu Approval Keuangan').length;
    else pending = data.filter(d => d.status === 'Menunggu Approval VP' || d.status === 'Menunggu Approval Keuangan').length;

    const disetujui = data.filter(d => d.status === 'Pembatalan Disetujui').length;
    const totalPPNDibatalkan = data
       .filter(d => d.status === 'Pembatalan Disetujui')
       .reduce((sum, item) => sum + (item.ppn || 0), 0);

    return {
      total: data.length,
      pending,
      disetujui,
      totalPPNDibatalkan
    };
  }, [data, role, badge]);

  // Filter & Pagination logic
  const filteredData = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const getColumnValue = (item: PembatalanFakturPajak, key: string) => {
      if (key === 'requester') return `${item.requesterNama}/${item.requesterBadge}`;
      const value = (item as unknown as Record<string, unknown>)[key];
      return value == null ? '' : String(value);
    };

    return data.filter((item) => {
      const matchesGlobal =
        !lowerQuery ||
        item.namaCustomer.toLowerCase().includes(lowerQuery) ||
        item.noSONoDoc.toLowerCase().includes(lowerQuery) ||
        (item.nomorFakturPajak && item.nomorFakturPajak.toLowerCase().includes(lowerQuery)) ||
        item.alasanPembatalan.toLowerCase().includes(lowerQuery);

      const matchesColumns = Object.entries(columnFilters).every(([key, value]) => {
        if (!value) return true;
        return getColumnValue(item, key).toLowerCase().includes(value.toLowerCase());
      });

      return matchesGlobal && matchesColumns;
    });
  }, [data, searchQuery, columnFilters]);

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) setSelectedIds([]);
    else setSelectedIds(paginatedData.map(d => d.id));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Hapus ${selectedIds.length} data pengajuan terpilih? (Ini tidak membatalkan proses, hanya menghapus record)`)) {
      bulkDelete(selectedIds);
      setSelectedIds([]);
      addToast('Data berhasil dihapus', 'success');
    }
  };

  // Handlers for Review/Approve
  const handleReviewApprove = (item: PembatalanFakturPajak) => {
    setActiveItem(item);
    setIsDetailOpen(true);
  };

  const handleApprove = (id: string, notes?: string) => {
    const approverLogInfo = {
       step: role === 'vp' ? 1 : 2 as 1|2,
       role: role as 'vp'|'keuangan',
       approverName: user?.name || '',
       approverBadge: user?.badge || '',
       action: 'approve' as 'approve'|'reject',
       catatan: notes
    };

    if (role === 'vp') {
      approveVP(id, approverLogInfo);
    } else if (role === 'keuangan') {
      approveKeuangan(id, approverLogInfo);
    }
    setIsDetailOpen(false);
    addToast('Pengajuan pembatalan berhasil disetujui', 'success');
  };

  const handleReject = (id: string, notes: string) => {
    const approverLogInfo = {
       step: role === 'vp' ? 1 : 2 as 1|2,
       role: role as 'vp'|'keuangan',
       approverName: user?.name || '',
       approverBadge: user?.badge || '',
       action: 'reject' as 'approve'|'reject',
    };

    if (role === 'vp') {
      rejectVP(id, approverLogInfo, notes);
    } else if (role === 'keuangan') {
      rejectKeuangan(id, approverLogInfo, notes);
    }
    setIsDetailOpen(false);
    addToast('Pengajuan pembatalan ditolak', 'error');
  };

  const handleOpenAssignVP = (item: PembatalanFakturPajak) => {
    setActiveItem(item);
    setIsAssignOpen(true);
  };

  const handleAssignVP = (vpId: string, vpNama: string) => {
    if (activeItem) {
      assignVP(activeItem.id, vpId, vpNama);
      setIsAssignOpen(false);
      addToast(`VP ${vpNama} berhasil diassign`, 'success');
    }
  };

  const handleOpenRevisi = (item: PembatalanFakturPajak) => {
    setActiveItem(item);
    setIsRevisiOpen(true);
  };

  const handleSubmitRevisi = (id: string, alasan: string, dokumen: any[]) => {
    submitRevisi(id, alasan, dokumen);
    setIsRevisiOpen(false);
    addToast('Revisi pembatalan berhasil disubmit', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembatalan Faktur Pajak</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar pengajuan pembatalan faktur pajak keluaran yang sudah selesai.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <StatCard label="Total Pengajuan Batal" value={stats.total} icon={<FileX className="w-5 h-5 text-blue-600" />} color="blue" />
        <StatCard label="Menunggu Approval" value={stats.pending} icon={<Clock className="w-5 h-5 text-amber-600" />} color="yellow" />
        <StatCard label="Pembatalan Disetujui" value={stats.disetujui} icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} color="green" />
        {/* <StatCard label="Total PPN Dibatalkan" value={`Rp ${stats.totalPPNDibatalkan.toLocaleString('id-ID')}`} icon={<DollarSign className="w-5 h-5 text-red-100" />} color="red" /> */}
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Toolbar & Search */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              Export Excel
            </Button>
            {role === 'keuangan' && selectedIds.length > 0 && (
              <Button size="sm" onClick={handleBulkDelete} variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                Hapus ({selectedIds.length})
              </Button>
            )}
            {/* Requester doesn't have "+ Input" button since they do it from Penerbitan page */}
          </div>

          <div className="relative max-w-xs w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari data (Customer, Alasan...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Table implementation */}
        <PembatalanTable 
          data={paginatedData}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onReviewApprove={handleReviewApprove}
          onAssignVP={handleOpenAssignVP}
          onRevisi={handleOpenRevisi}
          columnFilters={columnFilters}
          onColumnFilterChange={handleColumnFilterChange}
        />

        <div className="px-5 py-3 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <ModalDetailApprovalBatal
        isOpen={isDetailOpen}
        onClose={() => {setIsDetailOpen(false); setActiveItem(null);}}
        data={activeItem}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ModalRevisiBatalan
        isOpen={isRevisiOpen}
        onClose={() => {setIsRevisiOpen(false); setActiveItem(null);}}
        data={activeItem}
        onSubmit={handleSubmitRevisi}
      />

      {/* Reuse ModalAssignVP from FakturKeluaran */}
      <ModalAssignVP
        isOpen={isAssignOpen}
        onClose={() => {setIsAssignOpen(false); setActiveItem(null);}}
        onAssign={handleAssignVP}
      />
    </div>
  );
};

export default PembatalanFakturPajakPage;
