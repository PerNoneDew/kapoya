import { useState } from 'react';
import { History, Printer, Lock } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { FeedbackProvider } from './context/FeedbackContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/users/UserManagement';
import StudentManagement from './pages/users/StudentManagement';
import EmployeeManagement from './pages/users/EmployeeManagement';
import BulkImport from './pages/users/BulkImport';
import HealthRecords from './pages/health/HealthRecords';
import DailyTreatment from './pages/health/DailyTreatment';

import PhysicalExamination from './pages/health/PhysicalExamination';
import MedicineIssuance from './pages/health/MedicineIssuance';
import ReferralManagement from './pages/health/ReferralManagement';
import FollowUpManagement from './pages/health/FollowUpManagement';
import AppointmentManagement from './pages/health/AppointmentManagement';
import FirstAid from './pages/health/FirstAid';
import HealthServicesHistory from './pages/health/HealthServicesHistory';
import InventoryManagement from './pages/inventory/InventoryManagement';
import MedicalSuppliesManagement from './pages/inventory/MedicalSuppliesManagement';
import StockTransactions from './pages/inventory/StockTransactions';
import SupplierManagement from './pages/inventory/SupplierManagement';
import PurchaseManagement from './pages/inventory/PurchaseManagement';
import Liquidation from './pages/liquidation/Liquidation';
import Notifications from './pages/notifications/Notifications';
import Reports from './pages/reports/Reports';
import AuditTrail from './pages/audit/AuditTrail';
import BackupRecovery from './pages/backup/BackupRecovery';
import Profile from './pages/Profile';
import Placeholder from './pages/Placeholder';
import { Page } from './types';

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: dataLoading, loadError } = useData();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your data…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 max-w-md text-center">
          <p className="font-semibold text-rose-700">Couldn't load your data</p>
          <p className="text-sm text-slate-500 mt-1">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl">Retry</button>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;

      // People & Health Records
      case 'people-health-records':
        return <HealthRecords />;
      case 'students':
        return <StudentManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'health-records':
        return <HealthRecords />;
      case 'bulk-import':
        return <BulkImport />;

      // Health Services
      case 'health-services':
      case 'daily-treatment':
        return <DailyTreatment />;
      case 'first-aid':
        return <FirstAid />;
      case 'physical-examination':
        return <PhysicalExamination />;
      case 'medical-issuance':
        return <MedicineIssuance />;
      case 'referral':
        return <ReferralManagement />;
      case 'follow-up':
        return <FollowUpManagement />;
      case 'appointment':
        return <AppointmentManagement />;

      // Inventory & Purchases
      case 'inventory-purchases':
      case 'medicines':
        return <InventoryManagement />;
      case 'medical-supplies':
        return <MedicalSuppliesManagement />;
      case 'stock-transactions':
        return <StockTransactions />;
      case 'suppliers':
        return <SupplierManagement />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'liquidation':
        return <Liquidation />;

      // Reports & Notification
      case 'reports-notifications':
      case 'reports':
        return <Reports />;
      case 'printing':
        return <Placeholder title="Printing" description="Print health record forms, medical certificates, liquidation reports, and other documents." icon={Printer} />;
      case 'notifications':
        return <Notifications />;

      // User Management
      case 'user-management':
      case 'users':
        return <UserManagement />;
      case 'roles-permissions':
        return <Placeholder title="Roles & Permissions" description="Configure system roles, define access levels, and manage feature permissions for each role." icon={Lock} />;
      case 'system-settings':
        return currentUser.role === 'admin' ? <BackupRecovery /> : <Dashboard onNavigate={setCurrentPage} />;
      case 'login-history':
        return <Placeholder title="Login History" description="View a detailed log of all user login activity, including timestamps and IP addresses." icon={History} />;
      case 'audit-trail':
        return <AuditTrail />;

      case 'health-services-history':
        return <HealthServicesHistory />;

      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <FeedbackProvider>
          <AppContent />
        </FeedbackProvider>
      </DataProvider>
    </AuthProvider>
  );
}
