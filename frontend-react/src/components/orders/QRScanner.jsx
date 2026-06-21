import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const QRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let isMounted = true;

    const startScan = async () => {
      try {
        const videoElement = videoRef.current;
        if (!videoElement) return;
        await codeReader.decodeFromVideoDevice(
          undefined,
          videoElement,
          (result, error) => {
            if (result && isMounted) {
              const text = result.getText();
              onScan(text);
            }
            if (error && error.message && !error.message.includes('no frames')) {
              console.warn('Scan error:', error);
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
          console.error(err);
        }
      }
    };

    startScan();

    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full aspect-video"
          autoPlay
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-2 border-white/50 rounded-lg shadow-lg"></div>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
      <button
        onClick={onClose}
        className="mt-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
      >
        Fermer
      </button>
    </div>
  );
};

export default QRScanner;