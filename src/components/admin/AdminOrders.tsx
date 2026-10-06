import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  FileText,
  User,
  Phone,
  Mail,
  Loader2,
  X,
  CreditCard,
  Check,
} from 'lucide-react';
import { Order, PaymentStatus } from '../../types';
import { adminApi } from '../../services/api';

interface AdminOrdersProps {
  orders: Order[];
  currency: string;
  initialFilter?: string;
  onRefresh: () => void;
  selectedOrderForInspection?: Order | null;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  currency,
  initialFilter = 'All',
  onRefresh,
  selectedOrderForInspection = null,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(
    selectedOrderForInspection
  );

  // Verification / Action state
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Sync inspectedOrder notes when opened
  const handleOpenInspection = (order: Order) => {
    setInspectedOrder(order);
    setInternalNotes(order.internal_notes || '');
    setShowRejectInput(false);
    setActionSuccessMessage(null);
  };

  const handleVerify = async (orderId: string) => {
    try {
      setIsProcessing(true);
      setActionSuccessMessage(null);
      const res = await adminApi.verifyPayment(orderId);
      setInspectedOrder(res.order);
      setActionSuccessMessage('Payment verified! Product access granted to customer.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      setIsProcessing(true);
      setActionSuccessMessage(null);
      const res = await adminApi.rejectPayment(orderId, rejectionReason);
      setInspectedOrder(res.order);
      setShowRejectInput(false);
      setActionSuccessMessage('Payment rejected. Access denied.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async (orderId: string) => {
    if (window.confirm('Revoke product access for this customer? They will not be able to download or view digital assets.')) {
      try {
        setIsProcessing(true);
        await adminApi.revokeAccess(orderId);
        setActionSuccessMessage('Product access has been REVOKED.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Revocation failed');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRestore = async (orderId: string) => {
    try {
      setIsProcessing(true);
      await adminApi.restoreAccess(orderId);
      setActionSuccessMessage('Product access restored.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Restoration failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNotes = async (orderId: string) => {
    try {
      await adminApi.updateOrderNotes(orderId, internalNotes);
      alert('Internal notes saved');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save notes');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === 'All' || order.payment_status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      order.id.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_email.toLowerCase().includes(q) ||
      order.customer_phone.toLowerCase().includes(q) ||
      order.transaction_id.toLowerCase().includes(q) ||
      order.product_name.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Phone, Transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {st === 'All' ? 'All Orders' : st}
              {st === 'PENDING' && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400/30 text-amber-900 font-black text-[10px]">
                  {orders.filter((o) => o.payment_status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <th className="py-3.5 px-4 font-semibold">Order ID & Date</th>
                <th className="py-3.5 px-4 font-semibold">Customer Details</th>
                <th className="py-3.5 px-4 font-semibold">Product Purchased</th>
                <th className="py-3.5 px-4 font-semibold">Method & TID</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white text-xs">{ord.id}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(ord.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{ord.customer_name}</div>
                      <div className="text-[11px] text-zinc-400">{ord.customer_email}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{ord.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-200 line-clamp-1 max-w-[180px]">
                        {ord.product_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.payment_method === 'EasyPaisa'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}
                      >
                        {ord.payment_method}
                      </span>
                      <div className="font-mono text-[11px] text-zinc-300 mt-1">
                        TID: {ord.transaction_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {currency} {ord.amount_paid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          ord.payment_status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ord.payment_status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {ord.payment_status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                        {ord.payment_status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {ord.payment_status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenInspection(ord)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          ord.payment_status === 'PENDING'
                            ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-sm shadow-amber-500/20'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        Inspect & Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION & VERIFICATION MODAL */}
      {inspectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[94vh] overflow-y-auto shadow-2xl text-zinc-100 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {inspectedOrder.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inspectedOrder.payment_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : inspectedOrder.payment_status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {inspectedOrder.payment_status}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white">
                  Payment Verification & Access Control
                </h3>
              </div>

              <button
                onClick={() => setInspectedOrder(null)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {actionSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Order & Customer Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Customer Information
                  </h4>
                  <p>
                    Name: <strong className="text-white">{inspectedOrder.customer_name}</strong>
                  </p>
                  <p>
                    Email:{' '}
                    <strong className="text-emerald-400 select-all">
                      {inspectedOrder.customer_email}
                    </strong>
                  </p>
                  <p>
                    Phone:{' '}
                    <strong className="text-zinc-200 select-all">
                      {inspectedOrder.customer_phone}
                    </strong>
                  </p>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Payment Details
                  </h4>
                  <p>
                    Method: <strong className="text-white">{inspectedOrder.payment_method}</strong>
                  </p>
                  <p>
                    Amount Paid:{' '}
                    <strong className="text-emerald-400 font-bold">
                      {currency} {inspectedOrder.amount_paid.toLocaleString()}
                    </strong>
                  </p>
                  <p>
                    Transaction ID (TID):{' '}
                    <strong className="font-mono text-amber-300 select-all text-sm bg-zinc-900 px-2 py-0.5 rounded">
                      {inspectedOrder.transaction_id}
                    </strong>
                  </p>
                </div>
              </div>

              {/* PAYMENT SCREENSHOT PROOF VIEWER */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Customer Payment Screenshot Proof</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Protected private image (Admin auth only)
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center p-2 max-h-[360px]">
                  <img
                    src={adminApi.getScreenshotUrl(inspectedOrder.id)}
                    alt="Payment Proof"
                    className="max-h-[340px] w-auto object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-2 right-2">
                    <a
                      href={adminApi.getScreenshotUrl(inspectedOrder.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 backdrop-blur"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Resolution</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS: VERIFY / REJECT / REVOKE */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                  Admin Verification Actions
                </h4>

                <div className="flex flex-wrap gap-3">
                  {/* VERIFY BUTTON */}
                  {inspectedOrder.payment_status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerify(inspectedOrder.id)}
                      disabled={isProcessing}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>VERIFY PAYMENT (GRANT PRODUCT ACCESS)</span>
                    </button>
                  )}

                  {/* REJECT BUTTON */}
                  {inspectedOrder.payment_status === 'PENDING' && (
                    <button
                      onClick={() => setShowRejectInput(!showRejectInput)}
                      className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>REJECT PAYMENT</span>
                    </button>
                  )}

                  {/* ACCESS REVOCATION */}
                  {inspectedOrder.payment_status === 'VERIFIED' && (
                    <button
                      onClick={() => handleRevoke(inspectedOrder.id)}
                      disabled={isProcessing}
                      className="py-2.5 px-4 rounded-xl bg-red-950/60 border border-red-800 hover:bg-red-900/60 text-red-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>REVOKE ACCESS</span>
                    </button>
                  )}
                </div>

                {/* Reject Reason Input (if toggled) */}
                {showRejectInput && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <label className="block text-xs font-semibold text-red-300">
                      Reason for Rejection (Shown to Customer):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Transaction ID 98421034871 was not received in our EasyPaisa statement."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(inspectedOrder.id)}
                        disabled={isProcessing}
                        className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400">
                  Internal Admin Notes (Private)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Confirmed on EasyPaisa mobile app at 14:32..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleSaveNotes(inspectedOrder.id)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
