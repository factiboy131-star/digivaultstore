import React, { useState } from 'react';
import { Search, User, Mail, Phone, ShoppingBag, ShieldCheck, DollarSign } from 'lucide-react';
import { CustomerSummary } from '../../types';

interface AdminCustomersProps {
  customers: CustomerSummary[];
  currency: string;
  onFilterOrdersByCustomer: (email: string) => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  customers,
  currency,
  onFilterOrdersByCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-zinc-400">
          Total Customers: <strong className="text-white">{customers.length}</strong>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                <th className="py-3.5 px-4 font-semibold">Total Orders</th>
                <th className="py-3.5 px-4 font-semibold">Total Spent</th>
                <th className="py-3.5 px-4 font-semibold">Purchased Digital Products</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr key={cust.email} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{cust.name}</div>
                          <div className="text-[10px] text-zinc-500">
                            Last active: {new Date(cust.latest_order).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200 select-all">{cust.email}</div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{cust.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white">{cust.total_orders}</span>
                      <span className="text-[11px] text-zinc-400 ml-1">
                        ({cust.verified_orders} verified)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-400 text-sm">
                      {currency} {cust.total_spent.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cust.purchased_products.length > 0 ? (
                          cust.purchased_products.map((pName, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-300 truncate max-w-[140px]"
                            >
                              {pName}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-[11px]">Pending verification</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onFilterOrdersByCustomer(cust.email)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        View Orders
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
