import { useState } from 'react';
import { Plus, Search, CreditCard as Edit2, ShoppingCart, Eye, Trash2, Banknote, PackageCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { Purchase, PurchaseStatus, Expense } from '../../types';
import Modal from '../../components/ui/Modal';
import Badge, { statusVariant } from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

type FormData = Omit<Purchase, 'id' | 'createdAt' | 'totalCost'>;
const emptyForm: FormData = { supplierId: '', supplierName: '', itemDescription: '', quantity: 0, unit: '', unitCost: 0, purchaseDate: new Date().toISOString().split('T')[0], recordedBy: '', status: 'pending', receiptUrl: '', notes: '' };

const statusLabels: Record<PurchaseStatus, string> = { pending: 'Pending', received: 'Received', cancelled: 'Cancelled' };

export default function PurchaseManagement() {
  const { currentUser } = useAuth();
  const { purchases, persistPurchase, removePurchase, suppliers, persistExpense, expenses } = useData();
  const { runWithFeedback } = useFeedback();
  if (!currentUser) return null;

  const isStaff = currentUser.role === 'staff';
  const canManage = isStaff;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Purchase | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm, recordedBy: currentUser.name });
  const [viewItem, setViewItem] = useState<Purchase | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);

  const filtered = purchases.filter((p) => {
    const matchSearch = p.itemDescription.toLowerCase().includes(search.toLowerCase()) || p.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));

  const totalCost = purchases.reduce((s, p) => s + p.totalCost, 0);
  const pendingCount = purchases.filter((p) => p.status === 'pending').length;
  const receivedCount = purchases.filter((p) => p.status === 'received').length;

  const openAdd = () => { setEditItem(null); setForm({ ...emptyForm, recordedBy: currentUser.name }); setShowForm(true); };
  const openEdit = (p: Purchase) => {
    setEditItem(p);
    setForm({ supplierId: p.supplierId ?? '', supplierName: p.supplierName, itemDescription: p.itemDescription, quantity: p.quantity, unit: p.unit, unitCost: p.unitCost, purchaseDate: p.purchaseDate, recordedBy: p.recordedBy, status: p.status, receiptUrl: p.receiptUrl ?? '', notes: p.notes ?? '' });
    setShowForm(true);
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setForm((prev) => ({ ...prev, supplierId, supplierName: supplier?.name ?? '' }));
  };

  const handleSave = async () => {
    if (!form.itemDescription.trim() || form.quantity <= 0) return;
    const totalCost = form.quantity * form.unitCost;
    const isEdit = !!editItem;
    await runWithFeedback(
      async () => {
        if (editItem) {
          await persistPurchase({ ...editItem, ...form, totalCost });
        } else {
          const newPurchase: Purchase = { ...form, totalCost, id: `pur${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
          await persistPurchase(newPurchase);
          if (newPurchase.status === 'received') {
            const exp: Expense = {
              id: `exp${Date.now()}`,
              description: `Purchase: ${newPurchase.itemDescription}`,
              amount: newPurchase.totalCost,
              category: 'medicines',
              date: newPurchase.purchaseDate,
              recordedBy: newPurchase.recordedBy,
              receiptNo: newPurchase.id,
              status: 'recorded',
              sourcePurchaseId: newPurchase.id,
            };
            await persistExpense(exp);
          }
        }
      },
      { loadingTitle: isEdit ? 'Saving...' : 'Recording purchase...', successTitle: isEdit ? 'Purchase updated' : 'Purchase recorded', successMessage: `Purchase of "${form.itemDescription}" has been ${isEdit ? 'updated' : 'recorded'}.`, autoCloseMs: 1800 },
    );
    setShowForm(false);
  };

  const handleStatusChange = async (p: Purchase, status: PurchaseStatus) => {
    await runWithFeedback(
      async () => {
        await persistPurchase({ ...p, status });
        if (status === 'received' && p.status !== 'received') {
          const existing = expenses.find((e) => e.sourcePurchaseId === p.id);
          if (!existing) {
            const exp: Expense = {
              id: `exp${Date.now()}`,
              description: `Purchase: ${p.itemDescription}`,
              amount: p.totalCost,
              category: 'medicines',
              date: p.purchaseDate,
              recordedBy: p.recordedBy,
              receiptNo: p.id,
              status: 'recorded',
              sourcePurchaseId: p.id,
            };
            await persistExpense(exp);
          }
        }
      },
      { loadingTitle: 'Updating...', successTitle: 'Status updated', successMessage: `Purchase marked as ${statusLabels[status]}.`, autoCloseMs: 1800 },
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await runWithFeedback(
      () => removePurchase(deleteTarget.id),
      { loadingTitle: 'Deleting...', successTitle: 'Purchase deleted', successMessage: 'The purchase record has been removed.', autoCloseMs: 1800 },
    );
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const fmtPeso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><ShoppingCart size={18} className="text-teal-500" /></div>
            <div><p className="text-sm text-slate-500">Total Purchases</p><p className="text-2xl font-bold text-slate-800">{purchases.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl"><Clock size={18} className="text-amber-500" /></div>
            <div><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><PackageCheck size={18} className="text-emerald-500" /></div>
            <div><p className="text-sm text-slate-500">Received</p><p className="text-2xl font-bold text-emerald-600">{receivedCount}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl"><Banknote size={18} className="text-sky-500" /></div>
            <div><p className="text-sm text-slate-500">Total Spent</p><p className="text-2xl font-bold text-slate-800">{fmtPeso(totalCost)}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search purchases..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {canManage && (
              <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus size={15} /> New Purchase
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Supplier</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cost</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-700 truncate max-w-xs">{p.itemDescription}</p>
                    <p className="text-xs text-slate-400">{fmtPeso(p.unitCost)} / {p.unit}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500 truncate max-w-[160px]">{p.supplierName || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{p.quantity} {p.unit}</td>
                  <td className="px-5 py-3.5"><span className="text-sm font-bold text-slate-800">{fmtPeso(p.totalCost)}</span></td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-slate-400">{p.purchaseDate}</td>
                  <td className="px-5 py-3.5"><Badge label={statusLabels[p.status]} variant={statusVariant(p.status)} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewItem(p)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                      {canManage && p.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusChange(p, 'received')} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark Received"><PackageCheck size={14} /></button>
                          <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                        </>
                      )}
                      {canManage && <button onClick={() => { setDeleteTarget(p); setShowDeleteConfirm(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No purchase records found.</div>}
        </div>
      </div>

      <Modal isOpen={viewItem !== null} onClose={() => setViewItem(null)} title="Purchase Details" size="md">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{viewItem.itemDescription}</p>
                <p className="text-xs text-slate-400 mt-0.5">From: {viewItem.supplierName || '—'}</p>
              </div>
              <Badge label={statusLabels[viewItem.status]} variant={statusVariant(viewItem.status)} />
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-600 font-medium uppercase tracking-wider">Total Cost</p>
              <p className="text-3xl font-bold text-teal-700 mt-1">{fmtPeso(viewItem.totalCost)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400 mb-0.5">Quantity</p><p className="font-medium text-slate-700">{viewItem.quantity} {viewItem.unit}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Unit Cost</p><p className="font-medium text-slate-700">{fmtPeso(viewItem.unitCost)}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Purchase Date</p><p className="font-medium text-slate-700">{viewItem.purchaseDate}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Recorded By</p><p className="font-medium text-slate-700">{viewItem.recordedBy}</p></div>
            </div>
            {viewItem.notes && <div><p className="text-xs text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{viewItem.notes}</p></div>}
            {viewItem.receiptUrl && <div><p className="text-xs text-slate-400 mb-1">Receipt</p><a href={viewItem.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline">View receipt ↗</a></div>}
          </div>
        )}
      </Modal>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Purchase' : 'New Purchase'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
            <select value={form.supplierId} onChange={(e) => handleSupplierSelect(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">— Select supplier (or type manually) —</option>
              {suppliers.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value, supplierId: '' })} className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Or type supplier name manually" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Description</label>
            <input value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Paracetamol 500mg (500 tablets)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. boxes, tablets" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost (₱)</label>
              <input type="number" min={0} step={0.01} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total Cost</span>
            <span className="text-lg font-bold text-teal-700">{fmtPeso(form.quantity * form.unitCost)}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Receipt URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Link to receipt image/PDF" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Additional notes..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PurchaseStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">{editItem ? 'Save Changes' : 'Record Purchase'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Purchase Record"
        message={`Are you sure you want to delete the purchase record for "${deleteTarget?.itemDescription}"? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
      />
    </div>
  );
}
