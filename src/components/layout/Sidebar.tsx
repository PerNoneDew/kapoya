import { useState } from 'react';
import {
  LayoutDashboard, Users, FileText, ClipboardList, Package, Banknote, Bell,
  BarChart3, LogOut, ChevronRight, ChevronDown, History, Settings,
  Stethoscope, Pill, Share2, RefreshCw, CalendarClock,
  ShoppingCart, Truck, ArrowLeftRight, Upload, Printer, UserCog,
  Lock, GraduationCap, Briefcase, HeartPulse, ShieldPlus, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Page } from '../../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavChild {
  id: Page;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

interface NavGroup {
  id: Page;
  label: string;
  icon: React.ElementType;
  roles: string[];
  children?: NavChild[];
}

const navGroups: NavGroup[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
    roles: ['admin', 'student', 'staff', 'employee'],
  },
  {
    id: 'health-records', label: 'Health Record', icon: HeartPulse,
    roles: ['student', 'employee', 'faculty'],
  },
  {
    id: 'people-health-records', label: 'People & Health Records', icon: Users,
    roles: ['admin', 'staff'],
    children: [
      { id: 'students', label: 'Students', icon: GraduationCap },
      { id: 'employees', label: 'Employees', icon: Briefcase },
      { id: 'health-records', label: 'Health Records', icon: HeartPulse },
      { id: 'bulk-import', label: 'Bulk Import', icon: Upload, roles: ['admin'] },
    ],
  },
  {
    id: 'health-services', label: 'Health Services', icon: Stethoscope,
    roles: ['admin', 'staff'],
    children: [
      { id: 'daily-treatment', label: 'Daily Treatment', icon: ClipboardList },
      { id: 'first-aid', label: 'First Aid', icon: ShieldPlus },
      { id: 'physical-examination', label: 'Physical Examination', icon: HeartPulse },
      { id: 'medical-issuance', label: 'Medical Issuance', icon: FileText },
      { id: 'referral', label: 'Referral', icon: Share2 },
      { id: 'follow-up', label: 'Follow-up', icon: RefreshCw },
      { id: 'appointment', label: 'Appointment', icon: CalendarClock },
    ],
  },
  {
    id: 'inventory-purchases', label: 'Inventory & Purchases', icon: Package,
    roles: ['admin', 'staff'],
    children: [
      { id: 'medicines', label: 'Medicines', icon: Pill },
      { id: 'medical-supplies', label: 'Medical & Supplies', icon: Package },
      { id: 'stock-transactions', label: 'Stock Transactions', icon: ArrowLeftRight },
      { id: 'suppliers', label: 'Suppliers', icon: Truck },
      { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
      { id: 'liquidation', label: 'Liquidation', icon: Banknote },
    ],
  },
  {
    id: 'reports-notifications', label: 'Reports & Notification', icon: BarChart3,
    roles: ['admin', 'staff'],
    children: [
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'printing', label: 'Printing', icon: Printer },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    id: 'user-management', label: 'User Management', icon: UserCog,
    roles: ['admin'],
    children: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'roles-permissions', label: 'Roles & Permissions', icon: Lock },
      { id: 'system-settings', label: 'System Settings', icon: Settings },
      { id: 'login-history', label: 'Login History', icon: History },
      { id: 'audit-trail', label: 'Audit Trail', icon: History },
    ],
  },
];

const studentEmployeeNavGroups: NavGroup[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
    roles: ['student', 'employee'],
  },
  {
    id: 'health-records', label: 'My Health Record', icon: HeartPulse,
    roles: ['student', 'employee'],
  },
  {
    id: 'health-services-history', label: 'Health Services History', icon: Activity,
    roles: ['student', 'employee'],
  },
  {
    id: 'notifications', label: 'Notifications', icon: Bell,
    roles: ['student', 'employee'],
  },
];

