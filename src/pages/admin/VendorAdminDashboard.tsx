/**
 * Vendor Admin Dashboard
 * ======================
 * 
 * Admin interface for managing vendor submissions, approvals, and analytics.
 * 
 * Features:
 * - Product approval queue
 * - Vendor management
 * - Pricing review & sync
 * - Analytics & reporting
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Package, 
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  Building2,
  BarChart3
} from 'lucide-react';
import { 
  getVendorProducts,
  approveVendorProduct,
  rejectVendorProduct,
  autoApproveVendorProduct
} from '@/services/vendorService';
import { syncApprovedVendorProducts } from '@/services/vendorPricingIntegrationService';
import type { VendorProduct } from '@/services/supabaseClient';
import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/database.types';

type Vendor = Database['public']['Tables']['vendors']['Row'];
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';
type FilterCategory = 'all' | 'battery' | 'inverter' | 'ems' | 'bos' | 'container';

interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalSubmissions: number;
}

export default function VendorAdminDashboard() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load vendors
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (vendorData) setVendors(vendorData as Vendor[]);

      // Load products
      const productsData = await getVendorProducts();
      setProducts(productsData as VendorProduct[]);

      // Calculate stats
      const statsData = calculateStats(vendorData || [], productsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (vendorList: Vendor[], productList: VendorProduct[]): VendorStats => {
    return {
      totalVendors: vendorList.length,
      activeVendors: vendorList.filter(v => v.status === 'approved').length,
      pendingProducts: productList.filter(p => p.status === 'pending').length,
      approvedProducts: productList.filter(p => p.status === 'approved').length,
      rejectedProducts: productList.filter(p => p.status === 'rejected').length,
      totalSubmissions: productList.length,
    };
  };

  const handleApprove = async (productId: string) => {
    try {
      const result = await approveVendorProduct(productId, 'admin-id'); // TODO: Get real admin ID
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to approve product:', error);
    }
  };

  const handleReject = async (productId: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      const result = await rejectVendorProduct(productId, 'admin-id', reason);
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to reject product:', error);
    }
  };

  const handleAutoApprove = async (productId: string) => {
    try {
      // Get current admin user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const result = await autoApproveVendorProduct(productId, user.id);
      if (result.success) {
        await loadData();
      } else {
        alert(`Auto-approval failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to auto-approve product:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncApprovedVendorProducts();
      alert('Successfully synced approved vendor products to pricing database');
      await loadData();
    } catch (error) {
      console.error('Failed to sync products:', error);
      alert('Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && p.product_category !== filterCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.manufacturer?.toLowerCase().includes(query) ||
        p.model?.toLowerCase().includes(query) ||
        p.product_category?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-slate-400">Loading vendor data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <div className="bg-[#1a1c23] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Vendor Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">Manage vendor submissions and pricing</p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] text-white rounded-lg font-semibold hover:bg-[#35b87d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Pricing'}
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <StatCard
                icon={<Building2 className="w-5 h-5" />}
                label="Total Vendors"
                value={stats.totalVendors}
                color="text-blue-400"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5" />}
                label="Active"
                value={stats.activeVendors}
                color="text-emerald-400"
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Pending"
                value={stats.pendingProducts}
                color="text-amber-400"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5" />}
                label="Approved"
                value={stats.approvedProducts}
                color="text-emerald-400"
              />
              <StatCard
                icon={<XCircle className="w-5 h-5" />}
                label="Rejected"
                value={stats.rejectedProducts}
                color="text-red-400"
              />
              <StatCard
                icon={<Package className="w-5 h-5" />}
                label="Total"
                value={stats.totalSubmissions}
                color="text-slate-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by manufacturer, model, category..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a1c23] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#3ECF8E]/30"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2 bg-[#1a1c23] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-[#3ECF8E]/30"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
            className="px-4 py-2 bg-[#1a1c23] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-[#3ECF8E]/30"
          >
            <option value="all">All Categories</option>
            <option value="battery">Battery</option>
            <option value="inverter">Inverter/PCS</option>
            <option value="ems">EMS</option>
            <option value="bos">BOS</option>
            <option value="container">Container</option>
          </select>

          <div className="text-sm text-slate-400">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No products found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onApprove={() => handleApprove(product.id)}
                      onReject={() => handleReject(product.id)}
                      onAutoApprove={() => handleAutoApprove(product.id)}
                      onView={() => setSelectedProduct(product)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onApprove={() => {
            handleApprove(selectedProduct.id);
            setSelectedProduct(null);
          }}
          onReject={() => {
            handleReject(selectedProduct.id);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-[#1a1c23] border border-white/[0.06] rounded-xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ProductRow({ 
  product, 
  onApprove, 
  onReject, 
  onAutoApprove,
  onView 
}: { 
  product: VendorProduct; 
  onApprove: () => void; 
  onReject: () => void;
  onAutoApprove: () => void;
  onView: () => void;
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-white">{product.manufacturer} {product.model}</div>
          <div className="text-xs text-slate-400">{product.capacity_kwh}kWh / {product.power_kw}kW</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-300">{product.vendor_id}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-300 capitalize">{product.product_category}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-300">
          ${product.price_per_kwh || 0}/kWh
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusColors[product.status || 'pending']}`}>
          {product.status === 'pending' && <Clock className="w-3 h-3" />}
          {product.status === 'approved' && <CheckCircle className="w-3 h-3" />}
          {product.status === 'rejected' && <XCircle className="w-3 h-3" />}
          {product.status || 'pending'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {product.status === 'pending' && (
            <>
              <button
                onClick={onAutoApprove}
                className="p-1.5 hover:bg-white/[0.05] rounded transition-colors text-blue-400"
                title="Auto-approve (validation)"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
              <button
                onClick={onApprove}
                className="p-1.5 hover:bg-white/[0.05] rounded transition-colors text-emerald-400"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={onReject}
                className="p-1.5 hover:bg-white/[0.05] rounded transition-colors text-red-400"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onView}
            className="text-xs text-[#3ECF8E] hover:underline"
          >
            View
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductDetailModal({ 
  product, 
  onClose, 
  onApprove, 
  onReject 
}: { 
  product: VendorProduct; 
  onClose: () => void; 
  onApprove: () => void; 
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{product.manufacturer} {product.model}</h2>
              <p className="text-sm text-slate-400">Product ID: {product.id}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Category" value={product.product_category || '—'} />
              <DetailItem label="Capacity" value={`${product.capacity_kwh || 0} kWh`} />
              <DetailItem label="Power" value={`${product.power_kw || 0} kW`} />
              <DetailItem label="Price/kWh" value={`$${product.price_per_kwh || 0}`} />
              <DetailItem label="Price/kW" value={`$${product.price_per_kw || 0}`} />
              <DetailItem label="Lead Time" value={`${product.lead_time_weeks || 0} weeks`} />
              <DetailItem label="Warranty" value={`${product.warranty_years || 0} years`} />
              <DetailItem label="Status" value={product.status || 'pending'} />
            </div>

            {/* Certifications */}
            {product.certifications && (
              <div>
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Certifications</div>
                <div className="text-white">{product.certifications}</div>
              </div>
            )}

            {/* Actions */}
            {product.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  onClick={onApprove}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Approve Product
                </button>
                <button
                  onClick={onReject}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Reject Product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-white font-medium capitalize">{value}</div>
    </div>
  );
}
