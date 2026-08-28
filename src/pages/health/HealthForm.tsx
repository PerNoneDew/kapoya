import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle, FileText, ShieldCheck, XCircle, Clock, Mail, Phone, MapPin, Calendar, AlertCircle, Activity, Search, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { HealthFormData, HealthFormRequest, HealthFormStatus, HealthRecord } from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import { printHtml } from '../../lib/print';

const emptyForm: HealthFormData = {
  purposeOfVisit: '', fullName: '', gradeLevel: '', age: '', dateOfBirth: '', gender: '', address: '', contactNumber: '', email: '', idNumber: '', yearLevelOrPosition: '',
  height: '', weight: '', bloodPressure: '', bloodType: '', allergies: '', medications: '', chronicConditions: '', previousIllnesses: '', surgeries: '', familyHistory: '',
  emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '', smokingStatus: '', alcoholConsumption: '', exerciseFrequency: '', physicianNotes: '',
  allergyAnimals: '', allergyFoods: '', allergyChemicals: '', allergyPollen: '', allergySoap: '', allergyDrugs: '', physicalRestrictions: '', contagiousDiseaseExposure: '', medicationDetails: '',
  healthHistory: [], healthHistoryDetails: '', additionalInformation: '', releaseConsent: false, minorTreatmentConsent: false, studentSignature: '', releaseSignatureDate: '', parentSignature: '', parentSignatureDate: '',
};

const historyOptions = [
  'ADD/ADHD', 'Arthritis/Joints', 'Asthma', 'Birth Defects', 'Blood Disorder', 'Bowel Problems', 'Cancer',
  'Developmental Delays', 'Diabetes', 'Hearing Problems', 'Heart Problems', 'Hepatitis', 'Hospitalizations', 'Learning Problems',
  'Menstrual Problems', 'Mental Health Issues', 'Migraines', 'Physical Limitations', 'Relationship Issues', 'Seizures, tics, or tremors', 'Serious Illness',
  'Skin Problems', 'Stomach Problems', 'Surgeries', 'Urinary Problems', 'Visual Problems', 'Pregnancy', 'Other',
];

const lineInput = 'paper-input';
const sectionTitle = 'font-black text-[15px] uppercase tracking-wide text-slate-900';

type LineFieldProps = { label?: string; name: keyof HealthFormData; value: string; onChange: (name: keyof HealthFormData, value: string) => void; type?: string; className?: string };

function LineField({ label, name, value, onChange, type = 'text', className = '' }: LineFieldProps) {
  return <label className={`flex items-end gap-1 text-[13px] font-semibold text-slate-900 ${className}`}><span className="whitespace-nowrap">{label}</span><input type={type} value={value} onChange={(event) => onChange(name, event.target.value)} className={lineInput} /></label>;
}

function RuledLines({ value, onChange, rows = 2, name = 'additionalInformation' }: { value: string; onChange: (name: keyof HealthFormData, value: string) => void; rows?: number; name?: keyof HealthFormData }) {
  return <textarea name={name} value={value} onChange={(event) => onChange(name, event.target.value)} rows={rows} className="w-full resize-y border-0 bg-transparent px-1 py-1 text-[13px] leading-[26px] text-slate-800 outline-none" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 25px, #334155 26px)' }} />;
}

function PaperSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border-t-2 border-slate-800 pt-3 mt-6"><h2 className={sectionTitle}>{title}</h2><div className="mt-3">{children}</div></section>;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
const blank = '________________';
const checkbox = (checked: boolean) => checked ? '<span style="font-size:14px;">&#9745;</span>' : '<span style="font-size:14px;">&#9744;</span>';