const facultyNavGroups: NavGroup[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
    roles: ['faculty'],
  },
  {
    id: 'health-records', label: 'My Health Record', icon: HeartPulse,
    roles: ['faculty'],
  },
  {
    id: 'health-services-history', label: 'Health Services History', icon: Activity,
    roles: ['faculty'],
  },
  {
    id: 'notifications', label: 'Notifications', icon: Bell,
    roles: ['faculty'],
  },
];

const roleColors: Record<string, string> = {
  admin: 'bg-teal-400/20 text-teal-200',
  student: 'bg-slate-400/20 text-slate-300',
  staff: 'bg-amber-400/20 text-amber-200',
  faculty: 'bg-violet-400/20 text-violet-200',
  employee: 'bg-rose-400/20 text-rose-200',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  student: 'Student',
  staff: 'Staff',
  faculty: 'Faculty',
  employee: 'Employee',
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  if (!currentUser) return null;

  const isStudentOrEmployee = currentUser.role === 'student' || currentUser.role === 'employee';
  const isFaculty = currentUser.role === 'faculty';
  const visibleGroups = isStudentOrEmployee ? studentEmployeeNavGroups
    : isFaculty ? facultyNavGroups
    : navGroups.filter((g) => g.roles.includes(currentUser.role));

  const isPageInGroup = (group: NavGroup): boolean => {
    if (currentPage === group.id) return true;
    return group.children?.some((c) => c.id === currentPage) ?? false;
  };

  const toggleGroup = (groupId: Page) => {
    if (!visibleGroups.find((g) => g.id === groupId)?.children) {
      onNavigate(groupId);
      return;
    }
    setExpandedGroup((prev) => (prev === groupId ? null : groupId));
  };

  const handleChildClick = (page: Page) => {
    onNavigate(page);
  };

  return (
    <aside className="w-64 shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-auto shrink-0" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">HEALTH SYS SFCG</p>
            <p className="text-slate-400 text-xs">St. Francis College Health System</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-slate-700/50">
        <button
          onClick={() => onNavigate('profile')}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition-colors group"
          title="Open My Profile"
        >
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 ring-1 ring-teal-400/20 overflow-hidden">
            {currentUser.profileImage ? <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" /> : <span className="text-teal-300 font-bold text-sm">{(currentUser.firstName?.charAt(0) || currentUser.name.charAt(0)).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate group-hover:text-teal-100">{currentUser.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleColors[currentUser.role] ?? 'bg-slate-400/20 text-slate-300'}`}>
              {roleLabels[currentUser.role] ?? currentUser.role}
            </span>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {visibleGroups.map((group) => {
          const Icon = group.icon;
          const hasChildren = !!group.children;
          const isExpanded = expandedGroup === group.id;
          const isActive = isPageInGroup(group);

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive && !hasChildren
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                    : isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1 text-left">{group.label}</span>
                {hasChildren && (
                  <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${isActive ? 'text-teal-200' : 'text-slate-500'}`} />
                )}
                {isActive && !hasChildren && <ChevronRight size={14} className="text-teal-200" />}
              </button>

              {hasChildren && isExpanded && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700/50 space-y-0.5">
                  {group.children!.filter((child) => !child.roles || child.roles.includes(currentUser.role)).map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = currentPage === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => handleChildClick(child.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          childActive
                            ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <ChildIcon size={14} className={childActive ? 'text-white' : 'text-slate-500'} />
                        <span className="flex-1 text-left">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-slate-600 text-center">
            {currentUser.role === 'admin' && (currentUser as any).adminId ? `ID: ${(currentUser as any).adminId}` :
             currentUser.role === 'student' && (currentUser as any).studentId ? `ID: ${(currentUser as any).studentId}` :
             currentUser.role === 'faculty' && (currentUser as any).facultyId ? `ID: ${(currentUser as any).facultyId}` :
             (currentUser as any).employeeId ? `ID: ${(currentUser as any).employeeId}` :
             currentUser.department ?? ''}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
