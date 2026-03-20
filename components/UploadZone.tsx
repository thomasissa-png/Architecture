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
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-sage bg-sage/5 scale-[1.02]"
            : files.length >= MAX_FILES
            ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
            : "border-gray-300 hover:border-sage hover:bg-sage/5"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-sage"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {isDragActive ? (
            <p className="text-sage font-medium">Déposez vos photos ici...</p>
          ) : files.length >= MAX_FILES ? (
            <p className="text-gray-400">
              Nombre maximum de photos atteint ({MAX_FILES})
            </p>
          ) : (
            <>
              <p className="text-foreground font-medium">
                Glissez-déposez vos photos ici
              </p>
              <p className="text-gray-400 text-sm">
                ou cliquez pour sélectionner — JPG, PNG, WEBP (max 10 Mo)
              </p>
              <p className="text-gray-400 text-xs">
                Jusqu&apos;à {MAX_FILES} photos, traitées une par une
              </p>
            </>
          )}
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">
            {fileRejections.some((r) =>
              r.errors.some((e) => e.code === "file-too-large")
            )
              ? "Certains fichiers dépassent la taille maximale de 10 Mo."
              : "Format non accepté. Utilisez JPG, PNG ou WEBP."}
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
              >
                &times;
              </button>
              <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
