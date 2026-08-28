import { supabase } from './supabase';
import type {
  User, HealthRecord, Request, Medicine, Expense, Notification, AuditLog, BackupRecord, MedicineDispensing, DataSnapshot, HealthFormRequest, HealthFormData,
  PatientVisit, Referral, FollowUp, Appointment,
  MedicalSupply, StockTransaction, Supplier, Purchase,
  SchoolSettings,
} from '../types';

// ---------- Users ----------
type UserRow = {
  id: string; name: string; email: string; role: string; department: string | null;
  student_id: string | null; employee_id: string | null; faculty_id: string | null;
  admin_id: string | null; status: string; created_at: string; password: string;
  last_name: string | null; first_name: string | null; middle_name: string | null; suffix: string | null;
  sex: string | null; date_of_birth: string | null;
  grade_year_level: string | null; section: string | null; program_course: string | null; school_year: string | null;
  contact_number: string | null; address: string | null;
  parent_guardian: string | null; parent_guardian_contact: string | null;
  position: string | null; employment_type: string | null; emergency_contact: string | null; date_hired: string | null;
  profile_image: string | null;
};

const userToRow = (u: User, password = ''): UserRow => ({
  id: u.id, name: u.name, email: u.email, role: u.role, department: u.department ?? null,
  student_id: u.studentId ?? null, employee_id: u.employeeId ?? null, faculty_id: u.facultyId ?? null,
  admin_id: u.adminId ?? null, status: u.status, created_at: u.createdAt, password,
  last_name: u.lastName ?? null, first_name: u.firstName ?? null, middle_name: u.middleName ?? null, suffix: u.suffix ?? null,
  sex: u.sex ?? null, date_of_birth: u.dateOfBirth ?? null,
  grade_year_level: u.gradeYearLevel ?? null, section: u.section ?? null, program_course: u.programCourse ?? null, school_year: u.schoolYear ?? null,
  contact_number: u.contactNumber ?? null, address: u.address ?? null,
  parent_guardian: u.parentGuardian ?? null, parent_guardian_contact: u.parentGuardianContact ?? null,
  position: u.position ?? null, employment_type: u.employmentType ?? null, emergency_contact: u.emergencyContact ?? null, date_hired: u.dateHired ?? null,
  profile_image: u.profileImage ?? null,
});
const rowToUser = (r: UserRow): User & { password?: string } => ({
  id: r.id, name: r.name, email: r.email, role: r.role as User['role'], department: r.department ?? undefined,
  studentId: r.student_id ?? undefined, employeeId: r.employee_id ?? undefined, facultyId: r.faculty_id ?? undefined,
  adminId: r.admin_id ?? undefined, status: r.status as User['status'], createdAt: r.created_at,
  lastName: r.last_name ?? undefined, firstName: r.first_name ?? undefined, middleName: r.middle_name ?? undefined, suffix: r.suffix ?? undefined,
  sex: r.sex ?? undefined, dateOfBirth: r.date_of_birth ?? undefined,
  gradeYearLevel: r.grade_year_level ?? undefined, section: r.section ?? undefined, programCourse: r.program_course ?? undefined, schoolYear: r.school_year ?? undefined,
  contactNumber: r.contact_number ?? undefined, address: r.address ?? undefined,
  parentGuardian: r.parent_guardian ?? undefined, parentGuardianContact: r.parent_guardian_contact ?? undefined,
  position: r.position ?? undefined, employmentType: r.employment_type ?? undefined, emergencyContact: r.emergency_contact ?? undefined, dateHired: r.date_hired ?? undefined,
  profileImage: r.profile_image ?? undefined,
  password: r.password,
});

export async function fetchUsers(): Promise<{ users: User[]; credentials: Record<string, string> }> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  const rows = (data ?? []) as UserRow[];
  const users: User[] = rows.map((r) => {
    const { password: _pw, ...u } = rowToUser(r);
    return u;
  });
  const credentials: Record<string, string> = {};
  rows.forEach((r) => { if (r.password) credentials[r.email.trim().toLowerCase()] = r.password; });
  return { users, credentials };
}

export async function upsertUser(u: User, password?: string): Promise<void> {
  const existing = await supabase.from('users').select('password').eq('id', u.id).maybeSingle();
  const pw = password ?? existing.data?.password ?? '';
  const { error } = await supabase.from('users').upsert(userToRow(u, pw));
  if (error) throw error;
}

export async function upsertUsers(users: User[], credentials: Record<string, string>): Promise<void> {
  const rows = users.map((u) => userToRow(u, credentials[u.email.trim().toLowerCase()] ?? ''));
  const { error } = await supabase.from('users').upsert(rows);
  if (error) throw error;
}

