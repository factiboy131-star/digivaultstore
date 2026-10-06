import React from 'react';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  Users,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { DashboardStats, Order, Product } from '../../types';

interface AdminDashboardProps {
  stats: DashboardStats;
  currency: string;
  onNavigateTab: (tab: string, filter?: string) => void;
  onInspectOrder: (order: Order) => void;
  onAddNewProduct: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  currency,
  onNavigateTab,
  onInspectOrder,
  onAddNewProduct,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Pending Orders Attention Alert if pending > 0 */}
      {stats.pendingPayments > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-white">
                {stats.pendingPayments} Payment{stats.pendingPayments > 1 ? 's' : ''} Awaiting Admin Verification
              </h4>
              <p className="text-xs text-amber-200/80">
                Customers have submitted EasyPaisa / JazzCash payment proofs. Verify them to grant product downloads.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('orders', 'PENDING')}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <span>Review Pending Payments</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards Grid - ALL CARDS CLICKABLE */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalProducts}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block group-hover:text-emerald-400 transition-colors">
            Manage catalog →
          </span>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => onNavigateTab('orders', 'All')}
          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalOrders}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block group-hover:text-emerald-400 transition-colors">
            View all orders →
          </span>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => onNavigateTab('orders', 'PENDING')}
          className={`bg-zinc-900 border rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group ${
            stats.pendingPayments > 0
              ? 'border-amber-500/60 bg-amber-950/20 hover:border-amber-400'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300">Pending Payments</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.pendingPayments}</div>
          <span className="text-[11px] text-amber-400 mt-1 block font-medium">
            Requires verification →
          </span>
        </div>

        {/* Total Revenue */}
        <div
          onClick={() => onNavigateTab('orders', 'VERIFIED')}
          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {currency} {stats.totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block group-hover:text-emerald-400 transition-colors">
            Verified earnings →
          </span>
        </div>

        {/* Verified Payments */}
        <div
          onClick={() => onNavigateTab('orders', 'VERIFIED')}
          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Verified Payments</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.verifiedPayments}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block group-hover:text-emerald-400 transition-colors">
            Active access grants →
          </span>
        </div>

        {/* Rejected Payments */}
        <div
          onClick={() => onNavigateTab('orders', 'REJECTED')}
          className="bg-zinc-900 border border-zinc-800 hover:border-red-500/60 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Rejected Payments</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-red-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.rejectedPayments}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block group-hover:text-red-400 transition-colors">
            Unverified attempts →
          </span>
        </div>

        {/* Total Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer group col-span-2 sm:col-span-2"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Total Unique Customers</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-teal-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalCustomers}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block group-hover:text-emerald-400 transition-colors">
            Customer directory & access control →
          </span>
        </div>
      </div>

      {/* Two Column Section: Recent Pending Submissions & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Orders (Quick Review) */}
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-extrabold text-base text-white">Recent Orders & Submissions</h3>
              <p className="text-xs text-zinc-400">Latest checkout requests from customers</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders', 'All')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800/80">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-zinc-500">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 font-mono text-zinc-300 font-semibold">{ord.id}</td>
                      <td className="py-3">
                        <div className="font-medium text-white">{ord.customer_name}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[130px]">{ord.customer_email}</div>
                      </td>
                      <td className="py-3 text-zinc-300 truncate max-w-[140px]">{ord.product_name}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.payment_method === 'EasyPaisa'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          }`}
                        >
                          {ord.payment_method}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-white">
                        {currency} {ord.amount_paid.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.payment_status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : ord.payment_status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onInspectOrder(ord)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Selling & Quick Launch */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Button */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-zinc-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Create Digital Product</span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload custom images, digital files (PDF, ZIP, DOCX), configure EasyPaisa pricing and features.
            </p>
            <button
              onClick={onAddNewProduct}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+ Add New Product</span>
            </button>
          </div>

          {/* Top Selling Products List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Top Selling Products</span>
              </h4>
            </div>

            {stats.topSelling.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">No verified sales recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.topSelling.map(({ product, count, revenue }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800"
                  >
                    <div className="truncate max-w-[170px]">
                      <div className="font-bold text-white truncate">{product.name}</div>
                      <div className="text-[10px] text-zinc-500">{product.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-emerald-400">
                        {currency} {revenue.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-400">{count} verified sale{count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
