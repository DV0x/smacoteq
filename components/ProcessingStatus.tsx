'use client';

import type { ProcessingStatus } from '@/types';

interface ProcessingStatusProps {
  status: ProcessingStatus;
  error?: string;
}

export default function ProcessingStatus({ status, error }: ProcessingStatusProps) {
  const steps = [
    { key: 'uploading', label: 'Uploading documents' },
    { key: 'ocr', label: 'Extracting text with OCR' },
    { key: 'llm', label: 'Processing with AI' },
    { key: 'pdf', label: 'Generating PDF' },
    { key: 'complete', label: 'Complete' }
  ];
  
  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['idle', 'uploading', 'ocr', 'llm', 'pdf', 'complete'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepKey);
    
    if (currentIndex > stepIndex) return 'complete';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };
  
  if (status === 'idle') return null;
  
  return (
    <div className="mt-8 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Processing Status</h3>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key);
          const isLastStep = index === steps.length - 1;
          
          return (
            <div key={step.key} className="relative">
              <div className="flex items-center space-x-4">
                <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  stepStatus === 'complete' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' :
                  stepStatus === 'active' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg animate-pulse' :
                    'bg-gray-200'
                }`}>
                  {stepStatus === 'complete' && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {stepStatus === 'active' && (
                    <div className="w-4 h-4 bg-white rounded-full animate-ping" />
                  )}
                  {stepStatus === 'pending' && (
                    <div className="w-4 h-4 bg-gray-400 rounded-full" />
                  )}
                </div>
                
                <div className="flex-1">
                  <span className={`text-base font-medium transition-colors ${
                    stepStatus === 'active' 
                      ? 'text-blue-700 font-semibold' 
                      : stepStatus === 'complete'
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {stepStatus === 'active' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  )}
                </div>
              </div>
              
              {!isLastStep && (
                <div className={`absolute left-5 top-10 w-0.5 h-6 transition-colors ${
                  stepStatus === 'complete' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}