export async function deleteUserRow(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Health Records ----------
type HealthRecordRow = {
  id: string; user_id: string; user_name: string; user_role: string | null; department: string | null;
  student_id: string | null; employee_id: string | null; faculty_id: string | null; admin_id: string | null;
  allergies: string[]; conditions: string[]; medications: string[];
  height: string | null; weight: string | null; bmi: string | null; vision: string | null; dental_status: string | null;
  last_checkup: string | null; next_checkup: string | null; emergency_contact: string | null; emergency_phone: string | null;
  notes: string | null; created_at: string; updated_at: string; archived: boolean;
  forward_status: string; forwarded_to: string | null; forward_reason: string | null; forwarded_by: string | null; forwarded_at: string | null;
};

const hrToRow = (r: HealthRecord): HealthRecordRow => ({
  id: r.id, user_id: r.userId, user_name: r.userName, user_role: r.userRole ?? null, department: r.department ?? null,
  student_id: r.studentId ?? null, employee_id: r.employeeId ?? null, faculty_id: r.facultyId ?? null,
  admin_id: r.adminId ?? null,
  allergies: r.allergies, conditions: r.conditions, medications: r.medications,
  height: r.height ?? null, weight: r.weight ?? null, bmi: r.bmi ?? null, vision: r.vision ?? null, dental_status: r.dentalStatus ?? null,
  last_checkup: r.lastCheckup ?? null, next_checkup: r.nextCheckup ?? null,
  emergency_contact: r.emergencyContact ?? null, emergency_phone: r.emergencyPhone ?? null, notes: r.notes ?? null,
  created_at: r.createdAt, updated_at: r.updatedAt, archived: r.archived ?? false,
  forward_status: r.forwardStatus ?? 'active', forwarded_to: r.forwardedTo ?? null,
  forward_reason: r.forwardReason ?? null, forwarded_by: r.forwardedBy ?? null, forwarded_at: r.forwardedAt ?? null,
});
const rowToHr = (r: HealthRecordRow): HealthRecord => ({
  id: r.id, userId: r.user_id, userName: r.user_name, userRole: (r.user_role ?? undefined) as HealthRecord['userRole'], department: r.department ?? undefined,
  studentId: r.student_id ?? undefined, employeeId: r.employee_id ?? undefined, facultyId: r.faculty_id ?? undefined,
  adminId: r.admin_id ?? undefined,
  allergies: r.allergies ?? [], conditions: r.conditions ?? [], medications: r.medications ?? [],
  height: r.height ?? '', weight: r.weight ?? '', bmi: r.bmi ?? undefined, vision: r.vision ?? undefined, dentalStatus: r.dental_status ?? undefined,
  lastCheckup: r.last_checkup ?? '', nextCheckup: r.next_checkup ?? undefined,
  emergencyContact: r.emergency_contact ?? undefined, emergencyPhone: r.emergency_phone ?? undefined, notes: r.notes ?? '',
  createdAt: r.created_at, updatedAt: r.updated_at, archived: r.archived,
  forwardStatus: (r.forward_status ?? 'active') as HealthRecord['forwardStatus'],
  forwardedTo: r.forwarded_to ?? undefined, forwardReason: r.forward_reason ?? undefined,
  forwardedBy: r.forwarded_by ?? undefined, forwardedAt: r.forwarded_at ?? undefined,
});

export async function fetchHealthRecords(): Promise<HealthRecord[]> {
  const { data, error } = await supabase.from('health_records').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToHr);
}
export async function upsertHealthRecord(r: HealthRecord): Promise<void> {
  const { error } = await supabase.from('health_records').upsert(hrToRow(r));
  if (error) throw error;
}
export async function upsertHealthRecords(records: HealthRecord[]): Promise<void> {
  const { error } = await supabase.from('health_records').upsert(records.map(hrToRow));
  if (error) throw error;
}

// ---------- Medicine Dispensing ----------
type DispensingRow = {
  id: string; medicine_id: string; medicine_name: string; patient_id: string; patient_name: string;
  patient_role: string | null; quantity: number; unit: string; dispensed_by: string; dispensed_at: string; reason: string;
};
const dispToRow = (d: MedicineDispensing): DispensingRow => ({
  id: d.id, medicine_id: d.medicineId, medicine_name: d.medicineName, patient_id: d.patientId, patient_name: d.patientName,
  patient_role: d.patientRole ?? null, quantity: d.quantity, unit: d.unit, dispensed_by: d.dispensedBy, dispensed_at: d.dispensedAt, reason: d.reason,
});
const rowToDisp = (r: DispensingRow): MedicineDispensing => ({
  id: r.id, medicineId: r.medicine_id, medicineName: r.medicine_name, patientId: r.patient_id, patientName: r.patient_name,
  patientRole: r.patient_role as MedicineDispensing['patientRole'] ?? undefined, quantity: r.quantity, unit: r.unit,
  dispensedBy: r.dispensed_by, dispensedAt: r.dispensed_at, reason: r.reason,
});

export async function fetchDispensing(): Promise<MedicineDispensing[]> {
  const { data, error } = await supabase.from('medicine_dispensing').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToDisp);
}
export async function upsertDispensing(d: MedicineDispensing): Promise<void> {
  const { error } = await supabase.from('medicine_dispensing').upsert(dispToRow(d));
  if (error) throw error;
}
export async function upsertDispensingAll(items: MedicineDispensing[]): Promise<void> {
  const { error } = await supabase.from('medicine_dispensing').upsert(items.map(dispToRow));
  if (error) throw error;
}

