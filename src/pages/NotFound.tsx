import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          Pastikan URL yang Anda masukkan sudah benar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            leftIcon={<Home className="w-4 h-4" />}
            className="px-8"
          >
            Kembali ke Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="px-8"
          >
            Kembali
          </Button>
        </div>

        <div className="mt-12 text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} SI PAJAK - PT. Pupuk Sriwidjaja Palembang
        </div>
      </div>
    </div>
  );
};

export default NotFound;
