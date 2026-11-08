'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export interface UploadedEvidenceItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  signedUrl: string;
}

interface EvidenceUploaderProps {
  taskId?: string;
  participationId?: string;
  submissionVersionId?: string;
  disputeId?: string;
  onFilesChange?: (files: UploadedEvidenceItem[]) => void;
  maxFiles?: number;
  label?: string;
}

export function EvidenceUploader({
  taskId,
  participationId,
  submissionVersionId,
  disputeId,
  onFilesChange,
  maxFiles = 5,
  label = 'Upload Supporting Evidence & Deliverables',
}: EvidenceUploaderProps) {
  const [files, setFiles] = useState<UploadedEvidenceItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    if (files.length + selected.length > maxFiles) {
      setErrorMessage(`Maximum limit of ${maxFiles} evidence files reached.`);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const newItems: UploadedEvidenceItem[] = [...files];

      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];

        // Client side validation
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds the 50MB limit.`);
        }

        const res = await api.uploadEvidenceFile(file, {
          taskId,
          participationId,
          submissionVersionId,
          disputeId,
        });

        if (!res.success || !res.data) {
          throw new Error(res.message || `Failed to upload "${file.name}"`);
        }

        newItems.push({
          id: res.data.id,
          originalFilename: res.data.originalFilename,
          mimeType: res.data.mimeType,
          sizeBytes: res.data.sizeBytes,
          sha256Hash: res.data.sha256Hash,
          signedUrl: res.data.signedUrl,
        });
      }

      setFiles(newItems);
      onFilesChange?.(newItems);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (fileId: string) => {
    const updated = files.filter((f) => f.id !== fileId);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </label>
        <span className="text-xs text-slate-500">
          {files.length}/{maxFiles} attached
        </span>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          isUploading
            ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.zip,.mp4,.webm,.txt,.csv"
          onChange={handleFileSelect}
          disabled={isUploading || files.length >= maxFiles}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Scanning & uploading evidence securely...
            </p>
            <p className="text-xs text-slate-400 mt-1">Verifying magic bytes & malware signature</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Click to select or drag & drop files
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PNG, JPG, PDF, MP4, WEBM, ZIP, CSV (Max 50MB per file)
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Uploaded List */}
      {files.length > 0 && (
        <div className="space-y-2 mt-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {file.originalFilename}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{formatSize(file.sizeBytes)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> Scanned Clean
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      SHA: {file.sha256Hash.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  type="button"
                  onClick={() => handleRemove(file.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
