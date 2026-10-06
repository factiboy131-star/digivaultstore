import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Mail,
  FileText,
  Loader2,
} from 'lucide-react';
import { storeApi } from '../services/api';
import { PromptViewerModal } from './PromptViewerModal';

interface OrderTrackingModalProps {
  initialOrderId?: string;
  initialEmail?: string;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  initialOrderId = '',
  initialEmail = '',
  onClose,
}) => {
  const [tab, setTab] = useState<'track' | 'my-orders'>('track');
  const [orderId, setOrderId] = useState(initialOrderId);
  const [email, setEmail] = useState(initialEmail);

  // Status & Results
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trackedOrderResult, setTrackedOrderResult] = useState<any | null>(null);

  // Customer order history by email
  const [historyEmail, setHistoryEmail] = useState(initialEmail);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Online Viewer
  const [viewerContent, setViewerContent] = useState<{
    name: string;
    content: string;
  } | null>(null);

  // Auto-search if initialOrderId & email provided
  useEffect(() => {
    if (initialOrderId && initialEmail) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      setErrorMessage('Please enter both your Order ID and billing Email address');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await storeApi.trackOrder(orderId.trim(), email.trim());
      setTrackedOrderResult(res);
    } catch (err: any) {
      setTrackedOrderResult(null);
      setErrorMessage(err.message || 'Order not found. Please double-check your Order ID and Email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookupHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyEmail.trim()) return;

    try {
      setHistoryLoading(true);
      setErrorMessage(null);
      const orders = await storeApi.getCustomerOrders(historyEmail.trim());
      setHistoryOrders(orders);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve order history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDownload = (downloadToken: string) => {
    const downloadUrl = storeApi.getDownloadUrl(downloadToken);
    window.location.href = downloadUrl;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-zinc-100 flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="font-extrabold text-base sm:text-lg text-white">
                  Track Order & Access Digital Vault
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Verify payment status and download authorized digital assets
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-950 px-6 pt-2">
            <button
              onClick={() => setTab('track')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                tab === 'track'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Order Status Lookup
            </button>
            <button
              onClick={() => setTab('my-orders')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                tab === 'my-orders'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Lookup All Purchases by Email
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* TAB 1: ORDER STATUS LOOKUP */}
            {tab === 'track' && (
              <div className="space-y-6">
                <form onSubmit={handleSearch} className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Order ID (e.g. DP-20261006-8F32)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="DP-..."
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Billing Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="your-email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Database Records...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Check Status & Unlock Downloads</span>
                      </>
                    )}
                  </button>
                </form>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* TRACKED ORDER RESULT DISPLAY */}
                {trackedOrderResult && (
                  <div className="space-y-4">
                    {/* Status Banner */}
                    {trackedOrderResult.order.payment_status === 'VERIFIED' && (
                      <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-2xl p-5 text-emerald-200 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                              Payment Verified ✓
                            </span>
                            <h3 className="text-lg font-black text-white">
                              YOUR PRODUCT IS READY FOR ACCESS
                            </h3>
                          </div>
                        </div>

                        {/* Product Action Box */}
                        <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-700/80 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-white text-sm sm:text-base">
                                {trackedOrderResult.product?.name || trackedOrderResult.order.product_name}
                              </h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Order ID: <span className="font-mono text-zinc-300">{trackedOrderResult.order.id}</span>
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                              Active License
                            </span>
                          </div>

                          {/* Download / Access Buttons */}
                          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                            {trackedOrderResult.download_token && (
                              <button
                                onClick={() => handleDownload(trackedOrderResult.download_token)}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                <span>DOWNLOAD PRODUCT FILE</span>
                              </button>
                            )}

                            {trackedOrderResult.product?.digital_content && (
                              <button
                                onClick={() =>
                                  setViewerContent({
                                    name: trackedOrderResult.product.name,
                                    content: trackedOrderResult.product.digital_content,
                                  })
                                }
                                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
                              >
                                <BookOpen className="w-4 h-4 text-emerald-400" />
                                <span>OPEN ONLINE VAULT</span>
                              </button>
                            )}
                          </div>

                          {/* Download Quota Indicator */}
                          <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800">
                            <span>
                              Downloads Used:{' '}
                              <strong className="text-zinc-200">
                                {trackedOrderResult.download_count || 0} / {trackedOrderResult.max_downloads || 10}
                              </strong>
                            </span>
                            <span>Token valid for current session</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {trackedOrderResult.order.payment_status === 'PENDING' && (
                      <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-5 text-amber-200 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                              Payment Pending Verification
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-white">
                              We are reviewing your payment proof
                            </h3>
                          </div>
                        </div>

                        <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
                          <p>
                            • Submitted Transaction ID:{' '}
                            <strong className="font-mono text-amber-300">
                              {trackedOrderResult.order.transaction_id}
                            </strong>
                          </p>
                          <p>
                            • Method: <strong>{trackedOrderResult.order.payment_method}</strong>
                          </p>
                          <p>
                            • Product:{' '}
                            <strong className="text-zinc-100">{trackedOrderResult.order.product_name}</strong>
                          </p>
                          <p className="text-zinc-400 text-[11px] pt-1">
                            Our admin reviews and confirms transactions quickly. Once verified, download links and prompt vault access will unlock immediately here.
                          </p>
                        </div>
                      </div>
                    )}

                    {trackedOrderResult.order.payment_status === 'REJECTED' && (
                      <div className="bg-red-950/40 border border-red-700/50 rounded-2xl p-5 text-red-200 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-red-400 block">
                              Payment Rejected
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-white">
                              Your payment could not be verified
                            </h3>
                          </div>
                        </div>

                        <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                          <p className="text-red-300 font-semibold mb-1">Reason provided by admin:</p>
                          <p className="text-zinc-300">
                            {trackedOrderResult.order.rejection_reason ||
                              'The submitted transaction ID or screenshot did not match incoming records.'}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-3">
                            If you believe this was an error, please contact support with your payment receipt.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LOOKUP ALL ORDERS BY EMAIL */}
            {tab === 'my-orders' && (
              <div className="space-y-4">
                <form onSubmit={handleLookupHistory} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your customer email"
                      value={historyEmail}
                      onChange={(e) => setHistoryEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={historyLoading}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    {historyLoading ? 'Loading...' : 'Find Purchases'}
                  </button>
                </form>

                {historyOrders.length > 0 ? (
                  <div className="space-y-2.5">
                    {historyOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => {
                          setOrderId(ord.id);
                          setEmail(historyEmail);
                          setTab('track');
                          handleSearch();
                        }}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-white">
                            {ord.product_name}
                          </h5>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1 font-mono">
                            <span>{ord.id}</span>
                            <span>•</span>
                            <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              ord.payment_status === 'VERIFIED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : ord.payment_status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {ord.payment_status}
                          </span>
                          <ArrowRight className="w-4 h-4 text-zinc-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-xs text-zinc-500">
                    Enter the email you used during checkout to list your order history.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Online Prompt Viewer Modal */}
      {viewerContent && (
        <PromptViewerModal
          productName={viewerContent.name}
          digitalContent={viewerContent.content}
          onClose={() => setViewerContent(null)}
        />
      )}
    </>
  );
};
