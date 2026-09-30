import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, Edit, Trash2, X, DollarSign, Calendar,
  Filter, Download, TrendingUp, TrendingDown, Users,
  FileText, Eye, ChevronDown, ChevronRight, Printer,
  PieChart, Wallet, CreditCard, Banknote, Receipt,
  AlertCircle, CheckCircle, Clock, Upload, Building,
  User, Phone, Mail, BookOpen, Award, Star, Home, RefreshCw,
  History, CalendarDays, ReceiptText, FileSpreadsheet, Info, Archive,
  Loader2
} from 'lucide-react';
import {
  getFees, getExpenses, getSalaries, getStudents, getStaff,
  createFee, updateFee, deleteFee,
  createExpense, updateExpense, deleteExpense,
  createSalary, updateSalary, deleteSalary,
  getFeeRecordSummary, getFeeFullDetails,
  syncStudentFeesToFinance, generateRecurringFeesBulk,
  recordPayment, getStudentFeeInvoices, ensureFeeInvoice,
} from '../services/api';

// ==================== HELPERS ====================

// Archive reason options — mirrors the server-side enum in routes/archives.js
const ARCHIVE_REASONS = [
  'Duplicate record',
  'Created by mistake',
  'Incorrect amount',
  'Cancelled invoice',
  'Other',
];

// Adapt the storage key to however your app stores the logged-in user.
// (The backend prefers req.user if you have auth middleware.)
const getCurrentUserName = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.name || u.username || u.email || 'Admin';
  } catch {
    return 'Admin';
  }
};

// Local-time month key, avoids the UTC month-boundary bug of toISOString
const monthKeyLocal = (offset = 0) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Local-time 'YYYY-MM-DD' (toISOString gives the previous day in India before 5:30 am)
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Computes the actual due date for an invoice from a 'YYYY-MM' month and a
// day-of-month (1-31), clamped to that month's last valid day.
const computeDueDateFromDay = (monthStr, day) => {
  const base = monthStr || monthKeyLocal(0);
  const [y, m] = base.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const d = Math.min(Math.max(parseInt(day) || 5, 1), daysInMonth);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

// Display helpers (school timezone, so a date never shifts by a day)
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '—';
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) : '—';
const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// All payment rows of ONE invoice.
const invoicePaymentRows = (inv) => {
  if (!inv) return [];
  const history = Array.isArray(inv.payment_history) ? inv.payment_history : [];
  const base = {
    invoice_number: inv.invoice_number,
    month: inv.fee_period?.month,
  };

  if (history.length > 0) {
    return history.map((p) => ({
      ...base,
      invoice_number: p.invoice_number || inv.invoice_number,
      date: p.payment_date || p.recorded_at,
      amount: p.amount,
      payment_type: p.payment_type,
      payment_method: p.payment_method,
      transaction_id: p.transaction_id,
      notes: p.notes,
      advance_allocation: p.advance_allocation,
    }));
  }

  const paid = inv.paid_amount || 0;
  if (paid > 0) {
    const total = inv.total_amount || 0;
    return [{
      ...base,
      date: inv.payment_date || inv.invoice_date,
      amount: paid,
      payment_type: paid > total ? 'advance' : paid < total ? 'partial' : 'full',
      payment_method: inv.payment_method,
      transaction_id: inv.transaction_id,
      notes: 'Payment recorded on the invoice',
      advance_allocation: [],
    }];
  }

  return [];
};

