import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, RotateCcw, Printer } from 'lucide-react';
import Button from '../components/ui/Button';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../utils/formatCurrency';
import type { Tunjangan, StatusPTKP } from '../types';
import { cn } from '../utils/cn';

// --- PTKP Values 2024 ---
const PTKP_VALUES: Record<StatusPTKP, number> = {
  'TK/0': 54_000_000,
  'TK/1': 58_500_000,
  'TK/2': 63_000_000,
  'TK/3': 67_500_000,
  'K/0': 58_500_000,
  'K/1': 63_000_000,
  'K/2': 67_500_000,
  'K/3': 72_000_000,
};

// --- Progressive tax brackets ---
const TAX_BRACKETS = [
  { limit: 60_000_000, rate: 0.05, label: 's.d. Rp 60 juta' },
  { limit: 250_000_000, rate: 0.15, label: 'Rp 60 juta – Rp 250 juta' },
  { limit: 500_000_000, rate: 0.25, label: 'Rp 250 juta – Rp 500 juta' },
  { limit: 5_000_000_000, rate: 0.30, label: 'Rp 500 juta – Rp 5 miliar' },
  { limit: Infinity, rate: 0.35, label: '> Rp 5 miliar' },
];

const KalkulatorPPH21: React.FC = () => {
  const [statusPTKP, setStatusPTKP] = useState<StatusPTKP>('TK/0');
  const [gajiPokok, setGajiPokok] = useState<number>(0);
  const [gajiDisplay, setGajiDisplay] = useState('');
  const [tunjangan, setTunjangan] = useState<Tunjangan[]>([]);

  // --- Tunjangan handlers ---
  const addTunjangan = useCallback(() => {
    setTunjangan((prev) => [
      ...prev,
      { id: `t-${Date.now()}`, nama: '', nilai: 0 },
    ]);
  }, []);

  const removeTunjangan = useCallback((id: string) => {
    setTunjangan((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTunjangan = useCallback((id: string, field: 'nama' | 'nilai', value: string | number) => {
    setTunjangan((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }, []);

  // --- Calculation ---
  const calculation = useMemo(() => {
    const totalTunjangan = tunjangan.reduce((sum, t) => sum + t.nilai, 0);
    const brutoPerBulan = gajiPokok + totalTunjangan;
    const brutoSetahun = brutoPerBulan * 12;

    // BPJS
    const bpjsKesehatanPerBulan = brutoPerBulan * 0.04;
    const bpjsJHTPerBulan = brutoPerBulan * 0.037;
    const totalBPJSPerBulan = bpjsKesehatanPerBulan + bpjsJHTPerBulan;
    const totalBPJSSetahun = totalBPJSPerBulan * 12;

    // Biaya Jabatan: 5% dari bruto, max 500.000/bulan
    const biayaJabatanPerBulan = Math.min(brutoPerBulan * 0.05, 500_000);
    const biayaJabatanSetahun = biayaJabatanPerBulan * 12;

    // Total pengurang
    const totalPengurang = biayaJabatanSetahun + totalBPJSSetahun;

    // Neto
    const netoSetahun = brutoSetahun - totalPengurang;

    // PTKP
    const ptkp = PTKP_VALUES[statusPTKP];

    // PKP
    const pkp = Math.max(netoSetahun - ptkp, 0);

    // Progressive tax
    let remainingPKP = pkp;
    let prevLimit = 0;
    const taxBreakdown = TAX_BRACKETS.map((bracket) => {
      const taxableInBracket = Math.min(
        Math.max(remainingPKP, 0),
        bracket.limit - prevLimit
      );
      const tax = taxableInBracket * bracket.rate;
      remainingPKP -= taxableInBracket;
      prevLimit = bracket.limit;
      return {
        label: bracket.label,
        rate: `${bracket.rate * 100}%`,
        taxable: taxableInBracket,
        tax,
      };
    });

    const pph21Setahun = taxBreakdown.reduce((sum, b) => sum + b.tax, 0);
    const pph21Sebulan = pph21Setahun / 12;

    return {
      brutoPerBulan,
      brutoSetahun,
      bpjsKesehatanPerBulan,
      bpjsJHTPerBulan,
      totalBPJSPerBulan,
      totalBPJSSetahun,
      biayaJabatanPerBulan,
      biayaJabatanSetahun,
      totalPengurang,
      netoSetahun,
      ptkp,
      pkp,
      taxBreakdown,
      pph21Setahun,
      pph21Sebulan,
      totalTunjangan,
    };
  }, [gajiPokok, tunjangan, statusPTKP]);

  const handleReset = () => {
    setStatusPTKP('TK/0');
    setGajiPokok(0);
    setGajiDisplay('');
    setTunjangan([]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ====================== LEFT: Form Input ====================== */}
      <div className="space-y-5">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Data Penghasilan</h2>

          {/* Status PTKP */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status PTKP
            </label>
            <select
              value={statusPTKP}
              onChange={(e) => setStatusPTKP(e.target.value as StatusPTKP)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {Object.keys(PTKP_VALUES).map((key) => (
                <option key={key} value={key}>
                  {key} — {formatCurrency(PTKP_VALUES[key as StatusPTKP])}
                </option>
              ))}
            </select>
          </div>

          {/* Gaji Pokok */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Penghasilan Bruto per Bulan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={gajiDisplay}
              onChange={(e) => {
                const num = parseCurrencyInput(e.target.value);
                setGajiPokok(num);
                setGajiDisplay(formatCurrencyInput(num));
              }}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* BPJS auto-hitung */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">BPJS Kesehatan (4%)</p>
              <p className="text-sm font-semibold text-blue-800 mt-1">
                {formatCurrency(calculation.bpjsKesehatanPerBulan)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">BPJS JHT (3,7%)</p>
              <p className="text-sm font-semibold text-blue-800 mt-1">
                {formatCurrency(calculation.bpjsJHTPerBulan)}
              </p>
            </div>
          </div>

          {/* Biaya Jabatan */}
          <div className="p-3 bg-gray-50 rounded-lg mb-5">
            <p className="text-xs text-gray-600 font-medium">
              Biaya Jabatan (5%, maks Rp 500.000/bulan)
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {formatCurrency(calculation.biayaJabatanPerBulan)}
            </p>
          </div>

          {/* Tunjangan */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Tunjangan Tambahan</h3>
              <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addTunjangan}>
                Tambah
              </Button>
            </div>

            {tunjangan.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                Belum ada tunjangan. Klik "Tambah" untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-2">
                {tunjangan.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama tunjangan"
                      value={t.nama}
                      onChange={(e) => updateTunjangan(t.id, 'nama', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={t.nilai ? formatCurrencyInput(t.nilai) : ''}
                      onChange={(e) => {
                        const num = parseCurrencyInput(e.target.value);
                        updateTunjangan(t.id, 'nilai', num);
                      }}
                      className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      onClick={() => removeTunjangan(t.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between pt-1 text-sm">
                  <span className="text-gray-500">Total Tunjangan:</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(calculation.totalTunjangan)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint} className="flex-1">
            Cetak / Export PDF
          </Button>
        </div>
      </div>

      {/* ====================== RIGHT: Hasil Perhitungan ====================== */}
      <div className="space-y-5 print:space-y-3">
        {/* Step 1: Bruto */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            1. Penghasilan Bruto Setahun
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Gaji Pokok × 12" value={formatCurrency(gajiPokok * 12)} />
            <Row label="Tunjangan × 12" value={formatCurrency(calculation.totalTunjangan * 12)} />
            <Divider />
            <Row label="Total Bruto Setahun" value={formatCurrency(calculation.brutoSetahun)} bold />
          </div>
        </div>

        {/* Step 2: Pengurang */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            2. Pengurang
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Biaya Jabatan Setahun" value={formatCurrency(calculation.biayaJabatanSetahun)} />
            <Row label="BPJS Kesehatan Setahun" value={formatCurrency(calculation.bpjsKesehatanPerBulan * 12)} />
            <Row label="BPJS JHT Setahun" value={formatCurrency(calculation.bpjsJHTPerBulan * 12)} />
            <Divider />
            <Row label="Total Pengurang" value={formatCurrency(calculation.totalPengurang)} bold />
          </div>
        </div>

        {/* Step 3: Neto */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            3. Penghasilan Neto Setahun
          </h3>
          <Row label="Bruto − Pengurang" value={formatCurrency(calculation.netoSetahun)} bold />
        </div>

        {/* Step 4: PTKP */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            4. PTKP ({statusPTKP})
          </h3>
          <Row label="Penghasilan Tidak Kena Pajak" value={formatCurrency(calculation.ptkp)} bold />
        </div>

        {/* Step 5: PKP */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            5. Penghasilan Kena Pajak (PKP)
          </h3>
          <Row label="Neto − PTKP" value={formatCurrency(calculation.pkp)} bold />
        </div>

        {/* Step 6: Tax Breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            6. Breakdown Tarif Progresif
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-3 font-semibold text-gray-600">Lapisan PKP</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">Tarif</th>
                  <th className="text-right py-2 pl-3 font-semibold text-gray-600">PKP di Lapisan</th>
                  <th className="text-right py-2 pl-3 font-semibold text-gray-600">Pajak</th>
                </tr>
              </thead>
              <tbody>
                {calculation.taxBreakdown.map((bracket, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      'border-b border-gray-50',
                      bracket.tax > 0 && 'bg-amber-50/50'
                    )}
                  >
                    <td className="py-2 pr-3 text-gray-700">{bracket.label}</td>
                    <td className="py-2 px-3 text-center font-medium text-gray-700">{bracket.rate}</td>
                    <td className="py-2 pl-3 text-right tabular-nums text-gray-600">
                      {formatCurrency(bracket.taxable)}
                    </td>
                    <td className="py-2 pl-3 text-right tabular-nums font-medium text-gray-900">
                      {formatCurrency(bracket.tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 7 & 8: Final Results */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary-light p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">PPH 21 Setahun</p>
                <p className="text-white text-2xl lg:text-3xl font-bold">{formatCurrency(calculation.pph21Setahun)}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">PPH 21 Sebulan</p>
                <p className="text-accent text-2xl lg:text-3xl font-bold">{formatCurrency(calculation.pph21Sebulan)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Helper Components ----
const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({ label, value, bold }) => (
  <div className="flex justify-between items-center">
    <span className={cn('text-gray-600', bold && 'font-semibold text-gray-800')}>{label}</span>
    <span className={cn('tabular-nums', bold ? 'font-bold text-gray-900' : 'text-gray-700')}>{value}</span>
  </div>
);

const Divider: React.FC = () => <div className="border-t border-dashed border-gray-200 my-1" />;

export default KalkulatorPPH21;
