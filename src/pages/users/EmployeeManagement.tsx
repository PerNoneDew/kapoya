import { useState } from 'react';
import { UserPlus, Search, Eye, CreditCard as Edit2, Archive, Briefcase, Mail, Building2, FileText, ChevronRight, RotateCcw, HeartPulse, Phone, MapPin, Calendar, User as UserIcon, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { User, UserRole } from '../../types';
import PatientVisitForm from '../../components/ui/PatientVisitForm';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import HealthHistoryTabs from '../../components/ui/HealthHistoryTabs';

type EmployeeForm = Pick<User, 'name' | 'email' | 'department' | 'employeeId' | 'role' | 'status' | 'lastName' | 'firstName' | 'middleName' | 'suffix' | 'sex' | 'dateOfBirth' | 'contactNumber' | 'address' | 'position' | 'employmentType' | 'emergencyContact' | 'dateHired'> & { password: string };

const emptyForm: EmployeeForm = {
  name: '', email: '', department: '', employeeId: '', role: 'employee', status: 'active', password: '',
  lastName: '', firstName: '', middleName: '', suffix: '', sex: '', dateOfBirth: '',
  contactNumber: '', address: '', position: '', employmentType: '', emergencyContact: '', dateHired: '',
};

const offices = ['Finance Office', 'Registrar Office', 'Human Resources', 'IT Department', 'Library Services', 'Research Office', 'Student Affairs', 'Procurement Office'];
const employeeTypes: { role: 'employee' | 'staff' | 'faculty'; label: string }[] = [
  { role: 'employee', label: 'Employee' },
  { role: 'staff', label: 'Staff' },
  { role: 'faculty', label: 'Faculty' },
];
const sexOptions = ['Male', 'Female'];
const employmentTypes = ['Full-time', 'Part-time', 'Contractual', 'Permanent', 'Temporary'];

function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Admin',
    student: 'Student',
    staff: 'Staff',
    faculty: 'Faculty',
    employee: 'Employee',
  };
  return labels[role] ?? role;
}

function buildName(firstName: string | undefined, middleName: string | undefined, lastName: string | undefined, suffix: string | undefined): string {
  return [firstName?.trim(), middleName?.trim(), lastName?.trim(), suffix?.trim()].filter(Boolean).join(' ');
}

