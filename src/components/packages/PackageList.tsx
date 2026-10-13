import React, { useState } from 'react';
import { Package } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { Package as PackageIcon, Check, Edit3, Plus, ShieldCheck, Sparkles, X } from 'lucide-react';

export const PackageList: React.FC = () => {
  const { success, error } = useToast();
  const [packages, setPackages] = useState<Package[]>(() => dataService.getPackages());
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(4500);
  const [limit, setLimit] = useState(34);
  const [desc, setDesc] = useState('');
  const [featureStr, setFeatureStr] = useState('');

  const reload = () => {
    setPackages(dataService.getPackages());
  };

  const openEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setPrice(pkg.price);
    setLimit(pkg.annual_wash_limit);
    setDesc(pkg.description);
    setFeatureStr(pkg.features.join('\n'));
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingPkg(null);
    setName('');
    setPrice(5000);
    setLimit(34);
    setDesc('');
    setFeatureStr('34 Washes per academic year\nStandard Wash & Fold\nSMS notifications');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const features = featureStr
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingPkg) {
        dataService.updatePackage(editingPkg.id, {
          name: name.trim().toUpperCase(),
          price,
          annual_wash_limit: limit,
          description: desc.trim(),
          features,
        });
        success('Package Updated', `Saved settings for ${name}`);
      } else {
        dataService.addPackage({
          name: name.trim().toUpperCase(),
          price,
          annual_wash_limit: limit,
          description: desc.trim(),
          features,
          is_active: true,
        });
        success('Package Created', `New package plan ${name} created`);
      }
      setShowModal(false);
      reload();
    } catch (err: any) {
      error('Failed to save package', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hostel Laundry Packages</h1>
          <p className="text-xs text-slate-500">Configure annual subscription tiers, prices, and default yearly wash quotas</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Package Tier
        </button>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map(pkg => {
          const isPremium = pkg.name.includes('PREMIUM');
          const isSplit = pkg.name.includes('SPLIT');

          return (
            <div
              key={pkg.id}
              className={`rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between border relative ${isPremium
                ? 'bg-gradient-to-b from-slate-900 to-slate-950 text-white border-slate-700 shadow-xl'
                : isSplit
                  ? 'bg-white text-slate-900 border-teal-200/90 shadow-md ring-2 ring-teal-500/20'
                  : 'bg-white text-slate-900 border-slate-200 shadow-sm'
                }`}
            >
              {/* Badge for highlighted plans */}
              {isPremium && (
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  ★ MOST POPULAR
                </div>
              )}
              {isSplit && (
                <div className="absolute -top-3 right-6 bg-teal-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  BEST VALUE
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${isPremium ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-50 text-teal-700'
                        }`}
                    >
                      <PackageIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-lg tracking-tight">{pkg.name}</h3>
                  </div>

                  <button
                    onClick={() => openEdit(pkg)}
                    title="Edit Package Pricing"
                    className={`p-1.5 rounded-lg transition-colors ${isPremium
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <p className={`text-xs mt-3 ${isPremium ? 'text-slate-300' : 'text-slate-500'}`}>
                  {pkg.description}
                </p>

                {/* Pricing & Quota */}
                <div className="mt-5 py-4 border-y border-dashed border-slate-200/40">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono tracking-tight">
                      ₹{pkg.price.toLocaleString()}
                    </span>
                    <span className={`text-xs ${isPremium ? 'text-slate-400' : 'text-slate-500'}`}>
                      / academic year
                    </span>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-teal-500/15 text-teal-400 border border-teal-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    {pkg.annual_wash_limit} Washes Included
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-5 space-y-2.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${isPremium ? 'text-slate-400' : 'text-slate-400'
                    }`}>
                    Included Services
                  </span>
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className="p-0.5 rounded-full bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className={isPremium ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-8 pt-4 border-t border-slate-100/20">
                <button
                  type="button"
                  onClick={() => openEdit(pkg)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${isPremium
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                >
                  Configure Tier
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingPkg ? `Edit Package: ${editingPkg.name}` : 'Create New Package Tier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package Plan Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. ULTRA DELUXE"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Annual Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    required
                    value={price}
                    onChange={e => setPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wash Limit (Yearly) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={limit}
                    onChange={e => setLimit(parseInt(e.target.value, 10) || 34)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Short tagline..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows={4}
                  value={featureStr}
                  onChange={e => setFeatureStr(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md cursor-pointer"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
