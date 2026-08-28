import { useState, useEffect } from 'react';
import { Activity, Stethoscope, HeartPulse, Pill, Thermometer, Droplet, Gauge, Wind, Weight, Ruler, Package, ShieldPlus, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { PatientVisit, ServiceType, User, Medicine, UserRole } from '../../types';
import PatientSearch from './PatientSearch';
import PhysicalExamSheet from './PhysicalExamSheet';
import Modal from './Modal';

export type ClinicalData = Record<string, string | number | boolean | string[]>;

export type FormState = {
  patientId: string;
  patientName: string;
  patientRole?: string;
  department?: string;
  chiefComplaint: string;
  symptoms: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  weight: string;
  height: string;
  oxygenSat: string;
  assessment: string;
  diagnosis: string;
  treatmentProvided: string;
  firstAidTreatment: string;
  medicineName: string;
  medicineId: string;
  dosage: string;
  quantity: number;
  unit: string;
  instructions: string;
  remarks: string;
  clinical: ClinicalData;
};

const emptyForm: FormState = {
  patientId: '', patientName: '', patientRole: '', department: '',
  chiefComplaint: '', symptoms: '', temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '',
  weight: '', height: '', oxygenSat: '', assessment: '', diagnosis: '', treatmentProvided: '', firstAidTreatment: '',
  medicineName: '', medicineId: '', dosage: '', quantity: 0, unit: '', instructions: '', remarks: '',
  clinical: {},
};

interface PatientVisitFormProps {
  serviceType: ServiceType;
  isOpen: boolean;
  onClose: () => void;
  editVisit?: PatientVisit | null;
  presetPatient?: User | null;
}

export default function PatientVisitForm({ serviceType, isOpen, onClose, editVisit, presetPatient }: PatientVisitFormProps) {
  const { currentUser } = useAuth();
  const { users, inventory, persistPatientVisit, persistMedicine, persistDispensing } = useData();
  const { runWithFeedback } = useFeedback();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);

  const patients = users.filter((u) => ['student', 'staff', 'faculty', 'employee'].includes(u.role));

  // Hydrate form when editing or when a preset patient is provided
  useEffect(() => {
    if (editVisit) {
      setForm({
        patientId: editVisit.patientId, patientName: editVisit.patientName, patientRole: editVisit.patientRole, department: editVisit.department,
        chiefComplaint: editVisit.chiefComplaint, symptoms: editVisit.symptoms,
        temperature: editVisit.temperature ?? '', bloodPressure: editVisit.bloodPressure ?? '', heartRate: editVisit.heartRate ?? '',
        respiratoryRate: editVisit.respiratoryRate ?? '', weight: editVisit.weight ?? '', height: editVisit.height ?? '', oxygenSat: editVisit.oxygenSat ?? '',
        assessment: editVisit.assessment, diagnosis: editVisit.diagnosis, treatmentProvided: editVisit.treatmentProvided, firstAidTreatment: editVisit.firstAidTreatment,
        medicineName: editVisit.medicineName, medicineId: editVisit.medicineId ?? '', dosage: editVisit.dosage, quantity: editVisit.quantity, unit: editVisit.unit,
        instructions: editVisit.instructions, remarks: editVisit.remarks,
        clinical: editVisit.clinicalData ?? {},
      });
      setSelectedPatient(patients.find((p) => p.id === editVisit.patientId) ?? null);
    } else if (presetPatient) {
      setForm({ ...emptyForm, patientId: presetPatient.id, patientName: presetPatient.name, patientRole: presetPatient.role, department: presetPatient.department ?? '' });
      setSelectedPatient(presetPatient);
    } else {
      setForm(emptyForm);
      setSelectedPatient(null);
    }
  }, [editVisit, presetPatient]);

  const handlePatientSelect = (patient: User | null) => {
    setSelectedPatient(patient);
    if (patient) {
      setForm((prev) => ({ ...prev, patientId: patient.id, patientName: patient.name, patientRole: patient.role, department: patient.department ?? '' }));
    } else {
      setForm((prev) => ({ ...prev, patientId: '', patientName: '', patientRole: '', department: '' }));
    }
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setForm((prev) => ({ ...prev, medicineName: medicine.name, medicineId: medicine.id, unit: medicine.unit }));
  };

  const setClinical = (key: string, value: string | number | boolean | string[]) => {
    setForm((prev) => ({ ...prev, clinical: { ...prev.clinical, [key]: value } }));
  };

  const computeBmi = (): string => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    if (!w || !h) return '';
    const m = h / 100;
    const bmi = w / (m * m);
    return bmi.toFixed(1);
  };

  const handleSave = async () => {
    if (!form.patientId || !form.chiefComplaint.trim()) return;
    const now = new Date().toISOString().split('T')[0];

    // Auto-compute BMI for physical exams
    let clinical = { ...form.clinical };
    if (serviceType === 'physical') {
      const bmi = computeBmi();
      if (bmi) clinical.bmi = bmi;
    }

    const visit: PatientVisit = {
      id: editVisit?.id ?? `pv${Date.now()}`,
      patientId: form.patientId,
      patientName: form.patientName,
      patientRole: (form.patientRole || undefined) as PatientVisit['patientRole'],
      department: form.department || undefined,
      serviceType,
      visitDate: editVisit?.visitDate ?? now,
      chiefComplaint: form.chiefComplaint,
      symptoms: form.symptoms,
      temperature: form.temperature || undefined,
      bloodPressure: form.bloodPressure || undefined,
      heartRate: form.heartRate || undefined,
      respiratoryRate: form.respiratoryRate || undefined,
      weight: form.weight || undefined,
      height: form.height || undefined,
      oxygenSat: form.oxygenSat || undefined,
      assessment: form.assessment,
      diagnosis: form.diagnosis,
      treatmentProvided: form.treatmentProvided,
      firstAidTreatment: form.firstAidTreatment,
      medicineName: form.medicineName,
      medicineId: form.medicineId || undefined,
      dosage: form.dosage,
      quantity: form.quantity,
      unit: form.unit,
      instructions: form.instructions,
      remarks: form.remarks,
      recordedBy: currentUser?.name ?? '',
      status: 'completed',
      createdAt: editVisit?.createdAt ?? now,
      updatedAt: now,
      clinicalData: Object.keys(clinical).length > 0 ? clinical : undefined,
    };

    await runWithFeedback(
      async () => {
        await persistPatientVisit(visit);
        if (form.medicineId && form.quantity > 0) {
          const med = inventory.find((m) => m.id === form.medicineId);
          if (med && med.quantity >= form.quantity) {
            await persistMedicine({ ...med, quantity: med.quantity - form.quantity, lastUpdated: now });
            // Record dispensing history
            await persistDispensing({
              id: `disp${Date.now()}`,
              medicineId: med.id,
              medicineName: med.name,
              patientId: form.patientId,
              patientName: form.patientName,
              patientRole: (form.patientRole || 'student') as UserRole,
              quantity: form.quantity,
              unit: form.unit,
              dispensedBy: currentUser?.name ?? '',
              dispensedAt: now,
              reason: form.chiefComplaint,
            });
          }
        }
      },
      {
        loadingTitle: editVisit ? 'Saving visit...' : 'Recording visit...',
        successTitle: editVisit ? 'Visit updated' : 'Visit recorded',
        successMessage: `${serviceLabel[serviceType]} for ${form.patientName} has been ${editVisit ? 'updated' : 'recorded'}${form.medicineId && form.quantity > 0 ? ` and ${form.quantity} ${form.unit} deducted from inventory` : ''}.`,
        autoCloseMs: 1800,
      },
    );
    setForm(emptyForm);
    setSelectedPatient(null);
    onClose();
  };

  const serviceLabel: Record<ServiceType, string> = {
    medical: 'Medical Treatment',
    dental: 'Dental Examination',
    physical: 'Physical Examination',
    medicine: 'Medicine Issuance',
    first_aid: 'First Aid',
  };

  const serviceIcon: Partial<Record<ServiceType, React.ElementType>> = {
    medical: Stethoscope,
    physical: HeartPulse,
    medicine: Pill,
    first_aid: ShieldPlus,
  };

  const Icon = serviceIcon[serviceType] ?? Stethoscope;
  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${editVisit ? 'Edit' : 'Record'} ${serviceLabel[serviceType]}`} size="xl">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
          <div className="p-2 rounded-lg bg-white"><Icon size={18} className="text-teal-600" /></div>
          <div>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Service Type</p>
            <p className="font-bold text-teal-800">{serviceLabel[serviceType]}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Search Patient</label>
          <PatientSearch patients={patients} selectedId={form.patientId} onSelect={handlePatientSelect} />
        </div>

        {selectedPatient && (
          <>
            {/* ===== FIRST AID specific ===== */}
            {serviceType === 'first_aid' && (
              <>
                <Section title="Incident Details" icon={ShieldPlus}>
                  <div className="space-y-3">
                    <Field label="Incident Description *">
                      <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} rows={2} className={inputCls} placeholder="Describe the incident or injury..." />
                    </Field>
                    <Field label="Location of Incident">
                      <input value={String(form.clinical.incidentLocation ?? '')} onChange={(e) => setClinical('incidentLocation', e.target.value)} className={inputCls} placeholder="e.g. Playground, Classroom, Corridor" />
                    </Field>
                    <Field label="Time of Incident">
                      <input type="datetime-local" value={String(form.clinical.incidentTime ?? '')} onChange={(e) => setClinical('incidentTime', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Injury Type">
                      <select value={String(form.clinical.injuryType ?? '')} onChange={(e) => setClinical('injuryType', e.target.value)} className={inputCls}>
                        <option value="">— Select —</option>
                        <option value="cut">Cut / Laceration</option>
                        <option value="bruise">Bruise / Contusion</option>
                        <option value="burn">Burn</option>
                        <option value="sprain">Sprain / Strain</option>
                        <option value="fracture">Fracture</option>
                        <option value="faint">Fainting</option>
                        <option value="nosebleed">Nosebleed</option>
                        <option value="allergic">Allergic Reaction</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Symptoms Observed">
                      <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={2} className={inputCls} placeholder="Signs and symptoms observed..." />
                    </Field>
                  </div>
                </Section>

                <Section title="Vital Signs" icon={Thermometer}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <VitalField icon={Thermometer} label="Temp (°C)" value={form.temperature} onChange={(v) => setForm({ ...form, temperature: v })} />
                    <VitalField icon={Droplet} label="BP (mmHg)" value={form.bloodPressure} onChange={(v) => setForm({ ...form, bloodPressure: v })} />
                    <VitalField icon={Activity} label="HR (bpm)" value={form.heartRate} onChange={(v) => setForm({ ...form, heartRate: v })} />
                    <VitalField icon={Gauge} label="O2 Sat (%)" value={form.oxygenSat} onChange={(v) => setForm({ ...form, oxygenSat: v })} />
                  </div>
                </Section>

                <Section title="Treatment" icon={Stethoscope}>
                  <div className="space-y-3">
                    <Field label="First-Aid Treatment Given *">
                      <textarea value={form.firstAidTreatment} onChange={(e) => setForm({ ...form, firstAidTreatment: e.target.value })} rows={3} className={inputCls} placeholder="First-aid treatment administered..." />
                    </Field>
                    <Field label="Treatment Notes">
                      <textarea value={form.treatmentProvided} onChange={(e) => setForm({ ...form, treatmentProvided: e.target.value })} rows={2} className={inputCls} placeholder="Additional treatment notes..." />
                    </Field>
                  </div>
                </Section>

                <MedicineSection form={form} setForm={setForm} inventory={inventory} onMedicineSelect={handleMedicineSelect} inputCls={inputCls} />

                <Section title="Referral & Disposition" icon={Share2}>
                  <div className="space-y-3">
                    <Field label="Referral Required?">
                      <select value={String(form.clinical.referralRequired ?? 'no')} onChange={(e) => setClinical('referralRequired', e.target.value)} className={inputCls}>
                        <option value="no">No referral needed</option>
                        <option value="hospital">Refer to hospital</option>
                        <option value="specialist">Refer to specialist</option>
                        <option value="clinic">Refer to external clinic</option>
                      </select>
                    </Field>
                    {form.clinical.referralRequired && form.clinical.referralRequired !== 'no' && (
                      <Field label="Referral Reason / Destination">
                        <input value={String(form.clinical.referralDestination ?? '')} onChange={(e) => setClinical('referralDestination', e.target.value)} className={inputCls} placeholder="e.g. Emergency room, Orthopedic specialist" />
                      </Field>
                    )}
                    <Field label="Disposition">
                      <select value={String(form.clinical.disposition ?? '')} onChange={(e) => setClinical('disposition', e.target.value)} className={inputCls}>
                        <option value="">— Select —</option>
                        <option value="sent_home">Sent home / Rest</option>
                        <option value="returned_class">Returned to class</option>
                        <option value="parent_called">Parent/guardian called</option>
                        <option value="referred">Referred out</option>
                        <option value="admitted">Admitted</option>
                      </select>
                    </Field>
                  </div>
                </Section>

                <Section title="Remarks" icon={Package}>
                  <Field label="Remarks"><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className={inputCls} placeholder="Additional remarks..." /></Field>
                </Section>
              </>
            )}

            {/* ===== PHYSICAL EXAM specific ===== */}
            {serviceType === 'physical' && (
              <PhysicalExamSheet form={form} setForm={setForm} selectedPatient={selectedPatient} currentUserName={currentUser?.name ?? ''} />
            )}

            {/* ===== MEDICINE ISSUANCE specific ===== */}
            {serviceType === 'medicine' && (
              <>
                <Section title="Patient Complaint" icon={Activity}>
                  <div className="space-y-3">
                    <Field label="Reason for Medicine Request *">
                      <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} rows={2} className={inputCls} placeholder="Patient's complaint or reason..." />
                    </Field>
                    <Field label="Symptoms">
                      <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={2} className={inputCls} placeholder="Associated symptoms..." />
                    </Field>
                  </div>
                </Section>

                <Section title="Medicine Issuance" icon={Pill}>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Select Medicine from Inventory *</label>
                      <select value={form.medicineId} onChange={(e) => {
                        const med = inventory.find((m) => m.id === e.target.value);
                        if (med) handleMedicineSelect(med);
                        else setForm({ ...form, medicineId: '', medicineName: '', unit: '' });
                      }} className={inputCls}>
                        <option value="">— Select medicine —</option>
                        {inventory.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit} in stock)</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Field label="Medicine Name"><input value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} className={inputCls} placeholder="Medicine name" /></Field>
                      <Field label="Dosage"><input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className={inputCls} placeholder="e.g. 500mg" /></Field>
                      <Field label="Quantity"><input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className={inputCls} /></Field>
                      <Field label="Unit"><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="e.g. tablets" /></Field>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Frequency">
                        <select value={String(form.clinical.frequency ?? '')} onChange={(e) => setClinical('frequency', e.target.value)} className={inputCls}>
                          <option value="">— Select —</option>
                          <option value="once">Once a day</option>
                          <option value="bid">Twice a day (BID)</option>
                          <option value="tid">Three times a day (TID)</option>
                          <option value="qid">Four times a day (QID)</option>
                          <option value="prn">As needed (PRN)</option>
                          <option value="q4h">Every 4 hours</option>
                          <option value="q6h">Every 6 hours</option>
                        </select>
                      </Field>
                      <Field label="Duration">
                        <select value={String(form.clinical.duration ?? '')} onChange={(e) => setClinical('duration', e.target.value)} className={inputCls}>
                          <option value="">— Select —</option>
                          <option value="1day">1 day</option>
                          <option value="3days">3 days</option>
                          <option value="5days">5 days</option>
                          <option value="7days">7 days</option>
                          <option value="10days">10 days</option>
                          <option value="14days">14 days</option>
                          <option value="30days">30 days</option>
                          <option value="ongoing">Ongoing</option>
                        </select>
                      </Field>
                      <Field label="Date / Time Issued">
                        <input type="datetime-local" value={String(form.clinical.issuedAt ?? '')} onChange={(e) => setClinical('issuedAt', e.target.value)} className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Instructions">
                      <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} className={inputCls} placeholder="Dosage instructions for patient..." />
                    </Field>
                    {form.medicineId && form.quantity > 0 && (() => {
                      const med = inventory.find((m) => m.id === form.medicineId);
                      if (!med) return null;
                      const newStock = med.quantity - form.quantity;
                      return (
                        <div className={`p-3 rounded-xl border text-sm ${newStock < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                          <p className="font-medium">Inventory Preview</p>
                          <p>Current stock: {med.quantity} {med.unit} → After issuing: {newStock} {med.unit}</p>
                          {newStock < 0 && <p className="text-xs mt-1">Warning: Insufficient stock!</p>}
                        </div>
                      );
                    })()}
                  </div>
                </Section>

                <Section title="Remarks" icon={Package}>
                  <Field label="Remarks"><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className={inputCls} placeholder="Additional remarks..." /></Field>
                </Section>
              </>
            )}

            {/* ===== MEDICAL (generic) ===== */}
            {serviceType === 'medical' && (
              <>
                <Section title="Chief Complaint & Symptoms" icon={Activity}>
                  <div className="space-y-3">
                    <Field label="Chief Complaint *">
                      <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} rows={2} className={inputCls} placeholder="Patient's main complaint..." />
                    </Field>
                    <Field label="Symptoms">
                      <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={2} className={inputCls} placeholder="Associated symptoms..." />
                    </Field>
                  </div>
                </Section>

                <Section title="Vital Signs" icon={Thermometer}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <VitalField icon={Thermometer} label="Temp (°C)" value={form.temperature} onChange={(v) => setForm({ ...form, temperature: v })} />
                    <VitalField icon={Droplet} label="BP (mmHg)" value={form.bloodPressure} onChange={(v) => setForm({ ...form, bloodPressure: v })} />
                    <VitalField icon={Activity} label="HR (bpm)" value={form.heartRate} onChange={(v) => setForm({ ...form, heartRate: v })} />
                    <VitalField icon={Wind} label="RR (bpm)" value={form.respiratoryRate} onChange={(v) => setForm({ ...form, respiratoryRate: v })} />
                    <VitalField icon={Weight} label="Weight (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} />
                    <VitalField icon={Ruler} label="Height (cm)" value={form.height} onChange={(v) => setForm({ ...form, height: v })} />
                    <VitalField icon={Gauge} label="O2 Sat (%)" value={form.oxygenSat} onChange={(v) => setForm({ ...form, oxygenSat: v })} />
                  </div>
                </Section>

                <Section title="Assessment & Treatment" icon={Stethoscope}>
                  <div className="space-y-3">
                    <Field label="Assessment / Diagnosis">
                      <textarea value={form.assessment} onChange={(e) => setForm({ ...form, assessment: e.target.value })} rows={2} className={inputCls} placeholder="Clinical assessment..." />
                    </Field>
                    <Field label="Diagnosis">
                      <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className={inputCls} placeholder="Working diagnosis..." />
                    </Field>
                    <Field label="Treatment Provided">
                      <textarea value={form.treatmentProvided} onChange={(e) => setForm({ ...form, treatmentProvided: e.target.value })} rows={2} className={inputCls} placeholder="Treatment given..." />
                    </Field>
                  </div>
                </Section>

                <MedicineSection form={form} setForm={setForm} inventory={inventory} onMedicineSelect={handleMedicineSelect} inputCls={inputCls} />

                <Section title="Remarks" icon={Package}>
                  <Field label="Remarks"><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className={inputCls} placeholder="Additional remarks..." /></Field>
                </Section>
              </>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.patientId || !form.chiefComplaint.trim()} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white rounded-xl transition-colors">{editVisit ? 'Save Changes' : 'Submit'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ===== Shared sub-components =====

