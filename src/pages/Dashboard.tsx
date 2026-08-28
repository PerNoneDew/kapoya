import {
  Users, FileText, ClipboardList, Package, AlertTriangle, CheckCircle, Clock, TrendingUp,
  GraduationCap, Briefcase, Stethoscope, HeartPulse, Pill, Share2, RefreshCw,
  CalendarClock, Activity, ScrollText, UserPlus, Bell, Banknote,
  ArrowRight, ShieldCheck, PackageX, ShieldPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Badge, { statusVariant } from '../components/ui/Badge';
import DashStat from '../components/ui/DashStat';
import AlertPanel from '../components/ui/AlertPanel';
import { Page } from '../types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const todayStr = new Date().toISOString().slice(0, 10);

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { currentUser } = useAuth();
  const { users, healthRecords, requests, inventory, expenses, notifications, auditLogs, dispensingHistory } = useData();
  if (!currentUser) return null;

  const role = currentUser.role;
  const isAdmin = role === 'admin' || role === 'staff';
  const isStudent = role === 'student';
  const isFaculty = role === 'faculty';
  const isEmployee = role === 'employee';
  const isRegularUser = isStudent || isFaculty || isEmployee;

  // ---- Shared metrics ----
  const today = new Date();
  const ninetyDays = new Date(today); ninetyDays.setDate(today.getDate() + 90);

  const lowStockItems = inventory.filter((m) => m.quantity > 0 && m.quantity <= m.minStock);
  const outOfStockItems = inventory.filter((m) => m.quantity === 0);
  const expiredItems = inventory.filter((m) => new Date(m.expiryDate) < today);
  const nearExpiryItems = inventory.filter((m) => {
    const exp = new Date(m.expiryDate);
    return exp >= today && exp <= ninetyDays;
  });

  const pendingReferrals = requests.filter((r) => r.status === 'forwarded');
  const pendingFollowups = requests.filter((r) => r.status === 'processing');
  const upcomingAppointments = requests.filter((r) => r.status === 'approved' && r.submittedAt >= todayStr);

  const todayRequests = requests.filter((r) => r.submittedAt === todayStr || r.updatedAt === todayStr);
  const todayMedical = todayRequests.filter((r) => r.type === 'medical');
  const todayFirstAid = todayRequests.filter((r) => r.type === 'first_aid');
  const todayDispensing = dispensingHistory.filter((d) => d.dispensedAt === todayStr);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const liquidatedExpenses = expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0);

  const unreadNotifs = notifications.filter(
    (n) => !n.read && (n.recipientRoles.includes(role) || n.recipientIds?.includes(currentUser.id))
  ).length;

  const myRequests = requests.filter((r) => r.userId === currentUser.id);
  const myRecord = healthRecords.find((r) => r.userId === currentUser.id);

  const recentActivity = auditLogs.slice(0, 6);

  // ---- Quick actions (admin) ----
  const quickActions: { label: string; icon: typeof Users; page: Page; color: string }[] = [
    { label: 'Add User', icon: UserPlus, page: 'users', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
    { label: 'Inventory', icon: Package, page: 'medicines', color: 'bg-sky-50 text-sky-600 hover:bg-sky-100' },
    { label: 'Requests', icon: ClipboardList, page: 'daily-treatment', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    { label: 'First Aid', icon: ShieldPlus, page: 'first-aid', color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
    { label: 'Liquidation', icon: Banknote, page: 'liquidation', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
    { label: 'Reports', icon: FileText, page: 'reports', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
    { label: 'Audit Trail', icon: ScrollText, page: 'audit-trail', color: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
    { label: 'Notifications', icon: Bell, page: 'notifications', color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
    { label: 'Backup', icon: ShieldCheck, page: 'system-settings', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-teal-100 text-sm font-medium">Welcome back,</p>
            <h2 className="text-2xl font-bold mt-0.5">{currentUser.name}</h2>
            <p className="text-teal-100 text-sm mt-1">{currentUser.department || 'HEALTH SYS SFCG'}</p>
          </div>
          <div className="text-right text-sm text-teal-100">
            <p className="font-medium">{new Date().toLocaleDateString('en-PH', { weekday: 'long' })}</p>
            <p>{new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            {unreadNotifs > 0 && (
              <span className="mt-1 inline-block bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                {unreadNotifs} unread alert{unreadNotifs > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================== ADMIN ==================== */}
      {isAdmin && (
        <>
          {/* 2.1-2.6: People & Today's Services */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <DashStat title="Total Students" value={users.filter((u) => u.role === 'student').length} subtitle="Enrolled" icon={GraduationCap} color="teal" onClick={() => onNavigate('users')} />
            <DashStat title="Total Employees" value={users.filter((u) => u.role === 'employee' || u.role === 'staff' || u.role === 'faculty').length} subtitle="Staff & Faculty" icon={Briefcase} color="sky" onClick={() => onNavigate('users')} />
            <DashStat title="Today's Visits" value={todayRequests.length} subtitle="Patient visits today" icon={Stethoscope} color="violet" onClick={() => onNavigate('daily-treatment')} />
            <DashStat title="Today's Treatments" value={todayMedical.length} subtitle="Medical treatments" icon={Activity} color="emerald" onClick={() => onNavigate('daily-treatment')} />
            <DashStat title="Physical Exams Today" value={todayRequests.filter((r) => r.type === 'physical').length} subtitle="Physical checkups" icon={HeartPulse} color="rose" onClick={() => onNavigate('daily-treatment')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <DashStat title="First Aid Today" value={todayFirstAid.length} subtitle="First aid cases" icon={ShieldPlus} color="rose" onClick={() => onNavigate('first-aid')} />
            <DashStat title="Medicines Issued Today" value={todayDispensing.length} subtitle="Dispensed today" icon={Pill} color="teal" onClick={() => onNavigate('medicines')} />
            <DashStat title="Low-Stock Medicines" value={lowStockItems.length} subtitle="Need restocking" icon={AlertTriangle} color="amber" onClick={() => onNavigate('medicines')} />
            <DashStat title="Out-of-Stock" value={outOfStockItems.length} subtitle="Zero quantity" icon={PackageX} color="rose" onClick={() => onNavigate('medicines')} />
            <DashStat title="Near-Expiry" value={nearExpiryItems.length} subtitle="Within 90 days" icon={Clock} color="amber" onClick={() => onNavigate('medicines')} />
            <DashStat title="Expired Medicines" value={expiredItems.length} subtitle="Past expiry" icon={AlertTriangle} color="rose" onClick={() => onNavigate('medicines')} />
          </div>

          {/* 2.12-2.14: Referrals, Follow-ups, Appointments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DashStat title="Pending Referrals" value={pendingReferrals.length} subtitle="Awaiting external care" icon={Share2} color="sky" onClick={() => onNavigate('daily-treatment')} />
            <DashStat title="Pending Follow-ups" value={pendingFollowups.length} subtitle="In progress" icon={RefreshCw} color="amber" onClick={() => onNavigate('daily-treatment')} />
            <DashStat title="Upcoming Appointments" value={upcomingAppointments.length} subtitle="Approved & scheduled" icon={CalendarClock} color="teal" onClick={() => onNavigate('daily-treatment')} />
          </div>

          {/* 2.16: Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => onNavigate(action.page)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${action.color}`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 2.15: Recent System Activities */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Recent System Activities</h3>
                <button onClick={() => onNavigate('audit-trail')} className="text-teal-500 hover:text-teal-600 text-xs font-medium">View all →</button>
              </div>
              <div className="divide-y divide-slate-50">
                {recentActivity.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No recent activity.</div>
                ) : recentActivity.map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <span className="text-teal-600 font-semibold text-xs">{log.userName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{log.action}</p>
                      <p className="text-xs text-slate-400">{log.userName} · {log.module}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 hidden sm:block">{log.timestamp.slice(11)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Low stock + out of stock alerts */}
              <AlertPanel
                title="Low & Out-of-Stock Alerts"
                icon={AlertTriangle}
                accent="amber"
                items={[
                  ...lowStockItems.map((m) => ({ id: m.id, name: m.name, meta: `${m.quantity} ${m.unit} left (min: ${m.minStock})`, badge: 'Low', badgeColor: 'amber' as const })),
                  ...outOfStockItems.map((m) => ({ id: m.id, name: m.name, meta: 'Out of stock', badge: 'Out', badgeColor: 'rose' as const })),
                ]}
                emptyMessage="All items sufficiently stocked."
                onNavigate={() => onNavigate('medicines')}
              />

              {/* Financial summary */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <TrendingUp size={15} className="text-teal-500" />
                  <h3 className="font-semibold text-slate-800 text-sm">Financial Summary</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Expenses</span>
                    <span className="font-semibold text-slate-800">₱{totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Liquidated</span>
                    <span className="font-semibold text-emerald-600">₱{liquidatedExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pending</span>
                    <span className="font-semibold text-amber-600">₱{(totalExpenses - liquidatedExpenses).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${totalExpenses > 0 ? (liquidatedExpenses / totalExpenses) * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{totalExpenses > 0 ? Math.round((liquidatedExpenses / totalExpenses) * 100) : 0}% liquidated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== FACULTY / EMPLOYEE / STUDENT ==================== */}
      {isRegularUser && (
        <>
          {/* 2.27/2.29/2.31: Own Health Information */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <DashStat title="My Health Record" value={myRecord ? 1 : 0} subtitle={myRecord ? `Last checkup: ${myRecord.lastCheckup}` : 'Visit clinic to create'} icon={FileText} color="teal" onClick={() => onNavigate('health-records')} />
            <DashStat title="My Requests" value={myRequests.length} subtitle="Total submitted" icon={ClipboardList} color="sky" onClick={() => onNavigate('daily-treatment')} />
            <DashStat title="Pending" value={myRequests.filter((r) => r.status === 'pending' || r.status === 'processing').length} subtitle="Awaiting review" icon={Clock} color="amber" onClick={() => onNavigate('daily-treatment')} />
            <DashStat title="Approved" value={myRequests.filter((r) => r.status === 'approved' || r.status === 'released').length} subtitle="Completed" icon={CheckCircle} color="emerald" onClick={() => onNavigate('daily-treatment')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 2.28/2.30/2.32: Own Request Status */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">My Recent Requests</h3>
                <button onClick={() => onNavigate('daily-treatment')} className="text-teal-500 hover:text-teal-600 text-xs font-medium">View all →</button>
              </div>
              <div className="divide-y divide-slate-50">
                {myRequests.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No requests submitted yet.</div>
                ) : myRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 capitalize truncate">{req.type} Request</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{req.description}</p>
                      {req.remarks && <p className="text-xs text-teal-600 mt-0.5 truncate">Remarks: {req.remarks}</p>}
                    </div>
                    <div className="ml-4 shrink-0">
                      <Badge label={req.status.charAt(0).toUpperCase() + req.status.slice(1)} variant={statusVariant(req.status)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health summary card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">My Health Summary</h3>
              </div>
              {myRecord ? (
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Allergies</span><span className="font-semibold text-slate-700 text-right max-w-[140px] truncate">{myRecord.allergies.length > 0 ? myRecord.allergies.join(', ') : 'None'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Conditions</span><span className="font-semibold text-slate-700 text-right max-w-[140px] truncate">{myRecord.conditions.length > 0 ? myRecord.conditions.join(', ') : 'None'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Last Checkup</span><span className="font-semibold text-slate-700">{myRecord.lastCheckup}</span></div>
                  <div className="pt-2 border-t border-slate-100">
                    <button onClick={() => onNavigate('health-records')} className="text-teal-500 hover:text-teal-600 text-xs font-medium flex items-center gap-1">
                      View full record <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <FileText size={32} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No health record on file.</p>
                  <p className="text-slate-400 text-xs mt-1">Visit the clinic to create your health record.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
