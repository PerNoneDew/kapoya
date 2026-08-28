import { type Dispatch, type SetStateAction } from 'react';
import { HeartPulse } from 'lucide-react';
import type { User } from '../../types';
import type { FormState } from './PatientVisitForm';

interface PhysicalExamSheetProps {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  selectedPatient: User;
  currentUserName: string;
}

const clinicalRows = [
  ['eyes', 'Eyes (Vision)'],
  ['ears_nose_throat', 'Ears, Nose, Throat'],
  ['mouth_teeth', 'Mouth & Teeth'],
  ['neck_lymph_nodes', 'Neck/Lymph Nodes'],
  ['cardiovascular_heart', 'Cardiovascular/Heart'],
  ['abdomen', 'Abdomen'],
  ['chest_lungs', 'Chest & Lungs'],
  ['skin', 'Skin'],
  ['genitalia_hernia', 'Genitalia/Hernia (Male)'],
  ['breast', 'Breast'],
] as const;

const musculoskeletalRows = [
  ['neck', 'Neck'],
  ['spine_back', 'Spine/Back'],
  ['shoulders_arm', 'Shoulders/Arm'],
  ['elbow_forearm', 'Elbow/Forearm'],
  ['wrist_hand', 'Wrist/Hand'],
  ['hip_thighs', 'Hip/Thighs'],
  ['knee', 'Knee'],
  ['leg_ankles', 'Leg/Ankles'],
] as const;

function displayName(user: User): { first: string; middle: string; last: string } {
  const pieces = user.name.replace(/^Prof\.\s+/i, '').trim().split(/\s+/);
  return {
    first: user.firstName ?? pieces[0] ?? '',
    middle: user.middleName ?? '',
    last: user.lastName ?? pieces.slice(1).join(' '),
  };
}

function fieldValue(form: FormState, key: string, fallback = ''): string {
  return String(form.clinical[key] ?? fallback);
}

function SheetInput({ value, onChange, type = 'text', className = '' }: { value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`physical-sheet-input ${className}`} />;
}

function SheetLabel({ children }: { children: React.ReactNode }) {
  return <label className="physical-sheet-label">{children}</label>;
}

function ExamTable({ title, rows, form, setForm }: { title: string; rows: readonly (readonly [string, string])[]; form: FormState; setForm: Dispatch<SetStateAction<FormState>> }) {
  const setClinical = (key: string, value: string) => setForm((previous) => ({ ...previous, clinical: { ...previous.clinical, [key]: value } }));
  return (
    <div className="physical-table-wrap">
      <div className="physical-table-heading">
        <span>{title}</span><span>NORMAL</span><span>ABNORMAL FINDINGS</span><span>INITIALS</span>
      </div>
      {rows.map(([key, label], index) => (
        <div className="physical-table-row" key={key}>
          <span className="physical-table-label">{index + 1}. {label}</span>
          <input aria-label={`${label} normal`} type="checkbox" checked={form.clinical[`normal_${key}`] === 'yes'} onChange={(event) => setClinical(`normal_${key}`, event.target.checked ? 'yes' : '')} />
          <SheetInput value={fieldValue(form, `abnormal_${key}`)} onChange={(value) => setClinical(`abnormal_${key}`, value)} />
          <SheetInput value={fieldValue(form, `initials_${key}`)} onChange={(value) => setClinical(`initials_${key}`, value)} />
        </div>
      ))}
    </div>
  );
}

