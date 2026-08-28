import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users, FileText, ClipboardList, Package,
  TrendingUp, Activity, AlertTriangle, CheckCircle,
  Stethoscope, Pill, CalendarDays, Download, Printer,
  FileSpreadsheet, HeartPulse, Banknote, Bell, ScrollText,
} from 'lucide-react';
import { ExpenseCategory, RequestType } from '../../types';

function escapeCsv(value: string | number | undefined | null): string {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: (string | number | undefined | null)[][]): void {
  const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const categoryLabels: Record<ExpenseCategory, string> = {
  medicines: 'Medicines',
  equipment: 'Equipment',
  supplies: 'Supplies',
  services: 'Services',
  other: 'Other',
};

const requestTypeLabels: Record<RequestType, string> = {
  medical: 'Medical',
  dental: 'Dental',
  physical: 'Physical Exam',
  medicine: 'Medicine',
  first_aid: 'First Aid',
};

const catColors: Record<ExpenseCategory, string> = {
  medicines: 'bg-teal-400',
  equipment: 'bg-sky-400',
  supplies: 'bg-amber-400',
  services: 'bg-rose-400',
  other: 'bg-slate-400',
};

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-400',
  processing: 'bg-sky-400',
  pending: 'bg-amber-400',
  rejected: 'bg-rose-400',
};

const roleBarColors: Record<string, string> = {
  admin: 'bg-teal-400',
  student: 'bg-teal-400',
  staff: 'bg-amber-400',
  faculty: 'bg-violet-400',
  employee: 'bg-rose-400',
};

