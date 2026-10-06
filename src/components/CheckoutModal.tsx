import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Copy,
  Check,
  Upload,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Product, SiteSettings, Order } from '../types';
import { storeApi } from '../services/api';

interface CheckoutModalProps {
  product: Product;
  settings: SiteSettings;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  settings,
  onClose,
  onSuccess,
}) => {
  const currency = settings?.general.currency || 'PKR';
  const hasDiscount = product.discount_price !== null && product.discount_price < product.price;
  const finalPrice = hasDiscount ? product.discount_price! : product.price;

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Status & Validation
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const easypaisaConfig = settings.payments.easypaisa;
  const jazzcashConfig = settings.payments.jazzcash;

  const currentPaymentConfig =
    paymentMethod === 'EasyPaisa' ? easypaisaConfig : jazzcashConfig;

  const handleCopyAccount = () => {
    if (currentPaymentConfig.account_number) {
      navigator.clipboard.writeText(currentPaymentConfig.account_number);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Max 10MB check
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Screenshot file size must be less than 10MB');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address (needed for digital asset delivery)');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your mobile phone number');
      return;
    }
    if (!transactionId.trim() || transactionId.trim().length < 4) {
      setErrorMessage('Please enter the valid Transaction ID (TID) from your payment receipt');
      return;
    }
    if (!screenshotFile) {
      setErrorMessage('Please upload a screenshot or photo of your payment receipt');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('customer_name', customerName.trim());
      formData.append('customer_email', customerEmail.trim());
      formData.append('customer_phone', customerPhone.trim());
      formData.append('product_id', product.id);
      formData.append('payment_method', paymentMethod);
      formData.append('transaction_id', transactionId.trim());
      formData.append('payment_screenshot', screenshotFile);

      const result = await storeApi.submitCheckout(formData);
      onSuccess(result.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl text-zinc-100">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-base sm:text-lg text-white">
              Secure Checkout & Manual Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Summary Card */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={product.main_image_url}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover border border-zinc-800"
              />
              <div>
                <h4 className="font-bold text-sm text-white line-clamp-1">{product.name}</h4>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>{product.product_type}</span>
                  <span>•</span>
                  <span>Qty: 1</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-white">
                {currency} {finalPrice.toLocaleString()}
              </div>
              {hasDiscount && (
                <div className="text-xs text-zinc-500 line-through">
                  {currency} {product.price.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Customer Contact Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <span>1. Contact & Delivery Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Ali"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Email Address * <span className="text-[11px] text-zinc-500">(File access sent here)</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ali@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0300 1234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              2. Select Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* EasyPaisa Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('EasyPaisa')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'EasyPaisa'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-emerald-400">EasyPaisa</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'EasyPaisa'
                        ? 'border-emerald-400 bg-emerald-500'
                        : 'border-zinc-600'
                    }`}
                  >
                    {paymentMethod === 'EasyPaisa' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400">Manual Mobile Transfer</div>
              </button>

              {/* JazzCash Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('JazzCash')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'JazzCash'
                    ? 'bg-orange-950/40 border-orange-500 text-white shadow-md shadow-orange-950/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-orange-400">JazzCash</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'JazzCash'
                        ? 'border-orange-400 bg-orange-500'
                        : 'border-zinc-600'
                    }`}
                  >
                    {paymentMethod === 'JazzCash' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400">Manual Mobile Transfer</div>
              </button>
            </div>
          </div>

          {/* Account Details & Instructions Box */}
          <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs text-zinc-400">Send Amount to:</span>
              <span className="text-sm font-bold text-white">
                {paymentMethod} Account
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                  Account Name
                </span>
                <span className="font-bold text-zinc-200">
                  {currentPaymentConfig.account_name || 'DigiVault Official'}
                </span>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                    Account Number
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {currentPaymentConfig.account_number || '03001234567'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step by Step Instructions */}
            <div className="text-xs text-zinc-400 whitespace-pre-line bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60 leading-relaxed">
              {currentPaymentConfig.instructions}
            </div>
          </div>

          {/* Payment Proof Fields: TID & Screenshot */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span>3. Enter Payment Proof</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Transaction ID (TID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 98421034871"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Found in your EasyPaisa / JazzCash confirmation SMS or transaction receipt.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Amount Paid ({currency})
                </label>
                <input
                  type="text"
                  disabled
                  value={`${currency} ${finalPrice.toLocaleString()}`}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-emerald-400 opacity-90 cursor-not-allowed"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Exact product amount to be transferred.
                </span>
              </div>
            </div>

            {/* Screenshot Upload with Preview */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Upload Payment Screenshot Proof * (JPG, PNG, WEBP)
              </label>

              {screenshotPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 p-3 flex items-center gap-4">
                  <img
                    src={screenshotPreview}
                    alt="Payment Proof Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-zinc-800"
                  />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-zinc-200 truncate">
                      {screenshotFile?.name}
                    </p>
                    <p className="text-zinc-500">
                      {((screenshotFile?.size || 0) / 1024).toFixed(1)} KB • Ready for submission
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotFile(null);
                      setScreenshotPreview(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/80 bg-zinc-950 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <Upload className="w-7 h-7 text-zinc-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                    Tap to upload payment screenshot
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">
                    Maximum size: 10MB (JPG, JPEG, PNG, WEBP)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Payment Proof...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>SUBMIT PAYMENT & VERIFY ORDER</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-zinc-500 text-center mt-2.5">
              Our admin verifies payment proofs around the clock. Your order status updates in real-time.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