export default function PhysicalExamSheet({ form, setForm, selectedPatient, currentUserName }: PhysicalExamSheetProps) {
  const names = displayName(selectedPatient);
  const setClinical = (key: string, value: string | boolean) => setForm((previous) => ({ ...previous, clinical: { ...previous.clinical, [key]: value } }));
  const get = (key: string, fallback = '') => fieldValue(form, key, fallback);

  return (
    <div className="physical-sheet">
      <header className="physical-sheet-header">
        <img src="/logo.png" alt="Saint Francis College" />
        <p>SAINT FRANCIS COLLEGE-GUIHULNGAN NEGROS ORIENTAL, INCORPORATED<br /><span>Guihulngan City, Negros Oriental, Philippines 6214</span></p>
        <h2>PHYSICAL EXAMINATION</h2>
      </header>

      <div className="physical-grid physical-grid-4">
        <div><SheetLabel>First Name</SheetLabel><SheetInput value={get('firstName', names.first)} onChange={(value) => setClinical('firstName', value)} /></div>
        <div><SheetLabel>Middle Name</SheetLabel><SheetInput value={get('middleName', names.middle)} onChange={(value) => setClinical('middleName', value)} /></div>
        <div><SheetLabel>Last Name</SheetLabel><SheetInput value={get('lastName', names.last)} onChange={(value) => setClinical('lastName', value)} /></div>
        <div><SheetLabel>Date of Birth</SheetLabel><SheetInput type="date" value={get('dateOfBirth', selectedPatient.dateOfBirth)} onChange={(value) => setClinical('dateOfBirth', value)} /></div>
      </div>
      <div className="physical-grid physical-grid-5 physical-info-row">
        <div><SheetLabel>Gender</SheetLabel><div className="physical-choice-group"><label><input type="radio" name="physical-gender" checked={get('gender') === 'Male'} onChange={() => setClinical('gender', 'Male')} /> Male</label><label><input type="radio" name="physical-gender" checked={get('gender') === 'Female'} onChange={() => setClinical('gender', 'Female')} /> Female</label></div></div>
        <div><SheetLabel>Age</SheetLabel><SheetInput value={get('age')} onChange={(value) => setClinical('age', value)} /></div>
        <div className="physical-wide-field"><SheetLabel>Grade / Year / Course / Designation</SheetLabel><SheetInput value={get('gradeYearCourse', selectedPatient.gradeYearLevel ?? selectedPatient.programCourse ?? selectedPatient.position ?? '')} onChange={(value) => setClinical('gradeYearCourse', value)} /></div>
        <div><SheetLabel>Height</SheetLabel><SheetInput value={form.height} onChange={(value) => setForm((previous) => ({ ...previous, height: value }))} /></div>
        <div><SheetLabel>Weight</SheetLabel><SheetInput value={form.weight} onChange={(value) => setForm((previous) => ({ ...previous, weight: value }))} /></div>
      </div>

      <div className="physical-vitals">
        <span className="physical-vitals-title">Vital Signs:</span>
        <div><SheetLabel>Blood Pressure</SheetLabel><SheetInput value={form.bloodPressure} onChange={(value) => setForm((previous) => ({ ...previous, bloodPressure: value }))} /></div>
        <div><SheetLabel>Pulse Rate</SheetLabel><SheetInput value={form.heartRate} onChange={(value) => setForm((previous) => ({ ...previous, heartRate: value }))} /></div>
        <div><SheetLabel>Respiratory Rate</SheetLabel><SheetInput value={form.respiratoryRate} onChange={(value) => setForm((previous) => ({ ...previous, respiratoryRate: value }))} /></div>
        <div><SheetLabel>O2 SAT</SheetLabel><SheetInput value={form.oxygenSat} onChange={(value) => setForm((previous) => ({ ...previous, oxygenSat: value }))} /></div>
        <div><SheetLabel>Temperature</SheetLabel><SheetInput value={form.temperature} onChange={(value) => setForm((previous) => ({ ...previous, temperature: value }))} /></div>
      </div>

      <ExamTable title="MEDICAL" rows={clinicalRows} form={form} setForm={setForm} />
      <ExamTable title="MUSCULOSKELETAL: ROM" rows={musculoskeletalRows} form={form} setForm={setForm} />

      <div className="physical-clearance">
        <div className="physical-clearance-line" />
        <label><input type="radio" name="physical-clearance" checked={get('clearanceStatus') === 'cleared'} onChange={() => setClinical('clearanceStatus', 'cleared')} /> Cleared without restriction</label>
        <label><input type="radio" name="physical-clearance" checked={get('clearanceStatus') === 'cleared_with_restriction'} onChange={() => setClinical('clearanceStatus', 'cleared_with_restriction')} /> Cleared with recommendations for further evaluation or treatment for:</label>
        {get('clearanceStatus') === 'cleared_with_restriction' && <SheetInput value={get('restrictionDetails')} onChange={(value) => setClinical('restrictionDetails', value)} />}
        <div className="physical-activity-row"><label><input type="radio" name="physical-clearance" checked={get('clearanceStatus') === 'not_cleared_all'} onChange={() => setClinical('clearanceStatus', 'not_cleared_all')} /> Not Cleared: All school activities/sports</label><label><input type="radio" name="physical-clearance" checked={get('clearanceStatus') === 'not_cleared_certain'} onChange={() => setClinical('clearanceStatus', 'not_cleared_certain')} /> Certain Activities/Sports:</label><SheetInput value={get('activityRestrictions')} onChange={(value) => setClinical('activityRestrictions', value)} /></div>
      </div>

      <div className="physical-notes">
        <SheetLabel>Remarks:</SheetLabel>
        <textarea value={form.remarks} onChange={(event) => setForm((previous) => ({ ...previous, remarks: event.target.value }))} rows={3} />
      </div>
      <div className="physical-signatures">
        <div><SheetLabel>Physician's Signature:</SheetLabel><SheetInput value={get('physicianName', currentUserName)} onChange={(value) => setClinical('physicianName', value)} /></div>
        <div><SheetLabel>Date:</SheetLabel><SheetInput type="date" value={get('examDate')} onChange={(value) => setClinical('examDate', value)} /></div>
      </div>
      <p className="physical-sheet-note"><HeartPulse size={14} /> Complete each applicable field before saving the examination.</p>
    </div>
  );
}