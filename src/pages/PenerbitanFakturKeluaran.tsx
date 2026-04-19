import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useFakturKeluaranStore } from '../store/fakturKeluaranStore';
import type { PenerbitanFakturKeluaran } from '../types';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import FakturKeluaranTable from '../components/faktur-keluaran/FakturKeluaranTable';
import ModalInputFaktur from '../components/faktur-keluaran/ModalInputFaktur';
import ModalDetailApproval from '../components/faktur-keluaran/ModalDetailApproval';
import ModalAssignVP from '../components/faktur-keluaran/ModalAssignVP';
import ModalRevisi from '../components/faktur-keluaran/ModalRevisi';
import ModalKonfirmasiPembatalan from '../components/pembatalan-faktur/ModalKonfirmasiPembatalan';
import Pagination from '../components/ui/Pagination';
import { Plus, Download, Trash2, FileSpreadsheet, CheckCircle, Clock, Search } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useParams, useNavigate } from 'react-router-dom';

const PenerbitanFakturKeluaranPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    getByRole, addItem, bulkDelete, 
    submitPengajuan, approveVP, rejectVP, assignVP, approveKeuangan, rejectKeuangan, submitRevisi
  } = useFakturKeluaranStore();
  const addToast = useToastStore(s => s.addToast);
  const { jenis, kategori } = useParams<{ jenis: string, kategori: string }>();
  const isSubsidi = jenis === 'subsidi';
  const jenisFakturLabel = isSubsidi ? 'Subsidi' : 'Non Subsidi';
  const isPenerbitanBaru = kategori === 'baru';
  const kategoriLabel = isPenerbitanBaru ? 'Penerbitan Baru' : 'Tindak Lanjut';

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  
  // Modal states
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isRevisiOpen, setIsRevisiOpen] = useState(false);
  const [isBatalOpen, setIsBatalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PenerbitanFakturKeluaran | null>(null);

  // Reset states when switching submenus
  React.useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setColumnFilters({});
    setSelectedIds([]);
  }, [jenis, kategori]);

  const role = user?.role || 'requester';
  const badge = user?.badge || '';
  const unitKerja = user?.unitKerja || '';

  const rawData = getByRole(role, badge, unitKerja).filter(d => d.jenisFaktur === jenisFakturLabel);

  const data = useMemo(() => {
    return rawData.filter((item) => {
      const status = item.status;
      if (isPenerbitanBaru) {
        return [
          'Draft',
          'Menunggu Assign VP',
          'Menunggu Approval VP',
          'Revisi',
          'Ditolak'
        ].includes(status);
      } else {
        return [
          'Menunggu Approval Keuangan',
          'Selesai',
          'Dalam Proses Pembatalan',
          'Dibatalkan'
        ].includes(status);
      }
    });
  }, [rawData, isPenerbitanBaru]);

  // Summary stats
  const stats = useMemo(() => {
    let pending = 0;
    if (role === 'vp') pending = data.filter(d => d.status === 'Menunggu Approval VP' && d.assignedVPId === badge).length;
    else if (role === 'keuangan') pending = data.filter(d => d.status === 'Menunggu Approval Keuangan' || d.status === 'Menunggu Assign VP').length;
    else pending = data.filter(d => d.status === 'Menunggu Approval VP' || d.status === 'Menunggu Assign VP' || d.status === 'Menunggu Approval Keuangan').length;

    const approved = data.filter(d => d.status === 'Selesai').length;
    const totalPPN = data.reduce((sum, item) => sum + (item.ppn || 0), 0);

    return {
      total: data.length,
      pending,
      approved,
      totalPPN
    };
  }, [data, role, badge]);

  // Filter & Pagination logic
  const filteredData = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const getColumnValue = (item: PenerbitanFakturKeluaran, key: string) => {
      if (key === 'requester') return `${item.requesterNama}/${item.requesterBadge}`;
      const value = (item as unknown as Record<string, unknown>)[key];
      return value == null ? '' : String(value);
    };

    return data.filter((item) => {
      const matchesGlobal =
        !lowerQuery ||
        item.namaCustomer.toLowerCase().includes(lowerQuery) ||
        item.noSONoDoc.toLowerCase().includes(lowerQuery) ||
        (item.nomorFakturPajak && item.nomorFakturPajak.toLowerCase().includes(lowerQuery));

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
    if (window.confirm(`Hapus ${selectedIds.length} data terpilih?`)) {
      bulkDelete(selectedIds);
      setSelectedIds([]);
      addToast('Data berhasil dihapus', 'success');
    }
  };

  const handleInputSubmit = (formData: Partial<PenerbitanFakturKeluaran>, isDraft: boolean) => {
    addItem({ ...formData, jenisFaktur: jenisFakturLabel } as any);
    setIsInputOpen(false);
    if (!isDraft) {
      setTimeout(() => {
        const latest = getByRole(role, badge, unitKerja)[0];
        if (latest) submitPengajuan(latest.id);
      }, 0);
    }
    addToast(isDraft ? 'Draft disimpan' : 'Pengajuan berhasil disubmit', 'success');
  };

  // Handlers for Review/Approve
  const handleReviewApprove = (item: PenerbitanFakturKeluaran) => {
    setActiveItem(item);
    setIsDetailOpen(true);
  };

  const handleApprove = (id: string, notes?: string, invoiceData?: {no: string, tgl: string, docs: any[]}) => {
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
      approveKeuangan(id, approverLogInfo, invoiceData!.no, invoiceData!.tgl, invoiceData!.docs);
    }
    setIsDetailOpen(false);
    addToast('Pengajuan berhasil di-approve', 'success');
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
    addToast('Pengajuan ditolak', 'error');
  };

  const handleOpenAssignVP = (item: PenerbitanFakturKeluaran) => {
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

  const handleOpenRevisi = (item: PenerbitanFakturKeluaran) => {
    setActiveItem(item);
    setIsRevisiOpen(true);
  };

  const handleSubmitRevisi = (id: string, newData: Partial<PenerbitanFakturKeluaran>) => {
    submitRevisi(id, newData);
    setIsRevisiOpen(false);
    addToast('Revisi berhasil disubmit', 'success');
  };

  const handleAjukanBatal = (item: PenerbitanFakturKeluaran) => {
    setActiveItem(item);
    setIsBatalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-3">{kategoriLabel} Faktur Pajak - {jenisFakturLabel}</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola data permohonan penerbitan faktur pajak keluaran ({jenisFakturLabel.toLowerCase()}) untuk tahap {kategoriLabel.toLowerCase()}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Pengajuan" value={stats.total} icon={<FileSpreadsheet className="w-5 h-5" />} color="blue" />
        <StatCard label="Menunggu Approval" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="yellow" />
        <StatCard label="Selesai" value={stats.approved} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        {/* <StatCard label="Total Nilai PPN" value={`Rp ${stats.totalPPN.toLocaleString('id-ID')}`} icon={<Send className="w-5 h-5" />} color="gray" /> */}
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Toolbar & Search */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {role === 'requester' && isPenerbitanBaru && (
              <Button size="sm" onClick={() => setIsInputOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Input Faktur
              </Button>
            )}
            <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              Export Excel
            </Button>
            {role === 'keuangan' && selectedIds.length > 0 && (
              <Button size="sm" onClick={handleBulkDelete} variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                Hapus ({selectedIds.length})
              </Button>
            )}
          </div>

          <div className="relative max-w-xs w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari data..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        <FakturKeluaranTable 
          data={paginatedData}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onReviewApprove={handleReviewApprove}
          columnFilters={columnFilters}
          onColumnFilterChange={handleColumnFilterChange}
        />

        {/* Pagination component embedded identically to PPH Masukan */}
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
      <ModalInputFaktur 
        isOpen={isInputOpen} 
        onClose={() => setIsInputOpen(false)} 
        onSubmit={handleInputSubmit} 
      />

      <ModalDetailApproval
        isOpen={isDetailOpen}
        onClose={() => {setIsDetailOpen(false); setActiveItem(null);}}
        data={activeItem}
        onApprove={handleApprove}
        onReject={handleReject}
        onAssignVP={handleOpenAssignVP}
        onRevisi={handleOpenRevisi}
        onAjukanBatal={handleAjukanBatal}
        onLihatPembatalan={() => navigate('/pph-keluaran/pembatalan-faktur-pajak')}
      />

      <ModalAssignVP
        isOpen={isAssignOpen}
        onClose={() => {setIsAssignOpen(false); setActiveItem(null);}}
        onAssign={handleAssignVP}
      />

      <ModalRevisi
        isOpen={isRevisiOpen}
        onClose={() => {setIsRevisiOpen(false); setActiveItem(null);}}
        data={activeItem}
        onSubmit={handleSubmitRevisi}
      />

      <ModalKonfirmasiPembatalan
        isOpen={isBatalOpen}
        onClose={() => {setIsBatalOpen(false); setActiveItem(null);}}
        faktur={activeItem}
      />
    </div>
  );
};

export default PenerbitanFakturKeluaranPage;
