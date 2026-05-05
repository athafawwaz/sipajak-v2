import React from 'react';
import Modal from '../ui/Modal';
import { CHANGELOG, APP_VERSION } from '../../store/changelogStore';
import type { ChangelogEntry } from '../../store/changelogStore';
import { Tag } from 'lucide-react';

interface ModalChangelogProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeBadge: Record<ChangelogEntry['type'], { label: string; cls: string }> = {
  major: { label: 'MAJOR', cls: 'bg-red-100 text-red-700' },
  minor: { label: 'MINOR', cls: 'bg-blue-100 text-blue-700' },
  patch: { label: 'PATCH', cls: 'bg-gray-100 text-gray-600' },
};

const ModalChangelog: React.FC<ModalChangelogProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Riwayat Update Aplikasi" size="md">
      <div className="mb-4 flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <Tag className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm text-gray-600">Versi aktif saat ini: </span>
        <span className="font-bold text-primary text-sm">v{APP_VERSION}</span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {CHANGELOG.map((entry, idx) => {
          const badge = typeBadge[entry.type];
          const isLatest = idx === 0;
          return (
            <div
              key={entry.version}
              className={`relative pl-4 border-l-2 pb-3 ${isLatest ? 'border-primary' : 'border-gray-200'}`}
            >
              <div className={`absolute -left-[7px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${isLatest ? 'bg-primary' : 'bg-gray-300'}`} />
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gray-900 text-sm">v{entry.version}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.cls}`}>
                  {badge.label}
                </span>
                {isLatest && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    TERBARU
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">{entry.date}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{entry.description}</p>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ModalChangelog;
