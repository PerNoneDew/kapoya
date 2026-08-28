import { ChangeEvent, ReactNode, useRef, useState } from 'react';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Save, Shield, BadgeCheck, Building2, Calendar, Phone, MapPin, Briefcase, GraduationCap, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import Badge, { statusVariant, roleLabel } from '../components/ui/Badge';
import { User } from '../types';
import { supabase } from '../lib/supabase';

type ProfileForm = { [K in keyof Pick<User, 'email' | 'firstName' | 'middleName' | 'lastName' | 'suffix' | 'sex' | 'dateOfBirth' | 'contactNumber' | 'address' | 'department' | 'gradeYearLevel' | 'section' | 'programCourse' | 'schoolYear' | 'position' | 'employmentType' | 'emergencyContact' | 'dateHired'>]: string };

function valueOf(value: string | undefined): string {
  return value ?? '';
}

function buildName(form: ProfileForm): string {
  return [form.firstName, form.middleName, form.lastName, form.suffix].map((v) => (v ?? '').trim()).filter(Boolean).join(' ');
}

function initials(user: User): string {
  return (user.firstName?.trim().charAt(0) || user.name.trim().charAt(0) || '?').toUpperCase();
}

export default function Profile() {
  const { currentUser, updateUser } = useAuth();
  const { runWithFeedback } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(currentUser?.profileImage);
  const [form, setForm] = useState<ProfileForm>(() => ({
    email: valueOf(currentUser?.email),
    firstName: valueOf(currentUser?.firstName) || currentUser?.name.trim().split(/\s+/)[0] || '',
    middleName: valueOf(currentUser?.middleName),
    lastName: valueOf(currentUser?.lastName),
    suffix: valueOf(currentUser?.suffix),
    sex: valueOf(currentUser?.sex),
    dateOfBirth: valueOf(currentUser?.dateOfBirth),
    contactNumber: valueOf(currentUser?.contactNumber),
    address: valueOf(currentUser?.address),
    department: valueOf(currentUser?.department),
    gradeYearLevel: valueOf(currentUser?.gradeYearLevel),
    section: valueOf(currentUser?.section),
    programCourse: valueOf(currentUser?.programCourse || currentUser?.department),
    schoolYear: valueOf(currentUser?.schoolYear),
    position: valueOf(currentUser?.position),
    employmentType: valueOf(currentUser?.employmentType),
    emergencyContact: valueOf(currentUser?.emergencyContact),
    dateHired: valueOf(currentUser?.dateHired),
  }));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser) return null;

  const setField = (field: keyof ProfileForm, value: string) => setForm((previous) => ({ ...previous, [field]: value }));
  const idField = currentUser.adminId ?? currentUser.studentId ?? currentUser.facultyId ?? currentUser.employeeId;
  const idLabel = currentUser.role === 'admin' ? 'Admin ID' : currentUser.role === 'student' ? 'Student ID' : currentUser.role === 'faculty' ? 'Faculty ID' : currentUser.role === 'staff' ? 'Staff ID' : 'Employee ID';
  const isStudent = currentUser.role === 'student';
  const isEmployee = ['admin', 'staff', 'faculty', 'employee'].includes(currentUser.role);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be smaller than 5 MB.'); return; }
    setError('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${currentUser.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('profile_images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('profile_images').getPublicUrl(path);
      const url = `${pub.publicUrl}?t=${Date.now()}`;
      setProfileImageUrl(url);
      await updateUser(currentUser.id, { profileImage: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setError('');
    const fullName = buildName(form) || currentUser.name.trim();
    if (!(form.firstName ?? '').trim() || !(form.lastName ?? '').trim()) { setError('First name and last name are required.'); return; }
    if (!form.email.trim()) { setError('Email cannot be empty.'); return; }
    if (newPassword && newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword && newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    const updates: Partial<User> = {
      name: fullName,
      email: form.email.trim().toLowerCase(),
      firstName: (form.firstName ?? '').trim(), middleName: (form.middleName ?? '').trim(), lastName: (form.lastName ?? '').trim(), suffix: (form.suffix ?? '').trim(),
      sex: form.sex ?? '', dateOfBirth: form.dateOfBirth ?? '', contactNumber: form.contactNumber ?? '', address: form.address ?? '', department: form.department ?? '',
      ...(isStudent ? { gradeYearLevel: form.gradeYearLevel, section: form.section, programCourse: form.programCourse, schoolYear: form.schoolYear } : {}),
      ...(isEmployee ? { position: form.position, employmentType: form.employmentType, emergencyContact: form.emergencyContact, dateHired: form.dateHired } : {}),
    };

    const ok = await runWithFeedback(
      () => updateUser(currentUser.id, updates, newPassword.trim() || undefined),
      { loadingTitle: 'Saving profile…', successTitle: 'Profile updated', successMessage: 'Your account information has been saved successfully.', autoCloseMs: 1800 },
    );
    if (ok) { setNewPassword(''); setConfirmPassword(''); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 group">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 overflow-hidden hover:bg-white/30 transition-colors"
                title="Change profile picture"
              >
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : uploading ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <span className="text-white font-bold text-3xl">{initials(currentUser)}</span>
                )}
              </button>
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-teal-700 border-2 border-white flex items-center justify-center shadow-sm pointer-events-none">
                <Camera size={13} className="text-white" />
              </span>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageUpload} className="hidden" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white truncate">{currentUser.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap"><Badge label={roleLabel(currentUser.role)} variant={statusVariant(currentUser.role)} />{currentUser.department && <span className="text-teal-100 text-sm">{currentUser.department}</span>}</div>
              <p className="text-teal-100 text-sm mt-1 truncate">{currentUser.email}</p>
              <p className="text-teal-200/70 text-xs mt-0.5">Click the photo to upload a profile picture</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Info icon={BadgeCheck} label={idLabel} value={idField || '—'} />
            <Info icon={Building2} label="College / Department" value={currentUser.department || '—'} />
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5"><Shield size={12} /> School IDs, role, and account status are managed by the administrator.</p>
        </div>

        <div className="px-6 py-5 space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edit Personal Information</h3>
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required value={form.firstName ?? ''} onChange={(value) => setField('firstName', value)} />
            <Field label="Last Name" required value={form.lastName ?? ''} onChange={(value) => setField('lastName', value)} />
            <Field label="Middle Name" value={form.middleName ?? ''} onChange={(value) => setField('middleName', value)} />
            <Field label="Suffix" value={form.suffix ?? ''} onChange={(value) => setField('suffix', value)} placeholder="e.g. Jr., Sr., III" />
            <Field label="Email Address (Username)" type="email" value={form.email} onChange={(value) => setField('email', value)} icon={Mail} required />
            <Field label="Sex" value={form.sex ?? ''} onChange={(value) => setField('sex', value)} />
            <Field label="Date of Birth" type="date" value={form.dateOfBirth ?? ''} onChange={(value) => setField('dateOfBirth', value)} />
            <Field label="Contact Number" value={form.contactNumber ?? ''} onChange={(value) => setField('contactNumber', value)} icon={Phone} />
            <div className="sm:col-span-2"><Field label="Address" value={form.address ?? ''} onChange={(value) => setField('address', value)} icon={MapPin} /></div>
          </div>

          {isStudent && <section className="pt-5 border-t border-slate-100"><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Academic Information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Grade / Year Level" value={form.gradeYearLevel ?? ''} onChange={(value) => setField('gradeYearLevel', value)} icon={GraduationCap} /><Field label="Section" value={form.section ?? ''} onChange={(value) => setField('section', value)} /><Field label="Program / Course" value={form.programCourse ?? ''} onChange={(value) => setField('programCourse', value)} /><Field label="School Year" value={form.schoolYear ?? ''} onChange={(value) => setField('schoolYear', value)} /></div></section>}

          {isEmployee && <section className="pt-5 border-t border-slate-100"><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Employment Information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Position" value={form.position ?? ''} onChange={(value) => setField('position', value)} icon={Briefcase} /><Field label="Employment Type" value={form.employmentType ?? ''} onChange={(value) => setField('employmentType', value)} /><Field label="Date Hired" type="date" value={form.dateHired ?? ''} onChange={(value) => setField('dateHired', value)} icon={Calendar} /><Field label="Emergency Contact" value={form.emergencyContact ?? ''} onChange={(value) => setField('emergencyContact', value)} /></div></section>}

          <section className="pt-5 border-t border-slate-100"><h3 className="text-sm font-semibold text-slate-700 mb-3">Change Password</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="New Password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={setNewPassword} icon={Lock} placeholder="Leave blank to keep current" action={<button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} /><Field label="Confirm Password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={setConfirmPassword} icon={Lock} placeholder="Re-enter new password" /></div><p className="text-xs text-slate-400 mt-2">Password must be at least 6 characters. Leave both fields blank to keep your current password.</p></section>

          <div className="flex justify-end pt-2 border-t border-slate-100"><button onClick={handleSave} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"><Save size={15} /> Save Changes</button></div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, icon: Icon, required, action }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; icon?: typeof UserIcon; required?: boolean; action?: ReactNode }) {
  return <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-rose-500">*</span>}</label><div className="relative">{Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`w-full ${Icon ? 'pl-10' : 'pl-3'} ${action ? 'pr-10' : 'pr-3'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all`} />{action && <span className="absolute right-3 top-1/2 -translate-y-1/2">{action}</span>}</div></div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof BadgeCheck; label: string; value: string }) {
  return <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100"><div className="p-2 bg-slate-100 rounded-lg shrink-0"><Icon size={16} className="text-slate-500" /></div><div className="min-w-0"><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-700 truncate">{value}</p></div></div>;
}
