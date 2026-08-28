import { useState } from 'react';
import { Search, Eye, Plus, Stethoscope, HeartPulse, Pill, ShieldPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PatientVisit, ServiceType, UserRole } from '../../types';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PatientVisitForm from '../../components/ui/PatientVisitForm';

const serviceConfig: Partial<Record<ServiceType, { label: string; icon: React.ElementType; color: string }>> = {
  medical: { label: 'Medical', icon: Stethoscope, color: 'text-teal-600' },
  physical: { label: 'Physical Exam', icon: HeartPulse, color: 'text-rose-600' },
  medicine: { label: 'Medicine', icon: Pill, color: 'text-sky-600' },
  first_aid: { label: 'First Aid', icon: ShieldPlus, color: 'text-red-600' },
};

interface VisitListPageProps {
  serviceType: ServiceType;
  title: string;
  description: string;
}

export default function VisitListPage({ serviceType, title, description }: VisitListPageProps) {
  const { currentUser } = useAuth();
  const { patientVisits } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewVisit, setViewVisit] = useState<PatientVisit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editVisit, setEditVisit] = useState<PatientVisit | null>(null);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'staff';
  const isRegularUser = ['student', 'faculty', 'employee'].includes(currentUser.role);
  const canRecord = isAdmin || isStaff;

  const allVisits = patientVisits.filter((v) => v.serviceType === serviceType);
  const displayVisits = isRegularUser ? allVisits.filter((v) => v.patientId === currentUser.id) : allVisits;

  const filtered = displayVisits.filter((v) => {
    const matchSearch = v.patientName.toLowerCase().includes(search.toLowerCase()) || v.chiefComplaint.toLowerCase().includes(search.toLowerCase()) || v.diagnosis.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.visitDate.localeCompare(a.visitDate));

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = displayVisits.filter((v) => v.visitDate === todayStr);
  const followUpCount = displayVisits.filter((v) => v.status === 'follow_up').length;
  const svcConfig = serviceConfig[serviceType] ?? { label: 'Visit', icon: Stethoscope, color: 'text-teal-600' };
  const ServiceIcon = svcConfig.icon;

  const openEdit = (v: PatientVisit) => { setEditVisit(v); setShowForm(true); };
  const openAdd = () => { setEditVisit(null); setShowForm(true); };

  return (
    <div className="space-y-5">
      <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-teal-100"><ServiceIcon size={20} className={svcConfig.color} /></div>
          <div>
            <h2 className="text-sm font-bold text-teal-800 uppercase tracking-wider">{title}</h2>
            <p className="text-xs text-teal-600 mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Records" value={displayVisits.length} />
        <StatCard label="Today's Visits" value={todayVisits.length} />
        <StatCard label="Follow-ups" value={followUpCount} />
        <StatCard label="Completed" value={displayVisits.filter((v) => v.status === 'completed').length} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, complaint, or diagnosis..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="follow_up">Follow-up</option>
            </select>
            {canRecord && (
              <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus size={15} /> Submit
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {!isRegularUser && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>}
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Chief Complaint</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Diagnosis</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Medicine</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  {!isRegularUser && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0"><span className="text-teal-600 font-semibold text-xs">{v.patientName.charAt(0)}</span></div>
                        <div><p className="text-sm font-medium text-slate-700">{v.patientName}</p>{v.patientRole && <Badge label={roleLabel(v.patientRole as UserRole)} variant={statusVariant(v.patientRole as string)} />}</div>
                      </div>
                    </td>
                  )}
                  <td className="px-5 py-3.5"><p className="text-sm text-slate-700 truncate max-w-xs">{v.chiefComplaint}</p>{v.symptoms && <p className="text-xs text-slate-400 truncate max-w-xs">{v.symptoms}</p>}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500 truncate max-w-xs">{v.diagnosis || '—'}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {v.medicineName ? (<div><p className="text-sm text-slate-700">{v.medicineName}</p><p className="text-xs text-slate-400">{v.dosage} · {v.quantity} {v.unit}</p></div>) : <span className="text-slate-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3.5"><Badge label={v.status === 'follow_up' ? 'Follow-up' : v.status.charAt(0).toUpperCase() + v.status.slice(1)} variant={v.status === 'completed' ? 'success' : v.status === 'follow_up' ? 'warning' : 'neutral'} /></td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{v.visitDate}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewVisit(v)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                      {canRecord && <button onClick={() => openEdit(v)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit"><Stethoscope size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No {title.toLowerCase()} records found.</div>}
        </div>
      </div>

      <Modal isOpen={viewVisit !== null} onClose={() => setViewVisit(null)} title="Visit Details" size="lg">
        {viewVisit && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-sky-50 rounded-xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0"><span className="text-teal-600 font-bold text-xl">{viewVisit.patientName.charAt(0)}</span></div>
              <div><p className="font-bold text-slate-800">{viewVisit.patientName}</p><p className="text-xs text-slate-500">{viewVisit.department || '—'} · {viewVisit.visitDate}</p></div>
              <div className="ml-auto"><Badge label={viewVisit.status === 'follow_up' ? 'Follow-up' : 'Completed'} variant={viewVisit.status === 'completed' ? 'success' : 'warning'} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="Chief Complaint" value={viewVisit.chiefComplaint} />
              <DetailItem label="Symptoms" value={viewVisit.symptoms || '—'} />
            </div>
            {(viewVisit.temperature || viewVisit.bloodPressure || viewVisit.heartRate || viewVisit.respiratoryRate || viewVisit.weight || viewVisit.height || viewVisit.oxygenSat) && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vital Signs</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {viewVisit.temperature && <VitalCard label="Temp" value={`${viewVisit.temperature} °C`} />}
                  {viewVisit.bloodPressure && <VitalCard label="BP" value={`${viewVisit.bloodPressure} mmHg`} />}
                  {viewVisit.heartRate && <VitalCard label="HR" value={`${viewVisit.heartRate} bpm`} />}
                  {viewVisit.respiratoryRate && <VitalCard label="RR" value={`${viewVisit.respiratoryRate} bpm`} />}
                  {viewVisit.weight && <VitalCard label="Weight" value={`${viewVisit.weight} kg`} />}
                  {viewVisit.height && <VitalCard label="Height" value={`${viewVisit.height} cm`} />}
                  {viewVisit.oxygenSat && <VitalCard label="O2 Sat" value={`${viewVisit.oxygenSat}%`} />}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <DetailItem label="Assessment" value={viewVisit.assessment || '—'} />
              <DetailItem label="Diagnosis" value={viewVisit.diagnosis || '—'} />
              <DetailItem label="Treatment Provided" value={viewVisit.treatmentProvided || '—'} />
              {viewVisit.firstAidTreatment && <DetailItem label="First-Aid Treatment" value={viewVisit.firstAidTreatment} />}
            </div>
            {viewVisit.medicineName && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                <p className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2">Medicine Given</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-700">{viewVisit.medicineName}</span></div>
                  <div><span className="text-slate-400">Dosage:</span> <span className="font-medium text-slate-700">{viewVisit.dosage || '—'}</span></div>
                  <div><span className="text-slate-400">Qty:</span> <span className="font-medium text-slate-700">{viewVisit.quantity} {viewVisit.unit}</span></div>
                  <div><span className="text-slate-400">Instructions:</span> <span className="font-medium text-slate-700">{viewVisit.instructions || '—'}</span></div>
                  {viewVisit.clinicalData?.frequency && <div><span className="text-slate-400">Frequency:</span> <span className="font-medium text-slate-700">{String(viewVisit.clinicalData.frequency)}</span></div>}
                  {viewVisit.clinicalData?.duration && <div><span className="text-slate-400">Duration:</span> <span className="font-medium text-slate-700">{String(viewVisit.clinicalData.duration)}</span></div>}
                </div>
              </div>
            )}

            {/* Service-specific clinical details */}
            {viewVisit.clinicalData && Object.keys(viewVisit.clinicalData).length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Clinical Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {Object.entries(viewVisit.clinicalData).map(([key, value]) => {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                    let displayVal = String(value);
                    if (key.startsWith('proc_')) {
                      displayVal = value === 'yes' ? 'Yes' : '—';
                      if (value === 'no') return null;
                    }
                    return <div key={key}><span className="text-slate-400">{displayKey}:</span> <span className="font-medium text-slate-700">{displayVal}</span></div>;
                  })}
                </div>
              </div>
            )}

            {viewVisit.remarks && <DetailItem label="Remarks" value={viewVisit.remarks} />}
            <p className="text-xs text-slate-400 text-center">Recorded by {viewVisit.recordedBy} on {viewVisit.createdAt}</p>
          </div>
        )}
      </Modal>

      {showForm && <PatientVisitForm serviceType={serviceType} isOpen={showForm} onClose={() => { setShowForm(false); setEditVisit(null); }} editVisit={editVisit} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (<div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"><p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-xs text-slate-500 mt-0.5">{label}</p></div>);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (<div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm text-slate-700">{value}</p></div>);
}

function VitalCard({ label, value }: { label: string; value: string }) {
  return (<div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center"><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-bold text-slate-700">{value}</p></div>);
}
