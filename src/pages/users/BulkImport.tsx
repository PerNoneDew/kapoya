import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, GraduationCap, Briefcase, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { User, UserRole } from '../../types';

type ImportType = 'student' | 'employee';
type RowStatus = 'pending' | 'importing' | 'success' | 'error';

interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  status: RowStatus;
  message?: string;
}

const studentTemplate = ['name', 'email', 'studentId', 'department', 'password'];
const employeeTemplate = ['name', 'email', 'employeeId', 'department', 'role', 'password'];

export default function BulkImport() {
  const { registerUser } = useAuth();
  const { runWithFeedback } = useFeedback();
  const [importType, setImportType] = useState<ImportType>('student');
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const template = importType === 'student' ? studentTemplate : employeeTemplate;

  const parseCsv = useCallback((text: string): Record<string, string>[] => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const splitLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          result.push(current); current = '';
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result.map((s) => s.trim());
    };

    const headers = splitLine(lines[0]).map((h) => h.toLowerCase().trim());
    const data: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = splitLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
      data.push(row);
    }
    return data;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setRows([]);
    setFileName(file.name);
    setParsing(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setError('No data rows found in the file. Make sure the file has a header row and at least one data row.');
        setParsing(false);
        return;
      }
      const parsedRows: ParsedRow[] = parsed.map((data, idx) => {
        const missing = template.filter((col) => !data[col]?.trim());
        if (missing.includes('name')) {
          return { rowIndex: idx + 2, data, status: 'error', message: 'Missing required field: name' };
        }
        if (missing.includes('email')) {
          return { rowIndex: idx + 2, data, status: 'error', message: 'Missing required field: email' };
        }
        if (missing.includes('password')) {
          return { rowIndex: idx + 2, data, status: 'error', message: 'Missing required field: password' };
        }
        return { rowIndex: idx + 2, data, status: 'pending' };
      });
      setRows(parsedRows);
    } catch {
      setError('Failed to read the file. Please ensure it is a valid CSV file.');
    }
    setParsing(false);
  }, [parseCsv, template]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFile(file);
    } else {
      setError('Please upload a CSV file.');
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const headers = template.join(',');
    const sampleRow = importType === 'student'
      ? 'Juan Dela Cruz,juan.delacruz@student.edu,STU-2024-001,College of Engineering,password123'
      : 'Maria Santos,maria.santos@edu,EMP-2024-001,Finance Office,employee,password123';
    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${importType}_import_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setImporting(true);
    const validRows = rows.filter((r) => r.status === 'pending' || r.status === 'error');
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      setRows((prev) => prev.map((r) => r.rowIndex === row.rowIndex ? { ...r, status: 'importing' } : r));
      try {
        const d = row.data;
        const role: UserRole = importType === 'student' ? 'student' : (d.role?.trim() as UserRole || 'employee');
        const newUser: User = {
          id: `u${Date.now()}_${row.rowIndex}`,
          name: d.name.trim(),
          email: d.email.trim().toLowerCase(),
          role,
          department: d.department?.trim() || undefined,
          studentId: importType === 'student' ? d.studentId?.trim() || undefined : undefined,
          employeeId: importType === 'employee' && role !== 'faculty' ? d.employeeId?.trim() || undefined : undefined,
          facultyId: importType === 'employee' && role === 'faculty' ? d.employeeId?.trim() || undefined : undefined,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        };
        await registerUser(newUser, d.password.trim());
        successCount++;
        setRows((prev) => prev.map((r) => r.rowIndex === row.rowIndex ? { ...r, status: 'success', message: 'Imported successfully' } : r));
      } catch (err) {
        failCount++;
        setRows((prev) => prev.map((r) => r.rowIndex === row.rowIndex ? { ...r, status: 'error', message: err instanceof Error ? err.message : 'Import failed' } : r));
      }
    }

    setImporting(false);
    if (successCount > 0) {
      runWithFeedback(
        async () => {},
        { loadingTitle: '', successTitle: 'Import complete', successMessage: `${successCount} ${importType}(s) imported successfully${failCount > 0 ? `, ${failCount} failed.` : '.'}`, autoCloseMs: 3000 },
      );
    }
  };

  const reset = () => {
    setRows([]);
    setFileName('');
    setError('');
  };

  const successCount = rows.filter((r) => r.status === 'success').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;
  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-4">Select Import Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => { setImportType('student'); reset(); }}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${importType === 'student' ? 'border-teal-400 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200'}`}
          >
            <div className={`p-2.5 rounded-xl ${importType === 'student' ? 'bg-teal-100' : 'bg-slate-100'}`}>
              <GraduationCap size={20} className={importType === 'student' ? 'text-teal-600' : 'text-slate-500'} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Student Records</p>
              <p className="text-xs text-slate-400">Import multiple students at once</p>
            </div>
          </button>
          <button
            onClick={() => { setImportType('employee'); reset(); }}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${importType === 'employee' ? 'border-teal-400 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200'}`}
          >
            <div className={`p-2.5 rounded-xl ${importType === 'employee' ? 'bg-teal-100' : 'bg-slate-100'}`}>
              <Briefcase size={20} className={importType === 'employee' ? 'text-teal-600' : 'text-slate-500'} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Employee Records</p>
              <p className="text-xs text-slate-400">Import employees, staff, and faculty</p>
            </div>
          </button>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 text-sm">Upload CSV File</h3>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors border border-teal-200">
              <Download size={13} /> Download Template
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'}`}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-teal-500 animate-spin" />
                <p className="text-sm text-slate-500">Parsing file…</p>
              </div>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 border border-teal-100">
                  <Upload size={28} className="text-teal-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Drag & drop your CSV file here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                <label className="mt-4 inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                  <Upload size={15} /> Choose File
                  <input type="file" accept=".csv,text/csv" onChange={handleFileInput} className="hidden" />
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2">Required columns:</p>
            <div className="flex flex-wrap gap-2">
              {template.map((col) => (
                <span key={col} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-slate-600">{col}</span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">The first row must be a header with these column names (case-insensitive).</p>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-teal-500" />
                <span className="text-sm font-semibold text-slate-700">{fileName}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12} /> {successCount} done</span>
                <span className="flex items-center gap-1 text-amber-600"><AlertCircle size={12} /> {pendingCount} pending</span>
                {errorCount > 0 && <span className="flex items-center gap-1 text-rose-600"><XCircle size={12} /> {errorCount} errors</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={reset} disabled={importing} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleImport} disabled={importing || pendingCount === 0} className="px-5 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {importing ? <><Loader2 size={14} className="animate-spin" /> Importing…</> : <><Upload size={14} /> Import {pendingCount > 0 ? `(${pendingCount})` : ''}</>}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-16">#</th>
                    {template.map((col) => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{col}</th>
                    ))}
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row) => (
                    <tr key={row.rowIndex} className={`hover:bg-slate-50/50 transition-colors ${row.status === 'error' ? 'bg-rose-50/30' : row.status === 'success' ? 'bg-emerald-50/30' : ''}`}>
                      <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{row.rowIndex}</td>
                      {template.map((col) => (
                        <td key={col} className="px-4 py-2.5 text-sm text-slate-600 truncate max-w-[180px]">{row.data[col] || '—'}</td>
                      ))}
                      <td className="px-4 py-2.5">
                        {row.status === 'pending' && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 font-medium">Pending</span>}
                        {row.status === 'importing' && <Loader2 size={14} className="text-teal-500 animate-spin" />}
                        {row.status === 'success' && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span className="text-xs text-emerald-600">Done</span>
                          </div>
                        )}
                        {row.status === 'error' && (
                          <div className="flex items-center gap-1.5" title={row.message}>
                            <XCircle size={14} className="text-rose-500 shrink-0" />
                            <span className="text-xs text-rose-600 truncate max-w-[150px]">{row.message}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