export default function Reports() {
  const { currentUser } = useAuth();
  const { users, healthRecords, requests, inventory, expenses, notifications, auditLogs } = useData();
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'staff';

  const activeUsers = users.filter((u) => u.status === 'active').length;
  const totalRequests = requests.length;
  const approvedRequests = requests.filter((r) => r.status === 'approved' || r.status === 'released').length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
  const lowStockCount = inventory.filter((m) => m.quantity <= m.minStock).length;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const liquidatedExpenses = expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0);

  // Shared: requests by type & status
  const requestsByType = (Object.keys(requestTypeLabels) as RequestType[]).map((type) => ({
    type,
    label: requestTypeLabels[type],
    count: requests.filter((r) => r.type === type).length,
  })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  const maxRequestCount = Math.max(...requestsByType.map((r) => r.count), 1);

  const requestsByStatus = ['pending', 'processing', 'approved', 'rejected'].map((status) => ({
    status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    count: requests.filter((r) => r.status === status).length,
  }));
  const maxStatusCount = Math.max(...requestsByStatus.map((r) => r.count), 1);

  // Admin-only
  const expensesByCategory = (Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => ({
    cat,
    label: categoryLabels[cat],
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((e) => e.total > 0).sort((a, b) => b.total - a.total);
  const maxExpense = Math.max(...expensesByCategory.map((e) => e.total), 1);

  const usersByRole = ['admin', 'student', 'staff', 'faculty', 'employee'].map((role) => ({
    role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
    count: users.filter((u) => u.role === role).length,
  }));
  const maxRoleCount = Math.max(...usersByRole.map((r) => r.count), 1);

  // Health officer: consultation report data (9.5)
  const consultationRequests = requests.filter((r) => r.type === 'medical');
  const consultByStatus = ['pending', 'processing', 'approved', 'rejected', 'released'].map((s) => ({
    status: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: consultationRequests.filter((r) => r.status === s).length,
  })).filter((s) => s.count > 0);
  const consultByRole = ['student', 'staff', 'faculty', 'employee'].map((role) => ({
    role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
    count: consultationRequests.filter((r) => {
      const u = users.find((u) => u.id === r.userId);
      return u?.role === role;
    }).length,
  })).filter((r) => r.count > 0);

  // Health officer: medicine report data (9.6)
  const today = new Date();
  const ninetyDays = new Date(today); ninetyDays.setDate(today.getDate() + 90);
  const expiredMeds = inventory.filter((m) => new Date(m.expiryDate) < today);
  const expiringMeds = inventory.filter((m) => new Date(m.expiryDate) >= today && new Date(m.expiryDate) <= ninetyDays);
  const lowStockMeds = inventory.filter((m) => m.quantity <= m.minStock);
  const medicinesByCategory = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'other'].map((cat) => ({
    cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: inventory.filter((m) => m.category === cat).length,
  })).filter((c) => c.count > 0);
  const maxMedCat = Math.max(...medicinesByCategory.map((c) => c.count), 1);

  // Health officer: daily service report data (9.7)
  const todayStr = today.toISOString().slice(0, 10);
  const todayRequests = requests.filter((r) => r.submittedAt?.slice(0, 10) === todayStr);
  const recentRequests = requests.slice(0, 10);
  const activeRecords = healthRecords.filter((r) => !('archived' in r && (r as { archived?: boolean }).archived));

  const topMedicines = [...inventory].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const printConsultReport = () => { setShowConsultModal(true); };
  const printMedReport = () => { setShowMedModal(true); };
  const printDailyReport = () => { setShowDailyModal(true); };

  // ---------- CSV exports ----------
  const csvDate = today.toISOString().slice(0, 10);

  const exportUsersCsv = () => {
    const rows: (string | number)[][] = [
      ['ID', 'Name', 'Email', 'Role', 'Department', 'Student ID', 'Employee ID', 'Faculty ID', 'Admin ID', 'Status', 'Created At'],
      ...users.map((u) => [u.id, u.name, u.email, u.role, u.department ?? '', u.studentId ?? '', u.employeeId ?? '', u.facultyId ?? '', u.adminId ?? '', u.status, u.createdAt]),
    ];
    downloadCsv(`users_${csvDate}.csv`, rows);
  };

  const exportHealthRecordsCsv = () => {
    const rows: (string | number)[][] = [
      ['ID', 'User ID', 'User Name', 'Role', 'Department', 'Allergies', 'Conditions', 'Medications', 'Height', 'Weight', 'BMI', 'Vision', 'Dental Status', 'Last Checkup', 'Next Checkup', 'Emergency Contact', 'Emergency Phone', 'Notes', 'Archived', 'Forward Status', 'Forwarded To', 'Forward Reason', 'Forwarded By', 'Forwarded At', 'Created At', 'Updated At'],
      ...healthRecords.map((r) => [
        r.id, r.userId, r.userName, r.userRole ?? '', r.department ?? '',
        r.allergies.join('; '), r.conditions.join('; '), r.medications.join('; '),
        r.height, r.weight, r.bmi ?? '', r.vision ?? '', r.dentalStatus ?? '',
        r.lastCheckup, r.nextCheckup ?? '', r.emergencyContact ?? '', r.emergencyPhone ?? '',
        r.notes, r.archived ? 'Yes' : 'No', r.forwardStatus ?? '', r.forwardedTo ?? '',
        r.forwardReason ?? '', r.forwardedBy ?? '', r.forwardedAt ?? '', r.createdAt, r.updatedAt,
      ]),
    ];
    downloadCsv(`health_records_${csvDate}.csv`, rows);
  };

  const exportRequestsCsv = () => {
    const rows: (string | number)[][] = [
      ['ID', 'User ID', 'User Name', 'Role', 'Service Type', 'Description', 'Status', 'Attachments', 'Submitted At', 'Updated At', 'Reviewed By', 'Review Notes', 'Remarks', 'Forwarded To', 'Forward Reason', 'Forwarded By', 'Forwarded At'],
      ...requests.map((r) => [
        r.id, r.userId, r.userName, r.userRole ?? '', r.type, r.description, r.status,
        r.attachments.join('; '), r.submittedAt, r.updatedAt, r.reviewedBy ?? '',
        r.reviewNotes ?? '', r.remarks ?? '', r.forwardedTo ?? '', r.forwardReason ?? '',
        r.forwardedBy ?? '', r.forwardedAt ?? '',
      ]),
    ];
    downloadCsv(`service_requests_${csvDate}.csv`, rows);
  };

  const exportInventoryCsv = () => {
    const rows: (string | number)[][] = [
      ['ID', 'Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Expiry Date', 'Supplier', 'Last Updated', 'Primary Key Date'],
      ...inventory.map((m) => [m.id, m.name, m.category, m.quantity, m.unit, m.minStock, m.expiryDate, m.supplier, m.lastUpdated, m.primaryKeyDate ?? '']),
    ];
    downloadCsv(`medicine_inventory_${csvDate}.csv`, rows);
  };

  const exportExpensesCsv = () => {
    const rows: (string | number)[][] = [
      ['ID', 'Description', 'Amount', 'Category', 'Date', 'Recorded By', 'Receipt No', 'Status', 'Reviewed By', 'Review Notes', 'Liquidated At'],
      ...expenses.map((e) => [e.id, e.description, e.amount, e.category, e.date, e.recordedBy, e.receiptNo, e.status, e.reviewedBy ?? '', e.reviewNotes ?? '', e.liquidatedAt ?? '']),
    ];
    downloadCsv(`expenses_${csvDate}.csv`, rows);
  };

  const exportNotificationsCsv = () => {
    const rows: (string | number)[][] = [
      ['ID', 'Title', 'Message', 'Recipient Roles', 'Sent By', 'Sent At', 'Type', 'Read'],
      ...notifications.map((n) => [n.id, n.title, n.message, n.recipientRoles.join('; '), n.sentBy, n.sentAt, n.type, n.read ? 'Yes' : 'No']),
    ];
    downloadCsv(`notifications_${csvDate}.csv`, rows);
  };

  const exportAuditLogsCsv = () => {
    const rows: (string | number)[][] = [
      ['ID', 'User ID', 'User Name', 'Action', 'Module', 'Details', 'IP Address', 'Timestamp', 'Type'],
      ...auditLogs.map((l) => [l.id, l.userId, l.userName, l.action, l.module, l.details, l.ipAddress, l.timestamp, l.type]),
    ];
    downloadCsv(`audit_logs_${csvDate}.csv`, rows);
  };

  const fmtPeso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: Date) => d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  const printAdminPdfReport = () => {
    const reportDate = fmtDate(new Date());
    const reportTime = fmtTime(new Date());
    const liquidationRate = totalExpenses > 0 ? Math.round((liquidatedExpenses / totalExpenses) * 100) : 0;
    const pendingExpenses = totalExpenses - liquidatedExpenses;

    const expensesTableRows = expensesByCategory.map(({ label, total }) => {
      const pct = totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(1) : '0.0';
      return `<tr><td>${label}</td><td style="text-align:right">${fmtPeso(total)}</td><td style="text-align:right">${pct}%</td></tr>`;
    }).join('');

    const usersTableRows = usersByRole.map(({ label, count }) => {
      const pct = users.length > 0 ? ((count / users.length) * 100).toFixed(1) : '0.0';
      return `<tr><td>${label}</td><td style="text-align:right">${count}</td><td style="text-align:right">${pct}%</td></tr>`;
    }).join('');

    const requestTypeRows = requestsByType.map(({ label, count }) => {
      const pct = totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(1) : '0.0';
      return `<tr><td>${label}</td><td style="text-align:right">${count}</td><td style="text-align:right">${pct}%</td></tr>`;
    }).join('');

    const requestStatusRows = requestsByStatus.map(({ label, count }) => {
      const pct = totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(1) : '0.0';
      return `<tr><td>${label}</td><td style="text-align:right">${count}</td><td style="text-align:right">${pct}%</td></tr>`;
    }).join('');

    const topMedsRows = topMedicines.map((m, i) => {
      const status = m.quantity <= m.minStock ? 'LOW STOCK' : 'Adequate';
      const statusColor = m.quantity <= m.minStock ? '#dc2626' : '#059669';
      return `<tr><td style="text-align:center">${i + 1}</td><td>${m.name}</td><td>${m.category}</td><td style="text-align:right">${m.quantity} ${m.unit}</td><td style="text-align:right">${m.minStock}</td><td style="text-align:center;color:${statusColor};font-weight:600">${status}</td></tr>`;
    }).join('');

    const lowStockRows = lowStockMeds.length > 0
      ? lowStockMeds.map((m) => `<tr><td>${m.name}</td><td>${m.category}</td><td style="text-align:right">${m.quantity} ${m.unit}</td><td style="text-align:right">${m.minStock}</td><td>${m.supplier}</td></tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:#059669">All items sufficiently stocked</td></tr>';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Comprehensive Health System Report — ${reportDate}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1e293b; line-height: 1.6; font-size: 11pt; }
  .header { text-align: center; border-bottom: 3px double #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
  .header h1 { font-size: 18pt; color: #0f172a; letter-spacing: 0.5px; }
  .header h2 { font-size: 13pt; color: #0d9488; margin-top: 4px; font-weight: 600; }
  .header .meta { font-size: 9pt; color: #64748b; margin-top: 8px; }
  .meta-row { display: flex; justify-content: space-between; margin-top: 4px; }
  .doc-info { display: flex; justify-content: space-between; font-size: 9pt; color: #475569; margin-bottom: 20px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
  .section { margin-bottom: 22px; page-break-inside: avoid; }
  .section-title { font-size: 12pt; font-weight: 700; color: #0f172a; border-left: 4px solid #0d9488; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th { background: #0d9488; color: #ffffff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px; }
  .summary-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; }
  .summary-card .label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 20pt; font-weight: 700; color: #0f172a; margin-top: 4px; }
  .summary-card .sub { font-size: 8pt; color: #94a3b8; margin-top: 2px; }
  .summary-card.teal { border-top: 3px solid #0d9488; }
  .summary-card.sky { border-top: 3px solid #0ea5e9; }
  .summary-card.emerald { border-top: 3px solid #059669; }
  .summary-card.rose { border-top: 3px solid #e11d48; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .financial-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; }
  .financial-box .fin-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 10pt; border-bottom: 1px dotted #e2e8f0; }
  .financial-box .fin-row:last-child { border-bottom: none; }
  .financial-box .fin-total { font-weight: 700; font-size: 12pt; color: #0d9488; }
  .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 6px; }
  .progress-fill { height: 100%; background: #0d9488; border-radius: 4px; }
  .signature-block { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
  .sig-line { width: 240px; text-align: center; }
  .sig-line .line { border-top: 1px solid #1e293b; margin-bottom: 4px; margin-top: 50px; }
  .sig-line .name { font-weight: 600; font-size: 10pt; }
  .sig-line .title { font-size: 9pt; color: #64748b; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 8pt; color: #94a3b8; text-align: center; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 8pt; font-weight: 600; }
  .note { font-size: 9pt; color: #64748b; font-style: italic; margin-top: 6px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <h1>HEALTH SYS SFCG</h1>
    <h2>Comprehensive Health System Analytical Report</h2>
    <div class="meta">
      Saint Francis College — Guihulngan, Negros Oriental, Incorporated<br/>
      Bateria, Guihulngan City, Negros Oriental
    </div>
  </div>

  <div class="doc-info">
    <span><strong>Report Date:</strong> ${reportDate} at ${reportTime}</span>
    <span><strong>Prepared By:</strong> ${currentUser.name}</span>
    <span><strong>Document ID:</strong> ADM-RPT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}</span>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="summary-grid">
      <div class="summary-card teal"><div class="label">Active Users</div><div class="value">${activeUsers}</div><div class="sub">of ${users.length} total</div></div>
      <div class="summary-card sky"><div class="label">Health Records</div><div class="value">${activeRecords.length}</div><div class="sub">of ${healthRecords.length} total</div></div>
      <div class="summary-card emerald"><div class="label">Approval Rate</div><div class="value">${approvalRate}%</div><div class="sub">${approvedRequests} approved</div></div>
      <div class="summary-card rose"><div class="label">Low Stock Items</div><div class="value">${lowStockCount}</div><div class="sub">of ${inventory.length} items</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Service Requests Analysis</div>
    <div class="two-col">
      <div>
        <h3 style="font-size:10pt;margin-bottom:8px;color:#334155">Requests by Type</h3>
        <table><thead><tr><th>Service Type</th><th style="text-align:right">Count</th><th style="text-align:right">Share</th></tr></thead><tbody>${requestTypeRows || '<tr><td colspan="3" style="text-align:center;color:#94a3b8">No data</td></tr>'}</tbody></table>
      </div>
      <div>
        <h3 style="font-size:10pt;margin-bottom:8px;color:#334155">Requests by Status</h3>
        <table><thead><tr><th>Status</th><th style="text-align:right">Count</th><th style="text-align:right">Share</th></tr></thead><tbody>${requestStatusRows}</tbody></table>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Financial Overview — Liquidation</div>
    <div class="two-col">
      <div class="financial-box">
        <div class="fin-row"><span>Total Expenses</span><span style="font-weight:600">${fmtPeso(totalExpenses)}</span></div>
        <div class="fin-row"><span style="color:#059669">Liquidated</span><span style="font-weight:600;color:#059669">${fmtPeso(liquidatedExpenses)}</span></div>
        <div class="fin-row"><span style="color:#d97706">Pending Liquidation</span><span style="font-weight:600;color:#d97706">${fmtPeso(pendingExpenses)}</span></div>
        <div class="fin-row fin-total" style="border-top:2px solid #0d9488;margin-top:6px;padding-top:8px"><span>Liquidation Rate</span><span>${liquidationRate}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${liquidationRate}%"></div></div>
      </div>
      <div>
        <h3 style="font-size:10pt;margin-bottom:8px;color:#334155">Expenses by Category</h3>
        <table><thead><tr><th>Category</th><th style="text-align:right">Amount</th><th style="text-align:right">Share</th></tr></thead><tbody>${expensesTableRows || '<tr><td colspan="3" style="text-align:center;color:#94a3b8">No expense data</td></tr>'}</tbody></table>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">User Demographics</div>
    <div class="two-col">
      <div>
        <h3 style="font-size:10pt;margin-bottom:8px;color:#334155">Users by Role</h3>
        <table><thead><tr><th>Role</th><th style="text-align:right">Count</th><th style="text-align:right">Share</th></tr></thead><tbody>${usersTableRows}</tbody></table>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Medicine Inventory — Top Stocked Items</div>
    <table><thead><tr><th style="text-align:center;width:30px">#</th><th>Medicine</th><th>Category</th><th style="text-align:right">Quantity</th><th style="text-align:right">Min Stock</th><th style="text-align:center">Status</th></tr></thead><tbody>${topMedsRows}</tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Critical Inventory — Low Stock Items Requiring Restock</div>
    <table><thead><tr><th>Medicine</th><th>Category</th><th style="text-align:right">Current Qty</th><th style="text-align:right">Min Stock</th><th>Supplier</th></tr></thead><tbody>${lowStockRows}</tbody></table>
  </div>

  <div class="signature-block">
    <div class="sig-line">
      <div class="line"></div>
      <div class="name">${currentUser.name}</div>
      <div class="title">System Administrator</div>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <div class="name">Date: ${reportDate}</div>
      <div class="title">Date of Issuance</div>
    </div>
  </div>

  <div class="footer">
    This report was generated electronically by HEALTH SYS SFCG on ${reportDate} at ${reportTime}.<br/>
    Confidential — For internal administrative use only. Saint Francis College, Guihulngan City, Negros Oriental.
  </div>

</body>
</html>`;

    // Use a hidden iframe instead of window.open to avoid pop-up blockers
    // and blank-page timing issues. The iframe is embedded in the current
    // document so we have full control over when print() fires.
    const existingFrame = document.getElementById('pdf-print-frame') as HTMLIFrameElement | null;
    if (existingFrame) existingFrame.remove();

    // Signal to the session timer that a print dialog is open
    (window as any).__healthSysPrinting = true;

    const iframe = document.createElement('iframe');
    iframe.id = 'pdf-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc) { (window as any).__healthSysPrinting = false; return; }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    const cleanupFrame = () => {
      const f = document.getElementById('pdf-print-frame');
      if (f) f.remove();
      (window as any).__healthSysPrinting = false;
    };

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Clean up the iframe after the print dialog is handled
        setTimeout(cleanupFrame, 1000);
      } catch {
        // If printing fails, remove the iframe
        cleanupFrame();
      }
    };

    // Wait for the iframe content to fully load before printing
    iframe.onload = () => setTimeout(triggerPrint, 300);
    // Fallback: if onload doesn't fire within 2s, try printing anyway
    setTimeout(() => {
      try {
        if (iframe.contentWindow?.document.readyState === 'complete') {
          triggerPrint();
        }
      } catch { cleanupFrame(); }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Admin: PDF Print button — at the very top */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <FileText size={22} className="text-teal-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Formal PDF Report</h3>
              <p className="text-xs text-slate-300 mt-0.5">Generate a printable comprehensive administrative report with all analytics</p>
            </div>
          </div>
          <button
            onClick={printAdminPdfReport}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30"
          >
            <Printer size={16} /> Print PDF Report
          </button>
        </div>
      )}

      {/* Admin: CSV export section */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileSpreadsheet size={18} className="text-emerald-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Export Data as CSV</h3>
              <p className="text-xs text-slate-400">Download a spreadsheet file of any data set for record-keeping or external analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Users', sub: `${users.length} records`, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', border: 'hover:border-teal-300', action: exportUsersCsv },
              { label: 'Health Records', sub: `${healthRecords.length} records`, icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50', border: 'hover:border-rose-300', action: exportHealthRecordsCsv },
              { label: 'Service Requests', sub: `${requests.length} records`, icon: ClipboardList, color: 'text-sky-600', bg: 'bg-sky-50', border: 'hover:border-sky-300', action: exportRequestsCsv },
              { label: 'Medicine Inventory', sub: `${inventory.length} records`, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'hover:border-amber-300', action: exportInventoryCsv },
              { label: 'Expenses', sub: `${expenses.length} records`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-300', action: exportExpensesCsv },
              { label: 'Notifications', sub: `${notifications.length} records`, icon: Bell, color: 'text-violet-600', bg: 'bg-violet-50', border: 'hover:border-violet-300', action: exportNotificationsCsv },
              { label: 'Audit Logs', sub: `${auditLogs.length} records`, icon: ScrollText, color: 'text-slate-600', bg: 'bg-slate-100', border: 'hover:border-slate-300', action: exportAuditLogsCsv },
            ].map(({ label, sub, icon: Icon, color, bg, border, action }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 ${border} bg-white transition-all hover:shadow-md text-left group`}
              >
                <div className={`p-2.5 ${bg} rounded-lg shrink-0`}><Icon size={18} className={color} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
                <Download size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Users', value: activeUsers, sub: `of ${users.length} total`, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Health Records', value: activeRecords.length, sub: `of ${healthRecords.length} total`, icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Approval Rate', value: `${approvalRate}%`, sub: `${approvedRequests} approved`, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Low Stock Items', value: lowStockCount, sub: `of ${inventory.length} items`, icon: Package, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <div className={`p-2.5 ${bg} rounded-xl`}><Icon size={18} className={color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Report generation buttons */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Consultation Report', sub: 'Breakdown by type, status, and user role', icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', btnColor: 'bg-teal-500 hover:bg-teal-600', action: printConsultReport },
            { label: 'Medicine Report', sub: 'Stock levels, expiry, and category analysis', icon: Pill, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', btnColor: 'bg-sky-500 hover:bg-sky-600', action: printMedReport },
            { label: 'Daily Service Report', sub: "Today's service activity and patient summary", icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', btnColor: 'bg-emerald-500 hover:bg-emerald-600', action: printDailyReport },
          ].map(({ label, sub, icon: Icon, color, bg, border, btnColor, action }) => (
            <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm flex flex-col gap-3`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 ${bg} rounded-xl`}><Icon size={18} className={color} /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              </div>
              <button onClick={action} className={`mt-auto flex items-center justify-center gap-2 ${btnColor} text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors`}>
                <Download size={14} /> Generate Report
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shared: requests charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList size={16} className="text-teal-500" />
            <h3 className="font-semibold text-slate-800">Requests by Type</h3>
          </div>
          {requestsByType.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No request data.</p>
          ) : (
            <div className="space-y-3">
              {requestsByType.map(({ type, label, count }) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{label}</span>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-teal-400 h-2 rounded-full transition-all" style={{ width: `${(count / maxRequestCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-sky-500" />
            <h3 className="font-semibold text-slate-800">Requests by Status</h3>
          </div>
          <div className="space-y-3">
            {requestsByStatus.map(({ status, label, count }) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">{label}</span>
                  <span className="font-bold text-slate-800">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${statusColors[status]} h-2 rounded-full transition-all`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional analytics */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Package size={16} className="text-teal-500" />
              <h3 className="font-semibold text-slate-800">Top Medicine Stock</h3>
            </div>
            <div className="space-y-3">
              {topMedicines.map((m) => {
                const isLow = m.quantity <= m.minStock;
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={`shrink-0 p-1.5 rounded-lg ${isLow ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                      {isLow ? <AlertTriangle size={12} className="text-rose-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-medium text-slate-700 truncate">{m.name}</span>
                        <span className={`text-xs font-bold ${isLow ? 'text-rose-500' : 'text-slate-700'}`}>{m.quantity}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`${isLow ? 'bg-rose-400' : 'bg-emerald-400'} h-1.5 rounded-full`}
                          style={{ width: `${Math.min((m.quantity / (m.minStock * 5)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin-only charts */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-emerald-500" />
                <h3 className="font-semibold text-slate-800">Expenses by Category</h3>
              </div>
              {expensesByCategory.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No expense data.</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {expensesByCategory.map(({ cat, label, total }) => (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 font-medium">{label}</span>
                          <span className="font-bold text-slate-800">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`${catColors[cat]} h-2 rounded-full transition-all`} style={{ width: `${(total / maxExpense) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between text-sm">
                    <span className="text-slate-500">Liquidation Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${totalExpenses > 0 ? (liquidatedExpenses / totalExpenses) * 100 : 0}%` }} />
                      </div>
                      <span className="font-bold text-teal-600">{totalExpenses > 0 ? Math.round((liquidatedExpenses / totalExpenses) * 100) : 0}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users size={16} className="text-amber-500" />
                <h3 className="font-semibold text-slate-800">Users by Role</h3>
              </div>
              <div className="space-y-3">
                {usersByRole.map(({ role, label, count }) => (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 font-medium">{label}</span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${roleBarColors[role] ?? 'bg-amber-400'} h-2 rounded-full transition-all`} style={{ width: `${(count / maxRoleCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Package size={16} className="text-teal-500" />
                <h3 className="font-semibold text-slate-800">Top Medicine Stock</h3>
              </div>
              <div className="space-y-3">
                {topMedicines.map((m) => {
                  const isLow = m.quantity <= m.minStock;
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className={`shrink-0 p-1.5 rounded-lg ${isLow ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        {isLow ? <AlertTriangle size={12} className="text-rose-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs font-medium text-slate-700 truncate">{m.name}</span>
                          <span className={`text-xs font-bold ${isLow ? 'text-rose-500' : 'text-slate-700'}`}>{m.quantity}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className={`${isLow ? 'bg-rose-400' : 'bg-emerald-400'} h-1.5 rounded-full`}
                            style={{ width: `${Math.min((m.quantity / (m.minStock * 5)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-teal-500" />
              <h3 className="font-semibold text-slate-800">Financial Overview</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Total Budget Used</p>
                <p className="text-2xl font-bold text-slate-800">₱{totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Liquidated</p>
                <p className="text-2xl font-bold text-emerald-600">₱{liquidatedExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Pending Liquidation</p>
                <p className="text-2xl font-bold text-amber-600">₱{(totalExpenses - liquidatedExpenses).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Liquidation Progress</span>
                <span>{totalExpenses > 0 ? Math.round((liquidatedExpenses / totalExpenses) * 100) : 0}% complete</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-gradient-to-r from-teal-400 to-teal-500 h-3 rounded-full transition-all shadow-sm shadow-teal-200"
                  style={{ width: `${totalExpenses > 0 ? (liquidatedExpenses / totalExpenses) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 9.5 Consultation Report Modal */}
      {showConsultModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConsultModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-xl"><Stethoscope size={16} className="text-teal-500" /></div>
                <div>
                  <h3 className="font-semibold text-slate-800">Consultation Report</h3>
                  <p className="text-xs text-slate-400">Generated {todayStr}</p>
                </div>
              </div>
              <button onClick={() => setShowConsultModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-teal-700">{consultationRequests.length}</p>
                <p className="text-xs text-teal-600 mt-0.5">Total Consultations</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{consultationRequests.filter((r) => r.status === 'approved' || r.status === 'released').length}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Completed</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">By Status</h4>
              {consultByStatus.length === 0 ? <p className="text-slate-400 text-xs">No data.</p> : (
                <div className="space-y-2">
                  {consultByStatus.map(({ status, label, count }) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-28 bg-slate-100 rounded-full h-1.5">
                          <div className={`${statusColors[status] ?? 'bg-slate-400'} h-1.5 rounded-full`}
                            style={{ width: `${(count / Math.max(consultByStatus.reduce((s, c) => s + c.count, 0), 1)) * 100}%` }} />
                        </div>
                        <span className="font-bold text-slate-800 w-5 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">By User Category</h4>
              {consultByRole.length === 0 ? <p className="text-slate-400 text-xs">No data.</p> : (
                <div className="space-y-2">
                  {consultByRole.map(({ role, label, count }) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-28 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-teal-400 h-1.5 rounded-full"
                            style={{ width: `${(count / Math.max(consultByRole.reduce((s, c) => s + c.count, 0), 1)) * 100}%` }} />
                        </div>
                        <span className="font-bold text-slate-800 w-5 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Consultations</h4>
              <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {consultationRequests.slice(0, 5).map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-700">{r.userName}</p>
                      <p className="text-slate-400">{r.submittedAt?.slice(0, 10)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] ? 'text-white' : 'bg-slate-100 text-slate-600'} text-xs`}
                      style={{ background: r.status === 'approved' || r.status === 'released' ? '#10b981' : r.status === 'pending' ? '#f59e0b' : r.status === 'rejected' ? '#f43f5e' : '#38bdf8', color: '#fff' }}>
                      {r.status}
                    </span>
                  </div>
                ))}
                {consultationRequests.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">No consultations found.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9.6 Medicine Report Modal */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMedModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 rounded-xl"><Pill size={16} className="text-sky-500" /></div>
                <div>
                  <h3 className="font-semibold text-slate-800">Medicine Inventory Report</h3>
                  <p className="text-xs text-slate-400">Generated {todayStr}</p>
                </div>
              </div>
              <button onClick={() => setShowMedModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Items', value: inventory.length, bg: 'bg-sky-50', text: 'text-sky-700' },
                { label: 'Low Stock', value: lowStockMeds.length, bg: 'bg-amber-50', text: 'text-amber-700' },
                { label: 'Expired', value: expiredMeds.length, bg: 'bg-rose-50', text: 'text-rose-700' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-bold ${text}`}>{value}</p>
                  <p className={`text-xs ${text} opacity-75 mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>

            {expiringMeds.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-700 mb-2">Expiring Within 90 Days ({expiringMeds.length})</p>
                <div className="space-y-1">
                  {expiringMeds.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex justify-between text-xs text-amber-700">
                      <span>{m.name}</span>
                      <span className="font-medium">{m.expiryDate}</span>
                    </div>
                  ))}
                  {expiringMeds.length > 4 && <p className="text-xs text-amber-500">+{expiringMeds.length - 4} more</p>}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">By Category</h4>
              <div className="space-y-2">
                {medicinesByCategory.map(({ cat, label, count }) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: `${(count / maxMedCat) * 100}%` }} />
                      </div>
                      <span className="font-bold text-slate-800 w-5 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Low Stock Items</h4>
              <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {lowStockMeds.slice(0, 6).map((m) => (
                  <div key={m.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-700">{m.name}</p>
                      <p className="text-slate-400">{m.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">{m.quantity} left</p>
                      <p className="text-slate-400">min: {m.minStock}</p>
                    </div>
                  </div>
                ))}
                {lowStockMeds.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">All items sufficiently stocked.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9.7 Daily Service Report Modal */}
      {showDailyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDailyModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl"><CalendarDays size={16} className="text-emerald-500" /></div>
                <div>
                  <h3 className="font-semibold text-slate-800">Daily Service Report</h3>
                  <p className="text-xs text-slate-400">{todayStr}</p>
                </div>
              </div>
              <button onClick={() => setShowDailyModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Today's Requests", value: todayRequests.length, bg: 'bg-emerald-50', text: 'text-emerald-700' },
                { label: 'Active Records', value: activeRecords.length, bg: 'bg-sky-50', text: 'text-sky-700' },
                { label: 'Pending Reviews', value: requests.filter((r) => r.status === 'pending').length, bg: 'bg-amber-50', text: 'text-amber-700' },
                { label: 'Released Today', value: requests.filter((r) => r.status === 'released').length, bg: 'bg-teal-50', text: 'text-teal-700' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${text}`}>{value}</p>
                  <p className={`text-xs ${text} opacity-75 mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Service Activity</h4>
              <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {recentRequests.slice(0, 8).map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-700">{r.userName}</p>
                      <p className="text-slate-400">{requestTypeLabels[r.type as RequestType] ?? r.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: r.status === 'approved' || r.status === 'released' ? '#d1fae5' : r.status === 'pending' ? '#fef3c7' : r.status === 'rejected' ? '#fee2e2' : '#e0f2fe',
                          color: r.status === 'approved' || r.status === 'released' ? '#065f46' : r.status === 'pending' ? '#92400e' : r.status === 'rejected' ? '#9f1239' : '#0c4a6e',
                        }}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentRequests.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">No service activity found.</div>}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-medium text-slate-700 mb-2">Summary</p>
              <div className="flex justify-between"><span>Total Requests (All Time)</span><span className="font-semibold text-slate-700">{requests.length}</span></div>
              <div className="flex justify-between"><span>Approval Rate</span><span className="font-semibold text-emerald-600">{approvalRate}%</span></div>
              <div className="flex justify-between"><span>Health Records</span><span className="font-semibold text-slate-700">{healthRecords.length}</span></div>
              <div className="flex justify-between"><span>Active Patients</span><span className="font-semibold text-slate-700">{activeRecords.length}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
