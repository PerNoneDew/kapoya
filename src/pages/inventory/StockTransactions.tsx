import { useState } from 'react';
import { Search, Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Undo2, AlertTriangle, Ban, Trash2, Pill, Package, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { StockTransaction, StockTransactionType, Medicine, MedicalSupply } from '../../types';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

const txnConfig: Record<StockTransactionType, { label: string; icon: React.ElementType; color: string; bg: string; badge: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  stock_in: { label: 'Stock In', icon: ArrowDownToLine, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'success' },
  stock_out: { label: 'Stock Out', icon: ArrowUpFromLine, color: 'text-rose-600', bg: 'bg-rose-50', badge: 'danger' },
  adjustment: { label: 'Adjustment', icon: RefreshCw, color: 'text-sky-600', bg: 'bg-sky-50', badge: 'info' },
  return: { label: 'Return', icon: Undo2, color: 'text-teal-600', bg: 'bg-teal-50', badge: 'info' },
  damage: { label: 'Damage', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'warning' },
  expiry: { label: 'Expiry', icon: Ban, color: 'text-rose-600', bg: 'bg-rose-50', badge: 'danger' },
  disposal: { label: 'Disposal', icon: Trash2, color: 'text-slate-600', bg: 'bg-slate-100', badge: 'neutral' },
  issuance: { label: 'Issuance', icon: Pill, color: 'text-violet-600', bg: 'bg-violet-50', badge: 'info' },
};

type FormData = {
  itemId: string;
  itemName: string;
  itemType: 'medicine' | 'supply';
  transactionType: StockTransactionType;
  quantity: number;
  unit: string;
  reason: string;
  notes: string;
};

const emptyForm: FormData = { itemId: '', itemName: '', itemType: 'medicine', transactionType: 'stock_in', quantity: 0, unit: '', reason: '', notes: '' };

export default function StockTransactions() {
  const { currentUser } = useAuth();
  const { stockTransactions, persistStockTransaction, removeStockTransaction, inventory, medicalSupplies, persistMedicine, persistMedicalSupply } = useData();
  const { runWithFeedback } = useFeedback();
  if (!currentUser) return null;

  const isStaff = currentUser.role === 'staff';
  const canManage = isStaff;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [viewTxn, setViewTxn] = useState<StockTransaction | null>(null);

  const allItems: (Medicine | MedicalSupply)[] = [...inventory, ...medicalSupplies];

  const filtered = stockTransactions.filter((t) => {
    const matchSearch = t.itemName.toLowerCase().includes(search.toLowerCase()) || t.reason.toLowerCase().includes(search.toLowerCase()) || t.recordedBy.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.transactionType === typeFilter;
    const matchItemType = itemTypeFilter === 'all' || t.itemType === itemTypeFilter;
    return matchSearch && matchType && matchItemType;
  }).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  const handleItemSelect = (itemId: string) => {
    const item = allItems.find((i) => i.id === itemId);
    if (item) {
      const itemType: 'medicine' | 'supply' = medicalSupplies.some((s) => s.id === itemId) ? 'supply' : 'medicine';
      setForm((prev) => ({ ...prev, itemId: item.id, itemName: item.name, itemType, unit: item.unit }));
    } else {
      setForm((prev) => ({ ...prev, itemId: '', itemName: '', unit: '' }));
    }
  };

  const handleSave = async () => {
    if (!form.itemId || form.quantity <= 0 || !form.reason.trim()) return;
    const now = new Date().toISOString().split('T')[0];
    const txn: StockTransaction = {
      id: `st${Date.now()}`,
      itemId: form.itemId,
      itemName: form.itemName,
      itemType: form.itemType,
      transactionType: form.transactionType,
      quantity: form.quantity,
      unit: form.unit,
      reason: form.reason.trim(),
      recordedBy: currentUser.name,
      recordedAt: now,
      notes: form.notes.trim() || undefined,
    };

    const isPositive = ['stock_in', 'return'].includes(form.transactionType);
    const isNegative = ['stock_out', 'damage', 'expiry', 'disposal', 'issuance'].includes(form.transactionType);
    const delta = isPositive ? form.quantity : isNegative ? -form.quantity : 0;

    await runWithFeedback(
      async () => {
        await persistStockTransaction(txn);
        if (delta !== 0) {
          if (form.itemType === 'medicine') {
            const med = inventory.find((m) => m.id === form.itemId);
            if (med) await persistMedicine({ ...med, quantity: Math.max(0, med.quantity + delta), lastUpdated: now });
          } else {
            const sup = medicalSupplies.find((s) => s.id === form.itemId);
            if (sup) await persistMedicalSupply({ ...sup, quantity: Math.max(0, sup.quantity + delta), lastUpdated: now });
          }
        }
      },
      { loadingTitle: 'Recording transaction...', successTitle: 'Transaction recorded', successMessage: `${txnConfig[form.transactionType].label} for ${form.itemName} has been recorded.`, autoCloseMs: 1800 },
    );
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    await runWithFeedback(
      () => removeStockTransaction(id),
      { loadingTitle: 'Deleting...', successTitle: 'Transaction deleted', successMessage: 'The transaction record has been removed.', autoCloseMs: 1800 },
    );
  };

  const txnCounts = (Object.keys(txnConfig) as StockTransactionType[]).map((t) => ({
    type: t,
    count: stockTransactions.filter((x) => x.transactionType === t).length,
  })).filter((x) => x.count > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {txnCounts.length > 0 ? txnCounts.map(({ type, count }) => {
          const cfg = txnConfig[type];
          const Icon = cfg.icon;
          return (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`bg-white rounded-xl p-4 border text-left transition-all ${typeFilter === type ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-100 hover:border-teal-200'}`}>
              <div className={`inline-flex p-1.5 rounded-lg ${cfg.bg} mb-2`}><Icon size={13} className={cfg.color} /></div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500">{cfg.label}</p>
            </button>
          );
        }) : (
          <div className="col-span-full text-center py-8 text-slate-400 text-sm">No transactions recorded yet.</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={itemTypeFilter} onChange={(e) => setItemTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Items</option>
              <option value="medicine">Medicines</option>
              <option value="supply">Supplies</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Types</option>
              {(Object.keys(txnConfig) as StockTransactionType[]).map((t) => <option key={t} value={t}>{txnConfig[t].label}</option>)}
            </select>
            {canManage && (
              <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus size={15} /> New Transaction
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Reason</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Recorded By</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((t) => {
                const cfg = txnConfig[t.transactionType];
                const Icon = cfg.icon;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex p-1.5 rounded-lg ${cfg.bg}`}><Icon size={13} className={cfg.color} /></span>
                        <div>
                          <Badge label={cfg.label} variant={cfg.badge} />
                          <span className="block text-xs text-slate-400 mt-0.5">{t.itemType === 'medicine' ? 'Medicine' : 'Supply'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {t.itemType === 'medicine' ? <Pill size={13} className="text-teal-500 shrink-0" /> : <Package size={13} className="text-sky-500 shrink-0" />}
                        <p className="text-sm font-medium text-slate-700">{t.itemName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${['stock_in', 'return'].includes(t.transactionType) ? 'text-emerald-600' : ['stock_out', 'damage', 'expiry', 'disposal', 'issuance'].includes(t.transactionType) ? 'text-rose-600' : 'text-slate-700'}`}>
                        {['stock_in', 'return'].includes(t.transactionType) ? '+' : ['stock_out', 'damage', 'expiry', 'disposal', 'issuance'].includes(t.transactionType) ? '-' : ''}{t.quantity}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">{t.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500 truncate max-w-xs">{t.reason}</td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-slate-500">{t.recordedBy}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{t.recordedAt}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewTxn(t)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                        {canManage && <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No stock transactions found.</div>}
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Record Stock Transaction" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(txnConfig) as StockTransactionType[]).map((t) => {
                const cfg = txnConfig[t];
                const Icon = cfg.icon;
                return (
                  <button key={t} type="button" onClick={() => setForm({ ...form, transactionType: t })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${form.transactionType === t ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-200'}`}>
                    <Icon size={16} className={form.transactionType === t ? 'text-teal-600' : 'text-slate-400'} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Item</label>
            <select value={form.itemId} onChange={(e) => handleItemSelect(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">— Select an item —</option>
              <optgroup label="Medicines">
                {inventory.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit})</option>)}
              </optgroup>
              <optgroup label="Medical Supplies">
                {medicalSupplies.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.quantity} {s.unit})</option>)}
              </optgroup>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="auto-filled" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason <span className="text-rose-500">*</span></label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Restock from supplier, expired items removed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Additional notes..." />
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
            <p>This transaction will automatically adjust the item's stock level. Stock In/Return increases quantity; Stock Out/Damage/Expiry/Disposal/Issuance decreases it; Adjustment is recorded without changing stock.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!form.itemId || form.quantity <= 0 || !form.reason.trim()} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white rounded-xl transition-colors">Record Transaction</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={viewTxn !== null} onClose={() => setViewTxn(null)} title="Transaction Details" size="md">
        {viewTxn && (() => {
          const cfg = txnConfig[viewTxn.transactionType];
          const Icon = cfg.icon;
          return (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 ${cfg.bg} rounded-xl border border-slate-100`}>
                <div className="p-2.5 rounded-xl bg-white"><Icon size={20} className={cfg.color} /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transaction Type</p>
                  <p className="font-bold text-slate-800 text-lg">{cfg.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400 mb-0.5">Item</p><p className="font-medium text-slate-700">{viewTxn.itemName}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Item Type</p><p className="font-medium text-slate-700 capitalize">{viewTxn.itemType}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Quantity</p><p className="font-medium text-slate-700">{viewTxn.quantity} {viewTxn.unit}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Recorded By</p><p className="font-medium text-slate-700">{viewTxn.recordedBy}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Date</p><p className="font-medium text-slate-700">{viewTxn.recordedAt}</p></div>
              </div>
              <div><p className="text-xs text-slate-400 mb-1">Reason</p><p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{viewTxn.reason}</p></div>
              {viewTxn.notes && <div><p className="text-xs text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{viewTxn.notes}</p></div>}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
