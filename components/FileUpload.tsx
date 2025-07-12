'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  label: string;
  name: string;
  onFileSelect: (file: File | null) => void;
}

export default function FileUpload({ label, name, onFileSelect }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const convertDocToDocx = async (file: File): Promise<File> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/convert-doc', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Conversion failed');
    }

    const blob = await response.blob();
    const convertedFileName = file.name.replace(/\.doc$/i, '.pdf');
    return new File([blob], convertedFileName, {
      type: 'application/pdf'
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Check if it's a .doc file and convert it
      if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
        setIsConverting(true);
        try {
          const convertedFile = await convertDocToDocx(file);
          setFileName(convertedFile.name);
          onFileSelect(convertedFile);
        } catch {
          alert('Failed to convert .doc file. Please try saving it as .docx format manually.');
          // Reset the input
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        } finally {
          setIsConverting(false);
        }
        return;
      }
      setFileName(file.name);
      onFileSelect(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Check if it's a .doc file and convert it
      if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
        setIsConverting(true);
        try {
          const convertedFile = await convertDocToDocx(file);
          setFileName(convertedFile.name);
          onFileSelect(convertedFile);
        } catch {
          alert('Failed to convert .doc file. Please try saving it as .docx format manually.');
        } finally {
          setIsConverting(false);
        }
        return;
      }
      setFileName(file.name);
      onFileSelect(file);
    }
  };
  
  return (
    <div className="w-full">
      <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
        <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-md flex items-center justify-center mr-2">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        {label}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
          isDragging 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-[1.02]' 
            : fileName 
            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md bg-white'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc"
          className="hidden"
        />
        
        {isConverting ? (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-blue-800">
                Converting document...
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Converting .doc to PDF format
              </p>
            </div>
          </div>
        ) : fileName ? (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-green-800 truncate">
                {fileName}
              </p>
              <p className="text-sm text-green-600 mt-1">
                File uploaded successfully
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center transition-colors ${
              isDragging 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                : 'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-base font-medium text-gray-700">
                {isDragging ? 'Drop file here' : 'Drop file here or click to upload'}
              </p>
              <p className="text-sm text-gray-500 mt-2 flex items-center justify-center space-x-3">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  JPG
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  PNG
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  WebP
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  DOC/DOCX
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum file size: 50MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}