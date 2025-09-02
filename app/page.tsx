'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import type { ProcessingStatus as ProcessingStatusType } from '@/types';

export default function Home() {
  const [uploadMode, setUploadMode] = useState<'separate' | 'combined' | 'dangerous'>('separate');
  const [packingList, setPackingList] = useState<File | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);
  const [combinedDocument, setCombinedDocument] = useState<File | null>(null);
  const [dangerousGoods, setDangerousGoods] = useState<File | null>(null);
  const [bolNumber, setBolNumber] = useState<string>('');
  const [bookingNumber, setBookingNumber] = useState<string>('');
  const [status, setStatus] = useState<ProcessingStatusType>('idle');
  const [error, setError] = useState<string>('');
  
  // Function to validate BOL number format
  const validateBolNumber = (bolNum: string): boolean => {
    if (!bolNum.trim()) return true; // Empty is allowed
    
    // BOL number validation: alphanumeric, hyphens, underscores, 3-50 characters
    const bolRegex = /^[A-Za-z0-9\-_]{3,50}$/;
    return bolRegex.test(bolNum.trim());
  };

  // Function to validate Booking number format
  const validateBookingNumber = (bookingNum: string): boolean => {
    if (!bookingNum.trim()) return true; // Empty is allowed
    
    // Booking number validation: alphanumeric, hyphens, underscores, 3-50 characters
    const bookingRegex = /^[A-Za-z0-9\-_]{3,50}$/;
    return bookingRegex.test(bookingNum.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate BOL number format if provided
    if (bolNumber.trim() && !validateBolNumber(bolNumber)) {
      setError('BOL number must be 3-50 characters and contain only letters, numbers, hyphens, and underscores');
      return;
    }
    
    // Validate Booking number format if provided
    if (bookingNumber.trim() && !validateBookingNumber(bookingNumber)) {
      setError('Booking number must be 3-50 characters and contain only letters, numbers, hyphens, and underscores');
      return;
    }
    
    // Validation based on upload mode
    if (uploadMode === 'separate') {
      if (!packingList || !invoice) {
        setError('Please upload both documents');
        return;
      }
    } else if (uploadMode === 'dangerous') {
      if (!packingList || !invoice || !dangerousGoods) {
        setError('Please upload all three required documents for dangerous goods');
        return;
      }
    } else {
      if (!combinedDocument) {
        setError('Please upload the combined document');
        return;
      }
    }
    
    setError('');
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('uploadMode', uploadMode);
    
    // Add BOL number if provided
    if (bolNumber.trim()) {
      formData.append('bolNumber', bolNumber.trim());
    }
    
    // Add Booking number if provided
    if (bookingNumber.trim()) {
      formData.append('bookingNumber', bookingNumber.trim());
    }
    
    if (uploadMode === 'separate') {
      if (packingList) formData.append('packingList', packingList);
      if (invoice) formData.append('invoice', invoice);
    } else if (uploadMode === 'dangerous') {
      if (packingList) formData.append('packingList', packingList);
      if (invoice) formData.append('invoice', invoice);
      if (dangerousGoods) formData.append('dangerousGoods', dangerousGoods);
    } else {
      if (combinedDocument) formData.append('combinedDocument', combinedDocument);
    }
    
    try {
      // Simulate status updates
      setTimeout(() => setStatus('ocr'), 1000);
      setTimeout(() => setStatus('llm'), 5000);
      setTimeout(() => setStatus('pdf'), 10000);
      
      const response = await fetch('/api/generate-bol', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate BOL');
      }
      
      setStatus('complete');
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'bill-of-lading.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Reset form after successful download
      setTimeout(() => {
        setStatus('idle');
        setPackingList(null);
        setInvoice(null);
        setCombinedDocument(null);
        setDangerousGoods(null);
        setBolNumber('');
        setBookingNumber('');
      }, 3000);
      
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  const isProcessing = status !== 'idle' && status !== 'complete' && status !== 'error';
  
  // Helper function to check if form is valid for submission
  const isFormValid = uploadMode === 'separate' 
    ? (packingList && invoice)
    : uploadMode === 'dangerous'
    ? (packingList && invoice && dangerousGoods)
    : combinedDocument;

  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background patterns - Full Page */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/30 to-indigo-600/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-indigo-500/8 rounded-full blur-xl animate-pulse delay-3000"></div>
          <div className="absolute bottom-1/3 right-10 w-36 h-36 bg-purple-500/8 rounded-full blur-2xl animate-pulse delay-4000"></div>
        </div>
      </div>

      {/* Premium Header Section */}
      <div className="relative">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            {/* Compact Logo and brand section */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 mb-3 tracking-tight leading-none">
                SmacBOL
              </h1>
              
              {/* Animated underline */}
              <div className="relative mx-auto w-24 h-1 mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200 mb-4">
              AI-Powered Bill of Lading Generator
            </h2>
            
            <p className="text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
              Upload your documents and generate professional Bills of Lading instantly
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-8">
        
        {/* Upload Form */}
        <form id="upload-form" onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-8 hover:shadow-3xl hover:bg-white/98 transition-all duration-300">
          {/* Upload Mode Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              Upload Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  uploadMode === 'separate' 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                }`}
                onClick={() => setUploadMode('separate')}
              >
                {uploadMode === 'separate' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-start space-x-4">
                  <input
                    type="radio"
                    id="separate"
                    name="uploadMode"
                    value="separate"
                    checked={uploadMode === 'separate'}
                    onChange={() => setUploadMode('separate')}
                    className="w-5 h-5 text-blue-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <label htmlFor="separate" className="text-base font-semibold text-gray-900 cursor-pointer">
                        Separate Documents
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Upload Packing List and Commercial Invoice as individual files for precise processing
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  uploadMode === 'combined' 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                }`}
                onClick={() => setUploadMode('combined')}
              >
                {uploadMode === 'combined' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-start space-x-4">
                  <input
                    type="radio"
                    id="combined"
                    name="uploadMode"
                    value="combined"
                    checked={uploadMode === 'combined'}
                    onChange={() => setUploadMode('combined')}
                    className="w-5 h-5 text-blue-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <label htmlFor="combined" className="text-base font-semibold text-gray-900 cursor-pointer">
                        Combined Document
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Upload a single multi-page PDF containing both documents for streamlined processing
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  uploadMode === 'dangerous' 
                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg' 
                    : 'border-gray-200 hover:border-red-300 hover:shadow-md bg-white'
                }`}
                onClick={() => setUploadMode('dangerous')}
              >
                {uploadMode === 'dangerous' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex items-start space-x-4">
                  <input
                    type="radio"
                    id="dangerous"
                    name="uploadMode"
                    value="dangerous"
                    checked={uploadMode === 'dangerous'}
                    onChange={() => setUploadMode('dangerous')}
                    className="w-5 h-5 text-red-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <label htmlFor="dangerous" className="text-base font-semibold text-gray-900 cursor-pointer">
                        Dangerous Goods Shipment
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Upload Packing List, Invoice, and Dangerous Goods Declaration for hazardous materials
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOL Number Input */}
          <div className="mb-8">
            <label htmlFor="bolNumber" className="flex items-center text-base font-semibold text-gray-900 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-md flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                </svg>
              </div>
              Bill of Lading Number
              <span className="ml-2 text-sm font-normal text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="bolNumber"
                name="bolNumber"
                value={bolNumber}
                onChange={(e) => setBolNumber(e.target.value)}
                placeholder="Enter BOL number (e.g., BOL-2024-001)"
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                  bolNumber.trim() && !validateBolNumber(bolNumber) 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                maxLength={50}
              />
              {bolNumber.trim() && validateBolNumber(bolNumber) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {bolNumber.trim() && !validateBolNumber(bolNumber) && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  BOL number must be 3-50 characters and contain only letters, numbers, hyphens, and underscores
                </p>
              </div>
            )}
            <p className="mt-3 text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              If not provided, a unique BOL number will be automatically generated
            </p>
          </div>

          {/* Booking Number Input */}
          <div className="mb-8">
            <label htmlFor="bookingNumber" className="flex items-center text-base font-semibold text-gray-900 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-md flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              Booking Confirmation Number
              <span className="ml-2 text-sm font-normal text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="bookingNumber"
                name="bookingNumber"
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
                placeholder="Enter booking number (e.g., BOOK-2024-001)"
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                  bookingNumber.trim() && !validateBookingNumber(bookingNumber) 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                maxLength={50}
              />
              {bookingNumber.trim() && validateBookingNumber(bookingNumber) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {bookingNumber.trim() && !validateBookingNumber(bookingNumber) && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Booking number must be 3-50 characters and contain only letters, numbers, hyphens, and underscores
                </p>
              </div>
            )}
            <p className="mt-3 text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reference number for booking confirmation and tracking
            </p>
          </div>

          {/* File Upload Section */}
          {uploadMode === 'separate' ? (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <FileUpload
                label="Packing List"
                name="packingList"
                onFileSelect={setPackingList}
              />
              <FileUpload
                label="Commercial Invoice"
                name="invoice"
                onFileSelect={setInvoice}
              />
            </div>
          ) : uploadMode === 'dangerous' ? (
            <div className="space-y-6 mb-8">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Dangerous Goods Documentation Required</h4>
                    <p className="text-sm text-red-700">Please upload all three required documents for dangerous goods shipments</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                <FileUpload
                  label="Packing List"
                  name="packingList"
                  onFileSelect={setPackingList}
                />
                <FileUpload
                  label="Commercial Invoice"
                  name="invoice"
                  onFileSelect={setInvoice}
                />
                <FileUpload
                  label="Dangerous Goods Declaration"
                  name="dangerousGoods"
                  onFileSelect={setDangerousGoods}
                />
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <FileUpload
                label="Combined Document (Packing List + Commercial Invoice)"
                name="combinedDocument"
                onFileSelect={setCombinedDocument}
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={isProcessing || !isFormValid}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
              isProcessing || !isFormValid
                ? 'bg-gray-400 cursor-not-allowed hover:scale-100'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing Documents...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generate Bill of Lading</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </div>
          </button>

          {/* Inline Processing Status */}
          {(status !== 'idle') && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Processing Status</h3>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 font-medium text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {[
                  { key: 'uploading', label: 'Uploading documents' },
                  { key: 'ocr', label: 'Extracting text with OCR' },
                  { key: 'llm', label: 'Processing with AI' },
                  { key: 'pdf', label: 'Generating PDF' },
                  { key: 'complete', label: 'Complete' }
                ].map((step, index) => {
                  const statusOrder = ['idle', 'uploading', 'ocr', 'llm', 'pdf', 'complete'];
                  const currentIndex = statusOrder.indexOf(status);
                  const stepIndex = statusOrder.indexOf(step.key);
                  
                  const stepStatus = currentIndex > stepIndex ? 'complete' : 
                                   currentIndex === stepIndex ? 'active' : 'pending';
                  const isLastStep = index === 4;
                  
                  return (
                    <div key={step.key} className="relative">
                      <div className="flex items-center space-x-3">
                        <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          stepStatus === 'complete' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-md' :
                          stepStatus === 'active' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md animate-pulse' :
                            'bg-gray-200'
                        }`}>
                          {stepStatus === 'complete' && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {stepStatus === 'active' && (
                            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                          )}
                          {stepStatus === 'pending' && (
                            <div className="w-3 h-3 bg-gray-400 rounded-full" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <span className={`text-sm font-medium transition-colors ${
                            stepStatus === 'active' 
                              ? 'text-blue-700 font-semibold' 
                              : stepStatus === 'complete'
                              ? 'text-green-700'
                              : 'text-gray-500'
                          }`}>
                            {step.label}
                          </span>
                          {stepStatus === 'active' && (
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" style={{width: '60%'}}></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!isLastStep && (
                        <div className={`absolute left-4 top-8 w-0.5 h-4 transition-colors ${
                          stepStatus === 'complete' ? 'bg-green-300' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
        
        {/* Compact Instructions */}
        <div id="instructions" className="mt-8 bg-white/95 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              How It Works
            </h3>
            <p className="text-sm text-gray-600">Simple 3-step process to generate your Bill of Lading</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                title: "Upload",
                description: "Upload your Packing List and Commercial Invoice",
                icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              },
              {
                step: 2,
                title: "Process",
                description: "AI extracts and organizes your document data",
                icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              },
              {
                step: 3,
                title: "Download",
                description: "Get your professional Bill of Lading PDF",
                icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              }
            ].map((item, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50/80 to-blue-50/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <div className="mb-2">
                  <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Elegant Footer Spacing */}
        <div className="py-16"></div>
      </div>
    </main>
  );
}
