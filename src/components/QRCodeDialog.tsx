import { useState, useEffect } from 'react';
import { Download, Share2, Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Business } from '@/lib/db';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  generateQRCodeDataURL,
  generateQRCodeSVG,
  downloadQRCode,
  shareQRCode,
  copyReviewLink,
} from '@/lib/qrcode';
import { QRCodePreview } from './QRCodePreview';

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
}

type QRSize = 256 | 512 | 1024;
type QRFormat = 'png' | 'svg';

export const QRCodeDialog = ({ isOpen, onClose, business }: QRCodeDialogProps) => {
  const { t } = useLanguage();
  const [size, setSize] = useState<QRSize>(512);
  const [format, setFormat] = useState<QRFormat>('png');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate QR code when dialog opens or size/format changes
  useEffect(() => {
    if (isOpen && business.slug) {
      generateQR();
    }
  }, [isOpen, size, format, business.slug]);

  const generateQR = async () => {
    setLoading(true);
    try {
      if (format === 'png') {
        const dataUrl = await generateQRCodeDataURL(business.slug, size);
        setQrDataUrl(dataUrl);
      } else {
        const svgString = await generateQRCodeSVG(business.slug, size);
        // Convert SVG string to data URL
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const svgDataUrl = URL.createObjectURL(svgBlob);
        setQrDataUrl(svgDataUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    try {
      downloadQRCode(qrDataUrl, business.name, format);
      toast.success(t.successQRDownloaded);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleShare = async () => {
    if (!qrDataUrl) return;

    try {
      await shareQRCode(qrDataUrl, business.name);
      toast.success(t.successQRShared);
    } catch (error) {
      console.error('Error sharing QR code:', error);
      // Don't show error toast if user cancelled share
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share QR code');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyReviewLink(business.slug);
      toast.success(t.successLinkCopied);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const reviewUrl = `${window.location.origin}/review/${business.slug}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t.qrCodeTitle.replace('{business}', business.name)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code Preview */}
          <QRCodePreview
            qrDataUrl={qrDataUrl}
            businessName={business.name}
            loading={loading}
          />

          {/* Scan Prompt and URL */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">{t.qrScanPrompt}</p>
            <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              {reviewUrl}
            </p>
          </div>

          {/* Size Selector */}
          <div className="w-full space-y-2">
            <label className="text-sm font-medium">{t.qrSize}</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={size === 256 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSize(256)}
                disabled={loading}
              >
                {t.qrSizeSmall}
              </Button>
              <Button
                variant={size === 512 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSize(512)}
                disabled={loading}
              >
                {t.qrSizeMedium}
              </Button>
              <Button
                variant={size === 1024 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSize(1024)}
                disabled={loading}
              >
                {t.qrSizeLarge}
              </Button>
            </div>
          </div>

          {/* Format Selector */}
          <div className="w-full space-y-2">
            <label className="text-sm font-medium">{t.qrFormat}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={format === 'png' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('png')}
                disabled={loading}
              >
                PNG
              </Button>
              <Button
                variant={format === 'svg' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('svg')}
                disabled={loading}
              >
                SVG
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !qrDataUrl}
              className="flex flex-col h-auto py-3 gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">{t.downloadQR}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              disabled={loading || !qrDataUrl}
              className="flex flex-col h-auto py-3 gap-1"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">{t.shareQR}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="flex flex-col h-auto py-3 gap-1"
            >
              <Link2 className="h-4 w-4" />
              <span className="text-xs">{t.copyLink}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
