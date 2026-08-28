import { useState } from 'react';
import { Pill, Share2, CalendarClock, Stethoscope, HeartPulse } from 'lucide-react';
import { HealthRecord, MedicineDispensing, PatientVisit, Referral, FollowUp } from '../../types';
import Badge, { statusVariant } from './Badge';

type TabKey = 'overview' | 'medical' | 'physical' | 'medicine' | 'first_aid' | 'referral' | 'follow-up';

export default function HealthHistoryTabs({
  record,
  dispensingHistory,
  visits,
  referrals,
  followUps,
}: {
  record: HealthRecord | undefined;
  dispensingHistory: MedicineDispensing[];
  visits: PatientVisit[];
  referrals: Referral[];
  followUps: FollowUp[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const medicalVisits = visits.filter((v) => v.serviceType === 'medical');
  const physicalVisits = visits.filter((v) => v.serviceType === 'physical');
  const firstAidVisits = visits.filter((v) => v.serviceType === 'first_aid');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'medical', label: `Medical (${medicalVisits.length})` },
    { key: 'physical', label: `Physical (${physicalVisits.length})` },
    { key: 'first_aid', label: `First Aid (${firstAidVisits.length})` },
    { key: 'medicine', label: `Medicine (${dispensingHistory.length})` },
    { key: 'referral', label: `Referrals (${referrals.length})` },
    { key: 'follow-up', label: `Follow-ups (${followUps.length})` },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <HeartPulse size={16} className="text-emerald-600" />
        <p className="text-sm font-semibold text-slate-700">Health History</p>
      </div>

      <div className="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-fit py-1.5 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-3">
          {record ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Height', value: record.height },
                  { label: 'Weight', value: record.weight },
                  { label: 'BMI', value: record.bmi },
                  { label: 'Vision', value: record.vision },
                  { label: 'Dental Status', value: record.dentalStatus },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-700">{value}</p>
                  </div>
                ) : null)}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <TagList label="Allergies" items={record.allergies} emptyText="No known allergies" colorClass="bg-rose-50 text-rose-700 border-rose-100" />
                <TagList label="Medical Conditions" items={record.conditions} emptyText="No known conditions" colorClass="bg-amber-50 text-amber-700 border-amber-100" />
                <TagList label="Current Medications" items={record.medications} emptyText="No current medications" colorClass="bg-teal-50 text-teal-700 border-teal-100" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-sky-400 font-medium">Last Checkup</p>
                  <p className="text-sm font-bold text-sky-700 mt-0.5">{record.lastCheckup || '—'}</p>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-teal-400 font-medium">Next Checkup</p>
                  <p className="text-sm font-bold text-teal-700 mt-0.5">{record.nextCheckup || '—'}</p>
                </div>
              </div>

              {(record.emergencyContact || record.emergencyPhone) && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-rose-400 font-medium">Emergency Contact</p>
                    <p className="text-sm font-semibold text-rose-700 truncate">{record.emergencyContact || '—'}</p>
                    {record.emergencyPhone && <p className="text-sm text-rose-600">{record.emergencyPhone}</p>}
                  </div>
                </div>
              )}

              {record.notes && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clinical Notes</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed border border-slate-100">{record.notes}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <HeartPulse size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No health record on file.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'medical' && <VisitList visits={medicalVisits} />}
      {activeTab === 'physical' && <VisitList visits={physicalVisits} />}
      {activeTab === 'first_aid' && <VisitList visits={firstAidVisits} />}

      {activeTab === 'medicine' && (
        <div className="space-y-2">
          {dispensingHistory.length === 0 ? (
            <EmptyState icon={Pill} text="No medicine dispensing records yet." />
          ) : (
            dispensingHistory.map((d) => (
              <div key={d.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-teal-50 rounded-lg shrink-0"><Pill size={14} className="text-teal-500" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{d.medicineName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.reason}</p>
                    <p className="text-xs text-slate-400 mt-0.5">By {d.dispensedBy} · {d.dispensedAt}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-teal-600">{d.quantity}</p>
                  <p className="text-xs text-slate-400">{d.unit}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'referral' && (
        <div className="space-y-2">
          {referrals.length === 0 ? (
            <EmptyState icon={Share2} text="No referral records yet." />
          ) : (
            referrals.map((ref) => (
              <div key={ref.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Referred to {ref.referredTo}</p>
                  <Badge label={ref.status} variant={statusVariant(ref.status)} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{ref.referralReason}</p>
                <p className="text-xs text-slate-400 mt-0.5">By {ref.referredBy} · {ref.referralDate}</p>
                {ref.result && <p className="text-xs text-slate-600 mt-1">Result: {ref.result}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'follow-up' && (
        <div className="space-y-2">
          {followUps.length === 0 ? (
            <EmptyState icon={CalendarClock} text="No follow-up records yet." />
          ) : (
            followUps.map((fu) => (
              <div key={fu.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{fu.reason}</p>
                  <Badge label={fu.status} variant={statusVariant(fu.status)} />
                </div>
                <p className="text-xs text-slate-500 mt-1">Scheduled: {fu.scheduledDate}</p>
                <p className="text-xs text-slate-400 mt-0.5">By {fu.createdBy}</p>
                {fu.result && <p className="text-xs text-slate-600 mt-1">Result: {fu.result}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function VisitList({ visits }: { visits: PatientVisit[] }) {
  if (visits.length === 0) return <EmptyState icon={Stethoscope} text="No records yet." />;
  return (
    <div className="space-y-2">
      {visits.map((v) => (
        <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{v.chiefComplaint || 'No complaint recorded'}</p>
            <Badge label={v.status} variant={statusVariant(v.status)} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{v.diagnosis || 'No diagnosis recorded'}</p>
          {v.treatmentProvided && <p className="text-xs text-slate-600 mt-0.5">Treatment: {v.treatmentProvided}</p>}
          <p className="text-xs text-slate-400 mt-0.5">{v.visitDate} · By {v.recordedBy}</p>
        </div>
      ))}
    </div>
  );
}

function TagList({ label, items, emptyText, colorClass }: { label: string; items: string[]; emptyText: string; colorClass: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Pill; text: string }) {
  return (
    <div className="text-center py-10">
      <Icon size={28} className="text-slate-200 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}
