import { useState } from 'react';
import { Search, UserCheck, UserX } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { User } from '../../types';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function UserManagement() {
  const { users } = useData();
  const { toggleUserStatus } = useAuth();
  const { runWithFeedback } = useFeedback();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleToggleStatus = async (id: string) => {
    const target = users.find((u) => u.id === id);
    const activating = target?.status === 'inactive';
    const ok = await runWithFeedback(
      () => toggleUserStatus(id),
      {
        loadingTitle: activating ? 'Activating account…' : 'Deactivating account…',
        successTitle: activating ? 'Account activated' : 'Account deactivated',
        successMessage: activating ? `${target?.name} can sign in again.` : `${target?.name} can no longer sign in.`,
        autoCloseMs: 1800,
      },
    );
    if (ok) {
      setShowToggleConfirm(false);
      setToggleTarget(null);
    }
  };

  const openToggleConfirm = (u: User) => {
    setToggleTarget(u);
    setShowToggleConfirm(true);
  };

  const roleCounts = {
    admin: users.filter((u) => u.role === 'admin').length,
    student: users.filter((u) => u.role === 'student').length,
    staff: users.filter((u) => u.role === 'staff').length,
    faculty: users.filter((u) => u.role === 'faculty').length,
    employee: users.filter((u) => u.role === 'employee').length,
  };

  return (
    <div className="space-y-5">
      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['admin', 'student', 'staff', 'faculty', 'employee'] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
            className={`bg-white rounded-xl p-4 border text-left transition-all ${roleFilter === r ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-100 hover:border-teal-200'}`}>
            <p className="text-2xl font-bold text-slate-800">{roleCounts[r]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{roleLabel(r)}s</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="faculty">Faculty</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">College</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <span className="text-teal-600 font-semibold text-sm">{u.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><Badge label={roleLabel(u.role)} variant={statusVariant(u.role)} /></td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500">{u.department || '—'}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-xs text-slate-400">{u.studentId || u.facultyId || u.employeeId || u.adminId || '—'}</td>
                  <td className="px-5 py-3.5"><Badge label={u.status === 'active' ? 'Active' : 'Inactive'} variant={statusVariant(u.status)} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openToggleConfirm(u)} className={`p-1.5 rounded-lg transition-colors ${u.status === 'active' ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}>
                        {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No users found.</div>}
        </div>
      </div>

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        isOpen={showToggleConfirm}
        onClose={() => { setShowToggleConfirm(false); setToggleTarget(null); }}
        onConfirm={() => toggleTarget && handleToggleStatus(toggleTarget.id)}
        title={toggleTarget?.status === 'active' ? 'Deactivate User Account' : 'Activate User Account'}
        message={toggleTarget?.status === 'active'
          ? `Are you sure you want to deactivate ${toggleTarget?.name}? They will no longer be able to access the system.`
          : `Are you sure you want to reactivate ${toggleTarget?.name}? They will regain access to the system.`
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        type={toggleTarget?.status === 'active' ? 'danger' : 'success'}
        details={toggleTarget?.status === 'active' ? [
          'User will be logged out immediately',
          'User cannot log in until reactivated',
          'All user data will be preserved'
        ] : [
          'User will regain system access',
          'Previous permissions will be restored'
        ]}
      />
    </div>
  );
}