// Human label per delete target, for the archive popup
const describeTarget = (item, type) => {
  if (!item) return '';
  if (type === 'fee') return `${item.invoice_number || 'Invoice'} — ${item.student_id?.name || ''}`.trim();
  if (type === 'expense') return `${item.category || 'Expense'} — ${inr(item.amount)}`.trim();
  if (type === 'salary') {
    const m = item.month ? new Date(item.month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
    return `${item.staff_id?.name || 'Staff'} — ${m} — ${inr(item.net_salary)}`.trim();
  }
  return '';
};

export default function Finance() {
  const [activeTab, setActiveTab] = useState('fees');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyLocal(0));

  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null);
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [selectedFeeForDetails, setSelectedFeeForDetails] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [relatedInvoices, setRelatedInvoices] = useState([]);
  const [generatingRecurring, setGeneratingRecurring] = useState(false);
  const [loadingFeeSummary, setLoadingFeeSummary] = useState(false);
  const [feeSummary, setFeeSummary] = useState(null);
  const [studentInvoices, setStudentInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [newInvoiceMonth, setNewInvoiceMonth] = useState('');

  // ==================== DELETE (ARCHIVE) MODAL STATE ====================
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);   // the record itself
  const [deleteType, setDeleteType] = useState('');         // 'fee' | 'expense' | 'salary'
  const [deleteReasonType, setDeleteReasonType] = useState('');
  const [deleteReasonText, setDeleteReasonText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    admission_fee: '',
    tuition_fee: '',
    transport_fee: '',
    activity_fee: '',
    total_amount: '',
    due_date: '',
    status: 'Pending',
    payment_date: '',
    payment_method: 'Cash',
    transaction_id: '',
    notes: '',
    expense_category: '',
    expense_description: '',
    expense_amount: '',
    expense_date: todayLocal(),
    vendor_name: '',
    bill_number: '',
    payment_mode: 'Cash',
    receipt_doc: null,
    staff_id: '',
    staff_name: '',
    salary_month: selectedMonth,
    basic_salary: '',
    allowance: '',
    deductions: '',
    net_salary: '',
    payment_status: 'Pending',
    payment_date_salary: '',
    remarks: '',
    salary_slip: null,
    recurring_tuition_fee: '',
    recurring_activity_fee: '',
    recurring_transport_fee: '',
    recurring_start_month: '',
    recurring_end_month: '',
    fee_plan: 'Monthly',
    monthly_due_day: '5',
  });

  const [paymentFormData, setPaymentFormData] = useState({
    student_id: '',
    fee_id: '',
    amount_paid: '',
    payment_date: todayLocal(),
    payment_method: 'Cash',
    transaction_no: '',
    notes: '',
    payment_type: 'full',
    is_advance: false,
    advance_allocation: [],
    advance_month: '',
    advance_amount_allocation: '',
    generate_future_invoices: false,
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const extractArray = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [feesRes, expensesRes, salaryRes, studentsRes, staffRes] = await Promise.all([
        getFees(),
        getExpenses(),
        getSalaries(),
        getStudents(),
        getStaff(),
      ]);

      setFees(extractArray(feesRes));
      setExpenses(extractArray(expensesRes));
      setSalaryPayments(extractArray(salaryRes));
      setStudents(extractArray(studentsRes));
      setStaff(extractArray(staffRes));
    } catch (error) {
      console.error('Error loading finance data:', error);
      alert('Failed to load financial data');
      setFees(prev => Array.isArray(prev) ? prev : []);
      setExpenses(prev => Array.isArray(prev) ? prev : []);
      setSalaryPayments(prev => Array.isArray(prev) ? prev : []);
      setStudents(prev => Array.isArray(prev) ? prev : []);
      setStaff(prev => Array.isArray(prev) ? prev : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeSummary = async (feeId) => {
    if (!feeId) {
      setFeeSummary(null);
      return;
    }

    try {
      setLoadingFeeSummary(true);
      const response = await getFeeRecordSummary(feeId);
      const result = response.data;

      if (result.success) {
        setFeeSummary(result.data);

        const remaining = result.data.remaining_amount || 0;
        if (remaining > 0) {
          setPaymentFormData(prev => ({
            ...prev,
            amount_paid: remaining,
            payment_type: 'full'
          }));
        }
      } else {
        setFeeSummary(null);
        alert('Failed to fetch fee summary: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching fee summary:', error);
      setFeeSummary(null);
      alert('Failed to fetch fee summary');
    } finally {
      setLoadingFeeSummary(false);
    }
  };

  const loadStudentInvoices = async (studentId, autoSelect = false) => {
    if (!studentId) { setStudentInvoices([]); return; }
    try {
      setLoadingInvoices(true);
      const res = await getStudentFeeInvoices(studentId, { ensureUpcoming: true });
      const invoices = Array.isArray(res?.data?.invoices) ? res.data.invoices : [];
      setStudentInvoices(invoices);

      if (autoSelect) {
        const payable = invoices.filter(f => (f.remaining_amount ?? 0) > 0);
        const pick = payable.find(f => (f.amount_due || 0) > 0) || payable[0];
        if (pick) {
          setPaymentFormData(prev => ({ ...prev, fee_id: pick._id }));
          fetchFeeSummary(pick._id);
        }
      }
    } catch (error) {
      console.error('Error loading student invoices:', error);
      setStudentInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleCreateInvoiceForMonth = async () => {
    if (!paymentFormData.student_id) { alert('Select a student first'); return; }
    if (!newInvoiceMonth) { alert('Pick a month'); return; }
    try {
      const res = await ensureFeeInvoice({
        student_id: paymentFormData.student_id,
        month: newInvoiceMonth,
      });
      if (res.data?.success) {
        const invoice = res.data.invoice;
        await loadStudentInvoices(paymentFormData.student_id);
        setPaymentFormData(prev => ({ ...prev, fee_id: invoice._id }));
        fetchFeeSummary(invoice._id);
        setNewInvoiceMonth('');
        loadData();
      } else {
        alert(res.data?.message || 'Could not create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(error?.response?.data?.message || 'Could not create invoice');
    }
  };

  const syncAllStudentFees = async () => {
    if (!confirm('This will sync all student fee records from student profiles to the finance module. Continue?')) return;

    try {
      setIsSyncing(true);
      const response = await syncStudentFeesToFinance();
      const result = response.data;

      if (result.success) {
        alert(result.message || 'Fee sync completed successfully!');
        await loadData();
      } else {
        alert('Failed to sync fees: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error syncing fees:', error);
      alert('Failed to sync fees. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const generateRecurringFees = async () => {
    const month = prompt('Enter month (YYYY-MM) for recurring fee generation:', monthKeyLocal(0));
    if (!month) return;

    if (!confirm(`Generate recurring fees for ${month}? This will create invoices for all students with recurring fees configured.`)) return;

    try {
      setGeneratingRecurring(true);
      const response = await generateRecurringFeesBulk(month);
      const result = response.data;

      if (result.success) {
        alert(`Generated ${result.generated} invoices for ${month}`);
        await loadData();
      } else {
        alert('Failed to generate recurring fees: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating recurring fees:', error);
      alert('Failed to generate recurring fees. Please try again.');
    } finally {
      setGeneratingRecurring(false);
    }
  };

  const fetchFeeDetails = async (feeId) => {
    try {
      setLoadingHistory(true);
      setShowFeeDetails(true);
      setFeeDetails(null);
      const response = await getFeeFullDetails(feeId);
      const result = response.data;

      if (result) {
        setFeeDetails(result);
        setPaymentHistory(Array.isArray(result.payment_history) ? result.payment_history : []);
        setRelatedInvoices(Array.isArray(result.related_invoices) ? result.related_invoices : []);
        setSelectedFeeForDetails(feeId);
      } else {
        setShowFeeDetails(false);
        alert('Failed to fetch fee details');
      }
    } catch (error) {
      console.error('Error fetching fee details:', error);
      setShowFeeDetails(false);
      alert(error?.response?.data?.message || 'Failed to fetch fee details');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotalFee = () => {
    const admission = parseFloat(formData.admission_fee) || 0;
    const tuition = parseFloat(formData.tuition_fee) || 0;
    const transport = parseFloat(formData.transport_fee) || 0;
    const activity = parseFloat(formData.activity_fee) || 0;
    const total = admission + tuition + transport + activity;
    return total;
  };

  const updateTotalAmount = () => {
    const total = calculateTotalFee();
    setFormData(prev => ({ ...prev, total_amount: total.toString() }));
  };

  const handleFeeFieldChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      const admission = parseFloat(field === 'admission_fee' ? value : newData.admission_fee) || 0;
      const tuition = parseFloat(field === 'tuition_fee' ? value : newData.tuition_fee) || 0;
      const transport = parseFloat(field === 'transport_fee' ? value : newData.transport_fee) || 0;
      const activity = parseFloat(field === 'activity_fee' ? value : newData.activity_fee) || 0;
      const total = admission + tuition + transport + activity;
      newData.total_amount = total.toString();
      return newData;
    });
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const allowance = parseFloat(formData.allowance) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const net = basic + allowance - deductions;
    setFormData(prev => ({ ...prev, net_salary: net.toString() }));
  };

  const calculateRecurringTotal = () => {
    const tuition = parseFloat(formData.recurring_tuition_fee) || 0;
    const activity = parseFloat(formData.recurring_activity_fee) || 0;
    const transport = parseFloat(formData.recurring_transport_fee) || 0;
    return tuition + activity + transport;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!paymentFormData.amount_paid || parseFloat(paymentFormData.amount_paid) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!paymentFormData.fee_id) {
      alert('Please select a fee record');
      return;
    }

    try {
      let paymentType = 'full';
      const remaining = feeSummary?.remaining_amount || 0;
      const amountPaid = parseFloat(paymentFormData.amount_paid) || 0;

      if (amountPaid > remaining && remaining > 0) {
        paymentType = 'advance';
      } else if (amountPaid < remaining && remaining > 0) {
        paymentType = 'partial';
      } else {
        paymentType = 'full';
      }

      const paymentData = {
        student_id: paymentFormData.student_id,
        fee_id: paymentFormData.fee_id,
        amount_paid: amountPaid,
        payment_date: paymentFormData.payment_date,
        payment_type: paymentType,
        payment_method: paymentFormData.payment_method,
        transaction_no: paymentFormData.transaction_no,
        notes: paymentFormData.notes,
        advance_allocation: paymentFormData.advance_allocation || [],
        generate_future_invoices: paymentFormData.generate_future_invoices || false,
      };

      const response = await recordPayment(paymentData);
      const result = response.data;

      if (result.success) {
        alert(`Payment recorded successfully! (${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)})`);
        resetPaymentForm();
        await loadData();
      } else {
        alert('Failed to record payment: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(error?.response?.data?.message || 'Failed to record payment. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'fee') {
        const feeMonth = (formData.recurring_start_month || monthKeyLocal(0)).slice(0, 7);
        const computedDueDate = computeDueDateFromDay(feeMonth, formData.monthly_due_day);

        const oneTimeTotal = parseFloat(formData.total_amount) || 0;
        const recurringTotal = calculateRecurringTotal();
        const useRecurring = oneTimeTotal <= 0 && recurringTotal > 0;

        const feeData = {
          student_id: formData.student_id,
          admission_fee: parseFloat(formData.admission_fee) || 0,
          tuition_fee: parseFloat(formData.tuition_fee) || (useRecurring ? parseFloat(formData.recurring_tuition_fee) || 0 : 0),
          transport_fee: parseFloat(formData.transport_fee) || (useRecurring ? parseFloat(formData.recurring_transport_fee) || 0 : 0),
          activity_fee: parseFloat(formData.activity_fee) || (useRecurring ? parseFloat(formData.recurring_activity_fee) || 0 : 0),
          total_amount: useRecurring ? recurringTotal : oneTimeTotal,
          due_date: computedDueDate,
          payment_date: formData.payment_date || null,
          payment_method: formData.payment_method,
          transaction_id: formData.transaction_id,
          notes: formData.notes,
          fee_period: {
            month: feeMonth,
            start_date: new Date(feeMonth + '-01'),
            end_date: new Date(new Date(feeMonth + '-01').setMonth(new Date(feeMonth + '-01').getMonth() + 1) - 1),
          },
          fee_plan: formData.fee_plan || 'Monthly',
          recurring_fees: {
            tuition_fee: parseFloat(formData.recurring_tuition_fee) || 0,
            activity_fee: parseFloat(formData.recurring_activity_fee) || 0,
            transport_fee: parseFloat(formData.recurring_transport_fee) || 0,
            total_monthly: recurringTotal,
            monthly_due_day: parseInt(formData.monthly_due_day) || 5,
          },
          is_recurring: true,
        };

        if (editingItem) {
          await updateFee(editingItem._id, feeData);
          alert('Fee record updated successfully!');
        } else {
          await createFee(feeData);
          alert('Fee record added successfully!');
        }
      }
      else if (modalType === 'expense') {
        const expenseData = {
          category: formData.expense_category,
          description: formData.expense_description,
          amount: parseFloat(formData.expense_amount),
          date: formData.expense_date,
          vendor_name: formData.vendor_name,
          bill_number: formData.bill_number,
          payment_mode: formData.payment_mode,
          receipt: formData.receipt_doc,
        };

        if (editingItem) {
          await updateExpense(editingItem._id, expenseData);
          alert('Expense updated successfully!');
        } else {
          await createExpense(expenseData);
          alert('Expense added successfully!');
        }
      }
      else if (modalType === 'salary') {
        const salaryData = {
          staff_id: formData.staff_id,
          month: formData.salary_month,
          basic_salary: parseFloat(formData.basic_salary) || 0,
          allowance: parseFloat(formData.allowance) || 0,
          deductions: parseFloat(formData.deductions) || 0,
          net_salary: parseFloat(formData.net_salary) || 0,
          status: formData.payment_status,
          payment_date: formData.payment_date || null,
          remarks: formData.remarks,
          salary_slip: formData.salary_slip,
        };

        if (editingItem) {
          await updateSalary(editingItem._id, salaryData);
          alert('Salary record updated successfully!');
        } else {
          await createSalary(salaryData);
          alert('Salary record added successfully!');
        }
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
      alert(error?.response?.data?.message || 'Failed to save. Please try again.');
    }
  };

  // ==================== DELETE (ARCHIVE) FLOW ====================
  const resetDeleteState = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setDeleteType('');
    setDeleteReasonType('');
    setDeleteReasonText('');
  };

  const handleDeleteClick = (item, type) => {
    setDeleteTarget(item);
    setDeleteType(type);
    setDeleteReasonType('');
    setDeleteReasonText('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !deleteType) return;

    if (!deleteReasonType) { alert('Please select a reason'); return; }
    if (deleteReasonType === 'Other' && !deleteReasonText.trim()) {
      alert('Please specify the reason');
      return;
    }

    try {
      setIsDeleting(true);
      const id = deleteTarget._id;
      const payload = {
        reason_type: deleteReasonType,
        reason: deleteReasonText.trim(),
        archived_by_name: getCurrentUserName(),
      };

      if (deleteType === 'fee') await deleteFee(id, payload);
      else if (deleteType === 'expense') await deleteExpense(id, payload);
      else if (deleteType === 'salary') await deleteSalary(id, payload);

      alert('Record has been archived (voided).\n\nIt can be reviewed or restored from the Archived Records page.');
      resetDeleteState();
      await loadData();
    } catch (error) {
      console.error('Error archiving record:', error);
      alert(error?.response?.data?.message || 'Failed to archive record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    resetDeleteState();
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setModalType(type);

    if (type === 'fee') {
      setFormData({
        student_id: item.student_id?._id || item.student_id || '',
        student_name: item.student_id?.name || '',
        admission_fee: item.admission_fee?.toString() || '',
        tuition_fee: item.tuition_fee?.toString() || '',
        transport_fee: item.transport_fee?.toString() || '',
        activity_fee: item.activity_fee?.toString() || '',
        total_amount: item.total_amount?.toString() || '',
        due_date: item.due_date?.split('T')[0] || '',
        status: item.status || 'Pending',
        payment_date: item.payment_date?.split('T')[0] || '',
        payment_method: item.payment_method || 'Cash',
        transaction_id: item.transaction_id || '',
        notes: item.notes || '',
        expense_category: '',
        expense_description: '',
        expense_amount: '',
        expense_date: '',
        vendor_name: '',
        bill_number: '',
        payment_mode: '',
        staff_id: '',
        staff_name: '',
        salary_month: '',
        basic_salary: '',
        allowance: '',
        deductions: '',
        net_salary: '',
        payment_status: '',
        remarks: '',
        receipt_doc: null,
        salary_slip: null,
        payment_date_salary: '',
        recurring_tuition_fee: item.recurring_fees?.tuition_fee?.toString() || '',
        recurring_activity_fee: item.recurring_fees?.activity_fee?.toString() || '',
        recurring_transport_fee: item.recurring_fees?.transport_fee?.toString() || '',
        recurring_start_month: item.fee_period?.month || item.due_date?.slice(0, 7) || '',
        recurring_end_month: item.fee_period?.end_date?.slice(0, 7) || '',
        fee_plan: item.fee_plan || 'Monthly',
        monthly_due_day: item.recurring_fees?.monthly_due_day?.toString() || '5',
      });
    }
    else if (type === 'expense') {
      setFormData({
        expense_category: item.category || '',
        expense_description: item.description || '',
        expense_amount: item.amount?.toString() || '',
        expense_date: item.date?.split('T')[0] || todayLocal(),
        vendor_name: item.vendor_name || '',
        bill_number: item.bill_number || '',
        payment_mode: item.payment_mode || 'Cash',
        receipt_doc: item.receipt || null,
        student_id: '',
        student_name: '',
        admission_fee: '',
        tuition_fee: '',
        transport_fee: '',
        activity_fee: '',
        total_amount: '',
        due_date: '',
        status: '',
        payment_date: '',
        payment_method: '',
        transaction_id: '',
        notes: '',
        staff_id: '',
        staff_name: '',
        salary_month: '',
        basic_salary: '',
        allowance: '',
        deductions: '',
        net_salary: '',
        payment_status: '',
        remarks: '',
        salary_slip: null,
        payment_date_salary: '',
        recurring_tuition_fee: '',
        recurring_activity_fee: '',
        recurring_transport_fee: '',
        recurring_start_month: '',
        recurring_end_month: '',
        fee_plan: '',
        monthly_due_day: '5',
      });
    }
    else if (type === 'salary') {
      const staffMember = (Array.isArray(staff) ? staff : []).find(s => s._id === item.staff_id?._id || s._id === item.staff_id);
      setFormData({
        staff_id: item.staff_id?._id || item.staff_id || '',
        staff_name: staffMember?.name || '',
        salary_month: item.month || selectedMonth,
        basic_salary: item.basic_salary?.toString() || '',
        allowance: item.allowance?.toString() || '',
        deductions: item.deductions?.toString() || '',
        net_salary: item.net_salary?.toString() || '',
        payment_status: item.status || 'Pending',
        payment_date: item.payment_date?.split('T')[0] || '',
        remarks: item.remarks || '',
        salary_slip: item.salary_slip || null,
        expense_category: '',
        expense_description: '',
        expense_amount: '',
        expense_date: '',
        vendor_name: '',
        bill_number: '',
        payment_mode: '',
        student_id: '',
        student_name: '',
        admission_fee: '',
        tuition_fee: '',
        transport_fee: '',
        activity_fee: '',
        total_amount: '',
        due_date: '',
        status: '',
        payment_date_fee: '',
        payment_method: '',
        transaction_id: '',
        notes: '',
        receipt_doc: null,
        payment_date_salary: '',
        recurring_tuition_fee: '',
        recurring_activity_fee: '',
        recurring_transport_fee: '',
        recurring_start_month: '',
        recurring_end_month: '',
        fee_plan: '',
        monthly_due_day: '5',
      });
    }

    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      student_name: '',
      admission_fee: '',
      tuition_fee: '',
      transport_fee: '',
      activity_fee: '',
      total_amount: '',
      due_date: '',
      status: 'Pending',
      payment_date: '',
      payment_method: 'Cash',
      transaction_id: '',
      notes: '',
      expense_category: '',
      expense_description: '',
      expense_amount: '',
      expense_date: todayLocal(),
      vendor_name: '',
      bill_number: '',
      payment_mode: 'Cash',
      receipt_doc: null,
      staff_id: '',
      staff_name: '',
      salary_month: selectedMonth,
      basic_salary: '',
      allowance: '',
      deductions: '',
      net_salary: '',
      payment_status: 'Pending',
      payment_date_salary: '',
      remarks: '',
      salary_slip: null,
      recurring_tuition_fee: '',
      recurring_activity_fee: '',
      recurring_transport_fee: '',
      recurring_start_month: '',
      recurring_end_month: '',
      fee_plan: 'Monthly',
      monthly_due_day: '5',
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      student_id: '',
      fee_id: '',
      amount_paid: '',
      payment_date: todayLocal(),
      payment_method: 'Cash',
      transaction_no: '',
      notes: '',
      payment_type: 'full',
      is_advance: false,
      advance_allocation: [],
      advance_month: '',
      advance_amount_allocation: '',
      generate_future_invoices: false,
    });
    setSelectedFeeForPayment(null);
    setFeeSummary(null);
    setStudentInvoices([]);
    setNewInvoiceMonth('');
    setShowPaymentModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
      case 'Completed':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} /> };
      case 'Due':
        return { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock size={12} /> };
      case 'Upcoming':
        return { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Clock size={12} /> };
      case 'Pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={12} /> };
      case 'Overdue':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle size={12} /> };
      case 'Partial':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock size={12} /> };
      case 'Advance':
        return { bg: 'bg-purple-100', text: 'text-purple-700', icon: <TrendingUp size={12} /> };
      case 'No Dues':
        return { bg: 'bg-gray-100', text: 'text-gray-500', icon: null };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null };
    }
  };

  const safeFees = Array.isArray(fees) ? fees : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeSalaryPayments = Array.isArray(salaryPayments) ? salaryPayments : [];
  const safeStudents = Array.isArray(students) ? students : [];
  const safeStaff = Array.isArray(staff) ? staff : [];

  const totalFeesCollected = safeFees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);

  const pendingFees = safeFees.reduce((sum, f) => sum + (f.amount_due || 0), 0);
  const pendingCount = safeFees.filter(f => (f.amount_due || 0) > 0).length;

  const totalExpenses = safeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalSalaryPaid = safeSalaryPayments
    .filter(s => s.status === 'Completed')
    .reduce((sum, s) => sum + (s.net_salary || 0), 0);

  const netBalance = totalFeesCollected - totalExpenses - totalSalaryPaid;

  const getStudentFees = (studentId) => {
    if (!studentId) return [];
    if (studentInvoices.length > 0) return studentInvoices;
    return safeFees.filter(f => f.student_id?._id === studentId || f.student_id === studentId);
  };

  const phaseStyle = (phase) => {
    if (phase === 'Overdue') return 'bg-red-100 text-red-700';
    if (phase === 'Due') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-600';
  };

  const renderStatusBadge = (fee) => {
    const status = fee.status || 'Upcoming';
    const style = getStatusColor(status);
    const phase = fee.payment_phase;
    return (
      <div className="flex flex-col items-start gap-1">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
          {style.icon}
          {status}
        </span>
        {status === 'Partial' && phase && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${phaseStyle(phase)}`}>
            {phase}
          </span>
        )}
      </div>
    );
  };

  const filteredFees = safeFees.filter(f =>
    f.student_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student_id?.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpenses = safeExpenses.filter(e =>
    e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSalary = safeSalaryPayments.filter(s =>
    s.staff_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderFeeSummary = () => {
    if (!feeSummary) return null;

    const statusColor = getStatusColor(feeSummary.status);
    const phase = feeSummary.payment_phase;

    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Student</p>
            <p className="font-semibold text-gray-900">{feeSummary.student_name}</p>
            <p className="text-sm text-gray-500">{feeSummary.student_class}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Invoice #{feeSummary.invoice_number}</p>
            <div className="flex items-center justify-end gap-1">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                {statusColor.icon}
                {feeSummary.status}
              </span>
              {feeSummary.status === 'Partial' && phase && (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${phaseStyle(phase)}`}>{phase}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Fee Period</p>
            <p className="text-sm font-semibold text-gray-800">{feeSummary.fee_period?.month || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm font-semibold text-gray-800">
              {feeSummary.due_date ? new Date(feeSummary.due_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-sm font-bold text-gray-900">₹{(feeSummary.total_amount || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Already Paid</p>
            <p className="text-sm font-semibold text-green-600">₹{(feeSummary.paid_amount || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p className={`text-sm font-bold ${feeSummary.remaining_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ₹{(feeSummary.remaining_amount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Amount Due</p>
            <p className={`text-sm font-bold ${feeSummary.amount_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{(feeSummary.amount_due || 0).toLocaleString()}
            </p>
          </div>
          {feeSummary.overdue_amount > 0 && (
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-sm font-bold text-red-600">₹{feeSummary.overdue_amount.toLocaleString()}</p>
            </div>
          )}
          {feeSummary.advance_amount > 0 && (
            <div>
              <p className="text-xs text-gray-500">Credit</p>
              <p className="text-sm font-bold text-purple-600">₹{feeSummary.advance_amount.toLocaleString()}</p>
            </div>
          )}
        </div>

        {feeSummary.is_upcoming && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700 flex items-start gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              This invoice isn't due until {feeSummary.due_date ? new Date(feeSummary.due_date).toLocaleDateString() : 'its due date'}.
              Early payments are accepted; Amount Due stays ₹0 until the due date.
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Payment Type: <span className="font-semibold text-blue-600">
              {feeSummary.suggested_payment_type === 'full' ? 'Full Payment' :
               feeSummary.suggested_payment_type === 'partial' ? 'Partial Payment' : 'Advance Payment'}
            </span>
          </p>
        </div>
      </div>
    );
  };

  // ==================== PAYMENT HISTORY (View Details) ====================
  const paymentTypeBadge = (type) => {
    const t = type || 'full';
    const cls =
      t === 'full' ? 'bg-green-100 text-green-700' :
      t === 'partial' ? 'bg-blue-100 text-blue-700' :
      t === 'advance' ? 'bg-purple-100 text-purple-700' :
      'bg-gray-100 text-gray-700';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
        {t.charAt(0).toUpperCase() + t.slice(1)}
      </span>
    );
  };

  const renderFeeDetailsBody = () => {
    if (loadingHistory) {
      return (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading payment history...</p>
        </div>
      );
    }

    if (!feeDetails) {
      return (
        <div className="text-center py-10">
          <AlertCircle className="mx-auto text-red-400" size={48} />
          <p className="text-lg text-gray-500 mt-2">Could not load payment history. Close this window and try again.</p>
        </div>
      );
    }

    const rf = feeDetails.recurring_fees || {};
    const recurringParts = [];
    if (rf.tuition_fee > 0) recurringParts.push(`Tuition: ${inr(rf.tuition_fee)}`);
    if (rf.activity_fee > 0) recurringParts.push(`Activity: ${inr(rf.activity_fee)}`);
    if (rf.transport_fee > 0) recurringParts.push(`Transport: ${inr(rf.transport_fee)}`);
    recurringParts.push(`Monthly Total: ${inr(rf.total_monthly)}`);

    const groups = [
      {
        title: 'Fee Plan',
        pairs: [
          ['Fee Plan Type', feeDetails.fee_plan || 'Monthly'],
          ['Fee Period', feeDetails.fee_period?.month || 'N/A'],
          ['Invoice Number', <span className="font-mono">{feeDetails.invoice_number || 'N/A'}</span>],
          ['Invoice Date', fmtDate(feeDetails.invoice_date)],
          ['Due Date', fmtDate(feeDetails.due_date)],
          ['Recurring Fees Breakdown', recurringParts.join(', ')],
        ],
      },
      {
        title: 'Fee Account',
        pairs: [
          ['Total Charged', <span className="font-bold text-green-700">{inr(feeDetails.total_amount)}</span>],
          ['Total Paid', <span className="font-bold text-blue-700">{inr(feeDetails.paid_amount)}</span>],
          ['Outstanding', <span className="font-bold text-red-700">{inr(feeDetails.remaining_amount)}</span>],
          ['Advance', <span className="font-bold text-purple-700">{inr(feeDetails.advance_amount)}</span>],
        ],
      },
      {
        title: 'Fee Breakdown',
        pairs: [
          ['Admission', inr(feeDetails.admission_fee)],
          ['Tuition', inr(feeDetails.tuition_fee)],
          ['Transport', inr(feeDetails.transport_fee)],
          ['Activity', inr(feeDetails.activity_fee)],
          ...(feeDetails.registration_fee > 0 ? [['Registration', inr(feeDetails.registration_fee)]] : []),
          ...(feeDetails.kit_fee > 0 ? [['Kit', inr(feeDetails.kit_fee)]] : []),
          ...(feeDetails.camera_fee > 0 ? [['Camera', inr(feeDetails.camera_fee)]] : []),
          ...(feeDetails.discount > 0 ? [['Discount', `-${inr(feeDetails.discount)}`]] : []),
        ],
      },
    ];

    const invoices = [feeDetails, ...(Array.isArray(relatedInvoices) ? relatedInvoices : [])];
    let paymentRows = invoices.flatMap(invoicePaymentRows);
    paymentRows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const nothingPaid = paymentRows.length === 0;
    if (nothingPaid) {
      paymentRows = [{
        invoice_number: feeDetails.invoice_number,
        month: feeDetails.fee_period?.month,
        date: null,
        amount: 0,
        payment_type: 'unpaid',
        payment_method: null,
        notes: `Nothing paid yet. Outstanding ${inr(feeDetails.remaining_amount)}`,
        advance_allocation: [],
      }];
    }
    const totalReceived = paymentRows.reduce((s, r) => s + (r.amount || 0), 0);

    return (
      <div className="space-y-6">
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <tbody className="bg-white">
              {groups.map((group) => (
                <FragmentGroup key={group.title} group={group} />
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <History size={16} className="text-green-500" />
            Payments
          </h3>
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
                {paymentRows.map((row, index) => (
                  <tr key={index} className="hover:bg-teal-50/40 transition-colors align-top">
                    <td className="px-3 py-3 font-mono text-xs text-gray-700">{row.invoice_number || 'N/A'}</td>
                    <td className="px-3 py-3 text-gray-700">{row.month || 'N/A'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(row.date)}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900">{inr(row.amount)}</td>
                    <td className="px-3 py-3">
                      {row.payment_type === 'unpaid'
                        ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Unpaid</span>
                        : paymentTypeBadge(row.payment_type)}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{row.payment_method || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {row.transaction_id ? <div>Txn: {row.transaction_id}</div> : null}
                      {row.notes ? <div className="italic">{row.notes}</div> : null}
                      {row.advance_allocation && row.advance_allocation.length > 0 ? (
                        <div className="mt-1">
                          <span className="font-semibold">Advance to:</span>{' '}
                          {row.advance_allocation.map((a, i) => (
                            <span key={i}>
                              {a.month} {inr(a.amount)}{i < row.advance_allocation.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {!row.transaction_id && !row.notes && (!row.advance_allocation || row.advance_allocation.length === 0)
                        ? <span className="text-gray-400">—</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold text-gray-600">Total received</td>
                  <td className="px-3 py-3 font-bold text-green-700">{inr(totalReceived)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {(Array.isArray(relatedInvoices) ? relatedInvoices : []).length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-teal-500" />
              Related Invoices
            </h3>
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
                  {relatedInvoices.map((inv) => {
                    const style = getStatusColor(inv.status);
                    return (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono text-xs text-gray-700">{inv.invoice_number}</td>
                        <td className="px-3 py-3 text-gray-700">{inv.fee_period?.month || 'N/A'}</td>
                        <td className="px-3 py-3 text-gray-700">{fmtDate(inv.due_date)}</td>
                        <td className="px-3 py-3 font-semibold text-gray-900">{inr(inv.total_amount)}</td>
                        <td className="px-3 py-3 font-semibold text-green-700">{inr(inv.paid_amount)}</td>
                        <td className="px-3 py-3 font-semibold text-red-700">{inr(inv.remaining_amount)}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FragmentGroup = ({ group }) => (
    <>
      <tr className="bg-gradient-to-r from-purple-50 to-pink-50">
        <th colSpan={4} className="px-4 py-2 text-left text-sm font-bold text-gray-800">{group.title}</th>
      </tr>
      {chunk(group.pairs, 2).map((pair, i) => (
        <tr key={i} className="border-t border-gray-100">
          <td className="px-4 py-2 text-xs text-gray-500 w-1/6">{pair[0][0]}</td>
          <td className="px-4 py-2 font-semibold text-gray-800 w-1/3">{pair[0][1]}</td>
          {pair[1] ? (
            <>
              <td className="px-4 py-2 text-xs text-gray-500 w-1/6">{pair[1][0]}</td>
              <td className="px-4 py-2 font-semibold text-gray-800 w-1/3">{pair[1][1]}</td>
            </>
          ) : (
            <td colSpan={2}></td>
          )}
        </tr>
      ))}
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-teal-200 to-cyan-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent pb-2">
                Finance Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <DollarSign size={18} className="text-teal-500" />
                Manage fees collection, expenses, and staff salaries
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Wallet className="text-white" size={24} />
              </div>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Total Fees Collected</h3>
            <p className="text-2xl font-bold text-gray-800">₹{totalFeesCollected.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">+12% from last month</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-orange-600">₹{pendingFees.toLocaleString()}</span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Pending Fees</h3>
            <p className="text-2xl font-bold text-gray-800">{pendingCount} Invoices</p>
            <p className="text-xs text-gray-500 mt-2">Needs follow-up</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                <TrendingDown className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
            <p className="text-2xl font-bold text-gray-800">{safeExpenses.length} Transactions</p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Banknote className="text-white" size={24} />
              </div>
              <span className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netBalance.toLocaleString()}
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Net Balance</h3>
            <p className="text-2xl font-bold text-gray-800">{netBalance >= 0 ? 'Surplus' : 'Deficit'}</p>
            <p className="text-xs text-gray-500 mt-2">After all expenses</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 mb-8 shadow-lg">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setActiveTab('fees'); setSearchTerm(''); }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'fees'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Receipt size={18} />
              Fee Collection
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {safeFees.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('expenses'); setSearchTerm(''); }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingDown size={18} />
              Expenses
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {safeExpenses.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('salary'); setSearchTerm(''); }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'salary'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users size={18} />
              Staff Salary
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {safeSalaryPayments.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search by ${activeTab === 'fees' ? 'student name or invoice' : activeTab === 'expenses' ? 'category or vendor' : 'staff name'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {activeTab === 'fees' && (
                <>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <DollarSign size={20} />
                    Record Payment
                  </button>
                  <button
                    onClick={generateRecurringFees}
                    disabled={generatingRecurring}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CalendarDays size={20} className={generatingRecurring ? 'animate-spin' : ''} />
                    {generatingRecurring ? 'Generating...' : 'Generate Recurring Fees'}
                  </button>
                  <button
                    onClick={syncAllStudentFees}
                    disabled={isSyncing}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync Student Fees'}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setModalType(activeTab === 'fees' ? 'fee' : activeTab === 'expenses' ? 'expense' : 'salary');
                  setEditingItem(null);
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add {activeTab === 'fees' ? 'Fee Record' : activeTab === 'expenses' ? 'Expense' : 'Salary Payment'}
              </button>
            </div>
          </div>
        </div>

        {/* Fee Collection Table */}
        {activeTab === 'fees' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fee Period</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount Due</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFees.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        <Receipt className="mx-auto mb-3 text-gray-400" size={48} />
                        <p className="text-lg">No fee records found</p>
                        <p className="text-sm text-gray-400 mt-1">Click "Sync Student Fees" to import from student profiles</p>
                      </td>
                    </tr>
                  ) : (
                    filteredFees.map((fee) => {
                      const realRemaining = fee.remaining_amount ?? Math.max(0, (fee.total_amount || 0) - (fee.paid_amount || 0));
                      const amountDue = Math.max(0, fee.amount_due ?? fee.balance_due ?? 0);

                      return (
                        <tr key={fee._id} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-transparent transition-all duration-300">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                <User className="text-white" size={16} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{fee.student_id?.name}</div>
                                <div className="text-sm text-gray-500">Class: {fee.student_id?.class_id || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-gray-600">{fee.invoice_number || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {fee.fee_period?.month || (fee.due_date ? new Date(fee.due_date).toISOString().slice(0, 7) : 'N/A')}
                            </div>
                            <div className="text-xs text-gray-400">
                              Due: {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">₹{(fee.total_amount || 0).toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-green-600">₹{(fee.paid_amount || 0).toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className={`font-semibold ${amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{amountDue.toLocaleString()}
                              </span>
                              {fee.payment_phase === 'Upcoming' && realRemaining > 0 && (
                                <span className="text-xs text-gray-400 block">Remaining ₹{realRemaining.toLocaleString()} (not yet due)</span>
                              )}
                              {fee.overdue_amount > 0 && (
                                <span className="text-xs text-red-500 block">Overdue: ₹{fee.overdue_amount.toLocaleString()}</span>
                              )}
                              {fee.advance_amount > 0 && (
                                <span className="text-xs text-purple-500 block">Credit: ₹{fee.advance_amount.toLocaleString()}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{renderStatusBadge(fee)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  const sid = fee.student_id?._id || fee.student_id || '';
                                  setSelectedFeeForPayment(fee);
                                  setPaymentFormData({
                                    ...paymentFormData,
                                    student_id: sid,
                                    fee_id: fee._id,
                                    amount_paid: realRemaining > 0 ? realRemaining : '',
                                  });
                                  loadStudentInvoices(sid);
                                  fetchFeeSummary(fee._id);
                                  setShowPaymentModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 p-1 transition-colors"
                                title="Record Payment"
                              >
                                <DollarSign size={18} />
                              </button>
                              <button onClick={() => fetchFeeDetails(fee._id)} className="text-purple-600 hover:text-purple-800 p-1 transition-colors" title="View Details">
                                <Eye size={18} />
                              </button>
                              <button onClick={() => handleEdit(fee, 'fee')} className="text-blue-600 hover:text-blue-800 p-1 transition-colors" title="Edit">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => handleDeleteClick(fee, 'fee')} className="text-red-600 hover:text-red-800 p-1 transition-colors" title="Archive / Void">
                                <Archive size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showFeeDetails && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History size={24} />
                  Payment History{feeDetails?.student_id?.name ? ` — ${feeDetails.student_id.name}` : ''}
                </h2>
                <button onClick={() => setShowFeeDetails(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {renderFeeDetailsBody()}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Expenses Table */}
        {activeTab === 'expenses' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Mode</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <TrendingDown className="mx-auto mb-3 text-gray-400" size={48} />
                        <p className="text-lg">No expense records found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-transparent transition-all duration-300">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {expense.vendor_name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-red-600">₹{(expense.amount || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {expense.payment_mode}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEdit(expense, 'expense')} className="text-blue-600 hover:text-blue-800 mr-3 transition-colors">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteClick(expense, 'expense')} className="text-red-600 hover:text-red-800 transition-colors" title="Archive / Void">
                            <Archive size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Salary Table */}
        {activeTab === 'salary' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Basic Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Allowance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSalary.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        <Users className="mx-auto mb-3 text-gray-400" size={48} />
                        <p className="text-lg">No salary records found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSalary.map((salary) => {
                      const statusStyle = getStatusColor(salary.status);
                      return (
                        <tr key={salary._id} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-transparent transition-all duration-300">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <Users className="text-white" size={16} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{salary.staff_id?.name}</div>
                                <div className="text-sm text-gray-500">{salary.staff_id?.designation}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {salary.month ? new Date(salary.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹{(salary.basic_salary || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-green-600">
                            +₹{(salary.allowance || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            -₹{(salary.deductions || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">₹{(salary.net_salary || 0).toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                              {statusStyle.icon}
                              {salary.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleEdit(salary, 'salary')} className="text-blue-600 hover:text-blue-800 mr-3 transition-colors">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDeleteClick(salary, 'salary')} className="text-red-600 hover:text-red-800 transition-colors" title="Archive / Void">
                              <Archive size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== ARCHIVE / VOID MODAL ==================== */}
        {showDeleteModal && deleteTarget && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Archive size={22} />
                  Archive / Void Record
                </h2>
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-800">
                  <Info size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>{describeTarget(deleteTarget, deleteType)}</strong> will be voided and moved to the
                    <strong> Archived Records</strong> page. Finance records are never permanently deleted;
                    your name and the time will be recorded.
                  </span>
                </div>

                {deleteType === 'fee' && (deleteTarget.paid_amount || 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <span>
                      This invoice has <strong>{inr(deleteTarget.paid_amount)}</strong> already paid.
                      Voiding it removes that amount from the collected totals.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={deleteReasonType}
                    onChange={(e) => setDeleteReasonType(e.target.value)}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select a reason</option>
                    {ARCHIVE_REASONS.map((r) => (
                      <option key={r} value={r}>{r === 'Other' ? 'Other – specify reason' : r}</option>
                    ))}
                  </select>
                </div>

                {deleteReasonType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {deleteReasonType === 'Other' ? 'Specify reason' : 'Additional note'}{' '}
                      {deleteReasonType === 'Other'
                        ? <span className="text-red-500">*</span>
                        : <span className="text-xs text-gray-400">(optional)</span>}
                    </label>
                    <textarea
                      value={deleteReasonText}
                      onChange={(e) => setDeleteReasonText(e.target.value)}
                      rows={3}
                      placeholder={deleteReasonType === 'Other' ? 'Type the reason...' : 'Any extra details...'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={isDeleting}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={
                      isDeleting ||
                      !deleteReasonType ||
                      (deleteReasonType === 'Other' && !deleteReasonText.trim())
                    }
                    className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <><Loader2 size={18} className="animate-spin" /> Archiving...</>
                    ) : (
                      <><Archive size={18} /> Archive / Void</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Payment Record Modal */}
        {showPaymentModal && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign size={24} />
                  Record Payment
                </h2>
                <button onClick={resetPaymentForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                {loadingFeeSummary ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-2 text-gray-500">Loading fee details...</span>
                  </div>
                ) : feeSummary ? (
                  renderFeeSummary()
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 flex items-center gap-2">
                    <Info size={20} />
                    <span>Please select a student and fee record to view summary.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Student *</label>
                    <select
                      required
                      value={paymentFormData.student_id}
                      onChange={(e) => {
                        const sid = e.target.value;
                        setPaymentFormData({ ...paymentFormData, student_id: sid, fee_id: '', amount_paid: '' });
                        setFeeSummary(null);
                        setStudentInvoices([]);
                        loadStudentInvoices(sid, true);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Student</option>
                      {safeStudents.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} - {student.class_id || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Fee Record/Invoice * {loadingInvoices && <span className="text-xs text-gray-400">(loading...)</span>}
                    </label>
                    <select
                      required
                      value={paymentFormData.fee_id}
                      onChange={(e) => {
                        const feeId = e.target.value;
                        setPaymentFormData({ ...paymentFormData, fee_id: feeId });
                        if (feeId) fetchFeeSummary(feeId);
                        else setFeeSummary(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Fee Record</option>
                      {getStudentFees(paymentFormData.student_id).map((fee) => {
                        const remaining = fee.remaining_amount ?? Math.max(0, (fee.total_amount || 0) - (fee.paid_amount || 0));
                        const dueTxt = fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A';
                        const isNext = fee.fee_period?.month === monthKeyLocal(1);
                        let label;
                        switch (fee.status) {
                          case 'Paid': label = 'Paid'; break;
                          case 'Advance': label = 'Paid in advance'; break;
                          case 'No Dues': label = 'No dues'; break;
                          case 'Partial': label = `Partial · ${fee.payment_phase} - ₹${remaining} left`; break;
                          case 'Upcoming': label = `Upcoming - due ${dueTxt}, ₹${remaining} payable now`; break;
                          case 'Overdue': label = `Overdue - ₹${remaining}`; break;
                          default: label = `Due - ₹${remaining}`;
                        }
                        return (
                          <option key={fee._id} value={fee._id} disabled={remaining <= 0}>
                            {isNext ? '★ Next month · ' : ''}{fee.fee_period?.month || dueTxt} · {fee.invoice_number || ''} · ₹{fee.total_amount} ({label})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {paymentFormData.student_id && (
                    <div className="md:col-span-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600">Invoice not in the list?</span>
                      <input
                        type="month"
                        value={newInvoiceMonth}
                        onChange={(e) => setNewInvoiceMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleCreateInvoiceForMonth}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600"
                      >
                        Create invoice for this month
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      value={paymentFormData.amount_paid}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPaymentFormData({ ...paymentFormData, amount_paid: value });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter amount"
                    />
                    {feeSummary && feeSummary.remaining_amount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Remaining: ₹{feeSummary.remaining_amount.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={paymentFormData.payment_date}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                    <select
                      required
                      value={paymentFormData.payment_method}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction/Receipt No.</label>
                    <input
                      type="text"
                      value={paymentFormData.transaction_no}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_no: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter reference number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={paymentFormData.notes}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Additional notes about the payment..."
                    />
                  </div>

                  {feeSummary && (
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Payment Type (Auto-calculated):</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            parseFloat(paymentFormData.amount_paid || 0) > feeSummary.remaining_amount && feeSummary.remaining_amount > 0
                              ? 'bg-purple-100 text-purple-700'
                              : parseFloat(paymentFormData.amount_paid || 0) < feeSummary.remaining_amount && feeSummary.remaining_amount > 0
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {parseFloat(paymentFormData.amount_paid || 0) > feeSummary.remaining_amount && feeSummary.remaining_amount > 0
                              ? 'Advance Payment'
                              : parseFloat(paymentFormData.amount_paid || 0) < feeSummary.remaining_amount && feeSummary.remaining_amount > 0
                              ? 'Partial Payment'
                              : 'Full Payment'}
                          </span>
                          {feeSummary.remaining_amount <= 0 && (
                            <span className="text-sm text-green-600">✓ No outstanding balance</span>
                          )}
                          {feeSummary.is_overdue && (
                            <span className="text-sm text-red-600 ml-2">⚠️ Overdue</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {feeSummary && feeSummary.remaining_amount > 0 && parseFloat(paymentFormData.amount_paid || 0) > feeSummary.remaining_amount && (
                    <div className="md:col-span-2">
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="isAdvancePayment"
                            checked={paymentFormData.is_advance || false}
                            onChange={(e) => {
                              setPaymentFormData({
                                ...paymentFormData,
                                is_advance: e.target.checked,
                                advance_allocation: [],
                              });
                            }}
                            className="rounded border-purple-300"
                          />
                          <label htmlFor="isAdvancePayment" className="text-sm font-medium text-purple-700">
                            Allocate advance amount to future months
                          </label>
                        </div>

                        {paymentFormData.is_advance && (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                              Advance amount: ₹{(parseFloat(paymentFormData.amount_paid || 0) - feeSummary.remaining_amount).toLocaleString()}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <input
                                type="month"
                                value={paymentFormData.advance_month || ''}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, advance_month: e.target.value })}
                                className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <input
                                type="number"
                                placeholder="Amount"
                                value={paymentFormData.advance_amount_allocation || ''}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, advance_amount_allocation: e.target.value })}
                                className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (paymentFormData.advance_month && paymentFormData.advance_amount_allocation) {
                                    const allocations = [...(paymentFormData.advance_allocation || [])];
                                    const totalAdvance = parseFloat(paymentFormData.amount_paid || 0) - feeSummary.remaining_amount;
                                    const currentAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
                                    const newAmount = parseFloat(paymentFormData.advance_amount_allocation);

                                    if (currentAllocated + newAmount > totalAdvance) {
                                      alert(`Total allocation (₹${(currentAllocated + newAmount).toLocaleString()}) exceeds advance amount (₹${totalAdvance.toLocaleString()})`);
                                      return;
                                    }

                                    allocations.push({
                                      month: paymentFormData.advance_month,
                                      amount: newAmount,
                                    });
                                    setPaymentFormData({
                                      ...paymentFormData,
                                      advance_allocation: allocations,
                                      advance_month: '',
                                      advance_amount_allocation: '',
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                              >
                                Add
                              </button>
                            </div>
                            {(paymentFormData.advance_allocation || []).length > 0 && (
                              <div className="space-y-1">
                                {(paymentFormData.advance_allocation || []).map((alloc, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                                    <span className="text-sm">{alloc.month}</span>
                                    <span className="text-sm font-semibold">₹{(alloc.amount || 0).toLocaleString()}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const allocations = (paymentFormData.advance_allocation || []).filter((_, i) => i !== idx);
                                        setPaymentFormData({ ...paymentFormData, advance_allocation: allocations });
                                      }}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <div className="text-sm text-gray-600">
                                  Total Allocated: ₹{(paymentFormData.advance_allocation || []).reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString()}
                                  {feeSummary && (
                                    <span className="ml-2 text-gray-400">
                                      (Advance: ₹{(parseFloat(paymentFormData.amount_paid || 0) - feeSummary.remaining_amount).toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="generateFutureInvoices"
                                checked={paymentFormData.generate_future_invoices || false}
                                onChange={(e) => setPaymentFormData({ ...paymentFormData, generate_future_invoices: e.target.checked })}
                                className="rounded border-purple-300"
                              />
                              <label htmlFor="generateFutureInvoices" className="text-sm text-gray-600">
                                Generate future invoices for allocated months automatically
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={resetPaymentForm} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
                    <DollarSign size={18} />
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal for Add/Edit */}
        {showModal && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingItem ? `Edit ${modalType === 'fee' ? 'Fee Record' : modalType === 'expense' ? 'Expense' : 'Salary Payment'}` :
                   `Add New ${modalType === 'fee' ? 'Fee Record' : modalType === 'expense' ? 'Expense' : 'Salary Payment'}`}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {modalType === 'fee' && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <RefreshCw size={16} />
                        <span>
                          {editingItem ? (
                            'This fee record was auto-synced from student registration. Updates will be reflected in student profile.'
                          ) : (
                            'Fees can be auto-synced from student registration. Select a student to pre-fill fee details.'
                          )}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Student *</label>
                      <select
                        required
                        value={formData.student_id}
                        onChange={(e) => {
                          const student = safeStudents.find(s => s._id === e.target.value);
                          setFormData({
                            ...formData,
                            student_id: e.target.value,
                            student_name: student?.name || '',
                            admission_fee: student?.admission_fee?.toString() || '',
                            tuition_fee: student?.tuition_fee?.toString() || '',
                            transport_fee: student?.cab_fee?.toString() || '',
                            activity_fee: student?.activity_fee?.toString() || '',
                            recurring_tuition_fee: student?.recurring_fees?.tuition_fee?.toString() || '',
                            recurring_activity_fee: student?.recurring_fees?.activity_fee?.toString() || '',
                            recurring_transport_fee: student?.recurring_fees?.transport_fee?.toString() || '',
                          });
                          setTimeout(updateTotalAmount, 100);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select Student</option>
                        {safeStudents.map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.name} - {student.class_id || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                        <CalendarDays size={16} />
                        Recurring Fees Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Tuition Fee</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.recurring_tuition_fee}
                            onChange={(e) => setFormData({ ...formData, recurring_tuition_fee: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Activity Fee</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.recurring_activity_fee}
                            onChange={(e) => setFormData({ ...formData, recurring_activity_fee: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Transport Fee</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.recurring_transport_fee}
                            onChange={(e) => setFormData({ ...formData, recurring_transport_fee: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fee Plan</label>
                          <select
                            value={formData.fee_plan}
                            onChange={(e) => setFormData({ ...formData, fee_plan: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Half-Yearly">Half-Yearly</option>
                            <option value="Yearly">Yearly</option>
                            <option value="One-Time">One-Time</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Due (Day of Month) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="31"
                            value={formData.monthly_due_day}
                            onChange={(e) => setFormData({ ...formData, monthly_due_day: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="e.g. 5"
                          />
                          <p className="text-xs text-gray-500 mt-1">Recurring invoices are due on this day every month.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Month</label>
                          <input
                            type="month"
                            value={formData.recurring_start_month}
                            onChange={(e) => setFormData({ ...formData, recurring_start_month: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Month</label>
                          <input
                            type="month"
                            value={formData.recurring_end_month}
                            onChange={(e) => setFormData({ ...formData, recurring_end_month: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admission Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.admission_fee}
                          onChange={(e) => handleFeeFieldChange('admission_fee', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.tuition_fee}
                          onChange={(e) => handleFeeFieldChange('tuition_fee', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transport Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.transport_fee}
                          onChange={(e) => handleFeeFieldChange('transport_fee', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Activity Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.activity_fee}
                          onChange={(e) => handleFeeFieldChange('activity_fee', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount *</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          value={formData.total_amount}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 font-semibold text-teal-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (auto-calculated)</label>
                        <div className="w-full px-4 py-2 bg-gray-100 rounded-xl text-gray-700 font-semibold">
                          {computeDueDateFromDay(formData.recurring_start_month, formData.monthly_due_day)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <div className="w-full px-4 py-2 bg-gray-100 rounded-xl text-gray-600 text-sm">
                          Calculated automatically from payments and due date
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select
                          value={formData.payment_method}
                          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                        <input
                          type="date"
                          value={formData.payment_date}
                          onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                        <input
                          type="text"
                          value={formData.transaction_id}
                          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {modalType === 'expense' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expense Category *</label>
                      <select
                        required
                        value={formData.expense_category}
                        onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Events">Events</option>
                        <option value="Transport">Transport</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expense Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        required
                        value={formData.expense_description}
                        onChange={(e) => setFormData({ ...formData, expense_description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Describe the expense..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={formData.expense_amount}
                        onChange={(e) => setFormData({ ...formData, expense_amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
                      <input
                        type="text"
                        value={formData.vendor_name}
                        onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bill/Invoice Number</label>
                      <input
                        type="text"
                        value={formData.bill_number}
                        onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                      <select
                        value={formData.payment_mode}
                        onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Receipt/Bill Document</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'receipt_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                        />
                        {formData.receipt_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                  </div>
                )}

                {modalType === 'salary' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff Member *</label>
                      <select
                        required
                        value={formData.staff_id}
                        onChange={(e) => {
                          const staffMember = safeStaff.find(s => s._id === e.target.value);
                          setFormData({
                            ...formData,
                            staff_id: e.target.value,
                            staff_name: staffMember?.name || '',
                            basic_salary: staffMember?.salary?.toString() || ''
                          });
                          setTimeout(calculateNetSalary, 100);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select Staff</option>
                        {safeStaff.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name} - {member.designation}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Month *</label>
                        <input
                          type="month"
                          required
                          value={formData.salary_month}
                          onChange={(e) => setFormData({ ...formData, salary_month: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary *</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          value={formData.basic_salary}
                          onChange={(e) => {
                            setFormData({ ...formData, basic_salary: e.target.value });
                            setTimeout(calculateNetSalary, 100);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowances</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.allowance}
                          onChange={(e) => {
                            setFormData({ ...formData, allowance: e.target.value });
                            setTimeout(calculateNetSalary, 100);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Deductions</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.deductions}
                          onChange={(e) => {
                            setFormData({ ...formData, deductions: e.target.value });
                            setTimeout(calculateNetSalary, 100);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Net Salary *</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          value={formData.net_salary}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 font-semibold text-teal-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status *</label>
                        <select
                          required
                          value={formData.payment_status}
                          onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                        <input
                          type="date"
                          value={formData.payment_date}
                          onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                        <textarea
                          value={formData.remarks}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Additional remarks..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Slip Document</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, 'salary_slip')}
                            className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                          />
                          {formData.salary_slip && <FileText size={20} className="text-green-600" />}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all">
                    {editingItem ? 'Update' : 'Add'} Record
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}