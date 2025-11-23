import { useEffect, useRef, type FC } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  value: string; // tree.id atau URL lengkap
};

const QRModal: FC<Props> = ({ open, onClose, value }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-${value}.png`;
    a.click();
  };

  const downloadSVG = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-${value}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-10">
      <div className="relative bg-white rounded-xl p-6 w-full max-w-sm mx-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">QR Code</h2>

        {/* Hidden canvas for PNG */}
        <QRCodeCanvas ref={canvasRef} value={value} size={256} className="hidden" />

        <div className="flex justify-center mb-4 border border-gray-300 rounded-xl p-5 ">
          <QRCodeSVG id="qr-svg" value={value} size={210} />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadPNG}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-sm font-semibold text-white rounded-lg py-2 hover:bg-brand-700"
          >
            <Download className="w-4 h-4" /> PNG
          </button>
          <button
            type="button"
            onClick={downloadSVG}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-gray-200 text-gray-800 rounded-lg py-2 hover:bg-gray-300"
          >
            <Download className="w-4 h-4" /> SVG
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