function buildFormHtml(data: HealthFormData): string {
  const fld = (v: string) => escapeHtml(v || blank);

  const allergyRows = [
    ['A.', 'Animals/Insects (specify)', data.allergyAnimals],
    ['B.', 'Foods (specify)', data.allergyFoods],
    ['C.', 'Chemical/Household Products (specify)', data.allergyChemicals],
    ['D.', 'Pollens/Dust', data.allergyPollen],
    ['E.', 'Soap/Personal Care Products (specify)', data.allergySoap],
    ['F.', 'Drugs/Medications (specify)', data.allergyDrugs],
  ].map(([letter, label, val]) =>
    `<div class="allergy-row"><span>${letter}</span> <span>${label}:</span> <span class="underline">${fld(val)}</span></div>`
  ).join('');

  const historyCols = Array.from({ length: 4 }, (_, col) => {
    const items = historyOptions.slice(col * 7, col * 7 + 7);
    return `<div class="hist-col">${items.map((item) =>
      `<div class="hist-item">${checkbox(data.healthHistory.includes(item))} ${escapeHtml(item)}</div>`
    ).join('')}</div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Student Health Record Form</title>
<style>
  @page { size: 8.5in 13in; margin: 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color:#1e293b; font-size:12px; line-height:1.6; }
  .header { text-align:center; border-bottom:2px solid #1e293b; padding-bottom:8px; margin-bottom:16px; }
  .header h1 { font-size:18px; font-weight:900; }
  .header .school { font-size:10px; font-weight:bold; margin-top:4px; }
  .section { border-top:2px solid #1e293b; padding-top:8px; margin-top:18px; }
  .section h2 { font-size:14px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; }
  .field-row { margin-top:6px; font-weight:600; }
  .underline { border-bottom:1px solid #1e293b; padding:0 4px; min-width:60px; display:inline-block; }
  .allergy-row { margin-top:3px; padding-left:20px; }
  .allergy-row .underline { min-width:200px; }
  .ruled { background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 24px, #334155 25px); padding:4px; min-height:50px; }
  .history-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-top:8px; }
  .hist-col { font-size:11px; }
  .hist-item { margin-bottom:2px; }
  .checkbox-row { margin-top:8px; font-weight:600; }
  .consent-title { font-weight:bold; text-transform:uppercase; text-decoration:underline; margin-top:14px; }
  .consent-text { font-size:11px; margin-top:4px; }
  .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:16px; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
  <div class="header">
    <h1>STUDENT HEALTH RECORD FORM</h1>
    <div class="school">Saint Francis College Guihulngan, Negros Oriental, Incorporated<br/>Bateria, Guihulngan City, Negros Oriental</div>
  </div>
  <div class="section">
    <h2>Student Information</h2>
    <div class="field-row">Student's Name: <span class="underline">${fld(data.fullName)}</span> &nbsp; Grade Level: <span class="underline">${fld(data.gradeLevel)}</span> &nbsp; Age: <span class="underline">${fld(data.age)}</span></div>
    <div class="field-row">Date of Birth: <span class="underline">${fld(data.dateOfBirth)}</span> &nbsp; Gender: <span class="underline">${fld(data.gender)}</span> &nbsp; Height: <span class="underline">${fld(data.height)}</span> &nbsp; Weight: <span class="underline">${fld(data.weight)}</span></div>
    <div class="field-row">Phone Number: <span class="underline">${fld(data.contactNumber)}</span></div>
    <div class="field-row">Address: <span class="underline">${fld(data.address)}</span></div>
    <div class="field-row">Emergency Contact: <span class="underline">${fld(data.emergencyContactName)}</span> &nbsp; Relationship: <span class="underline">${fld(data.emergencyContactRelationship)}</span> &nbsp; Phone: <span class="underline">${fld(data.emergencyContactPhone)}</span></div>
  </div>
  <div class="section">
    <h2>Health Information</h2>
    <p style="margin-top:6px;font-weight:600;">Do you have any allergies to (circle all that apply):</p>
    ${allergyRows}
    <p style="margin-top:12px;font-weight:600;">Do you have any physical restrictions or special problems? If yes, please list directions below:</p>
    <div class="ruled">${escapeHtml(data.physicalRestrictions || '')}</div>
    <p class="checkbox-row">Have you had recent exposure to any contagious disease?
      &nbsp; YES ${checkbox(data.contagiousDiseaseExposure === 'Yes')}
      &nbsp;&nbsp; NO ${checkbox(data.contagiousDiseaseExposure === 'No')}</p>
    <p style="margin-top:10px;font-weight:600;">Please list any current medication being taken and the reason for each below:</p>
    <div class="ruled">${escapeHtml(data.medicationDetails || '')}</div>
  </div>
  <div class="section">
    <h2>Health History</h2>
    <p style="margin-top:6px;font-weight:600;">Please check all the conditions you have or have had:</p>
    <div class="history-grid">${historyCols}</div>
    <p style="margin-top:12px;font-weight:600;">If you have any of the above, please describe briefly:</p>
    <div class="ruled">${escapeHtml(data.healthHistoryDetails || '')}</div>
    <p style="margin-top:10px;font-weight:600;">Other Disease or any additional information we should know?</p>
    <div class="ruled">${escapeHtml(data.additionalInformation || '')}</div>
  </div>
  <div class="section">
    <h2>Consents</h2>
    <p class="consent-title">Release of Medical Information</p>
    <p class="consent-text">I hereby authorize SFC-G to disclose information on the health forms to any Health Care Provider who has rendered medical services to me.</p>
    <p class="checkbox-row">${checkbox(data.releaseConsent)} I agree to the release of my medical information for health care purposes.</p>
    <div class="sig-grid">
      <div class="field-row">Student's Signature: <span class="underline">${fld(data.studentSignature)}</span></div>
      <div class="field-row">Date: <span class="underline">${fld(data.releaseSignatureDate)}</span></div>
    </div>
    <div class="sig-grid">
      <div class="field-row">Parent/Legal Guardian Signature: <span class="underline">${fld(data.parentSignature)}</span></div>
      <div class="field-row">Date: <span class="underline">${fld(data.parentSignatureDate)}</span></div>
    </div>
    <p class="consent-title">Parental Consent for Medical Treatment of Minor</p>
    <p class="consent-text">I hereby authorize my son/daughter to be treated by the medical staff of SFC-G if needed, and in case of emergency, to be taken to the nearest emergency care center or hospital for treatment.</p>
  </div>
</body></html>`;
}

export default function HealthForm() {
  const { currentUser } = useAuth();
  const { healthFormRequests, persistHealthFormRequest, healthRecords, setHealthRecords } = useData();
  const [form, setForm] = useState<HealthFormData>(emptyForm);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<HealthFormRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<HealthFormStatus>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  if (!currentUser) return null;

  const isReviewer = currentUser.role === 'admin';
  const visibleRequests = isReviewer ? healthFormRequests : healthFormRequests.filter((request) => request.userId === currentUser.id);
  const latestRequest = visibleRequests[0];

  const updateField = (name: keyof HealthFormData, value: string) => setForm((previous) => ({ ...previous, [name]: value }));

  const toggleHistory = (item: string) => setForm((previous) => ({ ...previous, healthHistory: previous.healthHistory.includes(item) ? previous.healthHistory.filter((entry) => entry !== item) : [...previous.healthHistory, item] }));

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setFormError('');
    if (!form.fullName.trim()) {
      setFormError('Please complete the student name.');
      return;
    }
    if (!form.releaseConsent) {
      setFormError('Please agree to the release of medical information before submitting.');
      return;
    }
    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    const request: HealthFormRequest = {
      id: `hfr${Date.now()}`, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, department: currentUser.department,
      formData: { ...form }, status: 'pending', submittedAt: today, updatedAt: today,
    };
    await persistHealthFormRequest(request);
    setForm(emptyForm);
    setSubmitting(false);
    setMessage('Your health record form has been submitted. The health officer and admin will review your request.');
  };

  const buildHealthRecordFromForm = (req: HealthFormRequest): HealthRecord => {
    const fd = req.formData;
    const allergies: string[] = [
      fd.allergyAnimals, fd.allergyFoods, fd.allergyChemicals, fd.allergyPollen, fd.allergySoap, fd.allergyDrugs,
    ].filter((a): a is string => !!a.trim());
    const conditions: string[] = [...fd.healthHistory];
    if (fd.chronicConditions.trim()) conditions.push(fd.chronicConditions);
    if (fd.physicalRestrictions.trim()) conditions.push(`Restrictions: ${fd.physicalRestrictions}`);
    const medications: string[] = fd.medicationDetails.trim()
      ? fd.medicationDetails.split(/[\n,;]/).map((m) => m.trim()).filter(Boolean)
      : fd.medications.trim() ? [fd.medications] : [];
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `hr${Date.now()}`,
      userId: req.userId,
      userName: fd.fullName || req.userName,
      userRole: req.userRole,
      department: req.department,
      allergies,
      conditions,
      medications,
      height: fd.height || '',
      weight: fd.weight || '',
      vision: '',
      dentalStatus: '',
      lastCheckup: today,
      nextCheckup: '',
      emergencyContact: fd.emergencyContactName || '',
      emergencyPhone: fd.emergencyContactPhone || '',
      notes: [fd.additionalInformation, fd.healthHistoryDetails, fd.physicianNotes].filter((n) => n.trim()).join('\n') || 'Approved from health form submission.',
      createdAt: today,
      updatedAt: today,
    };
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    const updated = { ...selectedRequest, status: 'approved' as HealthFormStatus, reviewedBy: currentUser.name, reviewNotes: reviewNotes.trim() || undefined, updatedAt: new Date().toISOString().split('T')[0] };
    await persistHealthFormRequest(updated);
    const existing = healthRecords.find((hr) => hr.userId === selectedRequest.userId);
    const newRecord = buildHealthRecordFromForm(updated);
    if (existing) {
      setHealthRecords((prev) => prev.map((hr) => hr.userId === selectedRequest.userId ? { ...newRecord, id: existing.id, createdAt: existing.createdAt, dispensingHistory: existing.dispensingHistory } : hr));
    } else {
      setHealthRecords((prev) => [newRecord, ...prev]);
    }
    setShowApproveConfirm(false);
    setSelectedRequest(null);
    setReviewNotes('');
    setReviewSuccess(`Approved ${selectedRequest.userName}'s health form. A health record has been created for them.`);
    setTimeout(() => setReviewSuccess(''), 5000);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;
    await persistHealthFormRequest({ ...selectedRequest, status: 'rejected' as HealthFormStatus, reviewedBy: currentUser.name, reviewNotes: reviewNotes.trim() || undefined, updatedAt: new Date().toISOString().split('T')[0] });
    setShowRejectConfirm(false);
    setSelectedRequest(null);
    setReviewNotes('');
    setReviewSuccess(`Rejected ${selectedRequest.userName}'s health form. The submitter will be notified.`);
    setTimeout(() => setReviewSuccess(''), 5000);
  };

  if (isReviewer) {
    const filteredRequests = visibleRequests.filter((r) => {
      const matchSearch = r.userName.toLowerCase().includes(search.toLowerCase()) ||
        r.formData.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.formData.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });

    const pendingCount = visibleRequests.filter((r) => r.status === 'pending').length;
    const approvedCount = visibleRequests.filter((r) => r.status === 'approved').length;
    const rejectedCount = visibleRequests.filter((r) => r.status === 'rejected').length;

    return (
      <div className="space-y-5">
        {reviewSuccess && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />{reviewSuccess}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 rounded-xl"><FileText size={18} className="text-sky-500" /></div>
              <div><p className="text-sm text-slate-500">Total Submissions</p><p className="text-2xl font-bold text-slate-800">{visibleRequests.length}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl"><Clock size={18} className="text-amber-500" /></div>
              <div><p className="text-sm text-slate-500">Pending Review</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl"><CheckCircle size={18} className="text-emerald-500" /></div>
              <div><p className="text-sm text-slate-500">Approved</p><p className="text-2xl font-bold text-emerald-600">{approvedCount}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl"><XCircle size={18} className="text-rose-500" /></div>
              <div><p className="text-sm text-slate-500">Rejected</p><p className="text-2xl font-bold text-rose-600">{rejectedCount}</p></div>
            </div>
          </div>
        </div>

        {/* Submissions list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or service..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No health form submissions</p>
              <p className="text-slate-400 text-xs mt-1">Submissions from students and staff will appear here for review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Submitter</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Key Health Info</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRequests.map((request) => {
                    const hasAllergies = !!(request.formData.allergyDrugs || request.formData.allergyFoods || request.formData.allergyAnimals);
                    const hasConditions = request.formData.healthHistory.length > 0;
                    return (
                      <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                              <span className="text-teal-700 font-bold text-sm">{request.userName.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{request.userName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {request.userRole && <Badge label={roleLabel(request.userRole)} variant={statusVariant(request.userRole)} />}
                                {request.department && <span className="text-xs text-slate-400 truncate">{request.department}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <p className="text-sm text-slate-600 truncate max-w-[180px]">{request.formData.email}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[180px]">{request.formData.contactNumber}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="space-y-0.5">
                            {hasAllergies && <span className="inline-flex items-center gap-0.5 text-xs text-rose-500"><AlertCircle size={10} /> Allergies</span>}
                            {hasConditions && <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 ml-1"><Activity size={10} /> Conditions</span>}
                            {!hasAllergies && !hasConditions && <span className="text-xs text-slate-300">No major flags</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-slate-600 font-medium">{request.submittedAt}</p>
                          {request.reviewedBy && <p className="text-xs text-slate-400 mt-0.5">By {request.reviewedBy}</p>}
                        </td>
                        <td className="px-5 py-3.5"><Badge label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} variant={statusVariant(request.status)} /></td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => { setSelectedRequest(request); setReviewStatus(request.status === 'rejected' ? 'approved' : request.status); setReviewNotes(request.reviewNotes ?? ''); }}
                            className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        <Modal
          isOpen={selectedRequest !== null}
          onClose={() => setSelectedRequest(null)}
          title="Review Health Form Submission"
          size="xl"
          headerAction={
            <button onClick={() => selectedRequest && printHtml(buildFormHtml(selectedRequest.formData))} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors no-print" title="Print Form">
              <Printer size={18} />
            </button>
          }
        >
          {selectedRequest && (
            <div className="space-y-5 print-area">
              {/* Submitter info card */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-teal-50 rounded-xl border border-slate-100 no-print">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-teal-700 font-bold text-xl">{selectedRequest.userName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-lg">{selectedRequest.userName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {selectedRequest.userRole && <Badge label={roleLabel(selectedRequest.userRole)} variant={statusVariant(selectedRequest.userRole)} />}
                    {selectedRequest.department && <span className="text-sm text-slate-500">{selectedRequest.department}</span>}
                    <Badge label={selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)} variant={statusVariant(selectedRequest.status)} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail size={12} className="text-slate-400" /> <span className="truncate">{selectedRequest.formData.email}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={12} className="text-slate-400" /> {selectedRequest.formData.contactNumber || '—'}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar size={12} className="text-slate-400" /> {selectedRequest.submittedAt}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={12} className="text-slate-400" /> <span className="truncate">{selectedRequest.formData.address || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Key health details grid */}
              <div className="no-print">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Health Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedRequest.formData.height ? (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                      <p className="text-xs text-slate-400 mb-1">Height</p>
                      <p className="text-sm font-bold text-slate-700">{selectedRequest.formData.height}</p>
                    </div>
                  ) : null}
                  {selectedRequest.formData.weight ? (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                      <p className="text-xs text-slate-400 mb-1">Weight</p>
                      <p className="text-sm font-bold text-slate-700">{selectedRequest.formData.weight}</p>
                    </div>
                  ) : null}
                  {selectedRequest.formData.bloodPressure ? (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                      <p className="text-xs text-slate-400 mb-1">Blood Pressure</p>
                      <p className="text-sm font-bold text-slate-700">{selectedRequest.formData.bloodPressure}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Allergies & conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 no-print">
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Allergies</p>
                  <div className="space-y-1 text-sm text-rose-700">
                    {selectedRequest.formData.allergyDrugs && <p><span className="font-medium">Drugs:</span> {selectedRequest.formData.allergyDrugs}</p>}
                    {selectedRequest.formData.allergyFoods && <p><span className="font-medium">Foods:</span> {selectedRequest.formData.allergyFoods}</p>}
                    {selectedRequest.formData.allergyAnimals && <p><span className="font-medium">Animals:</span> {selectedRequest.formData.allergyAnimals}</p>}
                    {selectedRequest.formData.allergyChemicals && <p><span className="font-medium">Chemicals:</span> {selectedRequest.formData.allergyChemicals}</p>}
                    {!selectedRequest.formData.allergyDrugs && !selectedRequest.formData.allergyFoods && !selectedRequest.formData.allergyAnimals && !selectedRequest.formData.allergyChemicals && <p className="text-rose-400 italic">No known allergies</p>}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Health History & Conditions</p>
                  <div className="space-y-1 text-sm text-amber-700">
                    {selectedRequest.formData.healthHistory.length > 0 && <p><span className="font-medium">Conditions:</span> {selectedRequest.formData.healthHistory.join(', ')}</p>}
                    {selectedRequest.formData.physicalRestrictions && <p><span className="font-medium">Restrictions:</span> {selectedRequest.formData.physicalRestrictions}</p>}
                    {selectedRequest.formData.medicationDetails && <p><span className="font-medium">Current meds:</span> {selectedRequest.formData.medicationDetails}</p>}
                    {selectedRequest.formData.contagiousDiseaseExposure && <p><span className="font-medium">Contagious exposure:</span> {selectedRequest.formData.contagiousDiseaseExposure}</p>}
                    {selectedRequest.formData.healthHistory.length === 0 && !selectedRequest.formData.physicalRestrictions && !selectedRequest.formData.medicationDetails && !selectedRequest.formData.contagiousDiseaseExposure && <p className="text-amber-400 italic">No conditions reported</p>}
                  </div>
                </div>
              </div>

              {/* Full paper form */}
              <div className="paper-sheet rounded-lg border border-slate-300 bg-[#fffef9] p-6">
                <PaperHeader />
                <PaperStudentInformation data={selectedRequest.formData} />
                <PaperHealthInformation data={selectedRequest.formData} />
              </div>

              {/* Review decision */}
              <div className="border-t border-slate-100 pt-4 space-y-3 no-print">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Review decision</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setReviewStatus('approved')} className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${reviewStatus === 'approved' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-emerald-200'}`}>
                      Approve
                    </button>
                    <button onClick={() => setReviewStatus('rejected')} className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${reviewStatus === 'rejected' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-rose-200'}`}>
                      Reject
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Review notes <span className="text-slate-400 font-normal">(visible to submitter)</span></label>
                  <textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="Add notes for the submitter..." />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setSelectedRequest(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
                  {reviewStatus === 'approved' && (
                    <button onClick={() => setShowApproveConfirm(true)} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
                      <CheckCircle size={15} /> Approve
                    </button>
                  )}
                  {reviewStatus === 'rejected' && (
                    <button onClick={() => setShowRejectConfirm(true)} className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors flex items-center gap-2">
                      <XCircle size={15} /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
        {/* Approve Confirmation Modal */}
        <ConfirmModal
          isOpen={showApproveConfirm}
          onClose={() => setShowApproveConfirm(false)}
          onConfirm={confirmApprove}
          title="Approve Health Form"
          message={`Are you sure you want to approve ${selectedRequest?.userName}'s health form? This will create a health record in their profile.`}
          confirmLabel="Yes, Approve & Create Record"
          type="success"
          details={[
            'Health form will be marked as approved',
            'A health record will be created for this person',
            'The submitter will be able to view their health record'
          ]}
        />

        {/* Reject Confirmation Modal */}
        <ConfirmModal
          isOpen={showRejectConfirm}
          onClose={() => setShowRejectConfirm(false)}
          onConfirm={confirmReject}
          title="Reject Health Form"
          message={`Are you sure you want to reject ${selectedRequest?.userName}'s health form? The submitter will be notified of this decision.`}
          confirmLabel="Yes, Reject"
          type="danger"
          details={[
            'Health form will be marked as rejected',
            'No health record will be created',
            'The submitter will be notified of the rejection'
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Student Health Record Form</h2>
          <p className="text-sm text-slate-500">Fill out all applicable information and submit to request a health service.</p>
        </div>
        {latestRequest && <Badge label={latestRequest.status.charAt(0).toUpperCase() + latestRequest.status.slice(1)} variant={statusVariant(latestRequest.status)} />}
      </div>

      {message && <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle size={16} className="mt-0.5 shrink-0" />{message}</div>}
      {formError && <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><XCircle size={16} className="mt-0.5 shrink-0" />{formError}</div>}

      <form onSubmit={submitForm} className="paper-sheet mx-auto max-w-5xl rounded-sm border border-slate-300 bg-[#fffef9] px-6 py-7 text-slate-900 shadow-md sm:px-10 sm:py-9 print-area">
        <PaperHeader />

        <PaperSection title="Student Information">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <LineField label="Student's Name:" name="fullName" value={form.fullName} onChange={updateField} className="min-w-[260px] flex-1" />
              <LineField label="Grade Level:" name="gradeLevel" value={form.gradeLevel} onChange={updateField} className="w-full sm:w-44" />
              <LineField label="Age:" name="age" value={form.age} onChange={updateField} className="w-full sm:w-20" />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <LineField label="Date of Birth:" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} className="w-full sm:flex-1" />
              <LineField label="Gender:" name="gender" value={form.gender} onChange={updateField} className="w-full sm:flex-1" />
              <LineField label="Height:" name="height" value={form.height} onChange={updateField} className="w-full sm:flex-1" />
              <LineField label="Weight:" name="weight" value={form.weight} onChange={updateField} className="w-full sm:flex-1" />
              <LineField label="Phone Number:" name="contactNumber" value={form.contactNumber} onChange={updateField} className="w-full sm:flex-1" />
            </div>
            <LineField label="Address:" name="address" value={form.address} onChange={updateField} />
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <LineField label="Emergency Contact:" name="emergencyContactName" value={form.emergencyContactName} onChange={updateField} className="min-w-[230px] flex-1" />
              <LineField label="Relationship:" name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={updateField} className="min-w-[150px] flex-1" />
              <LineField label="Contact Number:" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={updateField} className="min-w-[180px] flex-1" />
            </div>
          </div>
        </PaperSection>

        <PaperSection title="Health Information">
          <p className="text-[13px] font-semibold">Do you have any allergies to (circle all that apply):</p>
          <div className="mt-2 space-y-0.5 pl-5 text-[13px] font-semibold">
            {[['A.', 'Animals/Insects (specify)', 'allergyAnimals'], ['B.', 'Foods (specify)', 'allergyFoods'], ['C.', 'Chemical/Household Products (specify)', 'allergyChemicals'], ['D.', 'Pollens/Dust', 'allergyPollen'], ['E.', 'Soap/Personal Care Products (specify)', 'allergySoap'], ['F.', 'Drugs/Medications (specify)', 'allergyDrugs']].map(([letter, label, name]) => (
              <div key={name} className="flex items-end gap-2">
                <span>{letter}</span>
                <span className="whitespace-nowrap">{label}:</span>
                <input value={String(form[name as keyof HealthFormData])} onChange={(event) => updateField(name as keyof HealthFormData, event.target.value)} className={lineInput} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] font-semibold">Do you have any physical restrictions or special problems? If yes, please list directions below:</p>
          <RuledLines name="physicalRestrictions" value={form.physicalRestrictions} onChange={updateField} rows={2} />
          <p className="mt-2 text-[13px] font-semibold">Have you had recent exposure to any contagious disease? <span className="ml-5">YES <input type="checkbox" checked={form.contagiousDiseaseExposure === 'Yes'} onChange={() => updateField('contagiousDiseaseExposure', form.contagiousDiseaseExposure === 'Yes' ? '' : 'Yes')} className="accent-teal-600" />&nbsp;&nbsp; NO <input type="checkbox" checked={form.contagiousDiseaseExposure === 'No'} onChange={() => updateField('contagiousDiseaseExposure', form.contagiousDiseaseExposure === 'No' ? '' : 'No')} className="accent-teal-600" /></span></p>
          <p className="mt-3 text-[13px] font-semibold">Please list any current medication being taken and the reason for each below:</p>
          <RuledLines name="medicationDetails" value={form.medicationDetails} onChange={updateField} rows={2} />
        </PaperSection>

        <PaperSection title="Health History">
          <p className="text-[13px] font-semibold">Please check all the conditions you have or have had:</p>
          <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-1 text-[12px] font-semibold sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, column) => (
              <div key={column}>
                {historyOptions.slice(column * 7, column * 7 + 7).map((item) => (
                  <label key={item} className="flex items-center gap-1"><input type="checkbox" checked={form.healthHistory.includes(item)} onChange={() => toggleHistory(item)} className="accent-teal-600" />{item}</label>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] font-semibold">If you have any of the above, please describe briefly:</p>
          <RuledLines name="healthHistoryDetails" value={form.healthHistoryDetails} onChange={updateField} rows={2} />
          <p className="mt-3 text-[13px] font-semibold">Other Disease or any additional information we should know?</p>
          <RuledLines name="additionalInformation" value={form.additionalInformation} onChange={updateField} rows={3} />
        </PaperSection>

        <PaperSection title="Consents">
          <p className="text-[12px] font-semibold uppercase underline">Release of Medical Information</p>
          <p className="mt-1 text-[11px] leading-relaxed">I hereby authorize SFC-G to disclose information on the health forms to any Health Care Provider who has rendered medical services to me.</p>
          <label className="mt-2 flex items-start gap-2 text-[12px] font-semibold"><input type="checkbox" checked={form.releaseConsent} onChange={(event) => setForm({ ...form, releaseConsent: event.target.checked })} className="mt-0.5 accent-teal-600" />I agree to the release of my medical information for health care purposes.</label>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <LineField label="Student's Signature:" name="studentSignature" value={form.studentSignature} onChange={updateField} />
            <LineField label="Date:" name="releaseSignatureDate" type="date" value={form.releaseSignatureDate} onChange={updateField} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <LineField label="Parent/Legal Guardian Signature:" name="parentSignature" value={form.parentSignature} onChange={updateField} />
            <LineField label="Date:" name="parentSignatureDate" type="date" value={form.parentSignatureDate} onChange={updateField} />
          </div>
          <p className="mt-5 text-[12px] font-semibold uppercase underline">Parental Consent for Medical Treatment of Minor</p>
          <p className="mt-1 text-[11px] leading-relaxed">I hereby authorize my son/daughter to be treated by the medical staff of SFC-G if needed, and in case of emergency, to be taken to the nearest emergency care center or hospital for treatment.</p>
        </PaperSection>

        <div className="mt-7 flex items-center justify-end border-t border-slate-300 pt-4 no-print">
          <span className="flex items-center gap-2 text-[11px] text-slate-500 mr-auto"><ShieldCheck size={15} /> Information is kept confidential.</span>
          <button type="submit" disabled={submitting} className="rounded bg-teal-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:bg-teal-300 transition-colors flex items-center gap-2">
            {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : 'Submit Form'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PaperHeader() {
  return <header className="text-center"><img src="/logo.png" alt="Saint Francis College logo" className="mx-auto h-14 w-auto object-contain" /><p className="mt-2 text-[10px] font-bold leading-tight">Saint Francis College Guihulngan, Negros Oriental, Incorporated<br />Bateria, Guihulngan City, Negros Oriental</p><div className="mt-2 border-t-2 border-slate-800 pt-1"><h1 className="text-xl font-black tracking-tight">STUDENT HEALTH RECORD FORM</h1></div></header>;
}

function PaperStudentInformation({ data }: { data: HealthFormData }) {
  return <PaperSection title="Student Information"><div className="space-y-2 text-[13px] font-semibold"><p>Student's Name: <span className="border-b border-slate-800">{data.fullName}</span> &nbsp;&nbsp; Grade Level: <span className="border-b border-slate-800">{data.gradeLevel}</span> &nbsp;&nbsp; Age: <span className="border-b border-slate-800">{data.age}</span></p><p>Date of Birth: {data.dateOfBirth} &nbsp;&nbsp; Gender: {data.gender} &nbsp;&nbsp; Height: {data.height} &nbsp;&nbsp; Weight: {data.weight}</p><p>Address: {data.address}</p><p>Emergency Contact: {data.emergencyContactName} &nbsp;&nbsp; Relationship: {data.emergencyContactRelationship} &nbsp;&nbsp; Contact Number: {data.emergencyContactPhone}</p></div></PaperSection>;
}

function PaperHealthInformation({ data }: { data: HealthFormData }) {
  return <PaperSection title="Health Information"><div className="space-y-2 text-[12px]"><p><b>Allergies:</b> Animals/Insects: {data.allergyAnimals || 'None'} · Foods: {data.allergyFoods || 'None'} · Chemicals: {data.allergyChemicals || 'None'} · Drugs: {data.allergyDrugs || 'None'}</p><p><b>Restrictions:</b> {data.physicalRestrictions || 'None listed'}</p><p><b>Contagious disease exposure:</b> {data.contagiousDiseaseExposure || 'Not answered'}</p><p><b>Current medications:</b> {data.medicationDetails || 'None listed'}</p><p><b>Health history:</b> {data.healthHistory.join(', ') || 'None checked'}</p><p><b>Additional information:</b> {data.additionalInformation || 'None'}</p></div></PaperSection>;
}
