import React, { useState } from 'react';
import {
  Save,
  Check,
  CreditCard,
  Settings as SettingsIcon,
  ShieldCheck,
  Globe,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SiteSettings } from '../../types';
import { adminApi } from '../../services/api';

interface AdminSettingsProps {
  settings: SiteSettings;
  onRefresh: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'general' | 'delivery' | 'homepage'>('payments');
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setErrorMessage(null);

      await adminApi.updateSettings(formData);
      setSaveSuccess(true);
      onRefresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900 px-4 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>EasyPaisa & JazzCash Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4 text-emerald-400" />
          <span>General Store Info</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'delivery'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Delivery & Expiration Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('homepage')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'homepage'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Homepage CMS</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Store settings successfully updated in the database!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. PAYMENTS: EASYPAISA & JAZZCASH */}
        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EasyPaisa Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <h4 className="font-extrabold text-sm text-white">EasyPaisa Configuration</h4>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.payments.easypaisa.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payments: {
                          ...formData.payments,
                          easypaisa: {
                            ...formData.payments.easypaisa,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  EasyPaisa Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.payments.easypaisa.account_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payments: {
                        ...formData.payments,
                        easypaisa: {
                          ...formData.payments.easypaisa,
                          account_name: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  EasyPaisa Account Number (Mobile) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.payments.easypaisa.account_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payments: {
                        ...formData.payments,
                        easypaisa: {
                          ...formData.payments.easypaisa,
                          account_number: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  EasyPaisa Instructions (Shown at Checkout)
                </label>
                <textarea
                  rows={4}
                  value={formData.payments.easypaisa.instructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payments: {
                        ...formData.payments,
                        easypaisa: {
                          ...formData.payments.easypaisa,
                          instructions: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>

            {/* JazzCash Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <h4 className="font-extrabold text-sm text-white">JazzCash Configuration</h4>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.payments.jazzcash.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payments: {
                          ...formData.payments,
                          jazzcash: {
                            ...formData.payments.jazzcash,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-orange-500"
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  JazzCash Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.payments.jazzcash.account_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payments: {
                        ...formData.payments,
                        jazzcash: {
                          ...formData.payments.jazzcash,
                          account_name: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  JazzCash Account Number (Mobile) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.payments.jazzcash.account_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payments: {
                        ...formData.payments,
                        jazzcash: {
                          ...formData.payments.jazzcash,
                          account_number: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-mono text-orange-400 font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  JazzCash Instructions (Shown at Checkout)
                </label>
                <textarea
                  rows={4}
                  value={formData.payments.jazzcash.instructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payments: {
                        ...formData.payments,
                        jazzcash: {
                          ...formData.payments.jazzcash,
                          instructions: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h4 className="font-extrabold text-sm text-white mb-2">General Store Identity</h4>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Store Name</label>
              <input
                type="text"
                value={formData.general.store_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    general: { ...formData.general, store_name: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Store Tagline</label>
              <input
                type="text"
                value={formData.general.store_tagline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    general: { ...formData.general, store_tagline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Official Email</label>
                <input
                  type="email"
                  value={formData.general.store_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      general: { ...formData.general, store_email: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">WhatsApp Support</label>
                <input
                  type="text"
                  value={formData.general.whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      general: { ...formData.general, whatsapp: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Currency Code</label>
              <input
                type="text"
                value={formData.general.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    general: { ...formData.general, currency: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* 3. DELIVERY & ACCESS EXPIRATION RULES */}
        {activeTab === 'delivery' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h4 className="font-extrabold text-sm text-white mb-2">Digital Delivery Rules</h4>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Download Link Expiration (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={formData.delivery.download_link_expiration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery: {
                      ...formData.delivery,
                      download_link_expiration_minutes: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-zinc-500">
                Short-lived cryptographic token generated per click to prevent link-sharing.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Maximum Download Attempts per Customer
              </label>
              <input
                type="number"
                min={1}
                value={formData.delivery.max_download_attempts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery: {
                      ...formData.delivery,
                      max_download_attempts: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Product Access Validity (Days)
              </label>
              <input
                type="number"
                min={1}
                value={formData.delivery.access_expiration_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery: {
                      ...formData.delivery,
                      access_expiration_days: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* 4. HOMEPAGE CMS */}
        {activeTab === 'homepage' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-w-2xl">
            <h4 className="font-extrabold text-sm text-white mb-2">Homepage Copy & CMS</h4>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Top Announcement Bar
              </label>
              <input
                type="text"
                value={formData.homepage.announcement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    homepage: { ...formData.homepage, announcement: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Hero Badge</label>
              <input
                type="text"
                value={formData.homepage.hero_badge}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    homepage: { ...formData.homepage, hero_badge: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Hero Heading</label>
              <input
                type="text"
                value={formData.homepage.hero_heading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    homepage: { ...formData.homepage, hero_heading: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Hero Description</label>
              <textarea
                rows={3}
                value={formData.homepage.hero_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    homepage: { ...formData.homepage, hero_description: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-extrabold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE CONFIGURATION</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