// ---------- Requests ----------
type RequestRow = {
  id: string; user_id: string; user_name: string; user_role: string | null; type: string; description: string; status: string;
  attachments: string[]; submitted_at: string; updated_at: string; reviewed_by: string | null; review_notes: string | null;
  remarks: string | null; forwarded_by: string | null; forwarded_to: string | null; forward_reason: string | null; forwarded_at: string | null;
};
const reqToRow = (r: Request): RequestRow => ({
  id: r.id, user_id: r.userId, user_name: r.userName, user_role: r.userRole ?? null, type: r.type, description: r.description, status: r.status,
  attachments: r.attachments, submitted_at: r.submittedAt, updated_at: r.updatedAt, reviewed_by: r.reviewedBy ?? null,
  review_notes: r.reviewNotes ?? null, remarks: r.remarks ?? null, forwarded_by: r.forwardedBy ?? null,
  forwarded_to: r.forwardedTo ?? null, forward_reason: r.forwardReason ?? null, forwarded_at: r.forwardedAt ?? null,
});
const rowToReq = (r: RequestRow): Request => ({
  id: r.id, userId: r.user_id, userName: r.user_name, userRole: r.user_role as Request['userRole'] ?? undefined, type: r.type as Request['type'],
  description: r.description, status: r.status as Request['status'], attachments: r.attachments ?? [],
  submittedAt: r.submitted_at, updatedAt: r.updated_at, reviewedBy: r.reviewed_by ?? undefined, reviewNotes: r.review_notes ?? undefined,
  remarks: r.remarks ?? undefined, forwardedBy: r.forwarded_by ?? undefined, forwardedTo: r.forwarded_to ?? undefined, forwardReason: r.forward_reason ?? undefined, forwardedAt: r.forwarded_at ?? undefined,
});

export async function fetchRequests(): Promise<Request[]> {
  const { data, error } = await supabase.from('requests').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToReq);
}
export async function upsertRequest(r: Request): Promise<void> {
  const { error } = await supabase.from('requests').upsert(reqToRow(r));
  if (error) throw error;
}
export async function upsertRequestsAll(items: Request[]): Promise<void> {
  const { error } = await supabase.from('requests').upsert(items.map(reqToRow));
  if (error) throw error;
}

// ---------- Medicines ----------
type MedicineRow = {
  id: string; name: string; generic_name: string | null; brand_name: string | null; dosage_form: string | null;
  category: string; quantity: number; unit: string; min_stock: number; batch_lot_number: string | null;
  expiry_date: string; supplier: string; storage_location: string | null; last_updated: string; primary_key_date: string | null;
};
const medToRow = (m: Medicine): MedicineRow => ({
  id: m.id, name: m.name, generic_name: m.genericName ?? null, brand_name: m.brandName ?? null, dosage_form: m.dosageForm ?? null,
  category: m.category, quantity: m.quantity, unit: m.unit, min_stock: m.minStock, batch_lot_number: m.batchLotNumber ?? null,
  expiry_date: m.expiryDate, supplier: m.supplier, storage_location: m.storageLocation ?? null, last_updated: m.lastUpdated, primary_key_date: m.primaryKeyDate ?? null,
});
const rowToMed = (r: MedicineRow): Medicine => ({
  id: r.id, name: r.name, genericName: r.generic_name ?? undefined, brandName: r.brand_name ?? undefined, dosageForm: r.dosage_form ?? undefined,
  category: r.category, quantity: r.quantity, unit: r.unit, minStock: r.min_stock, batchLotNumber: r.batch_lot_number ?? undefined,
  expiryDate: r.expiry_date, supplier: r.supplier, storageLocation: r.storage_location ?? undefined, lastUpdated: r.last_updated, primaryKeyDate: r.primary_key_date ?? undefined,
});

export async function fetchMedicines(): Promise<Medicine[]> {
  const { data, error } = await supabase.from('medicines').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToMed);
}
export async function upsertMedicine(m: Medicine): Promise<void> {
  const { error } = await supabase.from('medicines').upsert(medToRow(m));
  if (error) throw error;
}
export async function upsertMedicinesAll(items: Medicine[]): Promise<void> {
  const { error } = await supabase.from('medicines').upsert(items.map(medToRow));
  if (error) throw error;
}
export async function deleteMedicineRow(id: string): Promise<void> {
  const { error } = await supabase.from('medicines').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Expenses ----------
type ExpenseRow = {
  id: string; description: string; amount: number; category: string; date: string; recorded_by: string;
  receipt_no: string; status: string; reviewed_by: string | null; review_notes: string | null; liquidated_at: string | null;
  source_purchase_id: string | null;
};
const expToRow = (e: Expense): ExpenseRow => ({
  id: e.id, description: e.description, amount: e.amount, category: e.category, date: e.date, recorded_by: e.recordedBy,
  receipt_no: e.receiptNo, status: e.status, reviewed_by: e.reviewedBy ?? null, review_notes: e.reviewNotes ?? null, liquidated_at: e.liquidatedAt ?? null,
  source_purchase_id: e.sourcePurchaseId ?? null,
});
const rowToExp = (r: ExpenseRow): Expense => ({
  id: r.id, description: r.description, amount: Number(r.amount), category: r.category as Expense['category'], date: r.date,
  recordedBy: r.recorded_by, receiptNo: r.receipt_no, status: r.status as Expense['status'], reviewedBy: r.reviewed_by ?? undefined,
  reviewNotes: r.review_notes ?? undefined, liquidatedAt: r.liquidated_at ?? undefined, sourcePurchaseId: r.source_purchase_id ?? undefined,
});

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToExp);
}
export async function upsertExpense(e: Expense): Promise<void> {
  const { error } = await supabase.from('expenses').upsert(expToRow(e));
  if (error) throw error;
}
export async function upsertExpensesAll(items: Expense[]): Promise<void> {
  const { error } = await supabase.from('expenses').upsert(items.map(expToRow));
  if (error) throw error;
}

