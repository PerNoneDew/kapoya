import { useState } from 'react';
import { Plus, Search, Eye, RefreshCw, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { FollowUp, FollowUpStatus, UserRole, User } from '../../types';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PatientSearch from '../../components/ui/PatientSearch';
import ConfirmModal from '../../components/ui/ConfirmModal';

const statusConfig: Record<FollowUpStatus, { label: string; badge: 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pending', badge: 'warning' },
  scheduled: { label: 'Scheduled', badge: 'info' },
  completed: { label: 'Completed', badge: 'success' },
  cancelled: { label: 'Cancelled', badge: 'danger' },
};

type FormData = { patientId: string; patientName: string; patientRole?: string; department?: string; reason: string; scheduledDate: string };
const emptyForm: FormData = { patientId: '', patientName: '', reason: '', scheduledDate: '' };

export default function FollowUpManagement() {
  const { currentUser } = useAuth();
  const { users, followUps, persistFollowUp, removeFollowUp } = useData();
  const { runWithFeedback } = useFeedback();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewFU, setViewFU] = useState<FollowUp | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultTarget, setResultTarget] = useState<FollowUp | null>(null);
  const [resultText, setResultText] = useState('');
  const [resultStatus, setResultStatus] = useState<FollowUpStatus>('completed');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'staff';
  const isRegularUser = ['student', 'faculty', 'employee'].includes(currentUser.role);
  const canManage = isAdmin || isStaff;
  const patients = users.filter((u) => ['student', 'staff', 'faculty', 'employee'].includes(u.role));
  const displayFollowUps = isRegularUser ? followUps.filter((f) => f.patientId === currentUser.id) : followUps;

  const filtered = displayFollowUps.filter((f) => {
    const matchSearch = f.patientName.toLowerCase().includes(search.toLowerCase()) || f.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = displayFollowUps.filter((f) => f.scheduledDate >= todayStr && f.status !== 'completed' && f.status !== 'cancelled');
  const overdue = displayFollowUps.filter((f) => f.scheduledDate < todayStr && (f.status === 'pending' || f.status === 'scheduled'));
  const completed = displayFollowUps.filter((f) => f.status === 'completed');

  const handlePatientSelect = (patient: User | null) => {
    setSelectedPatient(patient);
    if (patient) setForm((prev) => ({ ...prev, patientId: patient.id, patientName: patient.name, patientRole: patient.role, department: patient.department }));
    else setForm((prev) => ({ ...prev, patientId: '', patientName: '', patientRole: '', department: '' }));
  };

  const handleCreate = async () => {
    if (!form.patientId || !form.scheduledDate) return;
    const now = new Date().toISOString().split('T')[0];
    const fu: FollowUp = { id: `fu${Date.now()}`, patientId: form.patientId, patientName: form.patientName, patientRole: form.patientRole as FollowUp['patientRole'], department: form.department || undefined, reason: form.reason, scheduledDate: form.scheduledDate, status: 'scheduled', result: '', createdBy: currentUser.name, createdAt: now, updatedAt: now };
    await runWithFeedback(() => persistFollowUp(fu), { loadingTitle: 'Creating follow-up...', successTitle: 'Follow-up created', successMessage: `Follow-up for ${form.patientName} scheduled for ${form.scheduledDate}.`, autoCloseMs: 1800 });
    setForm(emptyForm); setSelectedPatient(null); setShowForm(false);
  };

  const handleSaveResult = async () => {
    if (!resultTarget) return;
    const now = new Date().toISOString().split('T')[0];
    await runWithFeedback(() => persistFollowUp({ ...resultTarget, status: resultStatus, result: resultText, resultDate: resultStatus === 'completed' ? now : undefined, updatedAt: now }), { loadingTitle: 'Updating follow-up...', successTitle: 'Follow-up updated', successMessage: 'Follow-up status has been saved.', autoCloseMs: 1800 });
    setShowResultModal(false); setResultTarget(null); setResultText('');
  };

  const openResultModal = (f: FollowUp) => { setResultTarget(f); setResultText(f.result); setResultStatus(f.status === 'scheduled' || f.status === 'pending' ? 'completed' : f.status); setShowResultModal(true); };
  const handleDelete = async () => { if (!deleteTarget) return; await removeFollowUp(deleteTarget.id); setShowDeleteConfirm(false); setDeleteTarget(null); };
  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none';

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-amber-100"><RefreshCw size={20} className="text-amber-600" /></div>
          <div><h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Follow-up Management</h2><p className="text-xs text-amber-600 mt-0.5">Track patient follow-up appointments and monitor recovery progress.</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"><p className="text-2xl font-bold text-slate-800">{displayFollowUps.length}</p><p className="text-xs text-slate-500 mt-0.5">Total Follow-ups</p></div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-sm"><p className="text-2xl font-bold text-sky-600">{upcoming.length}</p><p className="text-xs text-slate-500 mt-0.5">Upcoming</p></div>
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm"><p className="text-2xl font-bold text-rose-600">{overdue.length}</p><p className="text-xs text-slate-500 mt-0.5">Overdue</p></div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm"><p className="text-2xl font-bold text-emerald-600">{completed.length}</p><p className="text-xs text-slate-500 mt-0.5">Completed</p></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search follow-ups..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              {(Object.keys(statusConfig) as FollowUpStatus[]).map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
            </select>
            {canManage && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"><Plus size={15} /> New Follow-up</button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              {!isRegularUser && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>}
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Scheduled Date</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((f) => { const isOverdue = f.scheduledDate < todayStr && (f.status === 'pending' || f.status === 'scheduled'); return (
                <tr key={f.id} className={`hover:bg-slate-50/50 transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                  {!isRegularUser && (<td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><span className="text-amber-600 font-semibold text-xs">{f.patientName.charAt(0)}</span></div><div><p className="text-sm font-medium text-slate-700">{f.patientName}</p>{f.patientRole && <Badge label={roleLabel(f.patientRole as UserRole)} variant={statusVariant(f.patientRole as string)} />}</div></div></td>)}
                  <td className="px-5 py-3.5"><p className="text-sm text-slate-700 truncate max-w-xs">{f.reason || '—'}</p></td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /><span className={`text-sm ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>{f.scheduledDate}</span></div>{isOverdue && <span className="text-xs text-rose-500">Overdue</span>}</td>
                  <td className="px-5 py-3.5"><Badge label={statusConfig[f.status].label} variant={statusConfig[f.status].badge} /></td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1">
                    <button onClick={() => setViewFU(f)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                    {canManage && f.status !== 'completed' && f.status !== 'cancelled' && <button onClick={() => openResultModal(f)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Update"><CheckCircle size={14} /></button>}
                    {canManage && <button onClick={() => { setDeleteTarget(f); setShowDeleteConfirm(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><XCircle size={14} /></button>}
                  </div></td>
                </tr>
              );})}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No follow-ups found.</div>}
        </div>
      </div>

      <Modal isOpen={viewFU !== null} onClose={() => setViewFU(null)} title="Follow-up Details" size="md">
        {viewFU && (<div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-400">Patient</p><p className="font-medium text-slate-700">{viewFU.patientName}</p></div><div><p className="text-xs text-slate-400">Department</p><p className="font-medium text-slate-700">{viewFU.department || '—'}</p></div><div><p className="text-xs text-slate-400">Scheduled Date</p><p className="font-medium text-slate-700">{viewFU.scheduledDate}</p></div><div><p className="text-xs text-slate-400">Created By</p><p className="font-medium text-slate-700">{viewFU.createdBy}</p></div></div>
          <div><p className="text-xs text-slate-400 mb-1">Reason</p><p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{viewFU.reason || '—'}</p></div>
          <Badge label={statusConfig[viewFU.status].label} variant={statusConfig[viewFU.status].badge} />
          {viewFU.result && <div><p className="text-xs text-slate-400 mb-1">Result</p><p className="text-sm text-slate-600 bg-emerald-50 rounded-xl p-3 border border-emerald-100">{viewFU.result}</p></div>}
        </div>)}
      </Modal>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelectedPatient(null); setForm(emptyForm); }} title="New Follow-up" size="md">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Search Patient</label><PatientSearch patients={patients} selectedId={form.patientId} onSelect={handlePatientSelect} /></div>
          {selectedPatient && (<>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date *</label><input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} className={inputCls} placeholder="Reason for follow-up..." /></div>
          </>)}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100"><button onClick={() => { setShowForm(false); setSelectedPatient(null); setForm(emptyForm); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button><button onClick={handleCreate} disabled={!form.patientId || !form.scheduledDate} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white rounded-xl transition-colors">Create Follow-up</button></div>
        </div>
      </Modal>

      <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Update Follow-up" size="md">
        <div className="space-y-4">
          {resultTarget && <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm"><p className="font-medium text-slate-700">{resultTarget.patientName}</p><p className="text-xs text-slate-400">Scheduled: {resultTarget.scheduledDate}</p></div>}
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label><div className="grid grid-cols-2 gap-2">{(['completed', 'cancelled', 'scheduled', 'pending'] as FollowUpStatus[]).map((s) => (<button key={s} onClick={() => setResultStatus(s)} className={`py-2 text-sm font-medium rounded-xl border transition-all capitalize ${resultStatus === s ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-200'}`}>{statusConfig[s].label}</button>))}</div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Result / Notes</label><textarea value={resultText} onChange={(e) => setResultText(e.target.value)} rows={3} className={inputCls} placeholder="Follow-up result..." /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100"><button onClick={() => setShowResultModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button><button onClick={handleSaveResult} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">Save</button></div>
        </div>
      </Modal>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} onConfirm={handleDelete} title="Delete Follow-up" message={`Delete the follow-up for ${deleteTarget?.patientName}? This cannot be undone.`} confirmLabel="Delete" type="danger" />
    </div>
  );
}
