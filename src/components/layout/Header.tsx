import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Page } from '../../types';

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  'people-health-records': 'People & Health Records',
  students: 'Students',
  employees: 'Employees',
  'health-records': 'Health Records',
  'bulk-import': 'Bulk Import',
  'health-services': 'Health Services',
  'daily-treatment': 'Daily Treatment',
  dental: 'Dental',
  'physical-examination': 'Physical Examination',
  'medical-issuance': 'Medical Issuance',
  referral: 'Referral',
  'follow-up': 'Follow-up',
  appointment: 'Appointment',
  'first-aid': 'First Aid',
  'inventory-purchases': 'Inventory & Purchases',
  medicines: 'Medicines',
  'medical-supplies': 'Medical & Supplies',
  'stock-transactions': 'Stock Transactions',
  suppliers: 'Suppliers',
  purchases: 'Purchases',
  liquidation: 'Liquidation',
  'reports-notifications': 'Reports & Notification',
  reports: 'Reports',
  printing: 'Printing',
  notifications: 'Notifications',
  'user-management': 'User Management',
  users: 'Users',
  'roles-permissions': 'Roles & Permissions',
  'system-settings': 'System Settings',
  'login-history': 'Login History',
  'audit-trail': 'Audit Trail',
  profile: 'My Profile',
  'health-services-history': 'Health Services History',
};

const pageSubtitles: Record<Page, string> = {
  dashboard: 'Overview of your health management system',
  'people-health-records': 'Manage students, employees, and health records',
  students: 'View and manage student records',
  employees: 'View and manage employee records',
  'health-records': 'View and manage patient health records and forms',
  'bulk-import': 'Import multiple records at once',
  'health-services': 'Manage daily health services and appointments',
  'daily-treatment': 'Record and track daily treatments',
  dental: 'Dental consultations and procedures',
  'physical-examination': 'Physical examination records and scheduling',
  'medical-issuance': 'Issue medical certificates and documents',
  referral: 'Manage patient referrals to external facilities',
  'follow-up': 'Track patient follow-up schedules',
  appointment: 'Manage health service appointments',
  'first-aid': 'Record and track first aid treatments',
  'inventory-purchases': 'Monitor stock, supplies, and purchases',
  medicines: 'Manage medicine inventory',
  'medical-supplies': 'Manage medical and clinic supplies',
  'stock-transactions': 'Track stock in and stock out transactions',
  suppliers: 'Manage supplier information',
  purchases: 'Record and track purchase orders',
  liquidation: 'Track expenses and generate liquidation reports',
  'reports-notifications': 'Generate reports, print documents, and send notifications',
  reports: 'Generate and view analytical reports',
  printing: 'Print forms, certificates, and documents',
  notifications: 'Manage system alerts and notifications',
  'user-management': 'Manage users, roles, permissions, and system settings',
  users: 'Manage user accounts and access',
  'roles-permissions': 'Configure roles and access permissions',
  'system-settings': 'Configure system-wide settings',
  'login-history': 'View user login history',
  'audit-trail': 'View login history, user activities, and record changes',
  profile: 'View and update your personal account information',
  'health-services-history': 'View your complete clinic visit history and download as PDF',
};

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { currentUser } = useAuth();
  const { notifications } = useData();

  if (!currentUser) return null;

  const unreadCount = notifications.filter(
    (n) => !n.read && (n.recipientRoles.includes(currentUser.role) || n.recipientIds?.includes(currentUser.id))
  ).length;

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{pageTitles[currentPage]}</h1>
        <p className="text-sm text-slate-400 mt-0.5">{pageSubtitles[currentPage]}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent w-48 transition-all focus:w-64"
          />
        </div>
        <button
          onClick={() => onNavigate('notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onNavigate('profile')}
          className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shadow-sm shadow-teal-200 hover:bg-teal-600 transition-colors overflow-hidden"
          title="Open My Profile"
        >
          {currentUser.profileImage ? <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-sm">{(currentUser.firstName?.charAt(0) || currentUser.name.charAt(0)).toUpperCase()}</span>}
        </button>
      </div>
    </header>
  );
}
