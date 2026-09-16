import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Printer, X, Loader2, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { orderApi, adminOrderApi, downloadBlobFile } from '../../../utils/api';

export default function InvoicePreviewModal({ isOpen, onClose, order, isAdmin = false }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [blobData, setBlobData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const iframeRef = useRef(null);

  const orderId = order?.id || order?.orderNumber || (typeof order === 'string' ? order : '');
  const displayOrderNumber = order?.orderNumber || order?.id || (typeof order === 'string' ? order : '');

  // Fetch invoice PDF blob on open
  const loadInvoice = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      setDownloadSuccess(false);

      const api = isAdmin ? adminOrderApi : orderApi;
      const blob = await api.getInvoiceBlob(orderId);
      
      const url = window.URL.createObjectURL(blob);
      setBlobData(blob);
      setBlobUrl(url);
    } catch (err) {
      console.error('[InvoicePreviewModal] Failed to fetch invoice:', err);
      setError(err.message || 'Could not load invoice preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      loadInvoice();
    } else {
      // Cleanup when closed
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
        setBlobData(null);
      }
      setError(null);
      setLoading(false);
      setDownloadSuccess(false);
    }

    return () => {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, orderId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  // Download action
  const handleDownload = () => {
    const filename = `Invoice-${displayOrderNumber || 'Order'}.pdf`;
    if (blobData) {
      downloadBlobFile(blobData, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } else if (orderId) {
      const api = isAdmin ? adminOrderApi : orderApi;
      api.downloadInvoice(orderId);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  // Print action
  const handlePrint = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } else if (blobUrl) {
        window.open(blobUrl, '_blank');
      }
    } catch (err) {
      console.error('Print error, falling back to download:', err);
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl h-[92vh] sm:h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF7F2] border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-[#0E2A1B] truncate">
                  Tax Invoice Preview
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-200 text-stone-800">
                  #{displayOrderNumber}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 truncate mt-0.5">
                AURIVÁ Foods Official GST Invoice • Generated in Real-time
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#0E2A1B] hover:bg-[#1B3B29] text-[#D4AF37] text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              title="Save invoice PDF to your device"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300">Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>

            {/* Print Button (Hidden on very small screens) */}
            <button
              onClick={handlePrint}
              disabled={loading || !blobUrl}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors disabled:opacity-40"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body / PDF Viewer */}
        <div className="flex-1 bg-[#4A4A4A] relative overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#0E2A1B]/10 flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6 text-[#0E2A1B] animate-spin" />
              </div>
              <p className="font-bold text-sm text-[#0E2A1B]">Generating Official Tax Invoice...</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                Retrieving verified order pricing, taxes, and shipping snapshot.
              </p>
            </div>
          )}

          {error ? (
            <div className="max-w-md p-6 bg-white rounded-2xl shadow-lg border border-rose-100 text-center m-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-stone-900">Failed to Load Invoice</h4>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{error}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={loadInvoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold hover:bg-stone-50 text-stone-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold hover:bg-[#1B3B29]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Direct</span>
                </button>
              </div>
            </div>
          ) : blobUrl ? (
            <iframe
              ref={iframeRef}
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={`Invoice-${displayOrderNumber}`}
              className="w-full h-full border-0 bg-stone-100"
            />
          ) : null}
        </div>

        {/* Footer Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Authorized computer-generated invoice. No physical signature required.</span>
            <span className="sm:hidden">Official GST Invoice</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
