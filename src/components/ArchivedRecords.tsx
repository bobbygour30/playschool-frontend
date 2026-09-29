// components/ArchivedRecords.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive, Search, Trash2, RotateCcw, X, AlertCircle, Users,
  Receipt, TrendingDown, Banknote, RefreshCw, Filter, Info,
  CheckCircle, FileText, User, Calendar, Loader2, Eye,
  Phone, Mail, Heart, Shield, DollarSign, History,
} from 'lucide-react';
import {
  getArchivedRecords,
  restoreArchivedRecord,
  permanentlyDeleteArchivedRecord,
  emptyArchive,
  getArchivedStudentProfile,
} from '../services/api';

// ==================== ADMIN AUTH ====================
// Two ways an admin can be recognized:
//   1. An explicit flag set at login (localStorage.isAdmin === 'true')
//   2. The hardcoded admin email from Login.jsx
// Adjust as needed if your auth model grows.
const isAuthorizedAdmin = () => {
  try {
    if (localStorage.getItem('isAdmin') === 'true') return true;
    const email = localStorage.getItem('userEmail') || '';
    return email === 'admin@goldenplay.com';
  } catch {
    return false;
  }
};

// Friendly display config per entity type
const ENTITY_META = {
  Student: { label: 'Student', icon: Users, bg: 'from-purple-500 to-pink-600', chip: 'bg-purple-100 text-purple-700' },
  Fee:     { label: 'Fee Invoice', icon: Receipt, bg: 'from-teal-500 to-cyan-600', chip: 'bg-teal-100 text-teal-700' },
  Expense: { label: 'Expense', icon: TrendingDown, bg: 'from-red-500 to-rose-600', chip: 'bg-red-100 text-red-700' },
  Salary:  { label: 'Salary', icon: Banknote, bg: 'from-amber-500 to-orange-600', chip: 'bg-amber-100 text-amber-700' },
};

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) : '—';
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '—';
const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

const describeSnapshot = (entry) => {
  const s = entry.snapshot || {};
  switch (entry.entity_type) {
    case 'Student':
      return `${s.class_id || 'N/A'} · Section ${s.section || 'A'} · ${s.parent_name || ''} ${s.parent_phone ? '· ' + s.parent_phone : ''}`;
    case 'Fee':
      return `Invoice ${s.invoice_number || 'N/A'} · ${s.fee_period?.month || ''} · Total ${inr(s.total_amount)} · Paid ${inr(s.paid_amount)}`;
    case 'Expense':
      return `${s.category || ''} · ${s.vendor_name || ''} · ${inr(s.amount)}`;
    case 'Salary':
      return `${s.month ? new Date(s.month).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' }) : ''} · Net ${inr(s.net_salary)}`;
    default:
      return '';
  }
};

