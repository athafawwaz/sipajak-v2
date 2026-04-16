import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { uploadToMinio } from '../../utils/minioUpload';
import type { DokumenPDF } from '../../types';

interface DokumenUploaderProps {
  value: DokumenPDF[];
  onChange: (docs: DokumenPDF[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const DokumenUploader: React.FC<DokumenUploaderProps> = ({
  value = [],
  onChange,
  maxFiles = 5,
  maxSizeMB = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFiles = async (files: File[]) => {
    setErrorStatus(null);
    if (value.length + files.length > maxFiles) {
      setErrorStatus(`Maksimal ${maxFiles} dokumen diperbolehkan`);
      return;
    }

    const validFiles = files.filter(f => {
      if (f.type !== 'application/pdf') {
        setErrorStatus('Hanya file PDF yang diperbolehkan');
        return false;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        setErrorStatus(`Ukuran maksimal per file adalah ${maxSizeMB}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    const uploadedDocs: DokumenPDF[] = [];

    for (const file of validFiles) {
      try {
        const url = await uploadToMinio(file);
        uploadedDocs.push({
          id: `doc-${Date.now()}-${file.name}`,
          namaFile: file.name,
          ukuran: file.size,
          url,
          uploadedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Upload failed", err);
        setErrorStatus('Terjadi kesalahan saat mengunggah sebagian file');
      }
    }

    onChange([...value, ...uploadedDocs]);
    setIsUploading(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [value, maxFiles, maxSizeMB]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    onChange(value.filter(doc => doc.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-gray-300 hover:bg-gray-50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading || value.length >= maxFiles}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
             <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
          ) : (
            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
          )}
          <p className="text-sm font-medium text-gray-700">
            {isUploading ? 'Mengunggah...' : 'Klik untuk browse atau seret file ke sini'}
          </p>
          <p className="text-xs text-gray-500">
            PDF saja. Maksimal {maxSizeMB}MB per file ({value.length}/{maxFiles} file)
          </p>
        </label>
      </div>

      {errorStatus && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {errorStatus}
        </div>
      )}

      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {value.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={doc.namaFile}>
                    {doc.namaFile}
                  </p>
                  <p className="text-xs text-gray-500">{formatSize(doc.ukuran)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(doc.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DokumenUploader;
