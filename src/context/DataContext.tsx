import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { HealthRecord, Request, Medicine, Expense, Notification, AuditLog, BackupRecord, MedicineDispensing, User, DataSnapshot, HealthFormRequest, PatientVisit, Referral, FollowUp, Appointment, MedicalSupply, StockTransaction, Supplier, Purchase, SchoolSettings } from '../types';
import * as db from '../lib/db';

export type { DataSnapshot };

interface DataContextType {
  users: User[];
  healthRecords: HealthRecord[];
  setHealthRecords: React.Dispatch<React.SetStateAction<HealthRecord[]>>;
  requests: Request[];
  setRequests: React.Dispatch<React.SetStateAction<Request[]>>;
  inventory: Medicine[];
  setInventory: React.Dispatch<React.SetStateAction<Medicine[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  backupRecords: BackupRecord[];
  setBackupRecords: React.Dispatch<React.SetStateAction<BackupRecord[]>>;
  dispensingHistory: MedicineDispensing[];
  setDispensingHistory: React.Dispatch<React.SetStateAction<MedicineDispensing[]>>;
  snapshots: DataSnapshot[];
  addSnapshot: (snapshot: DataSnapshot) => void;
  resetAllData: () => void;
  restoreFromBackup: (backup: { users: User[]; healthRecords: HealthRecord[]; requests: Request[]; inventory: Medicine[]; expenses: Expense[]; notifications: Notification[]; auditLogs: AuditLog[]; dispensingHistory: MedicineDispensing[] }) => void;
  getInitialSnapshot: () => DataSnapshot | null;
  restoreUsersData: (users: User[]) => void;
  loading: boolean;
  loadError: string | null;
  persistHealthRecord: (record: HealthRecord) => Promise<void>;
  persistRequest: (req: Request) => Promise<void>;
  persistMedicine: (med: Medicine) => Promise<void>;
  removeMedicine: (id: string) => Promise<void>;
  persistExpense: (exp: Expense) => Promise<void>;
  persistNotification: (notif: Notification) => Promise<void>;
  persistDispensing: (d: MedicineDispensing) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  addAuditLog: (log: AuditLog) => Promise<void>;
  healthFormRequests: HealthFormRequest[];
  setHealthFormRequests: React.Dispatch<React.SetStateAction<HealthFormRequest[]>>;
  persistHealthFormRequest: (req: HealthFormRequest) => Promise<void>;
  patientVisits: PatientVisit[];
  setPatientVisits: React.Dispatch<React.SetStateAction<PatientVisit[]>>;
  persistPatientVisit: (v: PatientVisit) => Promise<void>;
  removePatientVisit: (id: string) => Promise<void>;
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  persistReferral: (r: Referral) => Promise<void>;
  removeReferral: (id: string) => Promise<void>;
  followUps: FollowUp[];
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUp[]>>;
  persistFollowUp: (f: FollowUp) => Promise<void>;
  removeFollowUp: (id: string) => Promise<void>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  persistAppointment: (a: Appointment) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
  medicalSupplies: MedicalSupply[];
  setMedicalSupplies: React.Dispatch<React.SetStateAction<MedicalSupply[]>>;
  persistMedicalSupply: (s: MedicalSupply) => Promise<void>;
  removeMedicalSupply: (id: string) => Promise<void>;
  stockTransactions: StockTransaction[];
  setStockTransactions: React.Dispatch<React.SetStateAction<StockTransaction[]>>;
  persistStockTransaction: (t: StockTransaction) => Promise<void>;
  removeStockTransaction: (id: string) => Promise<void>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  persistSupplier: (s: Supplier) => Promise<void>;
  removeSupplier: (id: string) => Promise<void>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  persistPurchase: (p: Purchase) => Promise<void>;
  removePurchase: (id: string) => Promise<void>;
  schoolSettings: SchoolSettings | null;
  persistSchoolSettings: (s: SchoolSettings) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { users, restoreUsers } = useAuth();
  const [healthRecords, setHealthRecordsState] = useState<HealthRecord[]>([]);
  const [requests, setRequestsState] = useState<Request[]>([]);
  const [inventory, setInventoryState] = useState<Medicine[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogsState] = useState<AuditLog[]>([]);
  const [backupRecords, setBackupRecordsState] = useState<BackupRecord[]>([]);
  const [dispensingHistory, setDispensingHistoryState] = useState<MedicineDispensing[]>([]);
  const [healthFormRequests, setHealthFormRequestsState] = useState<HealthFormRequest[]>([]);
  const [patientVisits, setPatientVisitsState] = useState<PatientVisit[]>([]);
  const [referrals, setReferralsState] = useState<Referral[]>([]);
  const [followUps, setFollowUpsState] = useState<FollowUp[]>([]);
  const [appointments, setAppointmentsState] = useState<Appointment[]>([]);
  const [medicalSupplies, setMedicalSuppliesState] = useState<MedicalSupply[]>([]);
  const [stockTransactions, setStockTransactionsState] = useState<StockTransaction[]>([]);
  const [suppliers, setSuppliersState] = useState<Supplier[]>([]);
  const [purchases, setPurchasesState] = useState<Purchase[]>([]);
  const [snapshots, setSnapshots] = useState<DataSnapshot[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load all data from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hr, req, med, exp, notif, audit, backup, disp, snap, hfr, pv, ref, fu, appt, ms, st, sup, pur, ss] = await Promise.all([
          db.fetchHealthRecords(),
          db.fetchRequests(),
          db.fetchMedicines(),
          db.fetchExpenses(),
          db.fetchNotifications(),
          db.fetchAuditLogs(),
          db.fetchBackupRecords(),
          db.fetchDispensing(),
          db.fetchSnapshots(),
          db.fetchHealthFormRequests(),
          db.fetchPatientVisits(),
          db.fetchReferrals(),
          db.fetchFollowUps(),
          db.fetchAppointments(),
          db.fetchMedicalSupplies(),
          db.fetchStockTransactions(),
          db.fetchSuppliers(),
          db.fetchPurchases(),
          db.fetchSchoolSettings(),
        ]);
        setSchoolSettings(ss);
        if (cancelled) return;
        setHealthRecordsState(hr);
        setRequestsState(req);
        setInventoryState(med);
        setExpensesState(exp);
        setNotificationsState(notif);
        setAuditLogsState(audit);
        setBackupRecordsState(backup);
        setDispensingHistoryState(disp);
        setSnapshots(snap);
        setHealthFormRequestsState(hfr);
        setPatientVisitsState(pv);
        setReferralsState(ref);
        setFollowUpsState(fu);
        setAppointmentsState(appt);
        setMedicalSuppliesState(ms);
        setStockTransactionsState(st);
        setSuppliersState(sup);
        setPurchasesState(pur);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Wrapped setters that persist to Supabase
  const setHealthRecords: React.Dispatch<React.SetStateAction<HealthRecord[]>> = useCallback((updater) => {
    setHealthRecordsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: HealthRecord[]) => HealthRecord[])(prev) : updater;
      // Persist diff (upsert all for simplicity; Supabase upsert is idempotent by PK)
      db.upsertHealthRecords(next).catch((e) => console.error('persist healthRecords:', e));
      return next;
    });
  }, []);

  const setRequests: React.Dispatch<React.SetStateAction<Request[]>> = useCallback((updater) => {
    setRequestsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Request[]) => Request[])(prev) : updater;
      db.upsertRequestsAll(next).catch((e) => console.error('persist requests:', e));
      return next;
    });
  }, []);

  const setInventory: React.Dispatch<React.SetStateAction<Medicine[]>> = useCallback((updater) => {
    setInventoryState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Medicine[]) => Medicine[])(prev) : updater;
      db.upsertMedicinesAll(next).catch((e) => console.error('persist inventory:', e));
      return next;
    });
  }, []);

  const setExpenses: React.Dispatch<React.SetStateAction<Expense[]>> = useCallback((updater) => {
    setExpensesState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Expense[]) => Expense[])(prev) : updater;
      db.upsertExpensesAll(next).catch((e) => console.error('persist expenses:', e));
      return next;
    });
  }, []);

  const setNotifications: React.Dispatch<React.SetStateAction<Notification[]>> = useCallback((updater) => {
    setNotificationsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Notification[]) => Notification[])(prev) : updater;
      db.upsertNotificationsAll(next).catch((e) => console.error('persist notifications:', e));
      return next;
    });
  }, []);

  const setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>> = useCallback((updater) => {
    setAuditLogsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: AuditLog[]) => AuditLog[])(prev) : updater;
      db.upsertAuditLogsAll(next).catch((e) => console.error('persist auditLogs:', e));
      return next;
    });
  }, []);

  const setBackupRecords: React.Dispatch<React.SetStateAction<BackupRecord[]>> = useCallback((updater) => {
    setBackupRecordsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: BackupRecord[]) => BackupRecord[])(prev) : updater;
      db.upsertBackupRecordsAll(next).catch((e) => console.error('persist backupRecords:', e));
      return next;
    });
  }, []);

  const setDispensingHistory: React.Dispatch<React.SetStateAction<MedicineDispensing[]>> = useCallback((updater) => {
    setDispensingHistoryState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: MedicineDispensing[]) => MedicineDispensing[])(prev) : updater;
      db.upsertDispensingAll(next).catch((e) => console.error('persist dispensing:', e));
      return next;
    });
  }, []);

  // Awaitable single-item persist helpers (update state + await DB write)
  const persistHealthRecord = useCallback(async (record: HealthRecord): Promise<void> => {
    setHealthRecordsState((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      return idx >= 0 ? prev.map((r) => (r.id === record.id ? record : r)) : [...prev, record];
    });
    await db.upsertHealthRecord(record);
  }, []);

  const persistRequest = useCallback(async (req: Request): Promise<void> => {
    setRequestsState((prev) => {
      const idx = prev.findIndex((r) => r.id === req.id);
      return idx >= 0 ? prev.map((r) => (r.id === req.id ? req : r)) : [...prev, req];
    });
    await db.upsertRequest(req);
  }, []);

  const persistMedicine = useCallback(async (med: Medicine): Promise<void> => {
    setInventoryState((prev) => {
      const idx = prev.findIndex((m) => m.id === med.id);
      return idx >= 0 ? prev.map((m) => (m.id === med.id ? med : m)) : [...prev, med];
    });
    await db.upsertMedicine(med);
  }, []);
  const removeMedicine = useCallback(async (id: string): Promise<void> => {
    setInventoryState((prev) => prev.filter((m) => m.id !== id));
    await db.deleteMedicineRow(id);
  }, []);

  const persistExpense = useCallback(async (exp: Expense): Promise<void> => {
    setExpensesState((prev) => {
      const idx = prev.findIndex((e) => e.id === exp.id);
      return idx >= 0 ? prev.map((e) => (e.id === exp.id ? exp : e)) : [...prev, exp];
    });
    await db.upsertExpense(exp);
  }, []);

  const persistNotification = useCallback(async (notif: Notification): Promise<void> => {
    setNotificationsState((prev) => {
      const idx = prev.findIndex((n) => n.id === notif.id);
      return idx >= 0 ? prev.map((n) => (n.id === notif.id ? notif : n)) : [...prev, notif];
    });
    await db.upsertNotification(notif);
  }, []);

  const persistDispensing = useCallback(async (d: MedicineDispensing): Promise<void> => {
    setDispensingHistoryState((prev) => [...prev, d]);
    await db.upsertDispensing(d);
  }, []);

  const removeNotification = useCallback(async (id: string): Promise<void> => {
    setNotificationsState((prev) => prev.filter((n) => n.id !== id));
    await db.deleteNotificationRow(id);
  }, []);

  const addAuditLog = useCallback(async (log: AuditLog): Promise<void> => {
    setAuditLogsState((prev) => [...prev, log]);
    await db.upsertAuditLogsAll([log]);
  }, []);

  const setHealthFormRequests: React.Dispatch<React.SetStateAction<HealthFormRequest[]>> = useCallback((updater) => {
    setHealthFormRequestsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: HealthFormRequest[]) => HealthFormRequest[])(prev) : updater;
      db.upsertHealthFormRequestsAll(next).catch((e) => console.error('persist healthFormRequests:', e));
      return next;
    });
  }, []);

  const persistHealthFormRequest = useCallback(async (req: HealthFormRequest): Promise<void> => {
    setHealthFormRequestsState((prev) => {
      const idx = prev.findIndex((r) => r.id === req.id);
      return idx >= 0 ? prev.map((r) => (r.id === req.id ? req : r)) : [...prev, req];
    });
    await db.upsertHealthFormRequest(req);
  }, []);

  const setPatientVisits: React.Dispatch<React.SetStateAction<PatientVisit[]>> = useCallback((updater) => {
    setPatientVisitsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: PatientVisit[]) => PatientVisit[])(prev) : updater;
      db.upsertPatientVisitsAll(next).catch((e) => console.error('persist patientVisits:', e));
      return next;
    });
  }, []);
  const persistPatientVisit = useCallback(async (v: PatientVisit): Promise<void> => {
    setPatientVisitsState((prev) => {
      const idx = prev.findIndex((p) => p.id === v.id);
      return idx >= 0 ? prev.map((p) => (p.id === v.id ? v : p)) : [...prev, v];
    });
    await db.upsertPatientVisit(v);
  }, []);
  const removePatientVisit = useCallback(async (id: string): Promise<void> => {
    setPatientVisitsState((prev) => prev.filter((p) => p.id !== id));
    await db.deletePatientVisitRow(id);
  }, []);

  const setReferrals: React.Dispatch<React.SetStateAction<Referral[]>> = useCallback((updater) => {
    setReferralsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Referral[]) => Referral[])(prev) : updater;
      db.upsertReferralsAll(next).catch((e) => console.error('persist referrals:', e));
      return next;
    });
  }, []);
  const persistReferral = useCallback(async (r: Referral): Promise<void> => {
    setReferralsState((prev) => {
      const idx = prev.findIndex((p) => p.id === r.id);
      return idx >= 0 ? prev.map((p) => (p.id === r.id ? r : p)) : [...prev, r];
    });
    await db.upsertReferral(r);
  }, []);
  const removeReferral = useCallback(async (id: string): Promise<void> => {
    setReferralsState((prev) => prev.filter((p) => p.id !== id));
    await db.deleteReferralRow(id);
  }, []);

  const setFollowUps: React.Dispatch<React.SetStateAction<FollowUp[]>> = useCallback((updater) => {
    setFollowUpsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: FollowUp[]) => FollowUp[])(prev) : updater;
      db.upsertFollowUpsAll(next).catch((e) => console.error('persist followUps:', e));
      return next;
    });
  }, []);
  const persistFollowUp = useCallback(async (f: FollowUp): Promise<void> => {
    setFollowUpsState((prev) => {
      const idx = prev.findIndex((p) => p.id === f.id);
      return idx >= 0 ? prev.map((p) => (p.id === f.id ? f : p)) : [...prev, f];
    });
    await db.upsertFollowUp(f);
  }, []);
  const removeFollowUp = useCallback(async (id: string): Promise<void> => {
    setFollowUpsState((prev) => prev.filter((p) => p.id !== id));
    await db.deleteFollowUpRow(id);
  }, []);

  const setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>> = useCallback((updater) => {
    setAppointmentsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Appointment[]) => Appointment[])(prev) : updater;
      db.upsertAppointmentsAll(next).catch((e) => console.error('persist appointments:', e));
      return next;
    });
  }, []);
  const persistAppointment = useCallback(async (a: Appointment): Promise<void> => {
    setAppointmentsState((prev) => {
      const idx = prev.findIndex((p) => p.id === a.id);
      return idx >= 0 ? prev.map((p) => (p.id === a.id ? a : p)) : [...prev, a];
    });
    await db.upsertAppointment(a);
  }, []);
  const removeAppointment = useCallback(async (id: string): Promise<void> => {
    setAppointmentsState((prev) => prev.filter((p) => p.id !== id));
    await db.deleteAppointmentRow(id);
  }, []);

  const setMedicalSupplies: React.Dispatch<React.SetStateAction<MedicalSupply[]>> = useCallback((updater) => {
    setMedicalSuppliesState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: MedicalSupply[]) => MedicalSupply[])(prev) : updater;
      db.upsertMedicalSuppliesAll(next).catch((e) => console.error('persist medicalSupplies:', e));
      return next;
    });
  }, []);
  const persistMedicalSupply = useCallback(async (s: MedicalSupply): Promise<void> => {
    setMedicalSuppliesState((prev) => {
      const idx = prev.findIndex((m) => m.id === s.id);
      return idx >= 0 ? prev.map((m) => (m.id === s.id ? s : m)) : [...prev, s];
    });
    await db.upsertMedicalSupply(s);
  }, []);
  const removeMedicalSupply = useCallback(async (id: string): Promise<void> => {
    setMedicalSuppliesState((prev) => prev.filter((m) => m.id !== id));
    await db.deleteMedicalSupplyRow(id);
  }, []);

  const setStockTransactions: React.Dispatch<React.SetStateAction<StockTransaction[]>> = useCallback((updater) => {
    setStockTransactionsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: StockTransaction[]) => StockTransaction[])(prev) : updater;
      db.upsertStockTransactionsAll(next).catch((e) => console.error('persist stockTransactions:', e));
      return next;
    });
  }, []);
  const persistStockTransaction = useCallback(async (t: StockTransaction): Promise<void> => {
    setStockTransactionsState((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      return idx >= 0 ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t];
    });
    await db.upsertStockTransaction(t);
  }, []);
  const removeStockTransaction = useCallback(async (id: string): Promise<void> => {
    setStockTransactionsState((prev) => prev.filter((x) => x.id !== id));
    await db.deleteStockTransactionRow(id);
  }, []);

  const setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>> = useCallback((updater) => {
    setSuppliersState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Supplier[]) => Supplier[])(prev) : updater;
      db.upsertSuppliersAll(next).catch((e) => console.error('persist suppliers:', e));
      return next;
    });
  }, []);
  const persistSupplier = useCallback(async (s: Supplier): Promise<void> => {
    setSuppliersState((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      return idx >= 0 ? prev.map((x) => (x.id === s.id ? s : x)) : [...prev, s];
    });
    await db.upsertSupplier(s);
  }, []);
  const removeSupplier = useCallback(async (id: string): Promise<void> => {
    setSuppliersState((prev) => prev.filter((x) => x.id !== id));
    await db.deleteSupplierRow(id);
  }, []);

  const setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>> = useCallback((updater) => {
    setPurchasesState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Purchase[]) => Purchase[])(prev) : updater;
      db.upsertPurchasesAll(next).catch((e) => console.error('persist purchases:', e));
      return next;
    });
  }, []);
  const persistPurchase = useCallback(async (p: Purchase): Promise<void> => {
    setPurchasesState((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      return idx >= 0 ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
    await db.upsertPurchase(p);
  }, []);
  const removePurchase = useCallback(async (id: string): Promise<void> => {
    setPurchasesState((prev) => prev.filter((x) => x.id !== id));
    await db.deletePurchaseRow(id);
  }, []);

  const addSnapshot = useCallback((snapshot: DataSnapshot) => {
    setSnapshots((prev) => [snapshot, ...prev].slice(0, 50));
    db.upsertSnapshot(snapshot).catch((e) => console.error('persist snapshot:', e));
  }, []);

  const resetAllData = useCallback(() => {
    const now = new Date();
    const preResetSnapshot: DataSnapshot = {
      id: `snapshot_${Date.now()}`,
      name: `Pre-reset snapshot ${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
      createdAt: now.toISOString(),
      type: 'pre_reset',
      data: { users: [...users], healthRecords: [...healthRecords], requests: [...requests], inventory: [...inventory], expenses: [...expenses], notifications: [...notifications], auditLogs: [...auditLogs], dispensingHistory: [...dispensingHistory] },
    };
    setSnapshots((prev) => [preResetSnapshot, ...prev].slice(0, 50));
    setHealthRecordsState([]);
    setRequestsState([]);
    setInventoryState([]);
    setExpensesState([]);
    setNotificationsState([]);
    setAuditLogsState([]);
    setDispensingHistoryState([]);
    setHealthFormRequestsState([]);
    setPatientVisitsState([]);
    setReferralsState([]);
    setFollowUpsState([]);
    setAppointmentsState([]);
    setMedicalSuppliesState([]);
    setStockTransactionsState([]);
    setSuppliersState([]);
    setPurchasesState([]);
    db.clearAllData().catch((e) => console.error('clearAllData:', e));
  }, [users, healthRecords, requests, inventory, expenses, notifications, auditLogs, dispensingHistory]);

  const restoreFromBackup = useCallback((backup: { users: User[]; healthRecords: HealthRecord[]; requests: Request[]; inventory: Medicine[]; expenses: Expense[]; notifications: Notification[]; auditLogs: AuditLog[]; dispensingHistory: MedicineDispensing[] }) => {
    setHealthRecordsState(backup.healthRecords);
    setRequestsState(backup.requests);
    setInventoryState(backup.inventory);
    setExpensesState(backup.expenses);
    setNotificationsState(backup.notifications);
    setAuditLogsState(backup.auditLogs);
    setDispensingHistoryState(backup.dispensingHistory);
    Promise.all([
      db.upsertHealthRecords(backup.healthRecords),
      db.upsertRequestsAll(backup.requests),
      db.upsertMedicinesAll(backup.inventory),
      db.upsertExpensesAll(backup.expenses),
      db.upsertNotificationsAll(backup.notifications),
      db.upsertAuditLogsAll(backup.auditLogs),
      db.upsertDispensingAll(backup.dispensingHistory),
    ]).catch((e) => console.error('restoreFromBackup:', e));
  }, []);

  const getInitialSnapshot = useCallback(() => snapshots.find((s) => s.type === 'initial') ?? null, [snapshots]);

  const restoreUsersData = useCallback((restoredUsers: User[]) => {
    restoreUsers(restoredUsers);
  }, [restoreUsers]);

  const persistSchoolSettings = useCallback(async (s: SchoolSettings): Promise<void> => {
    setSchoolSettings(s);
    await db.upsertSchoolSettings(s);
  }, []);

  return (
    <DataContext.Provider value={{
      users,
      healthRecords, setHealthRecords,
      requests, setRequests,
      inventory, setInventory,
      expenses, setExpenses,
      notifications, setNotifications,
      auditLogs, setAuditLogs,
      backupRecords, setBackupRecords,
      dispensingHistory, setDispensingHistory,
      snapshots,
      addSnapshot,
      resetAllData,
      restoreFromBackup,
      getInitialSnapshot,
      restoreUsersData,
      loading,
      loadError,
      persistHealthRecord,
      persistRequest,
      persistMedicine,
      removeMedicine,
      persistExpense,
      persistNotification,
      persistDispensing,
      removeNotification,
      addAuditLog,
      healthFormRequests,
      setHealthFormRequests,
      persistHealthFormRequest,
      patientVisits,
      setPatientVisits,
      persistPatientVisit,
      removePatientVisit,
      referrals,
      setReferrals,
      persistReferral,
      removeReferral,
      followUps,
      setFollowUps,
      persistFollowUp,
      removeFollowUp,
      appointments,
      setAppointments,
      persistAppointment,
      removeAppointment,
      medicalSupplies,
      setMedicalSupplies,
      persistMedicalSupply,
      removeMedicalSupply,
      stockTransactions,
      setStockTransactions,
      persistStockTransaction,
      removeStockTransaction,
      suppliers,
      setSuppliers,
      persistSupplier,
      removeSupplier,
      purchases,
      setPurchases,
      persistPurchase,
      removePurchase,
      schoolSettings,
      persistSchoolSettings,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
