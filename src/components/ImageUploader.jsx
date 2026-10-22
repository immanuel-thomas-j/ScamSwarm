import React, { useRef, useState } from 'react';
import jsQR from 'jsqr';
import { AlertIcon, CheckIcon, CloseIcon, CameraIcon, QrCodeIcon } from './Icons';

export default function ImageUploader({ onImageSelected, onQrDecoded, onClear }) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [isScanningQr, setIsScanningQr] = useState(false);

  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      setPreviewUrl(base64Data);
      onImageSelected(base64Data, file.type);

      // Attempt client-side QR code extraction
      decodeQrCode(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const decodeQrCode = (dataUrl) => {
    setIsScanningQr(true);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          setQrResult(code.data);
          if (onQrDecoded) onQrDecoded(code.data);
        } else {
          setQrResult(null);
        }
      } catch (err) {
        console.warn("Client QR decoding failed:", err);
      } finally {
        setIsScanningQr(false);
      }
    };
    img.src = dataUrl;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setQrResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  return (
    <div className="image-uploader-container">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {!previewUrl ? (
        <div
          className="image-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon">
            <CameraIcon size={30} color="var(--cyan)" />
          </div>
          <div className="dropzone-text">
            <strong>Upload or Drop Screenshot / QR Code</strong>
            <span>Inspects fake payment receipts, SMS screenshots &amp; QR fraud</span>
          </div>
          <div className="dropzone-badge">MULTIMODAL FORENSICS</div>
        </div>
      ) : (
        <div className="image-preview-panel">
          <div className="preview-header">
            <span className="preview-label">
              <CheckIcon size={14} color="var(--green)" /> Telemetry Image Attached
            </span>
            <button className="clear-image-btn" onClick={handleClear} title="Remove image">
              <CloseIcon size={14} /> Remove
            </button>
          </div>

          <div className="preview-content">
            <img src={previewUrl} alt="Scam Evidence Preview" className="preview-thumbnail" />
            <div className="preview-meta">
              {isScanningQr && <div className="qr-status scanning">Scanning for QR code...</div>}
              {qrResult && (
                <div className="qr-badge-detected">
                  <span className="qr-icon">
                    <QrCodeIcon size={16} color="var(--cyan)" />
                  </span>
                  <div>
                    <strong>QR Code Extracted:</strong>
                    <code>{qrResult}</code>
                  </div>
                </div>
              )}
              {!qrResult && !isScanningQr && (
                <div className="qr-status none">
                  No QR code detected. Full vision OCR &amp; layout forensics will analyze screenshot text &amp; logos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