export default function EmployeeManagement() {
  const { currentUser, users, registerUser, updateUser, toggleUserStatus } = useAuth();
  const { healthRecords, dispensingHistory, patientVisits, referrals, followUps } = useData();
  const { runWithFeedback } = useFeedback();
  if (!currentUser) return null;

  const canManage = currentUser.role === 'admin';

  const employees = users.filter((u) => u.role === 'employee' || u.role === 'staff' || u.role === 'faculty');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<User | null>(null);
  const [physicalTarget, setPhysicalTarget] = useState<User | null>(null);

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()) || (e.employeeId?.toLowerCase().includes(search.toLowerCase()) ?? false) || (e.facultyId?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchType = typeFilter === 'all' || e.role === typeFilter;
    const matchOffice = officeFilter === 'all' || e.department === officeFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchType && matchOffice && matchStatus;
  });

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      name: u.name, email: u.email, department: u.department ?? '', employeeId: u.employeeId ?? u.facultyId ?? '', role: u.role, status: u.status, password: '',
      lastName: u.lastName ?? '', firstName: u.firstName ?? '', middleName: u.middleName ?? '', suffix: u.suffix ?? '',
      sex: u.sex ?? '', dateOfBirth: u.dateOfBirth ?? '',
      contactNumber: u.contactNumber ?? '', address: u.address ?? '',
      position: u.position ?? '', employmentType: u.employmentType ?? '', emergencyContact: u.emergencyContact ?? '', dateHired: u.dateHired ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const fullName = buildName(form.firstName, form.middleName, form.lastName, form.suffix);
    if (!fullName.trim() || !form.email.trim()) return;
    if (!editUser && !form.password.trim()) return;
    const isEdit = !!editUser;
    const ok = await runWithFeedback(
      async () => {
        if (editUser) {
          await updateUser(editUser.id, {
            name: fullName, email: form.email.trim().toLowerCase(), department: form.department,
            employeeId: form.role === 'faculty' ? undefined : form.employeeId, facultyId: form.role === 'faculty' ? form.employeeId : undefined,
            role: form.role as UserRole, status: form.status,
            lastName: form.lastName, firstName: form.firstName, middleName: form.middleName, suffix: form.suffix,
            sex: form.sex, dateOfBirth: form.dateOfBirth,
            contactNumber: form.contactNumber, address: form.address,
            position: form.position, employmentType: form.employmentType, emergencyContact: form.emergencyContact, dateHired: form.dateHired,
          }, form.password.trim() || undefined);
        } else {
          const newUser: User = {
            id: `u${Date.now()}`, name: fullName, email: form.email.trim().toLowerCase(),
            role: form.role as UserRole, department: form.department,
            employeeId: form.role !== 'faculty' ? form.employeeId : undefined,
            facultyId: form.role === 'faculty' ? form.employeeId : undefined,
            status: form.status, createdAt: new Date().toISOString().split('T')[0],
            lastName: form.lastName, firstName: form.firstName, middleName: form.middleName, suffix: form.suffix,
            sex: form.sex, dateOfBirth: form.dateOfBirth,
            contactNumber: form.contactNumber, address: form.address,
            position: form.position, employmentType: form.employmentType, emergencyContact: form.emergencyContact, dateHired: form.dateHired,
          };
          await registerUser(newUser, form.password.trim());
        }
      },
      { loadingTitle: isEdit ? 'Saving…' : 'Creating…', successTitle: isEdit ? 'Updated' : 'Added', successMessage: isEdit ? `${fullName}'s details saved.` : `${fullName} can now sign in.`, autoCloseMs: 1800 },
    );
    if (ok) setShowForm(false);
  };

  const handleArchiveToggle = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const activating = target.status === 'inactive';
    const ok = await runWithFeedback(
      () => toggleUserStatus(id),
      { loadingTitle: activating ? 'Restoring…' : 'Archiving…', successTitle: activating ? 'Restored' : 'Archived', successMessage: activating ? `${target.name} is active again.` : `${target.name} has been archived.`, autoCloseMs: 1800 },
    );
    if (ok) { setShowArchiveConfirm(false); setArchiveTarget(null); }
  };

  const openArchiveConfirm = (u: User) => { setArchiveTarget(u); setShowArchiveConfirm(true); };
  const employeeOffices = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl"><Briefcase size={18} className="text-sky-500" /></div>
            <div><p className="text-sm text-slate-500">Total Employees</p><p className="text-2xl font-bold text-slate-800">{employees.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-xl"><FileText size={18} className="text-violet-500" /></div>
            <div><p className="text-sm text-slate-500">Faculty</p><p className="text-2xl font-bold text-slate-800">{employees.filter((e) => e.role === 'faculty').length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl"><Building2 size={18} className="text-amber-500" /></div>
            <div><p className="text-sm text-slate-500">Departments</p><p className="text-2xl font-bold text-slate-800">{employeeOffices.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><HeartPulse size={18} className="text-emerald-500" /></div>
            <div><p className="text-sm text-slate-500">With Health Records</p><p className="text-2xl font-bold text-slate-800">{employees.filter((e) => healthRecords.some((r) => r.userId === e.id)).length}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, or ID..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Types</option>
              <option value="employee">Employees</option>
              <option value="staff">Staff</option>
              <option value="faculty">Faculty</option>
            </select>
            <select value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Departments</option>
              {employeeOffices.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Archived</option>
            </select>
            {canManage && (
              <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <UserPlus size={15} /> Add Employee
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Department</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((e) => {
                const hasRecord = healthRecords.some((r) => r.userId === e.id);
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                          <span className="text-sky-600 font-semibold text-sm">{e.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{e.name}</p>
                          <p className="text-xs text-slate-400 truncate">{e.email}</p>
                        </div>
                        {hasRecord && <HeartPulse size={12} className="text-emerald-400 shrink-0" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Badge label={roleLabel(e.role)} variant={statusVariant(e.role)} /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-xs text-slate-500 font-mono">{e.employeeId || e.facultyId || '—'}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-500">{e.department || '—'}</td>
                    <td className="px-5 py-3.5"><Badge label={e.status === 'active' ? 'Active' : 'Archived'} variant={statusVariant(e.status)} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewUser(e)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View Profile"><Eye size={14} /></button>
                        <button onClick={() => setPhysicalTarget(e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Physical Examination"><HeartPulse size={14} /></button>
                        {canManage && (
                          <>
                            <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => openArchiveConfirm(e)} className={`p-1.5 rounded-lg transition-colors ${e.status === 'active' ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={e.status === 'active' ? 'Archive' : 'Restore'}>
                              {e.status === 'active' ? <Archive size={14} /> : <RotateCcw size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No employees found.</div>}
        </div>
      </div>

      {/* View Profile Modal */}
      <Modal isOpen={viewUser !== null} onClose={() => setViewUser(null)} title="Employee Profile" size="lg">
        {viewUser && (() => {
          const record = healthRecords.find((r) => r.userId === viewUser.id);
          const userDispensing = dispensingHistory.filter((d) => d.patientId === viewUser.id);
          const userVisits = patientVisits.filter((v) => v.patientId === viewUser.id);
          const userReferrals = referrals.filter((ref) => ref.patientId === viewUser.id);
          const userFollowUps = followUps.filter((fu) => fu.patientId === viewUser.id);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-sky-50 to-teal-50 rounded-xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-sky-600 font-bold text-2xl">{viewUser.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-lg">{viewUser.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge label={roleLabel(viewUser.role)} variant={statusVariant(viewUser.role)} />
                    <Badge label={viewUser.status === 'active' ? 'Active' : 'Archived'} variant={statusVariant(viewUser.status)} />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Personal Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={UserIcon} label="Full Name" value={viewUser.name} />
                  <InfoRow icon={Mail} label="Email" value={viewUser.email} />
                  <InfoRow icon={FileText} label="Employee ID" value={viewUser.employeeId || viewUser.facultyId || '—'} />
                  <InfoRow icon={UserIcon} label="Sex" value={viewUser.sex || '—'} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={viewUser.dateOfBirth || '—'} />
                  <InfoRow icon={Phone} label="Contact Number" value={viewUser.contactNumber || '—'} />
                  <InfoRow icon={MapPin} label="Address" value={viewUser.address || '—'} />
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employment Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={Building2} label="Department" value={viewUser.department || '—'} />
                  <InfoRow icon={Briefcase} label="Position" value={viewUser.position || '—'} />
                  <InfoRow icon={FileText} label="Employment Type" value={viewUser.employmentType || '—'} />
                  <InfoRow icon={Calendar} label="Date Hired" value={viewUser.dateHired || '—'} />
                  <InfoRow icon={Briefcase} label="Joined" value={viewUser.createdAt} />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Emergency Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={Users} label="Emergency Contact Name" value={viewUser.emergencyContact || '—'} />
                  <InfoRow icon={Phone} label="Emergency Contact Number" value={viewUser.contactNumber || '—'} />
                </div>
              </div>

              <HealthHistoryTabs
                record={record}
                dispensingHistory={userDispensing}
                visits={userVisits}
                referrals={userReferrals}
                followUps={userFollowUps}
              />
            </div>
          );
        })()}
      </Modal>

      {/* Add/Edit Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editUser ? 'Edit Employee' : 'Add Employee'} size="lg">
        <div className="space-y-5">
          {/* Personal Information */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="email@edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name <span className="text-rose-500">*</span></label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Last name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name <span className="text-rose-500">*</span></label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="First name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                <input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Middle name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Suffix</label>
                <input value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Jr., Sr., III" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sex</label>
                <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Select sex</option>
                  {sexOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. 09171234567" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Home address" />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Employment Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'employee' | 'staff' | 'faculty' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {employeeTypes.map((t) => <option key={t.role} value={t.role}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{form.role === 'faculty' ? 'Faculty ID' : 'Employee ID'}</label>
                <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. EMP-2024-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Select department</option>
                  {offices.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Clerk, Instructor" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Select employment type</option>
                  {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Hired</label>
                <input type="date" value={form.dateHired} onChange={(e) => setForm({ ...form, dateHired: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Emergency Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name</label>
                <input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Full name" />
              </div>
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password {editUser && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder={editUser ? 'Enter new password' : 'Set login password'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="active">Active</option>
                  <option value="inactive">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors flex items-center gap-1.5">
              <ChevronRight size={14} />{editUser ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => { setShowArchiveConfirm(false); setArchiveTarget(null); }}
        onConfirm={() => archiveTarget && handleArchiveToggle(archiveTarget.id)}
        title={archiveTarget?.status === 'active' ? 'Archive Employee' : 'Restore Employee'}
        message={archiveTarget?.status === 'active' ? `Archive ${archiveTarget?.name}? They will no longer be able to sign in.` : `Restore ${archiveTarget?.name}? They will regain access.`}
        confirmLabel={archiveTarget?.status === 'active' ? 'Archive' : 'Restore'}
        type={archiveTarget?.status === 'active' ? 'warning' : 'success'}
      />

      {physicalTarget && (
        <PatientVisitForm serviceType="physical" isOpen={physicalTarget !== null} onClose={() => setPhysicalTarget(null)} presetPatient={physicalTarget} />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
      <div className="p-2 bg-slate-100 rounded-lg shrink-0"><Icon size={16} className="text-slate-500" /></div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