// ---------- Notifications ----------
type NotifRow = {
  id: string; title: string; message: string; recipient_roles: string[]; recipient_ids: string[] | null;
  sent_by: string; sent_at: string; type: string; read: boolean;
};
const notifToRow = (n: Notification): NotifRow => ({
  id: n.id, title: n.title, message: n.message, recipient_roles: n.recipientRoles, recipient_ids: n.recipientIds ?? null,
  sent_by: n.sentBy, sent_at: n.sentAt, type: n.type, read: n.read,
});
const rowToNotif = (r: NotifRow): Notification => ({
  id: r.id, title: r.title, message: r.message, recipientRoles: (r.recipient_roles ?? []) as Notification['recipientRoles'], recipientIds: r.recipient_ids ?? undefined,
  sentBy: r.sent_by, sentAt: r.sent_at, type: r.type as Notification['type'], read: r.read,
});

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from('notifications').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToNotif);
}
export async function upsertNotification(n: Notification): Promise<void> {
  const { error } = await supabase.from('notifications').upsert(notifToRow(n));
  if (error) throw error;
}
export async function upsertNotificationsAll(items: Notification[]): Promise<void> {
  const { error } = await supabase.from('notifications').upsert(items.map(notifToRow));
  if (error) throw error;
}
export async function deleteNotificationRow(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Audit Logs ----------
type AuditRow = {
  id: string; user_id: string; user_name: string; action: string; module: string; details: string;
  ip_address: string; timestamp: string; type: string;
};
const auditToRow = (a: AuditLog): AuditRow => ({
  id: a.id, user_id: a.userId, user_name: a.userName, action: a.action, module: a.module, details: a.details,
  ip_address: a.ipAddress, timestamp: a.timestamp, type: a.type,
});
const rowToAudit = (r: AuditRow): AuditLog => ({
  id: r.id, userId: r.user_id, userName: r.user_name, action: r.action, module: r.module, details: r.details,
  ipAddress: r.ip_address, timestamp: r.timestamp, type: r.type as AuditLog['type'],
});

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from('audit_logs').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToAudit);
}
export async function upsertAuditLogsAll(items: AuditLog[]): Promise<void> {
  const { error } = await supabase.from('audit_logs').upsert(items.map(auditToRow));
  if (error) throw error;
}

// ---------- Backup Records ----------
type BackupRow = {
  id: string; filename: string; size: string; created_at: string; created_by: string; status: string; type: string;
};
const backupToRow = (b: BackupRecord): BackupRow => ({
  id: b.id, filename: b.filename, size: b.size, created_at: b.createdAt, created_by: b.createdBy, status: b.status, type: b.type,
});
const rowToBackup = (r: BackupRow): BackupRecord => ({
  id: r.id, filename: r.filename, size: r.size, createdAt: r.created_at, createdBy: r.created_by, status: r.status as BackupRecord['status'], type: r.type as BackupRecord['type'],
});

export async function fetchBackupRecords(): Promise<BackupRecord[]> {
  const { data, error } = await supabase.from('backup_records').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToBackup);
}
export async function upsertBackupRecord(b: BackupRecord): Promise<void> {
  const { error } = await supabase.from('backup_records').upsert(backupToRow(b));
  if (error) throw error;
}
export async function upsertBackupRecordsAll(items: BackupRecord[]): Promise<void> {
  const { error } = await supabase.from('backup_records').upsert(items.map(backupToRow));
  if (error) throw error;
}

// ---------- Snapshots ----------
type SnapshotRow = { id: string; name: string; type: string; created_at: string; data: DataSnapshot['data'] };

export async function fetchSnapshots(): Promise<DataSnapshot[]> {
  const { data, error } = await supabase.from('snapshots').select('*');
  if (error) throw error;
  return ((data ?? []) as SnapshotRow[]).map((r) => ({
    id: r.id, name: r.name, type: r.type as DataSnapshot['type'], createdAt: r.created_at, data: r.data,
  }));
}

export async function upsertSnapshot(s: DataSnapshot): Promise<void> {
  const row = { id: s.id, name: s.name, type: s.type, created_at: s.createdAt, data: s.data };
  const { error } = await supabase.from('snapshots').upsert(row);
  if (error) throw error;
}

