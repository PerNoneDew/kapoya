import { useState } from 'react';
import { UserPlus, Search, Eye, CreditCard as Edit2, Archive, GraduationCap, Mail, Building2, FileText, ChevronRight, ChevronDown, RotateCcw, HeartPulse, Phone, MapPin, Calendar, User as UserIcon, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { User } from '../../types';
import PatientVisitForm from '../../components/ui/PatientVisitForm';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import HealthHistoryTabs from '../../components/ui/HealthHistoryTabs';

type StudentForm = Pick<User, 'name' | 'email' | 'department' | 'studentId' | 'status' | 'lastName' | 'firstName' | 'middleName' | 'suffix' | 'sex' | 'dateOfBirth' | 'gradeYearLevel' | 'section' | 'programCourse' | 'schoolYear' | 'contactNumber' | 'address' | 'parentGuardian' | 'parentGuardianContact'> & { password: string };

const emptyForm: StudentForm = {
  name: '', email: '', department: '', studentId: '', status: 'active', password: '',
  lastName: '', firstName: '', middleName: '', suffix: '', sex: '', dateOfBirth: '',
  gradeYearLevel: '', section: '', programCourse: '', schoolYear: '',
  contactNumber: '', address: '', parentGuardian: '', parentGuardianContact: '',
};

const programCourseOptions: { label: string; options: string[] }[] = [
  {
    label: 'COLLEGE',
    options: [
      'Bachelor of Elementary Education (BEEd)',
      'Bachelor of Secondary Education (BSEd) - Major in English',
      'Bachelor of Secondary Education (BSEd) - Major in Mathematics',
      'Bachelor of Secondary Education (BSEd) - Major in Social Studies',
      'Bachelor of Secondary Education (BSEd) - Major in General Science',
      'Bachelor of Secondary Education (BSEd) - Major in Filipino',
      'Bachelor of Science in Business Administration (BSBA) - Major in Financial Management',
      'Bachelor of Science in Business Administration (BSBA) - Major in Marketing Management',
      'Bachelor of Science in Business Administration (BSBA) - Major in Human Resource Development Management',
      'Bachelor of Science in Information System',
    ],
  },
  {
    label: 'SENIOR HIGH SCHOOL (Grades 11 & 12) - Academic Track',
    options: [
      'General Academic Strand (GAS)',
      'Humanities and Social Sciences (HUMSS)',
      'Accountancy, Business, and Management (ABM)',
    ],
  },
  {
    label: 'SENIOR HIGH SCHOOL (Grades 11 & 12) - TVL Track',
    options: [
      'Home Economics (HE)',
      'Information and Communications Technology (ICT)',
    ],
  },
  {
    label: 'BASIC EDUCATION DEPARTMENT - Junior High School',
    options: [
      'Grade 7',
      'Grade 8',
      'Grade 9',
      'Grade 10',
    ],
  },
  {
    label: 'BASIC EDUCATION DEPARTMENT - Elementary',
    options: [
      'Grade 1',
      'Grade 2',
      'Grade 3',
      'Grade 4',
      'Grade 5',
      'Grade 6',
    ],
  },
  {
    label: 'BASIC EDUCATION DEPARTMENT - Preschool',
    options: [
      'Kindergarten',
      'Nursery',
    ],
  },
];

const sexOptions = ['Male', 'Female'];

function buildName(firstName: string | undefined, middleName: string | undefined, lastName: string | undefined, suffix: string | undefined): string {
  return [firstName?.trim(), middleName?.trim(), lastName?.trim(), suffix?.trim()].filter(Boolean).join(' ');
}

export default function StudentManagement() {
  const { currentUser, users, registerUser, updateUser, toggleUserStatus } = useAuth();
  const { healthRecords, dispensingHistory, patientVisits, referrals, followUps } = useData();
  const { runWithFeedback } = useFeedback();
  if (!currentUser) return null;

  const canManage = currentUser.role === 'admin';

  const students = users.filter((u) => u.role === 'student');

  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<User | null>(null);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [physicalTarget, setPhysicalTarget] = useState<User | null>(null);

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || (s.studentId?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchCollege = collegeFilter === 'all' || s.department === collegeFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchCollege && matchStatus;
  });

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      name: u.name, email: u.email, department: u.department ?? '', studentId: u.studentId ?? '', status: u.status, password: '',
      lastName: u.lastName ?? '', firstName: u.firstName ?? '', middleName: u.middleName ?? '', suffix: u.suffix ?? '',
      sex: u.sex ?? '', dateOfBirth: u.dateOfBirth ?? '',
      gradeYearLevel: u.gradeYearLevel ?? '', section: u.section ?? '', programCourse: u.department ?? '', schoolYear: u.schoolYear ?? '',
      contactNumber: u.contactNumber ?? '', address: u.address ?? '',
      parentGuardian: u.parentGuardian ?? '', parentGuardianContact: u.parentGuardianContact ?? '',
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
            name: fullName, email: form.email.trim().toLowerCase(), department: form.department, studentId: form.studentId, status: form.status,
            lastName: form.lastName, firstName: form.firstName, middleName: form.middleName, suffix: form.suffix,
            sex: form.sex, dateOfBirth: form.dateOfBirth,
            gradeYearLevel: form.gradeYearLevel, section: form.section, programCourse: form.department, schoolYear: form.schoolYear,
            contactNumber: form.contactNumber, address: form.address,
            parentGuardian: form.parentGuardian, parentGuardianContact: form.parentGuardianContact,
          }, form.password.trim() || undefined);
        } else {
          const newUser: User = {
            id: `u${Date.now()}`, name: fullName, email: form.email.trim().toLowerCase(), role: 'student', department: form.department, studentId: form.studentId, status: form.status, createdAt: new Date().toISOString().split('T')[0],
            lastName: form.lastName, firstName: form.firstName, middleName: form.middleName, suffix: form.suffix,
            sex: form.sex, dateOfBirth: form.dateOfBirth,
            gradeYearLevel: form.gradeYearLevel, section: form.section, programCourse: form.department, schoolYear: form.schoolYear,
            contactNumber: form.contactNumber, address: form.address,
            parentGuardian: form.parentGuardian, parentGuardianContact: form.parentGuardianContact,
          };
          await registerUser(newUser, form.password.trim());
        }
      },
      { loadingTitle: isEdit ? 'Saving student…' : 'Creating student…', successTitle: isEdit ? 'Student updated' : 'Student added', successMessage: isEdit ? `${fullName}'s details saved.` : `${fullName} can now sign in.`, autoCloseMs: 1800 },
    );
    if (ok) setShowForm(false);
  };

  const handleArchiveToggle = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const activating = target.status === 'inactive';
    const ok = await runWithFeedback(
      () => toggleUserStatus(id),
      { loadingTitle: activating ? 'Restoring…' : 'Archiving…', successTitle: activating ? 'Student restored' : 'Student archived', successMessage: activating ? `${target.name} is active again.` : `${target.name} has been archived.`, autoCloseMs: 1800 },
    );
    if (ok) { setShowArchiveConfirm(false); setArchiveTarget(null); }
  };

  const openArchiveConfirm = (u: User) => { setArchiveTarget(u); setShowArchiveConfirm(true); };

  const studentColleges = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><GraduationCap size={18} className="text-teal-500" /></div>
            <div><p className="text-sm text-slate-500">Total Students</p><p className="text-2xl font-bold text-slate-800">{students.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><HeartPulse size={18} className="text-emerald-500" /></div>
            <div><p className="text-sm text-slate-500">With Health Records</p><p className="text-2xl font-bold text-slate-800">{students.filter((s) => healthRecords.some((r) => r.userId === s.id)).length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl"><Building2 size={18} className="text-amber-500" /></div>
            <div><p className="text-sm text-slate-500">Colleges</p><p className="text-2xl font-bold text-slate-800">{studentColleges.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl"><Archive size={18} className="text-slate-500" /></div>
            <div><p className="text-sm text-slate-500">Archived</p><p className="text-2xl font-bold text-slate-800">{students.filter((s) => s.status === 'inactive').length}</p></div>
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
            <select value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Programs</option>
              {studentColleges.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Archived</option>
            </select>
            {canManage && (
              <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <UserPlus size={15} /> Add Student
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Student ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Program / Course</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => {
                const hasRecord = healthRecords.some((r) => r.userId === s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                          <span className="text-teal-600 font-semibold text-sm">{s.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                          <p className="text-xs text-slate-400 truncate">{s.email}</p>
                        </div>
                        {hasRecord && <HeartPulse size={12} className="text-emerald-400 shrink-0" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-xs text-slate-500 font-mono">{s.studentId || '—'}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-500">{s.department || '—'}</td>
                    <td className="px-5 py-3.5"><Badge label={s.status === 'active' ? 'Active' : 'Archived'} variant={statusVariant(s.status)} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewUser(s)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View Profile"><Eye size={14} /></button>
                        <button onClick={() => setPhysicalTarget(s)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Physical Examination"><HeartPulse size={14} /></button>
                        {canManage && (
                          <>
                            <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => openArchiveConfirm(s)} className={`p-1.5 rounded-lg transition-colors ${s.status === 'active' ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={s.status === 'active' ? 'Archive' : 'Restore'}>
                              {s.status === 'active' ? <Archive size={14} /> : <RotateCcw size={14} />}
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
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No students found.</div>}
        </div>
      </div>

      {/* View Profile Modal */}
      <Modal isOpen={viewUser !== null} onClose={() => setViewUser(null)} title="Student Profile" size="lg">
        {viewUser && (() => {
          const record = healthRecords.find((r) => r.userId === viewUser.id);
          const userDispensing = dispensingHistory.filter((d) => d.patientId === viewUser.id);
          const userVisits = patientVisits.filter((v) => v.patientId === viewUser.id);
          const userReferrals = referrals.filter((ref) => ref.patientId === viewUser.id);
          const userFollowUps = followUps.filter((fu) => fu.patientId === viewUser.id);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-sky-50 rounded-xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-teal-600 font-bold text-2xl">{viewUser.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-lg">{viewUser.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge label="Student" variant="neutral" />
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
                  <InfoRow icon={FileText} label="Student ID" value={viewUser.studentId || '—'} />
                  <InfoRow icon={UserIcon} label="Sex" value={viewUser.sex || '—'} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={viewUser.dateOfBirth || '—'} />
                  <InfoRow icon={Phone} label="Contact Number" value={viewUser.contactNumber || '—'} />
                  <InfoRow icon={MapPin} label="Address" value={viewUser.address || '—'} />
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Academic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={Building2} label="Program / Course" value={viewUser.department || '—'} />
                  <InfoRow icon={GraduationCap} label="Grade/Year Level" value={viewUser.gradeYearLevel || '—'} />
                  <InfoRow icon={FileText} label="Section" value={viewUser.section || '—'} />
                  <InfoRow icon={GraduationCap} label="Program/Course" value={viewUser.programCourse || '—'} />
                  <InfoRow icon={Calendar} label="School Year" value={viewUser.schoolYear || '—'} />
                  <InfoRow icon={Calendar} label="Enrolled" value={viewUser.createdAt} />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parent / Guardian</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={Users} label="Parent/Guardian Name" value={viewUser.parentGuardian || '—'} />
                  <InfoRow icon={Phone} label="Parent/Guardian Contact" value={viewUser.parentGuardianContact || '—'} />
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
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editUser ? 'Edit Student' : 'Add Student'} size="lg">
        <div className="space-y-5">
          {/* Personal Information */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="student@email.edu" />
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

          {/* Academic Information */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Academic Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. STU-2024-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Program / Course</label>
                <button type="button" onClick={() => setShowProgramPicker(true)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-left flex items-center justify-between bg-white">
                  <span className={form.department ? 'text-slate-700' : 'text-slate-400'}>{form.department || 'Select program / course'}</span>
                  <ChevronDown size={16} className="text-slate-400 shrink-0" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grade / Year Level</label>
                <input value={form.gradeYearLevel} onChange={(e) => setForm({ ...form, gradeYearLevel: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Grade 11, 1st Year" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. A, B, Rizal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Year</label>
                <input value={form.schoolYear} onChange={(e) => setForm({ ...form, schoolYear: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. 2024-2025" />
              </div>
            </div>
          </div>

          {/* Parent/Guardian */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent / Guardian Name</label>
                <input value={form.parentGuardian} onChange={(e) => setForm({ ...form, parentGuardian: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent / Guardian Contact</label>
                <input value={form.parentGuardianContact} onChange={(e) => setForm({ ...form, parentGuardianContact: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Contact number" />
              </div>
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password {editUser && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder={editUser ? 'Enter new password to change' : 'Set login password'} />
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
              <ChevronRight size={14} />{editUser ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Program / Course Picker Modal */}
      <Modal isOpen={showProgramPicker} onClose={() => setShowProgramPicker(false)} title="Select Program / Course" size="lg">
        <div className="space-y-4">
          {programCourseOptions.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => { setForm({ ...form, department: o }); setShowProgramPicker(false); }}
                    className={`px-3 py-2 rounded-xl text-sm text-left transition-colors border ${form.department === o ? 'bg-teal-50 border-teal-400 text-teal-700 font-medium' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => { setShowArchiveConfirm(false); setArchiveTarget(null); }}
        onConfirm={() => archiveTarget && handleArchiveToggle(archiveTarget.id)}
        title={archiveTarget?.status === 'active' ? 'Archive Student' : 'Restore Student'}
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
