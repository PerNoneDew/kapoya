import { useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Truck, Mail, Phone, MapPin, Trash2, Building2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { Supplier, SupplierStatus } from '../../types';
import Modal from '../../components/ui/Modal';
import Badge, { statusVariant } from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

type FormData = Omit<Supplier, 'id' | 'createdAt'>;
const emptyForm: FormData = { name: '', contactPerson: '', email: '', phone: '', address: '', productsSupplied: '', category: 'General', status: 'active' };

const categories = ['Pharmaceutical', 'Medical Equipment', 'First Aid Supplies', 'Laboratory', 'General'];

export default function SupplierManagement() {
  const { currentUser } = useAuth();
  const { suppliers, persistSupplier, removeSupplier, purchases } = useData();
  const { runWithFeedback } = useFeedback();
  if (!currentUser) return null;

  const isStaff = currentUser.role === 'staff';
  const canManage = isStaff;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const filtered = suppliers.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ?? false) || (s.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const activeCount = suppliers.filter((s) => s.status === 'active').length;
  const purchaseCount = (supplierId: string) => purchases.filter((p) => p.supplierId === supplierId).length;

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({ name: s.name, contactPerson: s.contactPerson ?? '', email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '', productsSupplied: s.productsSupplied ?? '', category: s.category, status: s.status });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const isEdit = !!editItem;
    await runWithFeedback(
      async () => {
        if (editItem) {
          await persistSupplier({ ...editItem, ...form });
        } else {
          await persistSupplier({ ...form, id: `sup${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] });
        }
      },
      { loadingTitle: isEdit ? 'Saving...' : 'Adding supplier...', successTitle: isEdit ? 'Supplier updated' : 'Supplier added', successMessage: `"${form.name}" has been ${isEdit ? 'updated' : 'added'}.`, autoCloseMs: 1800 },
    );
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await runWithFeedback(
      () => removeSupplier(deleteTarget.id),
      { loadingTitle: 'Deleting...', successTitle: 'Supplier deleted', successMessage: `"${deleteTarget.name}" has been removed.`, autoCloseMs: 1800 },
    );
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl"><Truck size={18} className="text-sky-500" /></div>
            <div><p className="text-sm text-slate-500">Total Suppliers</p><p className="text-2xl font-bold text-slate-800">{suppliers.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><Building2 size={18} className="text-emerald-500" /></div>
            <div><p className="text-sm text-slate-500">Active</p><p className="text-2xl font-bold text-emerald-600">{activeCount}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><Truck size={18} className="text-teal-500" /></div>
            <div><p className="text-sm text-slate-500">Categories</p><p className="text-2xl font-bold text-slate-800">{new Set(suppliers.map((s) => s.category)).size}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {canManage && (
              <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus size={15} /> Add Supplier
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Purchases</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                {canManage && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => {
                const pCount = purchaseCount(s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                          <Truck size={16} className="text-sky-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{s.name}</p>
                          {s.contactPerson && <p className="text-xs text-slate-400 truncate">{s.contactPerson}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {s.email || s.phone ? (
                        <div className="space-y-0.5">
                          {s.email && <p className="text-xs text-slate-500 truncate max-w-[180px]">{s.email}</p>}
                          {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
                        </div>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{s.category}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-500">{pCount > 0 ? `${pCount} order${pCount > 1 ? 's' : ''}` : '—'}</td>
                    <td className="px-5 py-3.5"><Badge label={s.status === 'active' ? 'Active' : 'Inactive'} variant={statusVariant(s.status)} /></td>
                    {canManage && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => { setDeleteTarget(s); setShowDeleteConfirm(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No suppliers found.</div>}
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. PharmaCorp Inc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Contact name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="supplier@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="09XX XXX XXXX" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Supplier address" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Products Supplied</label>
            <input value={form.productsSupplied} onChange={(e) => setForm({ ...form, productsSupplied: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Medicines, First Aid Supplies, Equipment" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SupplierStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">{editItem ? 'Save Changes' : 'Add Supplier'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
      />
    </div>
  );
}
