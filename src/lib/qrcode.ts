import QRCode from 'qrcode';

/**
 * Generates a QR code as a PNG data URL
 * @param slug - Business slug for the review page URL
 * @param size - Size in pixels (256, 512, or 1024)
 * @returns Promise resolving to data URL string
 */
export async function generateQRCodeDataURL(slug: string, size: number): Promise<string> {
  const url = `${window.location.origin}/review/${slug}`;

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High = 30% damage tolerance
    });

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generates a QR code as an SVG string
 * @param slug - Business slug for the review page URL
 * @param size - Size in pixels (for viewBox dimensions)
 * @returns Promise resolving to SVG string
 */
export async function generateQRCodeSVG(slug: string, size: number): Promise<string> {
  const url = `${window.location.origin}/review/${slug}`;

  try {
    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    return svgString;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

/**
 * Triggers a download of the QR code
 * @param dataUrl - Data URL or SVG string to download
 * @param businessName - Business name for filename
 * @param format - File format ('png' or 'svg')
 */
export function downloadQRCode(dataUrl: string, businessName: string, format: 'png' | 'svg'): void {
  try {
    // Create sanitized filename from business name
    const sanitizedName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const filename = `${sanitizedName}-qr-code.${format}`;

    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw new Error('Failed to download QR code');
  }
}

/**
 * Shares the QR code using Web Share API with fallback to download
 * @param dataUrl - Data URL to share
 * @param businessName - Business name for filename
 * @returns Promise resolving when share is complete
 */
export async function shareQRCode(dataUrl: string, businessName: string): Promise<void> {
  // Check if Web Share API is available
  if (!navigator.share || !navigator.canShare) {
    // Fallback to download
    downloadQRCode(dataUrl, businessName, 'png');
    return;
  }

  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create file from blob
    const sanitizedName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const file = new File([blob], `${sanitizedName}-qr-code.png`, { type: 'image/png' });

    // Check if we can share this file
    const shareData = {
      files: [file],
      title: `QR Code for ${businessName}`,
      text: `Scan this QR code to leave a review for ${businessName}`
    };

    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      // Fallback to download if sharing files is not supported
      downloadQRCode(dataUrl, businessName, 'png');
    }
  } catch (error) {
    // If user cancels share or error occurs, fall back to download
    if ((error as Error).name !== 'AbortError') {
      console.error('Error sharing QR code:', error);
      downloadQRCode(dataUrl, businessName, 'png');
    }
  }
}

/**
 * Copies the review URL to clipboard
 * @param slug - Business slug for the review page URL
 * @returns Promise resolving when copy is complete
 */
export async function copyReviewLink(slug: string): Promise<void> {
  const url = `${window.location.origin}/review/${slug}`;

  try {
    await navigator.clipboard.writeText(url);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw new Error('Failed to copy link to clipboard');
  }
}
