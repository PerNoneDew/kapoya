import { useState } from 'react';
import { Plus, Search, Eye, Share2, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { Referral, ReferralStatus, UserRole, User } from '../../types';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PatientSearch from '../../components/ui/PatientSearch';
import ConfirmModal from '../../components/ui/ConfirmModal';

const statusConfig: Record<ReferralStatus, { label: string; icon: React.ElementType; color: string; badge: 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600', badge: 'warning' },
  forwarded: { label: 'Forwarded', icon: Share2, color: 'text-sky-600', badge: 'info' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-teal-600', badge: 'info' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-600', badge: 'success' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-rose-600', badge: 'danger' },
};

type FormData = { patientId: string; patientName: string; patientRole?: string; department?: string; referredTo: string; referralReason: string };
const emptyForm: FormData = { patientId: '', patientName: '', referredTo: '', referralReason: '' };

export default function ReferralManagement() {
  const { currentUser } = useAuth();
  const { users, referrals, persistReferral, removeReferral } = useData();
  const { runWithFeedback } = useFeedback();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewRef, setViewRef] = useState<Referral | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultTarget, setResultTarget] = useState<Referral | null>(null);
  const [resultText, setResultText] = useState('');
  const [resultStatus, setResultStatus] = useState<ReferralStatus>('completed');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Referral | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'staff';
  const isRegularUser = ['student', 'employee'].includes(currentUser.role);
  const isFaculty = currentUser.role === 'faculty';
  const canManage = isAdmin || isStaff;
  const canRefer = canManage || isFaculty;
  const patients = isFaculty
    ? users.filter((u) => ['student'].includes(u.role))
    : users.filter((u) => ['student', 'staff', 'faculty', 'employee'].includes(u.role));
  const displayReferrals = isRegularUser
    ? referrals.filter((r) => r.patientId === currentUser.id)
    : isFaculty
      ? referrals.filter((r) => r.referredBy === currentUser.name || r.patientId === currentUser.id)
      : referrals;

  const filtered = displayReferrals.filter((r) => {
    const matchSearch = r.patientName.toLowerCase().includes(search.toLowerCase()) || r.referredTo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.referralDate.localeCompare(a.referralDate));

  const handlePatientSelect = (patient: User | null) => {
    setSelectedPatient(patient);
    if (patient) setForm((prev) => ({ ...prev, patientId: patient.id, patientName: patient.name, patientRole: patient.role, department: patient.department }));
    else setForm((prev) => ({ ...prev, patientId: '', patientName: '', patientRole: '', department: '' }));
  };

  const handleCreate = async () => {
    if (!form.patientId || !form.referredTo.trim() || !form.referralReason.trim()) return;
    const now = new Date().toISOString().split('T')[0];
    const referral: Referral = { id: `ref${Date.now()}`, patientId: form.patientId, patientName: form.patientName, patientRole: form.patientRole as Referral['patientRole'], department: form.department || undefined, referredTo: form.referredTo, referralReason: form.referralReason, referralDate: now, status: 'pending', result: '', referredBy: currentUser.name, createdAt: now, updatedAt: now };
    await runWithFeedback(() => persistReferral(referral), { loadingTitle: 'Creating referral...', successTitle: 'Referral created', successMessage: `Referral for ${form.patientName} has been created.`, autoCloseMs: 1800 });
    setForm(emptyForm); setSelectedPatient(null); setShowForm(false);
  };

  const handleSaveResult = async () => {
    if (!resultTarget) return;
    const now = new Date().toISOString().split('T')[0];
    await runWithFeedback(() => persistReferral({ ...resultTarget, status: resultStatus, result: resultText, resultDate: now, updatedAt: now }), { loadingTitle: 'Updating referral...', successTitle: 'Referral updated', successMessage: 'Referral status and result have been saved.', autoCloseMs: 1800 });
    setShowResultModal(false); setResultTarget(null); setResultText('');
  };

  const openResultModal = (r: Referral) => { setResultTarget(r); setResultText(r.result); setResultStatus(r.status === 'pending' ? 'forwarded' : r.status); setShowResultModal(true); };
  const handleDelete = async () => { if (!deleteTarget) return; await removeReferral(deleteTarget.id); setShowDeleteConfirm(false); setDeleteTarget(null); };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none';

  return (
    <div className="space-y-5">
      <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-sky-100"><Share2 size={20} className="text-sky-600" /></div>
          <div><h2 className="text-sm font-bold text-sky-800 uppercase tracking-wider">Referral Management</h2><p className="text-xs text-sky-600 mt-0.5">Manage patient referrals to external facilities and specialists.</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"><p className="text-2xl font-bold text-slate-800">{displayReferrals.length}</p><p className="text-xs text-slate-500 mt-0.5">Total Referrals</p></div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm"><p className="text-2xl font-bold text-amber-600">{displayReferrals.filter((r) => r.status === 'pending').length}</p><p className="text-xs text-slate-500 mt-0.5">Pending</p></div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-sm"><p className="text-2xl font-bold text-sky-600">{displayReferrals.filter((r) => r.status === 'forwarded').length}</p><p className="text-xs text-slate-500 mt-0.5">Forwarded</p></div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm"><p className="text-2xl font-bold text-emerald-600">{displayReferrals.filter((r) => r.status === 'completed').length}</p><p className="text-xs text-slate-500 mt-0.5">Completed</p></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search referrals..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              {(Object.keys(statusConfig) as ReferralStatus[]).map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
            </select>
            {canRefer && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"><Plus size={15} /> New Referral</button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              {!isRegularUser && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>}
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Referred To</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Reason</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => { const cfg = statusConfig[r.status]; return (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  {!isRegularUser && (<td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0"><span className="text-sky-600 font-semibold text-xs">{r.patientName.charAt(0)}</span></div><div><p className="text-sm font-medium text-slate-700">{r.patientName}</p>{r.patientRole && <Badge label={roleLabel(r.patientRole as UserRole)} variant={statusVariant(r.patientRole as string)} />}</div></div></td>)}
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2"><Building2 size={13} className="text-slate-400 shrink-0" /><p className="text-sm font-medium text-slate-700">{r.referredTo || '—'}</p></div></td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500 truncate max-w-xs">{r.referralReason || '—'}</td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><cfg.icon size={13} className={cfg.color} /><Badge label={cfg.label} variant={cfg.badge} /></div></td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{r.referralDate}</td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1">
                    <button onClick={() => setViewRef(r)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                    {canManage && r.status !== 'completed' && <button onClick={() => openResultModal(r)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Update Status"><CheckCircle size={14} /></button>}
                    {canManage && <button onClick={() => { setDeleteTarget(r); setShowDeleteConfirm(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><XCircle size={14} /></button>}
                  </div></td>
                </tr>
              );})}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No referrals found.</div>}
        </div>
      </div>

      <Modal isOpen={viewRef !== null} onClose={() => setViewRef(null)} title="Referral Details" size="md">
        {viewRef && (<div className="space-y-4">
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><Building2 size={16} className="text-sky-600" /><p className="text-sm font-bold text-sky-800">{viewRef.referredTo}</p></div><p className="text-xs text-sky-600">Referred by {viewRef.referredBy} on {viewRef.referralDate}</p></div>
          <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-400">Patient</p><p className="font-medium text-slate-700">{viewRef.patientName}</p></div><div><p className="text-xs text-slate-400">Department</p><p className="font-medium text-slate-700">{viewRef.department || '—'}</p></div></div>
          <div><p className="text-xs text-slate-400 mb-1">Reason</p><p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{viewRef.referralReason}</p></div>
          <Badge label={statusConfig[viewRef.status].label} variant={statusConfig[viewRef.status].badge} />
          {viewRef.result && <div><p className="text-xs text-slate-400 mb-1">Result</p><p className="text-sm text-slate-600 bg-emerald-50 rounded-xl p-3 border border-emerald-100">{viewRef.result}</p></div>}
          {viewRef.resultDate && <p className="text-xs text-slate-400">Result date: {viewRef.resultDate}</p>}
        </div>)}
      </Modal>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelectedPatient(null); setForm(emptyForm); }} title="New Referral" size="md">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Search Patient</label><PatientSearch patients={patients} selectedId={form.patientId} onSelect={handlePatientSelect} /></div>
          {selectedPatient && (<>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Referred To *</label><input value={form.referredTo} onChange={(e) => setForm({ ...form, referredTo: e.target.value })} className={inputCls} placeholder="e.g. City General Hospital, Dr. Smith (Cardiology)" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason for Referral *</label><textarea value={form.referralReason} onChange={(e) => setForm({ ...form, referralReason: e.target.value })} rows={3} className={inputCls} placeholder="Reason for referral..." /></div>
          </>)}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => { setShowForm(false); setSelectedPatient(null); setForm(emptyForm); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={!form.patientId || !form.referredTo.trim() || !form.referralReason.trim()} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white rounded-xl transition-colors">Create Referral</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Update Referral Status" size="md">
        <div className="space-y-4">
          {resultTarget && <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm"><p className="font-medium text-slate-700">{resultTarget.patientName}</p><p className="text-xs text-slate-400">Referred to: {resultTarget.referredTo}</p></div>}
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label><div className="grid grid-cols-2 gap-2">
            {(['forwarded', 'accepted', 'completed', 'rejected'] as ReferralStatus[]).map((s) => (<button key={s} onClick={() => setResultStatus(s)} className={`py-2 text-sm font-medium rounded-xl border transition-all capitalize ${resultStatus === s ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-200'}`}>{statusConfig[s].label}</button>))}
          </div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Result / Notes</label><textarea value={resultText} onChange={(e) => setResultText(e.target.value)} rows={3} className={inputCls} placeholder="Referral result or notes..." /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100"><button onClick={() => setShowResultModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button><button onClick={handleSaveResult} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">Save</button></div>
        </div>
      </Modal>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} onConfirm={handleDelete} title="Delete Referral" message={`Delete the referral for ${deleteTarget?.patientName}? This cannot be undone.`} confirmLabel="Delete" type="danger" />
    </div>
  );
}
