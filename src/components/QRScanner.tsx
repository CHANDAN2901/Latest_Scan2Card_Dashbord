import { Html5Qrcode } from 'html5-qrcode';
import { useRef, useState } from 'react';

interface QRScannerProps {
  onScanSuccess: (qrText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    if (!scannerRef.current) return;
    setScanning(true);
    setError(null);
    try {
      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      html5QrCodeRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          html5QrCode.stop();
          onScanSuccess(decodedText);
        },
        () => {
          // ignore scan errors
        }
      );
    } catch (e: any) {
      setError(e.message || 'Failed to start QR scanner');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    html5QrCodeRef.current?.stop().catch(() => {});
    setScanning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>
        <div id="qr-scanner" ref={scannerRef} className="w-64 h-64 bg-gray-200 mb-4"></div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="flex gap-4">
          {!scanning && (
            <button onClick={startScanner} className="bg-[#854AE6] text-white px-4 py-2 rounded">Start Scan</button>
          )}
          <button onClick={stopScanner} className="bg-gray-300 px-4 py-2 rounded">Close</button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
