import { useState, useMemo } from 'react';
import {
  Stethoscope, HeartPulse, Pill, ShieldPlus, Share2, RefreshCw, CalendarClock,
  Download, FileText, Activity, Clock, Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ServiceType } from '../../types';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { printHtml } from '../../lib/print';

const serviceConfig: Record<ServiceType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  medical: { label: 'Medical Treatment', icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50' },
  dental: { label: 'Dental', icon: Stethoscope, color: 'text-sky-600', bg: 'bg-sky-50' },
  physical: { label: 'Physical Exam', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
  medicine: { label: 'Medicine Issuance', icon: Pill, color: 'text-violet-600', bg: 'bg-violet-50' },
  first_aid: { label: 'First Aid', icon: ShieldPlus, color: 'text-red-600', bg: 'bg-red-50' },
};

type HistoryEntry = {
  id: string;
  date: string;
  type: ServiceType | 'referral' | 'follow-up' | 'appointment';
  serviceLabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  details: string[];
  status?: string;
  statusVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal' | 'rose' | 'violet';
};

export default function HealthServicesHistory() {
  const { currentUser } = useAuth();
  const { patientVisits, dispensingHistory, referrals, followUps, appointments, healthRecords, schoolSettings } = useData();
  const [filterType, setFilterType] = useState<string>('all');
  const [viewEntry, setViewEntry] = useState<HistoryEntry | null>(null);

  if (!currentUser) return null;

  const myVisits = patientVisits.filter((v) => v.patientId === currentUser.id);
  const myDispensing = dispensingHistory.filter((d) => d.patientId === currentUser.id);
  const myReferrals = referrals.filter((r) => r.patientId === currentUser.id);
  const myFollowUps = followUps.filter((f) => f.patientId === currentUser.id);
  const myAppointments = appointments.filter((a) => a.patientId === currentUser.id);
  const myHealthRecord = healthRecords.find((r) => r.userId === currentUser.id);

  // Build unified history timeline
  const history: HistoryEntry[] = useMemo(() => {
    const entries: HistoryEntry[] = [];

    myVisits.forEach((v) => {
      const cfg = serviceConfig[v.serviceType];
      const details: string[] = [];
      if (v.chiefComplaint) details.push(`Chief Complaint: ${v.chiefComplaint}`);
      if (v.diagnosis) details.push(`Diagnosis: ${v.diagnosis}`);
      if (v.treatmentProvided) details.push(`Treatment: ${v.treatmentProvided}`);
      if (v.firstAidTreatment) details.push(`First Aid: ${v.firstAidTreatment}`);
      if (v.medicineName) details.push(`Medicine: ${v.medicineName} (${v.dosage || '—'}, ${v.quantity} ${v.unit})`);
      if (v.assessment) details.push(`Assessment: ${v.assessment}`);
      if (v.temperature) details.push(`Temperature: ${v.temperature}°C`);
      if (v.bloodPressure) details.push(`Blood Pressure: ${v.bloodPressure} mmHg`);
      if (v.heartRate) details.push(`Heart Rate: ${v.heartRate} bpm`);
      if (v.weight) details.push(`Weight: ${v.weight} kg`);
      if (v.height) details.push(`Height: ${v.height} cm`);
      if (v.remarks) details.push(`Remarks: ${v.remarks}`);

      entries.push({
        id: v.id,
        date: v.visitDate,
        type: v.serviceType,
        serviceLabel: cfg.label,
        icon: cfg.icon,
        color: cfg.color,
        bg: cfg.bg,
        title: cfg.label,
        subtitle: `Recorded by ${v.recordedBy}`,
        details,
        status: v.status === 'follow_up' ? 'Follow-up' : v.status.charAt(0).toUpperCase() + v.status.slice(1),
        statusVariant: v.status === 'completed' ? 'success' : v.status === 'follow_up' ? 'warning' : 'neutral',
      });
    });

    myDispensing.forEach((d) => {
      entries.push({
        id: d.id,
        date: d.dispensedAt,
        type: 'medicine',
        serviceLabel: 'Medicine Dispensed',
        icon: Pill,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        title: `${d.medicineName} — ${d.quantity} ${d.unit}`,
        subtitle: `Dispensed by ${d.dispensedBy}`,
        details: [
          `Reason: ${d.reason}`,
        ],
      });
    });

    myReferrals.forEach((r) => {
      entries.push({
        id: r.id,
        date: r.referralDate,
        type: 'referral',
        serviceLabel: 'Referral',
        icon: Share2,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
        title: `Referred to ${r.referredTo}`,
        subtitle: `By ${r.referredBy}`,
        details: [
          `Reason: ${r.referralReason}`,
          ...(r.result ? [`Result: ${r.result}`] : []),
        ],
        status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
        statusVariant: statusVariant(r.status),
      });
    });

    myFollowUps.forEach((f) => {
      entries.push({
        id: f.id,
        date: f.scheduledDate,
        type: 'follow-up',
        serviceLabel: 'Follow-up',
        icon: RefreshCw,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        title: f.reason || 'Follow-up Appointment',
        subtitle: `Scheduled by ${f.createdBy}`,
        details: [
          ...(f.result ? [`Result: ${f.result}`] : []),
        ],
        status: f.status.charAt(0).toUpperCase() + f.status.slice(1),
        statusVariant: statusVariant(f.status),
      });
    });

    myAppointments.forEach((a) => {
      entries.push({
        id: a.id,
        date: a.appointmentDate,
        type: 'appointment',
        serviceLabel: `${serviceConfig[a.serviceType]?.label ?? a.serviceType} Appointment`,
        icon: CalendarClock,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        title: `${serviceConfig[a.serviceType]?.label ?? a.serviceType} — ${a.appointmentDate}${a.appointmentTime ? ` at ${a.appointmentTime}` : ''}`,
        subtitle: `Scheduled by ${a.scheduledBy}`,
        details: [
          ...(a.reason ? [`Reason: ${a.reason}`] : []),
          ...(a.notes ? [`Notes: ${a.notes}`] : []),
        ],
        status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
        statusVariant: statusVariant(a.status),
      });
    });

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [myVisits, myDispensing, myReferrals, myFollowUps, myAppointments]);

  const filtered = filterType === 'all' ? history : history.filter((e) => e.type === filterType);

  // Summary stats
  const totalVisits = myVisits.length;
  const totalDispensing = myDispensing.length;
  const totalReferrals = myReferrals.length;
  const totalFollowUps = myFollowUps.length;
  const totalAppointments = myAppointments.length;
  const lastVisitDate = myVisits.length > 0 ? myVisits.sort((a, b) => b.visitDate.localeCompare(a.visitDate))[0].visitDate : '—';

  const filterOptions = [
    { value: 'all', label: 'All History' },
    { value: 'medical', label: 'Medical' },
    { value: 'physical', label: 'Physical Exam' },
    { value: 'first_aid', label: 'First Aid' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'referral', label: 'Referrals' },
    { value: 'follow-up', label: 'Follow-ups' },
    { value: 'appointment', label: 'Appointments' },
  ];

  const generatePdf = () => {
    const schoolName = schoolSettings?.schoolName ?? 'HEALTH SYS SFCG';
    const schoolLogo = schoolSettings?.schoolLogoPath ?? '/logo.png';
    const now = new Date().toLocaleString();

    const visitsRows = myVisits.map((v) => {
      const cfg = serviceConfig[v.serviceType];
      return `<tr>
        <td>${v.visitDate}</td>
        <td>${cfg.label}</td>
        <td>${v.chiefComplaint || '—'}</td>
        <td>${v.diagnosis || '—'}</td>
        <td>${v.treatmentProvided || '—'}</td>
        <td>${v.medicineName ? `${v.medicineName} (${v.quantity} ${v.unit})` : '—'}</td>
        <td>${v.recordedBy}</td>
      </tr>`;
    }).join('');

    const dispensingRows = myDispensing.map((d) => `<tr>
      <td>${d.dispensedAt}</td>
      <td>${d.medicineName}</td>
      <td>${d.quantity} ${d.unit}</td>
      <td>${d.reason}</td>
      <td>${d.dispensedBy}</td>
    </tr>`).join('');

    const referralRows = myReferrals.map((r) => `<tr>
      <td>${r.referralDate}</td>
      <td>${r.referredTo}</td>
      <td>${r.referralReason}</td>
      <td>${r.status}</td>
      <td>${r.result || '—'}</td>
      <td>${r.referredBy}</td>
    </tr>`).join('');

    const followUpRows = myFollowUps.map((f) => `<tr>
      <td>${f.scheduledDate}</td>
      <td>${f.reason || '—'}</td>
      <td>${f.status}</td>
      <td>${f.result || '—'}</td>
      <td>${f.createdBy}</td>
    </tr>`).join('');

    const appointmentRows = myAppointments.map((a) => `<tr>
      <td>${a.appointmentDate}${a.appointmentTime ? ' ' + a.appointmentTime : ''}</td>
      <td>${serviceConfig[a.serviceType]?.label ?? a.serviceType}</td>
      <td>${a.reason || '—'}</td>
      <td>${a.status}</td>
      <td>${a.scheduledBy}</td>
    </tr>`).join('');

    const healthSummary = myHealthRecord ? `
      <div class="section">
        <h2>Health Summary</h2>
        <table class="info-table">
          <tr><td>Allergies</td><td>${myHealthRecord.allergies.length > 0 ? myHealthRecord.allergies.join(', ') : 'None'}</td></tr>
          <tr><td>Conditions</td><td>${myHealthRecord.conditions.length > 0 ? myHealthRecord.conditions.join(', ') : 'None'}</td></tr>
          <tr><td>Medications</td><td>${myHealthRecord.medications.length > 0 ? myHealthRecord.medications.join(', ') : 'None'}</td></tr>
          <tr><td>Height</td><td>${myHealthRecord.height || '—'}</td></tr>
          <tr><td>Weight</td><td>${myHealthRecord.weight || '—'}</td></tr>
          <tr><td>BMI</td><td>${myHealthRecord.bmi || '—'}</td></tr>
          <tr><td>Last Checkup</td><td>${myHealthRecord.lastCheckup || '—'}</td></tr>
          <tr><td>Next Checkup</td><td>${myHealthRecord.nextCheckup || '—'}</td></tr>
        </table>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Health Services History — ${currentUser.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; padding: 40px; line-height: 1.6; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
  .header img { width: 60px; height: auto; }
  .header h1 { font-size: 20px; color: #0f766e; }
  .header p { font-size: 12px; color: #64748b; }
  .patient-info { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px 20px; margin-bottom: 25px; }
  .patient-info h2 { font-size: 14px; color: #0f766e; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
  .patient-info .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 20px; }
  .patient-info .grid div { font-size: 12px; }
  .patient-info .grid .label { color: #64748b; font-weight: 600; }
  .section { margin-bottom: 30px; page-break-inside: avoid; }
  .section h2 { font-size: 15px; color: #0f766e; border-bottom: 2px solid #ccfbf1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f0fdfa; color: #0f766e; padding: 8px 10px; text-align: left; border-bottom: 2px solid #99f6e4; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .info-table td { padding: 6px 12px; border-bottom: 1px solid #e2e8f0; }
  .info-table td:first-child { font-weight: 600; color: #475569; width: 160px; }
  .summary-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 25px; }
  .stat-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-card .num { font-size: 24px; font-weight: bold; color: #0d9488; }
  .stat-card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
  .empty { text-align: center; padding: 20px; color: #94a3b8; font-style: italic; font-size: 12px; }
  @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    <img src="${schoolLogo}" alt="Logo" />
    <div>
      <h1>${schoolName}</h1>
      <p>Health Services History Report</p>
    </div>
  </div>

  <div class="patient-info">
    <h2>Patient Information</h2>
    <div class="grid">
      <div><span class="label">Name:</span> ${currentUser.name}</div>
      <div><span class="label">Email:</span> ${currentUser.email}</div>
      <div><span class="label">Department:</span> ${currentUser.department || '—'}</div>
      <div><span class="label">ID:</span> ${currentUser.studentId || currentUser.employeeId || currentUser.facultyId || currentUser.adminId || '—'}</div>
      <div><span class="label">Role:</span> ${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</div>
      <div><span class="label">Report Date:</span> ${now}</div>
    </div>
  </div>

  <div class="summary-stats">
    <div class="stat-card"><div class="num">${totalVisits}</div><div class="lbl">Clinic Visits</div></div>
    <div class="stat-card"><div class="num">${totalDispensing}</div><div class="lbl">Medicines Issued</div></div>
    <div class="stat-card"><div class="num">${totalReferrals}</div><div class="lbl">Referrals</div></div>
    <div class="stat-card"><div class="num">${totalFollowUps}</div><div class="lbl">Follow-ups</div></div>
    <div class="stat-card"><div class="num">${totalAppointments}</div><div class="lbl">Appointments</div></div>
  </div>

  ${healthSummary}

  <div class="section">
    <h2>Clinic Visits (${myVisits.length})</h2>
    ${myVisits.length > 0 ? `<table>
      <thead><tr><th>Date</th><th>Service Type</th><th>Chief Complaint</th><th>Diagnosis</th><th>Treatment</th><th>Medicine</th><th>Recorded By</th></tr></thead>
      <tbody>${visitsRows}</tbody>
    </table>` : '<div class="empty">No clinic visit records.</div>'}
  </div>

  <div class="section">
    <h2>Medicine Dispensing History (${myDispensing.length})</h2>
    ${myDispensing.length > 0 ? `<table>
      <thead><tr><th>Date</th><th>Medicine</th><th>Quantity</th><th>Reason</th><th>Dispensed By</th></tr></thead>
      <tbody>${dispensingRows}</tbody>
    </table>` : '<div class="empty">No medicine dispensing records.</div>'}
  </div>

  <div class="section">
    <h2>Referrals (${myReferrals.length})</h2>
    ${myReferrals.length > 0 ? `<table>
      <thead><tr><th>Date</th><th>Referred To</th><th>Reason</th><th>Status</th><th>Result</th><th>Referred By</th></tr></thead>
      <tbody>${referralRows}</tbody>
    </table>` : '<div class="empty">No referral records.</div>'}
  </div>

  <div class="section">
    <h2>Follow-ups (${myFollowUps.length})</h2>
    ${myFollowUps.length > 0 ? `<table>
      <thead><tr><th>Date</th><th>Reason</th><th>Status</th><th>Result</th><th>Created By</th></tr></thead>
      <tbody>${followUpRows}</tbody>
    </table>` : '<div class="empty">No follow-up records.</div>'}
  </div>

  <div class="section">
    <h2>Appointments (${myAppointments.length})</h2>
    ${myAppointments.length > 0 ? `<table>
      <thead><tr><th>Date & Time</th><th>Service</th><th>Reason</th><th>Status</th><th>Scheduled By</th></tr></thead>
      <tbody>${appointmentRows}</tbody>
    </table>` : '<div class="empty">No appointment records.</div>'}
  </div>

  <div class="footer">
    Generated on ${now} · ${schoolName} Health Management System
  </div>
</body>
</html>`;

    printHtml(html);
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm"><Activity size={22} className="text-white" /></div>
            <div>
              <h2 className="text-lg font-bold">My Health Services History</h2>
              <p className="text-teal-100 text-sm mt-0.5">Complete record of your clinic visits, treatments, and health services</p>
            </div>
          </div>
          <button
            onClick={generatePdf}
            className="flex items-center gap-2 bg-white text-teal-600 hover:bg-teal-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><Stethoscope size={18} className="text-teal-500" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{totalVisits}</p><p className="text-xs text-slate-500">Clinic Visits</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-xl"><Pill size={18} className="text-violet-500" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{totalDispensing}</p><p className="text-xs text-slate-500">Medicines Issued</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl"><Share2 size={18} className="text-sky-500" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{totalReferrals}</p><p className="text-xs text-slate-500">Referrals</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl"><RefreshCw size={18} className="text-amber-500" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{totalFollowUps}</p><p className="text-xs text-slate-500">Follow-ups</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><CalendarClock size={18} className="text-teal-500" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{totalAppointments}</p><p className="text-xs text-slate-500">Appointments</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><Clock size={18} className="text-emerald-500" /></div>
            <div><p className="text-2xl font-bold text-slate-800 truncate">{lastVisitDate}</p><p className="text-xs text-slate-500">Last Visit</p></div>
          </div>
        </div>
      </div>

      {/* Filter + Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">Timeline</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${filterType === opt.value ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No health service records found</p>
              <p className="text-slate-400 text-xs mt-1">Your clinic visits and treatments will appear here.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />

              <div className="space-y-4">
                {filtered.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <div key={entry.id} className="relative flex gap-4">
                      {/* Dot */}
                      <div className={`shrink-0 w-10 h-10 rounded-full ${entry.bg} border-2 border-white shadow-sm flex items-center justify-center relative z-10`}>
                        <Icon size={16} className={entry.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.bg} ${entry.color}`}>{entry.serviceLabel}</span>
                              {entry.status && (
                                <Badge label={entry.status} variant={entry.statusVariant ?? 'neutral'} />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{entry.subtitle}</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium">{entry.date}</p>
                          </div>
                          <button
                            onClick={() => setViewEntry(entry)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors shrink-0"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                        {entry.details.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {entry.details.slice(0, 3).map((d, i) => (
                              <p key={i} className="text-xs text-slate-500 leading-relaxed">{d}</p>
                            ))}
                            {entry.details.length > 3 && (
                              <p className="text-xs text-teal-500 font-medium mt-1">+ {entry.details.length - 3} more details</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={viewEntry !== null} onClose={() => setViewEntry(null)} title="Service Details" size="md">
        {viewEntry && (() => {
          const Icon = viewEntry.icon;
          return (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 ${viewEntry.bg} rounded-xl border border-slate-100`}>
                <div className="p-2.5 rounded-xl bg-white shadow-sm"><Icon size={20} className={viewEntry.color} /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{viewEntry.serviceLabel}</p>
                  <p className="font-bold text-slate-800">{viewEntry.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400 mb-0.5">Date</p><p className="font-medium text-slate-700">{viewEntry.date}</p></div>
                {viewEntry.status && <div><p className="text-xs text-slate-400 mb-0.5">Status</p><Badge label={viewEntry.status} variant={viewEntry.statusVariant ?? 'neutral'} /></div>}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">Details</p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                  {viewEntry.details.length > 0 ? viewEntry.details.map((d, i) => (
                    <p key={i} className="text-sm text-slate-600 leading-relaxed">{d}</p>
                  )) : <p className="text-sm text-slate-400 italic">No additional details recorded.</p>}
                </div>
              </div>

              <p className="text-xs text-slate-400">{viewEntry.subtitle}</p>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