export default function ArchivedRecords() {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [archives, setArchives] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Admin authority — computed once per render
  const canRestore = isAuthorizedAdmin();

  // Modals
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyReason, setEmptyReason] = useState('');

  // Archived Student Profile drawer
  const [profileTarget, setProfileTarget] = useState(null);   // archive entry
  const [profileData, setProfileData] = useState(null);       // { student, fee_invoices, payments, totals }
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => { loadArchives(); }, [typeFilter]);

  const loadArchives = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'all') params.entity_type = typeFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await getArchivedRecords(params);
      setArchives(Array.isArray(res.data?.data) ? res.data.data : []);
      setSummary(res.data?.summary || null);
    } catch (error) {
      console.error('Error loading archives:', error);
      alert(error?.response?.data?.message || 'Failed to load archived records');
      setArchives([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSyncing(true);
    await loadArchives();
    setIsSyncing(false);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    if (!canRestore) { alert('Only an authorized admin can restore records.'); return; }
    try {
      setBusyId(restoreTarget._id);
      const res = await restoreArchivedRecord(restoreTarget._id);
      alert(res.data?.message || 'Restored successfully');
      setRestoreTarget(null);
      await loadArchives();
    } catch (error) {
      console.error('Restore failed:', error);
      alert(error?.response?.data?.message || 'Failed to restore record');
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) { alert('Please provide a reason for permanent deletion'); return; }
    try {
      setBusyId(deleteTarget._id);
      const res = await permanentlyDeleteArchivedRecord(deleteTarget._id, deleteReason.trim());
      alert(res.data?.message || 'Permanently deleted');
      setDeleteTarget(null);
      setDeleteReason('');
      await loadArchives();
    } catch (error) {
      console.error('Permanent delete failed:', error);
      alert(error?.response?.data?.message || 'Failed to permanently delete');
    } finally {
      setBusyId(null);
    }
  };

  const handleEmptyArchive = async () => {
    if (!emptyReason.trim()) { alert('Please provide a reason'); return; }
    try {
      const res = await emptyArchive(emptyReason.trim());
      alert(res.data?.message || 'Archive emptied');
      setShowEmptyConfirm(false);
      setEmptyReason('');
      await loadArchives();
    } catch (error) {
      console.error('Empty archive failed:', error);
      alert(error?.response?.data?.message || 'Failed to empty archive');
    }
  };

  // Open the full profile of an archived student
  const openStudentProfile = async (entry) => {
    setProfileTarget(entry);
    setProfileData(null);
    setProfileLoading(true);
    try {
      const res = await getArchivedStudentProfile(entry._id);
      setProfileData(res.data);
    } catch (error) {
      console.error('Error loading archived student profile:', error);
      alert(error?.response?.data?.message || 'Failed to load student profile');
      setProfileTarget(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const filtered = archives.filter((a) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      (a.label || '').toLowerCase().includes(t) ||
      (a.archive_reason || '').toLowerCase().includes(t) ||
      (a.entity_type || '').toLowerCase().includes(t)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-slate-200 to-gray-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent pb-2">
              Archived Records
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Archive size={18} className="text-slate-500" />
              Archived students &amp; finance records. Restore or permanently delete with a reason.
            </p>
            {!canRestore && (
              <p className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 inline-flex items-center gap-1 px-3 py-1 rounded-full">
                <Info size={12} /> Read-only mode — only authorized admins can restore
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={isSyncing}
              className="px-5 py-3 bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              Refresh
            </button>
            {summary?.total > 0 && canRestore && (
              <button
                onClick={() => setShowEmptyConfirm(true)}
                className="px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                Empty Archive
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <SummaryCard title="Total Archived" value={summary.total} icon={Archive} color="from-slate-500 to-gray-600" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
            <SummaryCard title="Students" value={summary.Student} icon={Users} color="from-purple-500 to-pink-600" active={typeFilter === 'Student'} onClick={() => setTypeFilter('Student')} />
            <SummaryCard title="Fee Invoices" value={summary.Fee} icon={Receipt} color="from-teal-500 to-cyan-600" active={typeFilter === 'Fee'} onClick={() => setTypeFilter('Fee')} />
            <SummaryCard title="Expenses" value={summary.Expense} icon={TrendingDown} color="from-red-500 to-rose-600" active={typeFilter === 'Expense'} onClick={() => setTypeFilter('Expense')} />
            <SummaryCard title="Salaries" value={summary.Salary} icon={Banknote} color="from-amber-500 to-orange-600" active={typeFilter === 'Salary'} onClick={() => setTypeFilter('Salary')} />
          </div>
        )}

        {/* Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, invoice, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-3 bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-xl hover:shadow-lg flex items-center gap-2"
            >
              <Filter size={18} />
              Apply
            </button>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <Archive className="mx-auto text-gray-300 mb-3" size={64} />
            <p className="text-lg text-gray-500">No archived records</p>
            <p className="text-sm text-gray-400 mt-1">
              Deleted students, fees, expenses and salaries will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const meta = ENTITY_META[entry.entity_type] || ENTITY_META.Student;
              const Icon = meta.icon;
              const busy = busyId === entry._id;
              const isStudent = entry.entity_type === 'Student';
              return (
                <div key={entry._id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.bg} flex-shrink-0`}>
                      <Icon className="text-white" size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 truncate">{entry.label || 'Untitled'}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.chip}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{describeSnapshot(entry)}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Archived {fmtDateTime(entry.archived_at)}
                        </span>
                        {entry.archive_reason && (
                          <span className="flex items-center gap-1">
                            <Info size={11} /> {entry.archive_reason}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      {isStudent && (
                        <button
                          onClick={() => openStudentProfile(entry)}
                          disabled={busy}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 text-sm font-semibold disabled:opacity-50"
                        >
                          <Eye size={16} /> View Profile
                        </button>
                      )}
                      <button
                        onClick={() => setRestoreTarget(entry)}
                        disabled={busy || !canRestore}
                        title={canRestore ? 'Restore this record' : 'Only authorized admins can restore'}
                        className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={16} /> Restore
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(entry); setDeleteReason(''); }}
                        disabled={busy || !canRestore}
                        title={canRestore ? 'Permanently delete' : 'Only authorized admins can delete'}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== ARCHIVED STUDENT PROFILE DRAWER ==================== */}
        {profileTarget && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <User size={22} className="text-white flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-white truncate">
                      Archived Student — {profileData?.student?.name || profileTarget.label}
                    </h2>
                    <p className="text-xs text-white/80 truncate">
                      Archived {fmtDateTime(profileTarget.archived_at)}
                      {profileTarget.archive_reason ? ` · ${profileTarget.archive_reason}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canRestore ? (
                    <button
                      onClick={() => { setProfileTarget(null); setRestoreTarget(profileTarget); }}
                      className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-white/90 text-sm font-semibold flex items-center gap-1"
                    >
                      <RotateCcw size={16} /> Restore Student
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-full">
                      Read-only
                    </span>
                  )}
                  <button
                    onClick={() => { setProfileTarget(null); setProfileData(null); }}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {profileLoading ? (
                  <div className="text-center py-12">
                    <Loader2 size={40} className="mx-auto text-purple-500 animate-spin" />
                    <p className="mt-3 text-gray-500">Loading archived student profile...</p>
                  </div>
                ) : !profileData ? (
                  <div className="text-center py-12">
                    <AlertCircle size={48} className="mx-auto text-red-400" />
                    <p className="mt-3 text-gray-500">Could not load this student's archived profile.</p>
                  </div>
                ) : (
                  <>
                    {/* ============ STUDENT INFO ============ */}
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <User size={16} className="text-purple-500" /> Student Profile
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
                        <InfoCell label="Name" value={profileData.student?.name} />
                        <InfoCell label="Class" value={`${profileData.student?.class_id || 'N/A'} · Section ${profileData.student?.section || 'A'}`} />
                        <InfoCell label="Gender" value={profileData.student?.gender} />
                        <InfoCell label="Blood Group" value={profileData.student?.blood_group} />
                        <InfoCell label="Date of Birth" value={fmtDate(profileData.student?.date_of_birth)} />
                        <InfoCell label="Admission Date" value={fmtDate(profileData.student?.admission_date)} />
                        <InfoCell label="Academic Year" value={profileData.student?.academic_year} />
                        <InfoCell label="Enrollment Type" value={profileData.student?.enrollment_type} />
                      </div>
                    </section>

                    {/* ============ PARENT / CONTACT ============ */}
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Users size={16} className="text-purple-500" /> Parent &amp; Contact
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
                        <InfoCell label="Parent Name" value={profileData.student?.parent_name} />
                        <InfoCell label="Relationship" value={profileData.student?.parent_relationship} />
                        <InfoCell label="Email" value={profileData.student?.parent_email} icon={Mail} />
                        <InfoCell label="Phone" value={profileData.student?.parent_phone} icon={Phone} />
                        <InfoCell label="Blood Group" value={profileData.student?.blood_group} icon={Heart} />
                        <InfoCell label="Address" value={profileData.student?.address} className="md:col-span-2" />
                        <InfoCell
                          label="Emergency Contact"
                          value={
                            profileData.student?.emergency_contact
                              ? `${profileData.student.emergency_contact.name || ''} (${profileData.student.emergency_contact.relationship || ''}) · ${profileData.student.emergency_contact.phone || ''}`
                              : '—'
                          }
                        />
                        {profileData.student?.authorized_pickup && (
                          <InfoCell
                            label="Authorized Pickup"
                            value={`${profileData.student.authorized_pickup.name || ''} (${profileData.student.authorized_pickup.relationship || ''}) · ${profileData.student.authorized_pickup.phone || ''}`}
                            icon={Shield}
                            className="md:col-span-2"
                          />
                        )}
                      </div>
                    </section>

                    {/* ============ FINANCE SUMMARY ============ */}
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <DollarSign size={16} className="text-green-600" /> Finance Summary
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Total Charged" value={inr(profileData.totals.charged)} tone="green" />
                        <StatCard label="Total Paid" value={inr(profileData.totals.paid)} tone="blue" />
                        <StatCard label="Outstanding" value={inr(profileData.totals.outstanding)} tone="red" />
                        <StatCard label="Advance / Credit" value={inr(profileData.totals.advance)} tone="purple" />
                      </div>
                    </section>

                    {/* ============ ARCHIVED INVOICES ============ */}
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Receipt size={16} className="text-teal-500" /> Archived Fee Invoices ({profileData.fee_invoices.length})
                      </h3>
                      {profileData.fee_invoices.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                          No archived invoices for this student.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                              <tr>
                                {['Invoice #', 'Fee Period', 'Due Date', 'Total', 'Paid', 'Outstanding', 'Status'].map((h) => (
                                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {profileData.fee_invoices.map((inv) => (
                                <tr key={inv._id} className="hover:bg-teal-50/40">
                                  <td className="px-3 py-3 font-mono text-xs text-gray-700">{inv.invoice_number || 'N/A'}</td>
                                  <td className="px-3 py-3 text-gray-700">{inv.fee_period?.month || '—'}</td>
                                  <td className="px-3 py-3 text-gray-700">{fmtDate(inv.due_date)}</td>
                                  <td className="px-3 py-3 font-semibold text-gray-900">{inr(inv.total_amount)}</td>
                                  <td className="px-3 py-3 font-semibold text-green-700">{inr(inv.paid_amount)}</td>
                                  <td className="px-3 py-3 font-semibold text-red-700">
                                    {inr(Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0)))}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                      inv.status === 'Partial' ? 'bg-blue-100 text-blue-700' :
                                      inv.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {inv.status || '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    {/* ============ PAYMENT HISTORY ============ */}
                    <section>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <History size={16} className="text-green-500" /> Payment History ({profileData.payments.length})
                      </h3>
                      {profileData.payments.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                          No payments recorded on any archived invoice.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                              <tr>
                                {['Invoice #', 'Fee Period', 'Payment Date', 'Amount', 'Type', 'Method', 'Txn / Notes'].map((h) => (
                                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {profileData.payments.map((p, i) => (
                                <tr key={i} className="hover:bg-teal-50/40 align-top">
                                  <td className="px-3 py-3 font-mono text-xs text-gray-700">{p.invoice_number || 'N/A'}</td>
                                  <td className="px-3 py-3 text-gray-700">{p.fee_period || '—'}</td>
                                  <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(p.date)}</td>
                                  <td className="px-3 py-3 font-semibold text-gray-900">{inr(p.amount)}</td>
                                  <td className="px-3 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      p.payment_type === 'full' ? 'bg-green-100 text-green-700' :
                                      p.payment_type === 'partial' ? 'bg-blue-100 text-blue-700' :
                                      p.payment_type === 'advance' ? 'bg-purple-100 text-purple-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {(p.payment_type || 'full').charAt(0).toUpperCase() + (p.payment_type || 'full').slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-gray-700">{p.payment_method || '—'}</td>
                                  <td className="px-3 py-3 text-xs text-gray-600">
                                    {p.transaction_id ? <div>Txn: {p.transaction_id}</div> : null}
                                    {p.notes ? <div className="italic">{p.notes}</div> : null}
                                    {p.advance_allocation?.length > 0 ? (
                                      <div className="mt-1">
                                        <span className="font-semibold">Advance →</span>{' '}
                                        {p.advance_allocation.map((a, idx) => (
                                          <span key={idx}>
                                            {a.month} {inr(a.amount)}{idx < p.advance_allocation.length - 1 ? ', ' : ''}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                    {!p.transaction_id && !p.notes && (!p.advance_allocation || p.advance_allocation.length === 0)
                                      ? <span className="text-gray-400">—</span> : null}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    {!canRestore && (
                      <p className="mt-6 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                        <Info size={14} /> You are viewing this archived profile in read-only mode.
                        Only an authorized admin can restore this student.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Restore confirm */}
        {restoreTarget && createPortal(
          <Modal onClose={() => setRestoreTarget(null)} title="Restore Archived Record" icon={RotateCcw} gradient="from-green-500 to-emerald-600">
            <p className="text-gray-700 text-sm">
              Restore <span className="font-semibold">{restoreTarget.label}</span> back into the active records?
            </p>
            {restoreTarget.entity_type === 'Student' && (
              <p className="text-xs text-gray-500 mt-2">
                Any of this student's archived fee invoices will also be restored.
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setRestoreTarget(null)} className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={busyId === restoreTarget._id}
                className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 disabled:opacity-60"
              >
                {busyId === restoreTarget._id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                Restore
              </button>
            </div>
          </Modal>,
          document.body
        )}

        {/* Permanent delete */}
        {deleteTarget && createPortal(
          <Modal onClose={() => setDeleteTarget(null)} title="Permanently Delete" icon={AlertCircle} gradient="from-red-500 to-rose-600">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>
                This action is <strong>irreversible</strong>. The record and any attached files will be permanently removed.
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-3">
              You are about to permanently delete <span className="font-semibold">{deleteTarget.label}</span>.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for permanent deletion <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="e.g. Duplicate entry, wrong data, parent requested removal..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={!deleteReason.trim() || busyId === deleteTarget._id}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 disabled:opacity-60"
              >
                {busyId === deleteTarget._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete Forever
              </button>
            </div>
          </Modal>,
          document.body
        )}

        {/* Empty archive confirm */}
        {showEmptyConfirm && createPortal(
          <Modal onClose={() => setShowEmptyConfirm(false)} title="Empty Entire Archive" icon={AlertCircle} gradient="from-red-600 to-rose-700">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>
                This will <strong>permanently delete every archived record</strong>. This cannot be undone.
              </span>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={emptyReason}
              onChange={(e) => setEmptyReason(e.target.value)}
              rows={3}
              placeholder="e.g. Yearly cleanup, archive retention policy..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowEmptyConfirm(false)} className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleEmptyArchive}
                disabled={!emptyReason.trim()}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl hover:shadow-lg disabled:opacity-60"
              >
                Yes, empty everything
              </button>
            </div>
          </Modal>,
          document.body
        )}
      </div>
    </div>
  );
}

// ==================== SMALL HELPERS ====================

function SummaryCard({ title, value, icon: Icon, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl p-4 border shadow-md hover:shadow-lg transition-all ${
        active ? 'bg-gradient-to-br from-white to-slate-50 border-slate-300 ring-2 ring-slate-400' : 'bg-white/80 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${color} flex-shrink-0`}>
          <Icon className="text-white" size={18} />
        </div>
        <p className="text-xs text-gray-500">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
    </button>
  );
}

function InfoCell({ label, value, icon: Icon, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        {Icon && <Icon size={11} />} {label}
      </p>
      <p className="font-semibold text-gray-800 break-words">{value || '—'}</p>
    </div>
  );
}

function StatCard({ label, value, tone = 'gray' }) {
  const toneMap = {
    green: 'text-green-700 bg-green-50 border-green-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
    gray: 'text-gray-700 bg-gray-50 border-gray-200',
  };
  return (
    <div className={`rounded-xl p-3 border ${toneMap[tone]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function Modal({ children, onClose, title, icon: Icon, gradient }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className={`bg-gradient-to-r ${gradient} px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {Icon && <Icon size={20} />} {title}
          </h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}