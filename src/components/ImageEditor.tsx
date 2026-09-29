"use client";

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Download, RefreshCw, AlertCircle, Palette } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { removeBackground } from '@imgly/background-removal';

type ProcessingState = 'idle' | 'preparing' | 'removing' | 'complete' | 'error';

export function ImageEditor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setErrorMessage('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage('Image is too large. Please upload an image under 15MB.');
      return;
    }

    setOriginalFile(file);
    const objectUrl = URL.createObjectURL(file);
    setOriginalImageUrl(objectUrl);
    setProcessedImageUrl(null);
    setStatus('preparing');
    setErrorMessage('');
    setProgress('Initializing AI model...');

    try {
      setStatus('removing');
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          setProgress(`Processing: ${key} ${Math.round((current / total) * 100)}%`);
        }
      });
      
      const processedUrl = URL.createObjectURL(blob);
      setProcessedImageUrl(processedUrl);
      setStatus('complete');
      setProgress('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('Failed to remove background. Please try again with a different image.');
      setProgress('');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleReset = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
    
    setOriginalFile(null);
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setStatus('idle');
    setErrorMessage('');
    setProgress('');
    setBgColor('transparent');
    setBgImageFile(null);
    setBgImageUrl(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const handleDownload = async () => {
    if (!processedImageUrl) return;

    // To merge with a background color or image, we need to draw it on a canvas
    if (bgColor !== 'transparent' || bgImageUrl) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = processedImageUrl;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw background
      if (bgImageUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
          bgImg.src = bgImageUrl;
        });
        // cover
        const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
        const x = (canvas.width / 2) - (bgImg.width / 2) * scale;
        const y = (canvas.height / 2) - (bgImg.height / 2) * scale;
        ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw foreground
      ctx.drawImage(img, 0, 0);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `pixelcut-ai-${originalFile?.name || 'result.png'}`;
      link.click();
    } else {
      // Just download the processed image as is (transparent)
      const link = document.createElement('a');
      link.href = processedImageUrl;
      link.download = `pixelcut-ai-transparent-${originalFile?.name || 'result.png'}`;
      link.click();
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setBgImageFile(file);
      setBgImageUrl(objectUrl);
      setBgColor('custom-image');
    }
  };

  if (status === 'idle' || (status === 'error' && !originalImageUrl)) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10">
        <div 
          className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50 transition-colors rounded-3xl p-12 text-center cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <UploadCloud className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Upload Image</h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Drag and drop an image here, or click to browse. Supports PNG, JPG, and WEBP.
          </p>
          
          <button className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors shadow-lg">
            Select an image
          </button>

          <p className="text-zinc-500 text-sm mt-8 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Your images are processed privately whenever possible.
          </p>
        </div>

        {status === 'error' && (
          <div className="mt-4 p-4 bg-red-950/50 border border-red-900 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 flex flex-col gap-8">
      {/* Editor Main View */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Canvas Area */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          <div className="bg-zinc-950 rounded-3xl p-4 border border-zinc-800 shadow-2xl relative min-h-[400px] flex items-center justify-center">
            
            {(status === 'preparing' || status === 'removing') && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-3xl">
                <div className="w-16 h-16 border-4 border-zinc-700 border-t-white rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-medium text-white mb-2">
                  {status === 'preparing' ? 'Preparing Image...' : 'Removing Background...'}
                </h3>
                <p className="text-zinc-400 text-sm font-mono">{progress}</p>
              </div>
            )}

            {status === 'error' && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm rounded-3xl p-6 text-center">
                 <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                 <h3 className="text-xl font-medium text-white mb-2">Processing Failed</h3>
                 <p className="text-red-400 mb-6">{errorMessage}</p>
                 <button onClick={handleReset} className="bg-zinc-800 text-white px-6 py-2 rounded-full hover:bg-zinc-700">
                   Try Another Image
                 </button>
               </div>
            )}

            {originalImageUrl && processedImageUrl && status === 'complete' && (
              <BeforeAfterSlider 
                originalImage={originalImageUrl} 
                processedImage={processedImageUrl}
                backgroundColor={bgColor}
                backgroundImage={bgImageUrl}
              />
            )}
            
            {/* Show just original while processing */}
            {originalImageUrl && status !== 'complete' && status !== 'error' && (
              <div className="w-full max-w-3xl aspect-[4/3] relative rounded-2xl overflow-hidden opacity-50">
                <img src={originalImageUrl} alt="Original" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Right Tools Area */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" /> Background
            </h3>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              <button 
                onClick={() => { setBgColor('transparent'); setBgImageUrl(null); }}
                className={`w-full aspect-square rounded-xl border-2 transition-all ${bgColor === 'transparent' && !bgImageUrl ? 'border-blue-500 scale-105' : 'border-transparent hover:border-zinc-600'} bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/ENFqwvAwRqoJY7B6gGGMJmEAAAAA//81H81JAAAAAFJOUwB6g8X2AAAAHUlEQVQYV2NkYGAQYcAP3uCTZhw1gGGYhIFB8gAAX4IBy0/89y8AAAAASUVORK5CYII=")]`}
                title="Transparent"
              />
              <button 
                onClick={() => { setBgColor('#ffffff'); setBgImageUrl(null); }}
                className={`w-full aspect-square rounded-xl border-2 transition-all ${bgColor === '#ffffff' && !bgImageUrl ? 'border-blue-500 scale-105' : 'border-zinc-700 hover:border-zinc-500'} bg-white`}
                title="White"
              />
              <button 
                onClick={() => { setBgColor('#000000'); setBgImageUrl(null); }}
                className={`w-full aspect-square rounded-xl border-2 transition-all ${bgColor === '#000000' && !bgImageUrl ? 'border-blue-500 scale-105' : 'border-zinc-700 hover:border-zinc-500'} bg-black`}
                title="Black"
              />
              <label 
                className={`w-full aspect-square rounded-xl border-2 border-dashed border-zinc-600 hover:border-zinc-400 flex items-center justify-center cursor-pointer transition-all ${bgImageUrl ? 'border-blue-500 scale-105 bg-zinc-800' : 'bg-zinc-800'}`}
                title="Custom Image"
              >
                <input 
                  type="file" 
                  ref={bgFileInputRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleBgImageUpload}
                />
                <ImageIcon className="w-5 h-5 text-zinc-400" />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDownload}
                disabled={status !== 'complete'}
                className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Download className="w-5 h-5" /> Download Result
              </button>
              
              <button 
                onClick={handleReset}
                className="w-full bg-zinc-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Start New Image
              </button>
            </div>
          </div>
          
          <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800">
            <h4 className="text-sm font-medium text-white mb-2">Privacy Note</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Images are processed directly in your browser. We do not upload or store your photos on our servers. Processing speed depends on your device's capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