function MedicineSection({ form, setForm, inventory, onMedicineSelect, inputCls }: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  inventory: Medicine[];
  onMedicineSelect: (m: Medicine) => void;
  inputCls: string;
}) {
  return (
    <Section title="Medicine Given" icon={Pill}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Select from Inventory (optional)</label>
          <select value={form.medicineId} onChange={(e) => {
            const med = inventory.find((m) => m.id === e.target.value);
            if (med) onMedicineSelect(med);
            else setForm({ ...form, medicineId: '', medicineName: '', unit: '' });
          }} className={inputCls}>
            <option value="">— None / Manual entry —</option>
            {inventory.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit} in stock)</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Medicine Name"><input value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} className={inputCls} placeholder="Medicine name" /></Field>
          <Field label="Dosage"><input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className={inputCls} placeholder="e.g. 500mg" /></Field>
          <Field label="Quantity"><input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className={inputCls} /></Field>
          <Field label="Unit"><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="e.g. tablets" /></Field>
        </div>
        <Field label="Instructions"><textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} className={inputCls} placeholder="Dosage instructions for patient..." /></Field>
      </div>
    </Section>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-center gap-2 mb-3"><Icon size={15} className="text-teal-500" /><h3 className="text-sm font-semibold text-slate-700">{title}</h3></div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>{children}</div>);
}

function VitalField({ icon: Icon, label, value, onChange }: { icon: React.ElementType; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
    </div>
  );
}
