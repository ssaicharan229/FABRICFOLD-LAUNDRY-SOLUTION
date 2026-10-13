import React, { useState } from 'react';
import { Customer, Package } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { RotateCcw, X, Check, ShieldCheck } from 'lucide-react';

interface RenewPackageModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onRenewed: (updatedCustomer: Customer) => void;
}

export const RenewPackageModal: React.FC<RenewPackageModalProps> = ({
  isOpen,
  customer,
  onClose,
  onRenewed,
}) => {
  const { success, error } = useToast();
  const packages = dataService.getPackages();

  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    customer?.package_id || packages[0]?.id || ''
  );
  const [customWashes, setCustomWashes] = useState<number>(34);

  if (!isOpen || !customer) return null;

  const currentPkg = packages.find(p => p.id === selectedPkgId) || packages[0];

  const handleRenew = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = dataService.renewCustomerPackage(customer.id, selectedPkgId, customWashes);
      success('Package Renewed!', `${customer.name} renewed with ${currentPkg.name} (${customWashes} fresh washes).`);
      onRenewed(updated);
      onClose();
    } catch (err: any) {
      error('Renewal failed', err?.message || 'Error renewing package');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Renew / Upgrade Wash Package</h3>
              <p className="text-xs text-slate-400">Refill quota for {customer.name} ({customer.customer_id})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleRenew} className="p-6 space-y-5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="text-slate-500 font-semibold">Current Balance:</div>
            <div className="text-slate-900 font-mono">
              <strong>{customer.used_washes} / {customer.total_washes} Washes Used</strong> ({customer.remaining_washes} remaining)
            </div>
            <div className="text-slate-500 text-[11px]">
              Renewing will reset used washes to 0 and extend package validity for 1 full academic year.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Package Tier
            </label>
            <div className="space-y-2">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPkgId(pkg.id);
                    setCustomWashes(pkg.annual_wash_limit);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPkgId === pkg.id
                      ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      {pkg.name}
                      {pkg.name === 'PREMIUM' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full font-bold">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-normal mt-0.5">{pkg.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">₹{pkg.price.toLocaleString()}</div>
                    <div className="text-xs text-teal-700 font-semibold">{pkg.annual_wash_limit} washes/yr</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Annual Washes Allocated
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={customWashes}
              onChange={e => setCustomWashes(parseInt(e.target.value, 10) || 34)}
              className="w-full text-sm font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Confirm Package Renewal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
