"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";

interface UploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  photoWarnings?: Record<number, string>;
  hidePreviews?: boolean;
}

const DEFAULT_MAX_FILES = 3;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadZone({ files, onFilesChange, maxFiles, photoWarnings, hidePreviews }: UploadZoneProps) {
  const MAX_FILES = maxFiles ?? DEFAULT_MAX_FILES;
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Auto-dismiss feedback
  useEffect(() => {
    if (!uploadFeedback) return;
    const timer = setTimeout(() => setUploadFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [uploadFeedback]);

  // Stable object URLs — created once per file, revoked on cleanup
  const fileUrls = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  // Revoke old URLs when files change
  useEffect(() => {
    return () => {
      fileUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fileUrls]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = MAX_FILES - files.length;
      const newFiles = acceptedFiles.slice(0, remaining);
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
        setUploadFeedback(
          newFiles.length === 1
            ? "Photo ajoutée avec succès"
            : `${newFiles.length} photos ajoutées avec succès`
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, onFilesChange, MAX_FILES]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
        "image/heic": [".heic"],
        "image/heif": [".heif"],
      },
      maxSize: MAX_SIZE,
      maxFiles: MAX_FILES - files.length,
      disabled: files.length >= MAX_FILES,
    });

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div
        {...getRootProps()}
        className={`relative border border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-foreground bg-foreground/[0.02] scale-[1.01]"
            : files.length >= MAX_FILES
            ? "border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <svg
            className={`w-8 h-8 transition-colors duration-300 ${
              isDragActive ? "text-foreground" : "text-gray-300"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {isDragActive ? (
            <p className="text-foreground font-medium text-sm">D&eacute;posez ici&hellip;</p>
          ) : files.length >= MAX_FILES ? (
            <p className="text-gray-400 text-sm font-light">
              Maximum atteint ({MAX_FILES} photos)
            </p>
          ) : (
            <>
              <p className="text-foreground text-sm font-medium">
                <span className="sm:hidden">Appuyez pour ajouter des photos</span>
                <span className="hidden sm:inline">Glissez vos photos ici</span>
              </p>
              <p className="text-muted text-xs font-light">
                ou cliquez pour s&eacute;lectionner — JPG, PNG, WEBP, HEIC — max 10 Mo — jusqu&apos;&agrave; {MAX_FILES} photos
              </p>
            </>
          )}
        </div>
      </div>

      {uploadFeedback && (
        <div className="flex items-center gap-2 bg-sage/10 border border-sage/20 rounded-xl px-4 py-3 animate-fade-in-up">
          <svg className="w-4 h-4 text-sage flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sage-dark text-xs font-medium">{uploadFeedback}</p>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="bg-red-50/50 border border-red-200/60 rounded-xl p-4">
          <p className="text-red-500/80 text-xs font-light">
            {fileRejections.some((r) =>
              r.errors.some((e) => e.code === "file-too-large")
            )
              ? "Certains fichiers dépassent la taille maximale de 10 Mo."
              : "Format non accepté. Utilisez JPG, PNG, WEBP ou HEIC."}
          </p>
        </div>
      )}

      {files.length > 0 && !hidePreviews && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrls[index]}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeFile(index)}
                aria-label={`Supprimer ${file.name}`}
                className="absolute -top-2 -right-2 w-7 h-7 sm:w-5 sm:h-5 bg-foreground text-background rounded-full flex items-center justify-center text-xs sm:text-xs sm:opacity-60 sm:group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                &times;
              </button>
              <p className="text-xs text-muted/70 mt-1.5 truncate font-light">
                {file.name}
              </p>
              {photoWarnings?.[index] && (
                <p className="text-[10px] text-amber-600 font-medium mt-0.5 leading-tight">
                  {photoWarnings[index]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
