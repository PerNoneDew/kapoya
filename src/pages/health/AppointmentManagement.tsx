import { useState } from 'react';
import { Plus, Search, Eye, CalendarClock, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { Appointment, AppointmentStatus, ServiceType, UserRole, User } from '../../types';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PatientSearch from '../../components/ui/PatientSearch';
import ConfirmModal from '../../components/ui/ConfirmModal';

const statusConfig: Record<AppointmentStatus, { label: string; badge: 'success' | 'warning' | 'danger' | 'info' }> = {
  scheduled: { label: 'Scheduled', badge: 'info' },
  completed: { label: 'Completed', badge: 'success' },
  cancelled: { label: 'Cancelled', badge: 'danger' },
  rescheduled: { label: 'Rescheduled', badge: 'warning' },
};

const serviceLabels: Record<ServiceType, string> = { medical: 'Medical', dental: 'Dental', physical: 'Physical Exam', medicine: 'Medicine', first_aid: 'First Aid' };

type FormData = { patientId: string; patientName: string; patientRole?: string; department?: string; serviceType: ServiceType; appointmentDate: string; appointmentTime: string; reason: string; notes: string };
const emptyForm: FormData = { patientId: '', patientName: '', serviceType: 'medical', appointmentDate: '', appointmentTime: '', reason: '', notes: '' };

export default function AppointmentManagement() {
  const { currentUser } = useAuth();
  const { users, appointments, persistAppointment, removeAppointment } = useData();
  const { runWithFeedback } = useFeedback();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewAppt, setViewAppt] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'staff';
  const isRegularUser = ['student', 'faculty', 'employee'].includes(currentUser.role);
  const canManage = isAdmin || isStaff;
  const patients = users.filter((u) => ['student', 'staff', 'faculty', 'employee'].includes(u.role));
  const displayAppts = isRegularUser ? appointments.filter((a) => a.patientId === currentUser.id) : appointments;

  const filtered = displayAppts.filter((a) => {
    const matchSearch = a.patientName.toLowerCase().includes(search.toLowerCase()) || a.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => (b.appointmentDate + b.appointmentTime).localeCompare(a.appointmentDate + a.appointmentTime));

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = displayAppts.filter((a) => a.appointmentDate === todayStr && a.status === 'scheduled');
  const upcomingAppts = displayAppts.filter((a) => a.appointmentDate > todayStr && a.status === 'scheduled');
  const completedAppts = displayAppts.filter((a) => a.status === 'completed');

  const handlePatientSelect = (patient: User | null) => {
    setSelectedPatient(patient);
    if (patient) setForm((prev) => ({ ...prev, patientId: patient.id, patientName: patient.name, patientRole: patient.role, department: patient.department }));
    else setForm((prev) => ({ ...prev, patientId: '', patientName: '', patientRole: '', department: '' }));
  };

  const handleSave = async () => {
    if (!form.patientId || !form.appointmentDate) return;
    const now = new Date().toISOString().split('T')[0];
    const appt: Appointment = {
      id: editAppt?.id ?? `appt${Date.now()}`,
      patientId: form.patientId, patientName: form.patientName, patientRole: form.patientRole as Appointment['patientRole'], department: form.department || undefined,
      serviceType: form.serviceType, appointmentDate: form.appointmentDate, appointmentTime: form.appointmentTime,
      status: editAppt?.status ?? 'scheduled', reason: form.reason, notes: form.notes,
      scheduledBy: editAppt?.scheduledBy ?? currentUser.name, createdAt: editAppt?.createdAt ?? now, updatedAt: now,
    };
    await runWithFeedback(() => persistAppointment(appt), { loadingTitle: editAppt ? 'Saving...' : 'Scheduling...', successTitle: editAppt ? 'Appointment updated' : 'Appointment scheduled', successMessage: `Appointment for ${form.patientName} on ${form.appointmentDate} has been ${editAppt ? 'updated' : 'scheduled'}.`, autoCloseMs: 1800 });
    setForm(emptyForm); setSelectedPatient(null); setEditAppt(null); setShowForm(false);
  };

  const handleStatusChange = async (appt: Appointment, status: AppointmentStatus) => {
    const now = new Date().toISOString().split('T')[0];
    await runWithFeedback(() => persistAppointment({ ...appt, status, updatedAt: now }), { loadingTitle: 'Updating...', successTitle: 'Appointment updated', successMessage: `Appointment marked as ${status}.`, autoCloseMs: 1800 });
  };

  const openEdit = (a: Appointment) => {
    setEditAppt(a);
    setForm({ patientId: a.patientId, patientName: a.patientName, patientRole: a.patientRole, department: a.department, serviceType: a.serviceType, appointmentDate: a.appointmentDate, appointmentTime: a.appointmentTime, reason: a.reason, notes: a.notes });
    setSelectedPatient(patients.find((p) => p.id === a.patientId) ?? null);
    setShowForm(true);
  };

  const handleDelete = async () => { if (!deleteTarget) return; await removeAppointment(deleteTarget.id); setShowDeleteConfirm(false); setDeleteTarget(null); };
  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none';

  return (
    <div className="space-y-5">
      <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-teal-100"><CalendarClock size={20} className="text-teal-600" /></div>
          <div><h2 className="text-sm font-bold text-teal-800 uppercase tracking-wider">Appointment Management</h2><p className="text-xs text-teal-600 mt-0.5">Schedule and manage health service appointments.</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"><p className="text-2xl font-bold text-slate-800">{displayAppts.length}</p><p className="text-xs text-slate-500 mt-0.5">Total Appointments</p></div>
        <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-sm"><p className="text-2xl font-bold text-teal-600">{todayAppts.length}</p><p className="text-xs text-slate-500 mt-0.5">Today</p></div>
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-sm"><p className="text-2xl font-bold text-sky-600">{upcomingAppts.length}</p><p className="text-xs text-slate-500 mt-0.5">Upcoming</p></div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm"><p className="text-2xl font-bold text-emerald-600">{completedAppts.length}</p><p className="text-xs text-slate-500 mt-0.5">Completed</p></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search appointments..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              {(Object.keys(statusConfig) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
            </select>
            {canManage && <button onClick={() => { setEditAppt(null); setForm(emptyForm); setSelectedPatient(null); setShowForm(true); }} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"><Plus size={15} /> New Appointment</button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              {!isRegularUser && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>}
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Reason</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a) => { const isToday = a.appointmentDate === todayStr; return (
                <tr key={a.id} className={`hover:bg-slate-50/50 transition-colors ${isToday && a.status === 'scheduled' ? 'bg-teal-50/30' : ''}`}>
                  {!isRegularUser && (<td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0"><span className="text-teal-600 font-semibold text-xs">{a.patientName.charAt(0)}</span></div><div><p className="text-sm font-medium text-slate-700">{a.patientName}</p>{a.patientRole && <Badge label={roleLabel(a.patientRole as UserRole)} variant={statusVariant(a.patientRole as string)} />}</div></div></td>)}
                  <td className="px-5 py-3.5"><span className="text-sm font-medium text-slate-700">{serviceLabels[a.serviceType]}</span></td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /><span className="text-sm text-slate-600">{a.appointmentDate}</span>{a.appointmentTime && <><Clock size={11} className="text-slate-400 ml-1" /><span className="text-xs text-slate-400">{a.appointmentTime}</span></>}</div>{isToday && a.status === 'scheduled' && <span className="text-xs text-teal-600 font-medium">Today</span>}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500 truncate max-w-xs">{a.reason || '—'}</td>
                  <td className="px-5 py-3.5"><Badge label={statusConfig[a.status].label} variant={statusConfig[a.status].badge} /></td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1">
                    <button onClick={() => setViewAppt(a)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                    {canManage && a.status === 'scheduled' && <button onClick={() => handleStatusChange(a, 'completed')} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Complete"><CheckCircle size={14} /></button>}
                    {canManage && a.status === 'scheduled' && <button onClick={() => handleStatusChange(a, 'cancelled')} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Cancel"><XCircle size={14} /></button>}
                    {canManage && <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit"><CalendarClock size={14} /></button>}
                    {canManage && <button onClick={() => { setDeleteTarget(a); setShowDeleteConfirm(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><XCircle size={14} /></button>}
                  </div></td>
                </tr>
              );})}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No appointments found.</div>}
        </div>
      </div>

      <Modal isOpen={viewAppt !== null} onClose={() => setViewAppt(null)} title="Appointment Details" size="md">
        {viewAppt && (<div className="space-y-4">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><CalendarClock size={16} className="text-teal-600" /><p className="text-sm font-bold text-teal-800">{serviceLabels[viewAppt.serviceType]} Appointment</p></div><p className="text-xs text-teal-600">{viewAppt.appointmentDate}{viewAppt.appointmentTime ? ` at ${viewAppt.appointmentTime}` : ''}</p></div>
          <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-400">Patient</p><p className="font-medium text-slate-700">{viewAppt.patientName}</p></div><div><p className="text-xs text-slate-400">Department</p><p className="font-medium text-slate-700">{viewAppt.department || '—'}</p></div><div><p className="text-xs text-slate-400">Scheduled By</p><p className="font-medium text-slate-700">{viewAppt.scheduledBy}</p></div></div>
          {viewAppt.reason && <div><p className="text-xs text-slate-400 mb-1">Reason</p><p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{viewAppt.reason}</p></div>}
          {viewAppt.notes && <div><p className="text-xs text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{viewAppt.notes}</p></div>}
          <Badge label={statusConfig[viewAppt.status].label} variant={statusConfig[viewAppt.status].badge} />
        </div>)}
      </Modal>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelectedPatient(null); setForm(emptyForm); setEditAppt(null); }} title={editAppt ? 'Edit Appointment' : 'New Appointment'} size="md">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Search Patient</label><PatientSearch patients={patients} selectedId={form.patientId} onSelect={handlePatientSelect} /></div>
          {selectedPatient && (<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label><select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })} className={inputCls}>{(Object.keys(serviceLabels) as ServiceType[]).map((s) => <option key={s} value={s}>{serviceLabels[s]}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Time</label><input type="time" value={form.appointmentTime} onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })} className={inputCls} /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Date *</label><input type="date" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className={inputCls} placeholder="Reason for appointment..." /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} placeholder="Additional notes..." /></div>
          </>)}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100"><button onClick={() => { setShowForm(false); setSelectedPatient(null); setForm(emptyForm); setEditAppt(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button><button onClick={handleSave} disabled={!form.patientId || !form.appointmentDate} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white rounded-xl transition-colors">{editAppt ? 'Save Changes' : 'Schedule'}</button></div>
        </div>
      </Modal>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} onConfirm={handleDelete} title="Delete Appointment" message={`Delete the appointment for ${deleteTarget?.patientName}? This cannot be undone.`} confirmLabel="Delete" type="danger" />
    </div>
  );
}
