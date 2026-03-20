"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface UploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadZone({ files, onFilesChange }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = MAX_FILES - files.length;
      const newFiles = acceptedFiles.slice(0, remaining);
      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
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
        className={`relative border border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 ${
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
            <p className="text-foreground font-medium text-sm">Déposez ici…</p>
          ) : files.length >= MAX_FILES ? (
            <p className="text-gray-400 text-sm font-light">
              Maximum atteint ({MAX_FILES} photos)
            </p>
          ) : (
            <>
              <p className="text-foreground text-sm font-medium">
                Glissez vos photos ici
              </p>
              <p className="text-muted text-xs font-light">
                ou cliquez pour sélectionner — JPG, PNG, WEBP — max 10 Mo — jusqu&apos;à {MAX_FILES} photos
              </p>
            </>
          )}
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="bg-red-50/50 border border-red-200/60 rounded-xl p-4">
          <p className="text-red-500/80 text-xs font-light">
            {fileRejections.some((r) =>
              r.errors.some((e) => e.code === "file-too-large")
            )
              ? "Certains fichiers dépassent la taille maximale de 10 Mo."
              : "Format non accepté. Utilisez JPG, PNG ou WEBP."}
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeFile(index)}
                aria-label={`Supprimer ${file.name}`}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
              <p className="text-[10px] text-muted/60 mt-1.5 truncate font-light">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
