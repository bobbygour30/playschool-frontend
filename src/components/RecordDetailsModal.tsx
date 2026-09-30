// components/RecordDetailsModal.jsx  (NEW)
// Shared by Finance.jsx and ArchivedRecords.jsx.
//   <RecordDetailsModal type="expense|salary|fee" record={...} archive={entryOrNull} onClose={fn} />
//   <AuditStrip record={editingItemOrNull} idLabel="Expense ID" idValue={...} />   (read-only strip inside forms)
import { createPortal } from 'react-dom';
import { X, FileText, ShieldCheck, ExternalLink } from 'lucide-react';
import { getCurrentUserName } from '../services/api';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '—';
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) : '—';
const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const monthLabel = (m) =>
  m ? new Date(m).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';

// ---------- read-only strip shown at the top of the Add / Edit forms ----------
export function AuditStrip({ record, idLabel, idValue }) {
  const isEdit = !!record?._id;
  const cell = (label, value) => (
    <div key={label}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 break-words">{value || '—'}</p>
    </div>
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      {idLabel && cell(idLabel, isEdit ? idValue : 'Auto-generated on save')}
      {cell('Created By', isEdit ? record.created_by_name : getCurrentUserName())}
      {cell('Created Date', isEdit ? fmtDateTime(record.created_at) : fmtDateTime(new Date()))}
      {isEdit
        ? cell(
            'Last Modified',
            `${record.last_modified_by_name || '—'} · ${fmtDateTime(record.last_modified_at || record.updated_at)}`
          )
        : cell('Status', 'Active')}
    </div>
  );
}

// ---------- the audit trail block (used in the details modal) ----------
export function AuditTrail({ record = {}, archive = null }) {
  const r = record || {};
  const rows = [
    ['Created By', r.created_by_name || '—'],
    ['Created Date / Time', fmtDateTime(r.created_at)],
    ['Last Modified By', r.last_modified_by_name || '—'],
    ['Last Modified Date / Time', fmtDateTime(r.last_modified_at || r.updated_at)],
    ['Status', archive ? 'Archived / Voided' : 'Active'],
  ];
  if (archive) {
    rows.push(
      ['Archive / Void Reason', archive.archive_reason || archive.archive_reason_type || '—'],
      ['Archived / Voided By', archive.archived_by_name || '—'],
      ['Archived / Voided Date / Time', fmtDateTime(archive.archived_at)]
    );
  }

  return (
    <section>
      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
        <ShieldCheck size={16} className="text-teal-600" /> Audit Trail
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800 break-words">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const buildFields = (type, r) => {
  switch (type) {
    case 'expense':
      return [
        ['Expense ID', r.expense_id],
        ['Category', r.category],
        ['Description', r.description],
        ['Amount', inr(r.amount)],
        ['Expense Date', fmtDate(r.date)],
        ['Payment Method', r.payment_mode],
        ['Vendor / Payee', r.vendor_name],
        ['Receipt / Invoice No.', r.bill_number],
        ['Notes', r.notes],
      ];
    case 'salary':
      return [
        ['Staff Member', r.staff_name || r.staff_id?.name],
        ['Designation', r.staff_designation || r.staff_id?.designation],
        ['Salary Month', monthLabel(r.month)],
        ['Basic Salary', inr(r.basic_salary)],
        ['Allowance', inr(r.allowance)],
        ['Deductions', inr(r.deductions)],
        ['Net Salary', inr(r.net_salary)],
        ['Payment Status', r.status],
        ['Payment Date', fmtDate(r.payment_date)],
        ['Payment Method', r.payment_method],
        ['Transaction ID', r.transaction_id],
        ['Remarks', r.remarks],
      ];
    case 'fee':
      return [
        ['Student', r.student_name || r.student_id?.name],
        ['Invoice #', r.invoice_number],
        ['Fee Period', r.fee_period?.month],
        ['Due Date', fmtDate(r.due_date)],
        ['Total Amount', inr(r.total_amount)],
        ['Paid Amount', inr(r.paid_amount)],
        ['Status', r.status],
        ['Notes', r.notes],
      ];
    default:
      return [];
  }
};

const TITLES = { expense: 'Expense', salary: 'Salary Record', fee: 'Fee Invoice' };

export function RecordDetailsModal({ type, record, archive = null, onClose }) {
  const t = String(type || '').toLowerCase();
  const r = record || {};
  const fields = buildFields(t, r);
  const attachment = r.receipt_url || r.salary_slip_url;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[130] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={20} />
            {TITLES[t] || 'Record'} Details
            {archive && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">Archived / Voided</span>
            )}
          </h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold text-gray-800 break-words">{value || '—'}</p>
                </div>
              ))}
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500">Attachment / Receipt</p>
                {attachment ? (
                  String(attachment).startsWith('http') ? (
                    <a
                      href={attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
                    >
                      <ExternalLink size={14} /> Open attachment
                    </a>
                  ) : (
                    <p className="font-semibold text-gray-800">Attached</p>
                  )
                ) : (
                  <p className="font-semibold text-gray-800">—</p>
                )}
              </div>
            </div>
          </section>

          <AuditTrail record={r} archive={archive} />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RecordDetailsModal;