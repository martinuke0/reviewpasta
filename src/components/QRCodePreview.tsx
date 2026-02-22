import { Loader2 } from 'lucide-react';

interface QRCodePreviewProps {
  qrDataUrl: string | null;
  businessName: string;
  loading?: boolean;
}

export const QRCodePreview = ({ qrDataUrl, businessName, loading = false }: QRCodePreviewProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-[300px] h-[300px] bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code for ${businessName}`}
            className="w-full h-full p-4 object-contain"
          />
        ) : (
          <div className="text-gray-400 text-sm text-center px-4">
            QR Code will appear here
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 text-center font-medium">
        {businessName}
      </p>
    </div>
  );
};
