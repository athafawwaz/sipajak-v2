import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import PageLoader from './components/ui/PageLoader';
import NotificationModal from './components/ui/NotificationModal';

// --- Lazy loaded pages ---
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FakturPajakPage = lazy(() => import('./pages/FakturPajak'));
const KalkulatorPPH21 = lazy(() => import('./pages/KalkulatorPPH21'));
const EditProfil = lazy(() => import('./pages/EditProfil'));
const MasterUnitKerja = lazy(() => import('./pages/MasterUnitKerja'));
const MasterVendor = lazy(() => import('./pages/MasterVendor'));
const MasterUser = lazy(() => import('./pages/MasterUser'));
const FakturPajakSetorPage = lazy(() => import('./pages/FakturPajakSetor'));
const PenerbitanFakturKeluaranPage = lazy(() => import('./pages/PenerbitanFakturKeluaran'));
const PembatalanFakturPajakPage = lazy(() => import('./pages/PembatalanFakturPajak'));
const NotFound = lazy(() => import('./pages/NotFound'));

// --- PrivateRoute: redirect to /login if not authenticated ---
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// --- PublicRoute: redirect to app if already authenticated ---
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    // window.PIHelpdeskConfig = { url: 'https://pushme.pupuk-indonesia.com' };
    
    const s1 = document.createElement('script');
    s1.src = "https://pushme.pupuk-indonesia.com/helpdesk-button.js";
    document.body.appendChild(s1);

    const s2 = document.createElement('script');
    s2.src = "https://pushme.pupuk-indonesia.com/widgets/pi-speedtest.js";
    document.body.appendChild(s2);
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Faktur Pajak Routes */}
            <Route path="/pph-masukan/faktur-pajak" element={<Navigate to="/pph-masukan/faktur-pajak/baru" replace />} />
            <Route path="/pph-masukan/faktur-pajak/baru" element={<FakturPajakPage />} />
            <Route path="/pph-masukan/faktur-pajak/tindak-lanjut" element={<FakturPajakPage />} />
            
            {/* Faktur Pajak Setor Routes */}
            <Route path="/pph-masukan/faktur-pajak-setor" element={<Navigate to="/pph-masukan/faktur-pajak-setor/baru" replace />} />
            <Route path="/pph-masukan/faktur-pajak-setor/baru" element={<FakturPajakSetorPage />} />
            <Route path="/pph-masukan/faktur-pajak-setor/tindak-lanjut" element={<FakturPajakSetorPage />} />

            <Route path="/pph-keluaran/penerbitan-faktur/:jenis" element={<Navigate to="baru" relative="path" replace />} />
            <Route path="/pph-keluaran/penerbitan-faktur/:jenis/:kategori" element={<PenerbitanFakturKeluaranPage />} />
            <Route path="/pph-keluaran/pembatalan-faktur-pajak" element={<Navigate to="/pph-keluaran/pembatalan-faktur-pajak/proses" replace />} />
            <Route path="/pph-keluaran/pembatalan-faktur-pajak/:mode" element={<PembatalanFakturPajakPage />} />
            <Route path="/kalkulator/pph-21" element={<KalkulatorPPH21 />} />
            <Route path="/pengaturan/edit-profil" element={<EditProfil />} />
            <Route path="/pengaturan/master-unit-kerja" element={<MasterUnitKerja />} />
            
            <Route path="/master/vendor" element={<MasterVendor />} />
            <Route path="/master/user" element={<MasterUser />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <NotificationModal />
    </BrowserRouter>
  );
};

export default App;
