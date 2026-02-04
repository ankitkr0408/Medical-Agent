'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // in MB
}

export default function FileUpload({
    onFileSelect,
    accept = 'image/*,.dcm,.nii,.nii.gz',
    maxSize = 50,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const processFile = (file: File) => {
        setError('');

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }

        onFileSelect(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreview(null);
        setError('');
    };

    return (
        <Card className="relative">
            {!selectedFile ? (
                <div
                    className={`
            border-2 border-dashed rounded-xl p-12 text-center
            transition-all duration-300
            ${isDragging
                            ? 'border-primary bg-primary/10'
                            : 'border-white/20 hover:border-primary/50'
                        }
          `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept={accept}
                        onChange={handleFileInput}
                    />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`
              p-4 rounded-full bg-gradient-primary
              ${isDragging ? 'scale-110' : 'scale-100'}
              transition-transform duration-300
            `}>
                            <Upload className="w-8 h-8 text-white" />
                        </div>

                        <div>
                            <p className="text-lg font-semibold text-text-primary mb-2">
                                Drop your medical image here
                            </p>
                            <p className="text-sm text-text-secondary mb-4">
                                or click to browse
                            </p>
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="inline-block px-4 py-2 text-sm border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl font-semibold transition-smooth">
                                    Select File
                                </span>
                            </label>
                        </div>

                        <p className="text-xs text-text-muted">
                            Supported: JPG, PNG, DICOM, NIFTI (max {maxSize}MB)
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 p-2 rounded-full bg-error hover:bg-error/80 transition-colors z-10"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>

                    {preview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-64 object-contain rounded-lg"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-64 bg-bg-tertiary rounded-lg">
                            <FileImage className="w-16 h-16 text-text-muted" />
                        </div>
                    )}

                    <div className="mt-4">
                        <p className="text-sm font-medium text-text-primary">{selectedFile.name}</p>
                        <p className="text-xs text-text-secondary mt-1">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-2 text-sm text-error">{error}</p>
            )}
        </Card>
    );
}
