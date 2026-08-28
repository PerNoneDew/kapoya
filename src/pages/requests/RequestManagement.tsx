import { useState } from 'react';
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, RefreshCw, Paperclip, Share2, PackageCheck, Stethoscope, Pill, HeartPulse, ShieldPlus, Upload, FileText, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Request, RequestType, RequestStatus, Notification } from '../../types';
import Badge, { statusVariant, roleLabel } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { supabase } from '../../lib/supabase';

const ATTACHMENT_BUCKET = 'request-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type UploadedAttachment = { name: string; url: string };

async function uploadAttachment(file: File): Promise<UploadedAttachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is too large. Maximum file size is 10 MB.`);
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data: pub } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(path);
  return { name: file.name, url: pub.publicUrl };
}

function fileIcon(_name: string): React.ElementType {
  return FileText;
}

export const patientServiceClassifications: Record<RequestType, { label: string; description: string; icon: React.ElementType }> = {
  medical: { label: 'Medical', description: 'Medical consultation, checkup, or treatment', icon: Stethoscope },
  dental: { label: 'Dental', description: 'Dental consultation, checkup, or oral care', icon: Stethoscope },
  physical: { label: 'Physical Exam', description: 'Physical examination and fitness assessment', icon: HeartPulse },
  medicine: { label: 'Medicine', description: 'Request for medicine from clinic stock', icon: Pill },
  first_aid: { label: 'First Aid', description: 'Immediate first aid treatment for injuries', icon: ShieldPlus },
};

export default function RequestManagement() {
  const { currentUser } = useAuth();
  const { requests, setRequests, setNotifications } = useData();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isOfficerOrAdmin = isAdmin || currentUser.role === 'staff';
  const isStaff = currentUser.role === 'staff';
  const canSubmit = ['student', 'staff', 'faculty', 'employee'].includes(currentUser.role);

  const displayRequests = canSubmit
    ? requests.filter((r) => r.userId === currentUser.id)
    : requests;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewReq, setViewReq] = useState<Request | null>(null);
  const [reviewReq, setReviewReq] = useState<Request | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reviewAction, setReviewAction] = useState<RequestStatus>('approved');
  const [forwardTo, setForwardTo] = useState('');
  const [forwardReason, setForwardReason] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({ type: 'medical' as RequestType, description: '' });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardReq, setForwardReq] = useState<Request | null>(null);
  const [forwardNotes, setForwardNotes] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const statusPriority: Record<string, number> = {
    processing: 1,
    forwarded: 2,
    approved: 3,
    released: 4,
    rejected: 5,
    pending: 6,
  };

  const filtered = displayRequests
    .filter((r) => {
      const matchSearch = r.userName.toLowerCase().includes(search.toLowerCase()) ||
        patientServiceClassifications[r.type]?.label.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  const statusCounts = {
    pending: displayRequests.filter((r) => r.status === 'pending').length,
    processing: displayRequests.filter((r) => r.status === 'processing').length,
    approved: displayRequests.filter((r) => r.status === 'approved').length,
    rejected: displayRequests.filter((r) => r.status === 'rejected').length,
    forwarded: displayRequests.filter((r) => r.status === 'forwarded').length,
  };

  const createNotification = (notif: Omit<Notification, 'id' | 'sentAt' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sentAt: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateStatus = (id: string, status: RequestStatus, notes?: string, rmks?: string, ft?: string, fr?: string) => {
    const req = requests.find((r) => r.id === id);
    setRequests((prev) => prev.map((r) => r.id === id ? {
      ...r, status,
      reviewedBy: currentUser.name,
      reviewNotes: notes !== undefined ? notes : r.reviewNotes,
      remarks: rmks !== undefined ? rmks : r.remarks,
      forwardedTo: ft !== undefined ? ft : r.forwardedTo,
      forwardReason: fr !== undefined ? fr : r.forwardReason,
      forwardedBy: status === 'forwarded' ? currentUser.name : r.forwardedBy,
      forwardedAt: status === 'forwarded' ? new Date().toISOString().split('T')[0] : r.forwardedAt,
      updatedAt: new Date().toISOString().split('T')[0],
    } : r));
    if (req) {
      const svcLabel = patientServiceClassifications[req.type]?.label ?? req.type;
      if (status === 'approved') {
        createNotification({
          title: 'Request Approved',
          message: `Your ${svcLabel} request has been approved. ${rmks ? rmks : 'Please proceed to the clinic.'}`,
          recipientRoles: (req.userRole ? [req.userRole] : []) as Notification['recipientRoles'],
          recipientIds: [req.userId],
          sentBy: currentUser.name,
          type: 'approval',
        });
      } else if (status === 'rejected') {
        createNotification({
          title: 'Request Rejected',
          message: `Your ${svcLabel} request has been rejected. ${notes ? `Reason: ${notes}` : 'Please contact the clinic for more information.'}`,
          recipientRoles: (req.userRole ? [req.userRole] : []) as Notification['recipientRoles'],
          recipientIds: [req.userId],
          sentBy: currentUser.name,
          type: 'rejection',
        });
      } else if (status === 'released') {
        createNotification({
          title: 'Request Released',
          message: `Your ${svcLabel} request has been released and is ready for pickup.`,
          recipientRoles: (req.userRole ? [req.userRole] : []) as Notification['recipientRoles'],
          recipientIds: [req.userId],
          sentBy: currentUser.name,
          type: 'approval',
        });
      } else if (status === 'forwarded') {
        createNotification({
          title: 'Request Forwarded',
          message: `Your ${svcLabel} request has been forwarded${ft ? ` to ${ft}` : ''}. ${fr ? `Reason: ${fr}` : ''}`,
          recipientRoles: (req.userRole ? [req.userRole] : []) as Notification['recipientRoles'],
          recipientIds: [req.userId],
          sentBy: currentUser.name,
          type: 'status_update',
        });
      } else if (status === 'processing') {
        createNotification({
          title: 'Request Under Review',
          message: `Your ${svcLabel} request is now being reviewed.`,
          recipientRoles: (req.userRole ? [req.userRole] : []) as Notification['recipientRoles'],
          recipientIds: [req.userId],
          sentBy: currentUser.name,
          type: 'status_update',
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const valid: File[] = [];
    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
      if (!allowed.includes(ext ?? '')) {
        setUploadError(`"${f.name}" is not a supported file type. Only PDF, PNG, JPG, WEBP, and GIF are allowed.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setUploadError(`"${f.name}" is too large. Maximum file size is 10 MB.`);
        continue;
      }
      valid.push(f);
    }
    setPendingFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitRequest = async () => {
    if (!submitForm.description.trim()) return;
    setUploading(true);
    setUploadError('');
    let uploaded: UploadedAttachment[] = [];
    try {
      for (const f of pendingFiles) {
        uploaded.push(await uploadAttachment(f));
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload file.');
      setUploading(false);
      return;
    }
    const now = new Date().toISOString().split('T')[0];
    const newReq: Request = {
      id: `req${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      type: submitForm.type,
      description: submitForm.description,
      status: 'pending',
      attachments: uploaded.map((u) => `${u.name}||${u.url}`),
      submittedAt: now,
      updatedAt: now,
    };
    setRequests((prev) => [...prev, newReq]);
    createNotification({
      title: 'New Consultation Request',
      message: `${currentUser.name} submitted a ${patientServiceClassifications[newReq.type]?.label ?? newReq.type} request: ${newReq.description.slice(0, 80)}${newReq.description.length > 80 ? '...' : ''}`,
      recipientRoles: ['admin'],
      sentBy: currentUser.name,
      type: 'status_update',
    });
    setShowSubmit(false);
    setSubmitForm({ type: 'medical', description: '' });
    setPendingFiles([]);
    setUploading(false);
  };

  const parseAttachment = (raw: string): { name: string; url: string } => {
    if (raw.includes('||')) {
      const [name, url] = raw.split('||');
      return { name, url };
    }
    // Legacy plain-filename entries — not clickable
    return { name: raw, url: '' };
  };

  const handleForward = () => {
    if (!forwardReq) return;
    setRequests((prev) => prev.map((r) => r.id === forwardReq.id ? {
      ...r, status: 'forwarded', forwardedBy: currentUser.name,
      reviewNotes: forwardNotes, updatedAt: new Date().toISOString().split('T')[0],
    } : r));
    const svcLabel = patientServiceClassifications[forwardReq.type]?.label ?? forwardReq.type;
    createNotification({
      title: 'Request Forwarded',
      message: `Your ${svcLabel} request has been forwarded for review.`,
      recipientRoles: (forwardReq.userRole ? [forwardReq.userRole] : []) as Notification['recipientRoles'],
      recipientIds: [forwardReq.userId],
      sentBy: currentUser.name,
      type: 'status_update',
    });
    setShowForwardModal(false);
    setForwardReq(null);
    setForwardNotes('');
  };

  const handleReview = () => {
    if (!reviewReq) return;
    if (reviewAction === 'rejected') {
      setShowRejectConfirm(true);
    } else if (reviewAction === 'forwarded') {
      if (!forwardTo.trim() || !forwardReason.trim()) return;
      updateStatus(reviewReq.id, 'forwarded', reviewNotes, remarks, forwardTo.trim(), forwardReason.trim());
      setReviewReq(null);
    } else {
      updateStatus(reviewReq.id, reviewAction, reviewNotes, remarks);
      setReviewReq(null);
    }
  };

  const confirmReject = () => {
    if (!reviewReq) return;
    updateStatus(reviewReq.id, 'rejected', reviewNotes, remarks);
    setShowRejectConfirm(false);
    setReviewReq(null);
  };

  const openReview = (r: Request) => {
    setReviewReq(r);
    setReviewNotes(r.reviewNotes ?? '');
    setRemarks(r.remarks ?? '');
    setReviewAction('approved');
    setForwardTo(r.forwardedTo ?? '');
    setForwardReason(r.forwardReason ?? '');
  };

  const statusConfig = [
    { key: 'pending', label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    { key: 'processing', label: 'Processing', color: 'text-sky-600', bg: 'bg-sky-50', icon: RefreshCw },
    { key: 'approved', label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
    { key: 'rejected', label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    { key: 'forwarded', label: 'Forwarded', color: 'text-sky-600', bg: 'bg-sky-50', icon: Share2 },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4">
        <h2 className="text-sm font-bold text-teal-800 uppercase tracking-wider">Patient Service Requests</h2>
        <p className="text-xs text-teal-600 mt-0.5">Submit and track Medical, Physical, Medicine, and First Aid requests.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statusConfig.map(({ key, label, color, bg, icon: Icon }) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`bg-white rounded-xl p-4 border text-left transition-all ${statusFilter === key ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-100 hover:border-teal-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1 rounded-lg ${bg}`}><Icon size={12} className={color} /></div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{statusCounts[key as keyof typeof statusCounts]}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Services</option>
              {(Object.entries(patientServiceClassifications) as [RequestType, typeof patientServiceClassifications[RequestType]][])
                .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="forwarded">Forwarded</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
            </select>
            {canSubmit && (
              <button onClick={() => setShowSubmit(true)} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus size={15} /> New Request
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {isOfficerOrAdmin && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Requester</th>}
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => {
                const svcClass = patientServiceClassifications[r.type];
                const ServiceIcon = svcClass?.icon ?? Stethoscope;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    {isOfficerOrAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                            <span className="text-sky-600 font-semibold text-xs">{r.userName.charAt(0)}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-700 block">{r.userName}</span>
                            {r.userRole && <Badge label={roleLabel(r.userRole)} variant={statusVariant(r.userRole)} />}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-teal-50 shrink-0"><ServiceIcon size={14} className="text-teal-600" /></div>
                        <p className="text-sm font-semibold text-slate-700">{svcClass?.label ?? r.type}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-slate-500 truncate max-w-xs">{r.description}</p>
                      {r.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5"><Paperclip size={10} />{r.attachments.length} file{r.attachments.length > 1 ? 's' : ''}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><Badge label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} variant={statusVariant(r.status)} /></td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{r.submittedAt}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewReq(r)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="View Details"><Eye size={14} /></button>
                        {isStaff && (r.status === 'pending' || r.status === 'processing') && (
                          <button onClick={() => { setForwardReq(r); setForwardNotes(''); setShowForwardModal(true); }} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Forward Request"><Share2 size={14} /></button>
                        )}
                        {isAdmin && (r.status === 'pending' || r.status === 'forwarded' || r.status === 'processing') && (
                          <button onClick={() => openReview(r)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Review Request">
                            <RefreshCw size={14} />
                          </button>
                        )}
                        {isAdmin && r.status === 'approved' && (
                          <button onClick={() => updateStatus(r.id, 'released', r.reviewNotes, 'Request has been released.')} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Release Request">
                            <PackageCheck size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No requests found.</div>}
        </div>
      </div>

      {/* View Request Modal */}
      <Modal isOpen={viewReq !== null} onClose={() => setViewReq(null)} title="Patient Service Request Details" size="md">
        {viewReq && (() => {
          const svcClass = patientServiceClassifications[viewReq.type];
          const ServiceIcon = svcClass?.icon ?? Stethoscope;
          return (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Request ID</p>
                  <p className="text-sm font-mono font-semibold text-slate-700 mt-0.5">{viewReq.id.toUpperCase()}</p>
                </div>
                <Badge label={viewReq.status.charAt(0).toUpperCase() + viewReq.status.slice(1)} variant={statusVariant(viewReq.status)} />
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white"><ServiceIcon size={18} className="text-teal-600" /></div>
                <div>
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Service</p>
                  <p className="font-bold text-teal-800">{svcClass?.label}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Requester</p>
                  <p className="font-medium text-slate-700">{viewReq.userName}</p>
                  {viewReq.userRole && <Badge label={roleLabel(viewReq.userRole)} variant={statusVariant(viewReq.userRole)} />}
                </div>
                <div><p className="text-xs text-slate-400 mb-0.5">Submitted</p><p className="font-medium text-slate-700">{viewReq.submittedAt}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Last Updated</p><p className="font-medium text-slate-700">{viewReq.updatedAt}</p></div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">Description / Reason</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed text-justify">{viewReq.description}</p>
              </div>

              {viewReq.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Supporting Documents</p>
                  <div className="space-y-2">
                    {viewReq.attachments.map((a, i) => {
                      const att = parseAttachment(a);
                      const Icon = fileIcon(att.name);
                      return att.url ? (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg border border-teal-100 transition-colors cursor-pointer group">
                          <Icon size={14} className="text-teal-500 shrink-0" />
                          <span className="truncate flex-1 font-medium group-hover:underline">{att.name}</span>
                          <span className="text-xs text-teal-400 shrink-0">Open ↗</span>
                        </a>
                      ) : (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <Icon size={14} className="text-slate-300 shrink-0" />
                          <span className="truncate flex-1">{att.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewReq.status === 'forwarded' && (viewReq.forwardedTo || viewReq.forwardReason) && (
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Forwarding Details</p>
                  {viewReq.forwardedTo && <div><p className="text-xs text-sky-400">Forwarded To</p><p className="text-sm font-semibold text-sky-700">{viewReq.forwardedTo}</p></div>}
                  {viewReq.forwardReason && <div><p className="text-xs text-sky-400">Reason</p><p className="text-sm text-sky-700 text-justify">{viewReq.forwardReason}</p></div>}
                  {viewReq.forwardedBy && <div><p className="text-xs text-sky-400">Forwarded By</p><p className="text-sm font-medium text-sky-700">{viewReq.forwardedBy}</p></div>}
                  {viewReq.forwardedAt && <div><p className="text-xs text-sky-400">Date</p><p className="text-sm text-sky-700">{viewReq.forwardedAt}</p></div>}
                </div>
              )}

              {viewReq.reviewedBy && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Reviewed by <span className="font-medium text-slate-600">{viewReq.reviewedBy}</span></p>
                  {viewReq.reviewNotes && <p className="text-sm text-slate-600 text-justify">{viewReq.reviewNotes}</p>}
                </div>
              )}
              {viewReq.remarks && (
                <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                  <p className="text-xs text-teal-600 font-medium mb-1">Remarks</p>
                  <p className="text-sm text-teal-700 text-justify">{viewReq.remarks}</p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewReq !== null} onClose={() => setReviewReq(null)} title="Review Patient Service Request" size="lg">
        {reviewReq && (() => {
          const svcClass = patientServiceClassifications[reviewReq.type];
          const ServiceIcon = svcClass?.icon ?? Stethoscope;
          return (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-teal-50"><ServiceIcon size={14} className="text-teal-600" /></div>
                  <p className="text-sm font-bold text-slate-700">{svcClass?.label}</p>
                </div>
                <p className="text-sm text-slate-500 mt-1 text-justify">{reviewReq.description}</p>
                <p className="text-xs text-slate-400 mt-2">By {reviewReq.userName} {reviewReq.userRole ? `(${roleLabel(reviewReq.userRole)})` : ''} · {reviewReq.submittedAt}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['processing', 'approved', 'rejected', 'forwarded'] as RequestStatus[]).map((s) => (
                    <button key={s} onClick={() => setReviewAction(s)}
                      className={`py-2 text-sm font-medium rounded-xl border transition-all capitalize ${reviewAction === s ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-200'}`}>
                      {s === 'forwarded' ? 'Forward Patient' : s}
                    </button>
                  ))}
                </div>
              </div>

              {reviewAction === 'forwarded' && (
                <div className="border border-sky-200 rounded-xl p-4 bg-sky-50/50 space-y-3">
                  <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Forward Patient — Transfer to Another Facility / Personnel</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Forward To <span className="text-rose-500">*</span></label>
                    <input value={forwardTo} onChange={(e) => setForwardTo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="e.g. City General Hospital, Dr. Smith (Cardiology)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Forwarding <span className="text-rose-500">*</span></label>
                    <textarea value={forwardReason} onChange={(e) => setForwardReason(e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                      placeholder="Reason for forwarding the patient..." />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Review Notes</label>
                <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Enter review notes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks <span className="text-slate-400 font-normal">(visible to requester)</span></label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Optional remarks for the requester..." />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setReviewReq(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleReview} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">Submit Review</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Forward Modal */}
      <Modal isOpen={showForwardModal} onClose={() => setShowForwardModal(false)} title="Forward Request" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Forward this request to the Health Officer for review.</p>
          {forwardReq && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
              <p className="font-medium">{patientServiceClassifications[forwardReq.type]?.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{forwardReq.userName} · {forwardReq.submittedAt}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea value={forwardNotes} onChange={(e) => setForwardNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Any notes for the Health Officer..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForwardModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleForward} className="px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors">Forward Request</button>
          </div>
        </div>
      </Modal>

      {/* Submit New Request */}
      <Modal isOpen={showSubmit} onClose={() => setShowSubmit(false)} title="Submit Patient Service Request" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Type</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(patientServiceClassifications) as [RequestType, typeof patientServiceClassifications[RequestType]][]).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} type="button" onClick={() => setSubmitForm({ ...submitForm, type: k })}
                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${submitForm.type === k ? 'border-teal-400 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-slate-50'}`}>
                    <div className={`p-2 rounded-lg ${submitForm.type === k ? 'bg-teal-100' : 'bg-slate-100'}`}><Icon size={18} className={submitForm.type === k ? 'text-teal-600' : 'text-slate-500'} /></div>
                    <div>
                      <span className="font-medium">{v.label}</span>
                      <span className="text-xs text-slate-400 block">{v.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason / Description</label>
            <textarea value={submitForm.description} onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Describe your request in detail..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Supporting Documents <span className="text-slate-400 font-normal">(optional, PDF or image, max 10 MB)</span></label>
            <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer">
              <Upload size={20} className="text-slate-400" />
              <span className="font-medium text-slate-600">Click to upload files</span>
              <span className="text-xs text-slate-400">PDF, PNG, JPG, WEBP, GIF</span>
              <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/*" onChange={handleFileSelect} className="hidden" />
            </label>
            {uploadError && (
              <div className="mt-2 flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                <XCircle size={14} className="mt-0.5 shrink-0" />{uploadError}
              </div>
            )}
            {pendingFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {pendingFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    <FileText size={14} className="text-teal-500 shrink-0" />
                    <span className="truncate flex-1 text-slate-700">{f.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removePendingFile(idx)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0" title="Remove">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowSubmit(false)} disabled={uploading} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={submitRequest} disabled={uploading} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-60">
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={confirmReject}
        title="Reject Service Request"
        message={`Are you sure you want to reject the "${reviewReq ? patientServiceClassifications[reviewReq.type]?.label : ''}" request from ${reviewReq?.userName}? The requester will be notified of this decision.`}
        confirmLabel="Reject Request"
        type="danger"
        details={[
          'Request will be marked as rejected',
          'Requester will be notified of the rejection',
          'Review notes will be shared with requester'
        ]}
      />
    </div>
  );
}