export async function deleteSnapshotRow(id: string): Promise<void> {
  const { error } = await supabase.from('snapshots').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Health Form Requests ----------
type HealthFormRow = {
  id: string; user_id: string; user_name: string; user_role: string | null; department: string | null;
  form_data: HealthFormData; status: string; submitted_at: string; updated_at: string;
  reviewed_by: string | null; review_notes: string | null;
};

const hfToRow = (r: HealthFormRequest): HealthFormRow => ({
  id: r.id, user_id: r.userId, user_name: r.userName, user_role: r.userRole ?? null, department: r.department ?? null,
  form_data: r.formData, status: r.status, submitted_at: r.submittedAt, updated_at: r.updatedAt,
  reviewed_by: r.reviewedBy ?? null, review_notes: r.reviewNotes ?? null,
});
const rowToHf = (r: HealthFormRow): HealthFormRequest => ({
  id: r.id, userId: r.user_id, userName: r.user_name, userRole: (r.user_role ?? undefined) as HealthFormRequest['userRole'],
  department: r.department ?? undefined, formData: r.form_data, status: r.status as HealthFormRequest['status'],
  submittedAt: r.submitted_at, updatedAt: r.updated_at, reviewedBy: r.reviewed_by ?? undefined, reviewNotes: r.review_notes ?? undefined,
});

export async function fetchHealthFormRequests(): Promise<HealthFormRequest[]> {
  const { data, error } = await supabase.from('health_form_requests').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToHf);
}
export async function upsertHealthFormRequest(r: HealthFormRequest): Promise<void> {
  const { error } = await supabase.from('health_form_requests').upsert(hfToRow(r));
  if (error) throw error;
}
export async function upsertHealthFormRequestsAll(items: HealthFormRequest[]): Promise<void> {
  const { error } = await supabase.from('health_form_requests').upsert(items.map(hfToRow));
  if (error) throw error;
}
export async function deleteHealthFormRequestRow(id: string): Promise<void> {
  const { error } = await supabase.from('health_form_requests').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Patient Visits ----------
type VisitRow = {
  id: string; patient_id: string; patient_name: string; patient_role: string | null; department: string | null;
  service_type: string; visit_date: string; chief_complaint: string; symptoms: string;
  temperature: string | null; blood_pressure: string | null; heart_rate: string | null; respiratory_rate: string | null;
  weight: string | null; height: string | null; oxygen_sat: string | null;
  assessment: string; diagnosis: string; treatment_provided: string; first_aid_treatment: string;
  medicine_name: string; medicine_id: string | null; dosage: string; quantity: number; unit: string; instructions: string;
  remarks: string; recorded_by: string; status: string; created_at: string; updated_at: string;
  clinical_data: Record<string, string | number | boolean | string[]> | null;
};

const visitToRow = (v: PatientVisit): VisitRow => ({
  id: v.id, patient_id: v.patientId, patient_name: v.patientName, patient_role: v.patientRole ?? null, department: v.department ?? null,
  service_type: v.serviceType, visit_date: v.visitDate, chief_complaint: v.chiefComplaint, symptoms: v.symptoms,
  temperature: v.temperature ?? null, blood_pressure: v.bloodPressure ?? null, heart_rate: v.heartRate ?? null, respiratory_rate: v.respiratoryRate ?? null,
  weight: v.weight ?? null, height: v.height ?? null, oxygen_sat: v.oxygenSat ?? null,
  assessment: v.assessment, diagnosis: v.diagnosis, treatment_provided: v.treatmentProvided, first_aid_treatment: v.firstAidTreatment,
  medicine_name: v.medicineName, medicine_id: v.medicineId ?? null, dosage: v.dosage, quantity: v.quantity, unit: v.unit, instructions: v.instructions,
  remarks: v.remarks, recorded_by: v.recordedBy, status: v.status, created_at: v.createdAt, updated_at: v.updatedAt,
  clinical_data: v.clinicalData ?? null,
});
const rowToVisit = (r: VisitRow): PatientVisit => ({
  id: r.id, patientId: r.patient_id, patientName: r.patient_name, patientRole: (r.patient_role ?? undefined) as PatientVisit['patientRole'], department: r.department ?? undefined,
  serviceType: r.service_type as PatientVisit['serviceType'], visitDate: r.visit_date, chiefComplaint: r.chief_complaint, symptoms: r.symptoms,
  temperature: r.temperature ?? undefined, bloodPressure: r.blood_pressure ?? undefined, heartRate: r.heart_rate ?? undefined, respiratoryRate: r.respiratory_rate ?? undefined,
  weight: r.weight ?? undefined, height: r.height ?? undefined, oxygenSat: r.oxygen_sat ?? undefined,
  assessment: r.assessment, diagnosis: r.diagnosis, treatmentProvided: r.treatment_provided, firstAidTreatment: r.first_aid_treatment,
  medicineName: r.medicine_name, medicineId: r.medicine_id ?? undefined, dosage: r.dosage, quantity: r.quantity, unit: r.unit, instructions: r.instructions,
  remarks: r.remarks, recordedBy: r.recorded_by, status: r.status as PatientVisit['status'], createdAt: r.created_at, updatedAt: r.updated_at,
  clinicalData: r.clinical_data ?? undefined,
});

export async function fetchPatientVisits(): Promise<PatientVisit[]> {
  const { data, error } = await supabase.from('patient_visits').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToVisit);
}
export async function upsertPatientVisit(v: PatientVisit): Promise<void> {
  const { error } = await supabase.from('patient_visits').upsert(visitToRow(v));
  if (error) throw error;
}
export async function upsertPatientVisitsAll(items: PatientVisit[]): Promise<void> {
  const { error } = await supabase.from('patient_visits').upsert(items.map(visitToRow));
  if (error) throw error;
}
export async function deletePatientVisitRow(id: string): Promise<void> {
  const { error } = await supabase.from('patient_visits').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Referrals ----------
type ReferralRow = {
  id: string; patient_id: string; patient_name: string; patient_role: string | null; department: string | null;
  referred_to: string; referral_reason: string; referral_date: string; status: string;
  result: string; result_date: string | null; referred_by: string; created_at: string; updated_at: string;
};

const referralToRow = (r: Referral): ReferralRow => ({
  id: r.id, patient_id: r.patientId, patient_name: r.patientName, patient_role: r.patientRole ?? null, department: r.department ?? null,
  referred_to: r.referredTo, referral_reason: r.referralReason, referral_date: r.referralDate, status: r.status,
  result: r.result, result_date: r.resultDate ?? null, referred_by: r.referredBy, created_at: r.createdAt, updated_at: r.updatedAt,
});
const rowToReferral = (r: ReferralRow): Referral => ({
  id: r.id, patientId: r.patient_id, patientName: r.patient_name, patientRole: (r.patient_role ?? undefined) as Referral['patientRole'], department: r.department ?? undefined,
  referredTo: r.referred_to, referralReason: r.referral_reason, referralDate: r.referral_date, status: r.status as Referral['status'],
  result: r.result, resultDate: r.result_date ?? undefined, referredBy: r.referred_by, createdAt: r.created_at, updatedAt: r.updated_at,
});

export async function fetchReferrals(): Promise<Referral[]> {
  const { data, error } = await supabase.from('referrals').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToReferral);
}
export async function upsertReferral(r: Referral): Promise<void> {
  const { error } = await supabase.from('referrals').upsert(referralToRow(r));
  if (error) throw error;
}
export async function upsertReferralsAll(items: Referral[]): Promise<void> {
  const { error } = await supabase.from('referrals').upsert(items.map(referralToRow));
  if (error) throw error;
}
export async function deleteReferralRow(id: string): Promise<void> {
  const { error } = await supabase.from('referrals').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Follow-ups ----------
type FollowUpRow = {
  id: string; patient_id: string; patient_name: string; patient_role: string | null; department: string | null;
  reason: string; scheduled_date: string; status: string; result: string; result_date: string | null;
  created_by: string; created_at: string; updated_at: string;
};

const followUpToRow = (f: FollowUp): FollowUpRow => ({
  id: f.id, patient_id: f.patientId, patient_name: f.patientName, patient_role: f.patientRole ?? null, department: f.department ?? null,
  reason: f.reason, scheduled_date: f.scheduledDate, status: f.status, result: f.result, result_date: f.resultDate ?? null,
  created_by: f.createdBy, created_at: f.createdAt, updated_at: f.updatedAt,
});
const rowToFollowUp = (r: FollowUpRow): FollowUp => ({
  id: r.id, patientId: r.patient_id, patientName: r.patient_name, patientRole: (r.patient_role ?? undefined) as FollowUp['patientRole'], department: r.department ?? undefined,
  reason: r.reason, scheduledDate: r.scheduled_date, status: r.status as FollowUp['status'], result: r.result, resultDate: r.result_date ?? undefined,
  createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
});

export async function fetchFollowUps(): Promise<FollowUp[]> {
  const { data, error } = await supabase.from('follow_ups').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToFollowUp);
}
export async function upsertFollowUp(f: FollowUp): Promise<void> {
  const { error } = await supabase.from('follow_ups').upsert(followUpToRow(f));
  if (error) throw error;
}
export async function upsertFollowUpsAll(items: FollowUp[]): Promise<void> {
  const { error } = await supabase.from('follow_ups').upsert(items.map(followUpToRow));
  if (error) throw error;
}
export async function deleteFollowUpRow(id: string): Promise<void> {
  const { error } = await supabase.from('follow_ups').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Appointments ----------
type AppointmentRow = {
  id: string; patient_id: string; patient_name: string; patient_role: string | null; department: string | null;
  service_type: string; appointment_date: string; appointment_time: string; status: string;
  reason: string; notes: string; scheduled_by: string; created_at: string; updated_at: string;
};

const apptToRow = (a: Appointment): AppointmentRow => ({
  id: a.id, patient_id: a.patientId, patient_name: a.patientName, patient_role: a.patientRole ?? null, department: a.department ?? null,
  service_type: a.serviceType, appointment_date: a.appointmentDate, appointment_time: a.appointmentTime, status: a.status,
  reason: a.reason, notes: a.notes, scheduled_by: a.scheduledBy, created_at: a.createdAt, updated_at: a.updatedAt,
});
const rowToAppt = (r: AppointmentRow): Appointment => ({
  id: r.id, patientId: r.patient_id, patientName: r.patient_name, patientRole: (r.patient_role ?? undefined) as Appointment['patientRole'], department: r.department ?? undefined,
  serviceType: r.service_type as Appointment['serviceType'], appointmentDate: r.appointment_date, appointmentTime: r.appointment_time,
  status: r.status as Appointment['status'], reason: r.reason, notes: r.notes, scheduledBy: r.scheduled_by, createdAt: r.created_at, updatedAt: r.updated_at,
});

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase.from('appointments').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToAppt);
}
export async function upsertAppointment(a: Appointment): Promise<void> {
  const { error } = await supabase.from('appointments').upsert(apptToRow(a));
  if (error) throw error;
}
export async function upsertAppointmentsAll(items: Appointment[]): Promise<void> {
  const { error } = await supabase.from('appointments').upsert(items.map(apptToRow));
  if (error) throw error;
}
export async function deleteAppointmentRow(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Medical Supplies ----------
type MedicalSupplyRow = {
  id: string; name: string; category: string; quantity: number; unit: string; min_stock: number;
  expiry_date: string; supplier: string; storage_location: string | null; last_updated: string; primary_key_date: string | null;
};
const supToRow = (s: MedicalSupply): MedicalSupplyRow => ({
  id: s.id, name: s.name, category: s.category, quantity: s.quantity, unit: s.unit, min_stock: s.minStock,
  expiry_date: s.expiryDate, supplier: s.supplier, storage_location: s.storageLocation ?? null, last_updated: s.lastUpdated, primary_key_date: s.primaryKeyDate ?? null,
});
const rowToSup = (r: MedicalSupplyRow): MedicalSupply => ({
  id: r.id, name: r.name, category: r.category, quantity: r.quantity, unit: r.unit, minStock: r.min_stock,
  expiryDate: r.expiry_date, supplier: r.supplier, storageLocation: r.storage_location ?? undefined, lastUpdated: r.last_updated, primaryKeyDate: r.primary_key_date ?? undefined,
});

export async function fetchMedicalSupplies(): Promise<MedicalSupply[]> {
  const { data, error } = await supabase.from('medical_supplies').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToSup);
}
export async function upsertMedicalSupply(s: MedicalSupply): Promise<void> {
  const { error } = await supabase.from('medical_supplies').upsert(supToRow(s));
  if (error) throw error;
}
export async function upsertMedicalSuppliesAll(items: MedicalSupply[]): Promise<void> {
  const { error } = await supabase.from('medical_supplies').upsert(items.map(supToRow));
  if (error) throw error;
}
export async function deleteMedicalSupplyRow(id: string): Promise<void> {
  const { error } = await supabase.from('medical_supplies').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Stock Transactions ----------
type StockTxnRow = {
  id: string; item_id: string; item_name: string; item_type: string; transaction_type: string;
  quantity: number; unit: string; reason: string; recorded_by: string; recorded_at: string; notes: string | null;
};
const txnToRow = (t: StockTransaction): StockTxnRow => ({
  id: t.id, item_id: t.itemId, item_name: t.itemName, item_type: t.itemType, transaction_type: t.transactionType,
  quantity: t.quantity, unit: t.unit, reason: t.reason, recorded_by: t.recordedBy, recorded_at: t.recordedAt, notes: t.notes ?? null,
});
const rowToTxn = (r: StockTxnRow): StockTransaction => ({
  id: r.id, itemId: r.item_id, itemName: r.item_name, itemType: r.item_type as StockTransaction['itemType'],
  transactionType: r.transaction_type as StockTransaction['transactionType'],
  quantity: r.quantity, unit: r.unit, reason: r.reason, recordedBy: r.recorded_by, recordedAt: r.recorded_at, notes: r.notes ?? undefined,
});

export async function fetchStockTransactions(): Promise<StockTransaction[]> {
  const { data, error } = await supabase.from('stock_transactions').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToTxn);
}
export async function upsertStockTransaction(t: StockTransaction): Promise<void> {
  const { error } = await supabase.from('stock_transactions').upsert(txnToRow(t));
  if (error) throw error;
}
export async function upsertStockTransactionsAll(items: StockTransaction[]): Promise<void> {
  const { error } = await supabase.from('stock_transactions').upsert(items.map(txnToRow));
  if (error) throw error;
}
export async function deleteStockTransactionRow(id: string): Promise<void> {
  const { error } = await supabase.from('stock_transactions').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Suppliers ----------
type SupplierRow = {
  id: string; name: string; contact_person: string | null; email: string | null; phone: string | null;
  address: string | null; products_supplied: string | null; category: string; status: string; created_at: string;
};
const supplierToRow = (s: Supplier): SupplierRow => ({
  id: s.id, name: s.name, contact_person: s.contactPerson ?? null, email: s.email ?? null, phone: s.phone ?? null,
  address: s.address ?? null, products_supplied: s.productsSupplied ?? null, category: s.category, status: s.status, created_at: s.createdAt,
});
const rowToSupplier = (r: SupplierRow): Supplier => ({
  id: r.id, name: r.name, contactPerson: r.contact_person ?? undefined, email: r.email ?? undefined, phone: r.phone ?? undefined,
  address: r.address ?? undefined, productsSupplied: r.products_supplied ?? undefined, category: r.category, status: r.status as Supplier['status'], createdAt: r.created_at,
});

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToSupplier);
}
export async function upsertSupplier(s: Supplier): Promise<void> {
  const { error } = await supabase.from('suppliers').upsert(supplierToRow(s));
  if (error) throw error;
}
export async function upsertSuppliersAll(items: Supplier[]): Promise<void> {
  const { error } = await supabase.from('suppliers').upsert(items.map(supplierToRow));
  if (error) throw error;
}
export async function deleteSupplierRow(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Purchases ----------
type PurchaseRow = {
  id: string; supplier_id: string | null; supplier_name: string; item_description: string; quantity: number;
  unit: string; unit_cost: number; total_cost: number; purchase_date: string; recorded_by: string;
  status: string; receipt_url: string | null; notes: string | null; created_at: string;
};
const purchaseToRow = (p: Purchase): PurchaseRow => ({
  id: p.id, supplier_id: p.supplierId ?? null, supplier_name: p.supplierName, item_description: p.itemDescription,
  quantity: p.quantity, unit: p.unit, unit_cost: p.unitCost, total_cost: p.totalCost, purchase_date: p.purchaseDate,
  recorded_by: p.recordedBy, status: p.status, receipt_url: p.receiptUrl ?? null, notes: p.notes ?? null, created_at: p.createdAt,
});
const rowToPurchase = (r: PurchaseRow): Purchase => ({
  id: r.id, supplierId: r.supplier_id ?? undefined, supplierName: r.supplier_name, itemDescription: r.item_description,
  quantity: r.quantity, unit: r.unit, unitCost: Number(r.unit_cost), totalCost: Number(r.total_cost), purchaseDate: r.purchase_date,
  recordedBy: r.recorded_by, status: r.status as Purchase['status'], receiptUrl: r.receipt_url ?? undefined, notes: r.notes ?? undefined, createdAt: r.created_at,
});

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase.from('purchases').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToPurchase);
}
export async function upsertPurchase(p: Purchase): Promise<void> {
  const { error } = await supabase.from('purchases').upsert(purchaseToRow(p));
  if (error) throw error;
}
export async function upsertPurchasesAll(items: Purchase[]): Promise<void> {
  const { error } = await supabase.from('purchases').upsert(items.map(purchaseToRow));
  if (error) throw error;
}
export async function deletePurchaseRow(id: string): Promise<void> {
  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Bulk clear (for reset) ----------
export async function clearAllData(): Promise<void> {
  const tables = ['health_records', 'medicine_dispensing', 'requests', 'medicines', 'expenses', 'notifications', 'audit_logs', 'backup_records', 'health_form_requests', 'patient_visits', 'referrals', 'follow_ups', 'appointments', 'medical_supplies', 'stock_transactions', 'suppliers', 'purchases'];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq('id', '0');
    if (error) throw error;
  }
}

