import React from 'react';
import type { ApprovalLog } from '../../types';
import { CheckCircle2, XCircle, UserCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ApprovalTimelineProps {
  logs: ApprovalLog[];
  status: string;
}

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ logs, status }) => {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
        <Clock className="w-12 h-12 text-gray-300 mb-3" />
        <p>Belum ada riwayat persetujuan.</p>
        <p className="text-sm mt-1 text-gray-400">Status: {status}</p>
      </div>
    );
  }

  // Sort by timestamp asc
  const sortedLogs = [...logs].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
      {sortedLogs.map((log) => {
        const isApprove = log.action === 'approve';
        const isAssign = log.action === 'assign_vp';
        return (
          <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            
            {/* Icon marker */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
              isAssign ? 'bg-indigo-100 text-indigo-500' :
              isApprove ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'
            }`}>
              {isAssign ? <UserCheck className="w-5 h-5" /> : 
               isApprove ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
              isAssign ? 'border-indigo-100' :
              isApprove ? 'border-emerald-100' : 'border-red-100'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-sm text-gray-900">
                  {log.approverName} <span className="text-gray-400 font-normal">({log.approverBadge})</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                </div>
              </div>

              <div className="text-sm font-medium mb-1">
                 {log.role.toUpperCase()} 
                 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                   isAssign ? 'bg-indigo-50 text-indigo-600' :
                   isApprove ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                 }`}>
                   {isAssign ? 'Assigned VP' : isApprove ? 'Approved' : 'Rejected'}
                 </span>
              </div>

              {log.catatan && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 italic">
                  "{log.catatan}"
                </div>
              )}
            </div>
            
          </div>
        );
      })}
    </div>
  );
};

export default ApprovalTimeline;
