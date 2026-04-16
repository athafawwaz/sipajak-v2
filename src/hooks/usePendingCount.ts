import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useFakturKeluaranStore } from '../store/fakturKeluaranStore';
import { usePembatalanFakturStore } from '../store/pembatalanFakturStore';

export const usePendingCount = () => {
  const { user } = useAuthStore();
  const getFakturPendingCount = useFakturKeluaranStore(s => s.getPendingCount);
  const getPembatalanPendingCount = usePembatalanFakturStore(s => s.getPendingCount);
  
  const counts = useMemo(() => {
    if (!user || (!user.role)) return { penerbitan: 0, pembatalan: 0, total: 0 };
    
    const penerbitan = getFakturPendingCount(user.role, user.badge, user.unitKerja);
    const pembatalan = getPembatalanPendingCount(user.role, user.badge, user.unitKerja);
    
    return {
      penerbitan,
      pembatalan,
      total: penerbitan + pembatalan
    };
  }, [user, getFakturPendingCount, getPembatalanPendingCount]);

  return { 
    count: counts.total, // backward compatibility for other places if needed
    penerbitan: counts.penerbitan,
    pembatalan: counts.pembatalan,
    total: counts.total
  };
};