// ---------- School Settings ----------
type SchoolSettingsRow = {
  id: string; school_name: string; school_logo_path: string | null;
  school_address: string | null; contact_email: string | null; contact_phone: string | null;
  updated_at: string; updated_by: string | null;
};

const rowToSettings = (r: SchoolSettingsRow): SchoolSettings => ({
  id: r.id, schoolName: r.school_name, schoolLogoPath: r.school_logo_path ?? undefined,
  schoolAddress: r.school_address ?? undefined, contactEmail: r.contact_email ?? undefined,
  contactPhone: r.contact_phone ?? undefined, updatedAt: r.updated_at, updatedBy: r.updated_by ?? undefined,
});

export async function fetchSchoolSettings(): Promise<SchoolSettings> {
  const { data, error } = await supabase.from('school_settings').select('*').eq('id', 'singleton').maybeSingle();
  if (error) throw error;
  if (data) return rowToSettings(data as SchoolSettingsRow);
  return { id: 'singleton', schoolName: 'HEALTH SYS SFCG', updatedAt: '' };
}

export async function upsertSchoolSettings(s: SchoolSettings): Promise<void> {
  const row: SchoolSettingsRow = {
    id: 'singleton', school_name: s.schoolName, school_logo_path: s.schoolLogoPath ?? null,
    school_address: s.schoolAddress ?? null, contact_email: s.contactEmail ?? null,
    contact_phone: s.contactPhone ?? null, updated_at: s.updatedAt, updated_by: s.updatedBy ?? null,
  };
  const { error } = await supabase.from('school_settings').upsert(row);
  if (error) throw error;
}
