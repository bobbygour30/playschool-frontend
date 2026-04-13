import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, DollarSign, Calendar, 
  Filter, Download, TrendingUp, TrendingDown, Users, 
  FileText, Eye, ChevronDown, ChevronRight, Printer,
  PieChart, Wallet, CreditCard, Banknote, Receipt,
  AlertCircle, CheckCircle, Clock, Upload, Building,
  User, Phone, Mail, BookOpen, Award, Star, Home
} from 'lucide-react';
import { 
  getFees, getExpenses, getSalaries, getStudents, getStaff,
  createFee, updateFee, deleteFee,
  createExpense, updateExpense, deleteExpense,
  createSalary, updateSalary, deleteSalary
} from '../services/api';

export default function Finance() {
  const [activeTab, setActiveTab] = useState('fees');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  
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
    expense_date: new Date().toISOString().split('T')[0],
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
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

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
      
      setFees(feesRes.data || []);
      setExpenses(expensesRes.data || []);
      setSalaryPayments(salaryRes.data || []);
      setStudents(studentsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error) {
      console.error('Error loading finance data:', error);
      alert('Failed to load financial data');
    } finally {
      setLoading(false);
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
    const total = (parseFloat(formData.admission_fee) || 0) +
                  (parseFloat(formData.tuition_fee) || 0) +
                  (parseFloat(formData.transport_fee) || 0) +
                  (parseFloat(formData.activity_fee) || 0);
    setFormData(prev => ({ ...prev, total_amount: total.toString() }));
  };

  const calculateNetSalary = () => {
    const net = (parseFloat(formData.basic_salary) || 0) +
                (parseFloat(formData.allowance) || 0) -
                (parseFloat(formData.deductions) || 0);
    setFormData(prev => ({ ...prev, net_salary: net.toString() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'fee') {
        const feeData = {
          student_id: formData.student_id,
          admission_fee: parseFloat(formData.admission_fee) || 0,
          tuition_fee: parseFloat(formData.tuition_fee) || 0,
          transport_fee: parseFloat(formData.transport_fee) || 0,
          activity_fee: parseFloat(formData.activity_fee) || 0,
          total_amount: parseFloat(formData.total_amount) || 0,
          due_date: formData.due_date,
          status: formData.status,
          payment_date: formData.payment_date || null,
          payment_method: formData.payment_method,
          transaction_id: formData.transaction_id,
          notes: formData.notes,
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
      alert('Failed to save. Please try again.');
    }
  };

  const handleDelete = async (id, type) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        if (type === 'fee') await deleteFee(id);
        else if (type === 'expense') await deleteExpense(id);
        else if (type === 'salary') await deleteSalary(id);
        
        await loadData();
        alert('Record deleted successfully!');
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Failed to delete. Please try again.');
      }
    }
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
      });
    } 
    else if (type === 'expense') {
      setFormData({
        expense_category: item.category || '',
        expense_description: item.description || '',
        expense_amount: item.amount?.toString() || '',
        expense_date: item.date?.split('T')[0] || new Date().toISOString().split('T')[0],
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
      });
    }
    else if (type === 'salary') {
      const staffMember = staff.find(s => s._id === item.staff_id?._id || s._id === item.staff_id);
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
      expense_date: new Date().toISOString().split('T')[0],
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
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
      case 'Completed':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} /> };
      case 'Pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={12} /> };
      case 'Overdue':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle size={12} /> };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null };
    }
  };

  const totalFeesCollected = fees
    .filter(f => f.status === 'Paid')
    .reduce((sum, f) => sum + (f.total_amount || 0), 0);
  
  const pendingFees = fees
    .filter(f => f.status === 'Pending' || f.status === 'Overdue')
    .reduce((sum, f) => sum + (f.total_amount || 0), 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalSalaryPaid = salaryPayments
    .filter(s => s.status === 'Completed')
    .reduce((sum, s) => sum + (s.net_salary || 0), 0);
  
  const netBalance = totalFeesCollected - totalExpenses - totalSalaryPaid;

  const filteredFees = fees.filter(f => 
    f.student_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.student_id?.parent_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredExpenses = expenses.filter(e => 
    e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSalary = salaryPayments.filter(s => 
    s.staff_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Finance Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <DollarSign size={18} className="text-teal-500" />
                Manage fees collection, expenses, and staff salaries
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                <Download size={18} />
                Export Report
              </button>
              <button className="px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                <Printer size={18} />
                Print
              </button>
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
            <p className="text-2xl font-bold text-gray-800">{fees.filter(f => f.status === 'Pending').length} Students</p>
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
            <p className="text-2xl font-bold text-gray-800">{expenses.length} Transactions</p>
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
          <div className="flex gap-2">
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
                placeholder={`Search by ${activeTab === 'fees' ? 'student name' : activeTab === 'expenses' ? 'category or vendor' : 'staff name'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
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

        {/* Fee Collection Table */}
        {activeTab === 'fees' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fee Breakdown</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <Receipt className="mx-auto mb-3 text-gray-400" size={48} />
                        <p className="text-lg">No fee records found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredFees.map((fee) => {
                      const statusStyle = getStatusColor(fee.status);
                      return (
                        <tr key={fee._id} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-transparent transition-all duration-300">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                <User className="text-white" size={16} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{fee.student_id?.name}</div>
                                <div className="text-sm text-gray-500">Class: {fee.student_id?.class_id?.name || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-sm">
                              {fee.admission_fee > 0 && <div>Admission: ₹{fee.admission_fee}</div>}
                              {fee.tuition_fee > 0 && <div>Tuition: ₹{fee.tuition_fee}</div>}
                              {fee.transport_fee > 0 && <div>Transport: ₹{fee.transport_fee}</div>}
                              {fee.activity_fee > 0 && <div>Activity: ₹{fee.activity_fee}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">₹{fee.total_amount?.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(fee.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                              {statusStyle.icon}
                              {fee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {fee.payment_method || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleEdit(fee, 'fee')} className="text-blue-600 hover:text-blue-800 mr-3 transition-colors">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(fee._id, 'fee')} className="text-red-600 hover:text-red-800 transition-colors">
                              <Trash2 size={18} />
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
                          {new Date(expense.date).toLocaleDateString()}
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
                          <span className="font-semibold text-red-600">₹{expense.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {expense.payment_mode}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEdit(expense, 'expense')} className="text-blue-600 hover:text-blue-800 mr-3 transition-colors">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(expense._id, 'expense')} className="text-red-600 hover:text-red-800 transition-colors">
                            <Trash2 size={18} />
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
                            {new Date(salary.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹{salary.basic_salary?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-green-600">
                            +₹{salary.allowance?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            -₹{salary.deductions?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">₹{salary.net_salary?.toLocaleString()}</span>
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
                            <button onClick={() => handleDelete(salary._id, 'salary')} className="text-red-600 hover:text-red-800 transition-colors">
                              <Trash2 size={18} />
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

        {/* Modal for Add/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                {/* Fee Form */}
                {modalType === 'fee' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Student *</label>
                      <select
                        required
                        value={formData.student_id}
                        onChange={(e) => {
                          const student = students.find(s => s._id === e.target.value);
                          setFormData({ 
                            ...formData, 
                            student_id: e.target.value,
                            student_name: student?.name || ''
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.name} - {student.class_id?.name || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admission Fee</label>
                        <input type="number" step="0.01" value={formData.admission_fee} onChange={(e) => {
                          setFormData({ ...formData, admission_fee: e.target.value });
                          setTimeout(calculateTotalFee, 100);
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Fee</label>
                        <input type="number" step="0.01" value={formData.tuition_fee} onChange={(e) => {
                          setFormData({ ...formData, tuition_fee: e.target.value });
                          setTimeout(calculateTotalFee, 100);
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transport Fee</label>
                        <input type="number" step="0.01" value={formData.transport_fee} onChange={(e) => {
                          setFormData({ ...formData, transport_fee: e.target.value });
                          setTimeout(calculateTotalFee, 100);
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Activity Fee</label>
                        <input type="number" step="0.01" value={formData.activity_fee} onChange={(e) => {
                          setFormData({ ...formData, activity_fee: e.target.value });
                          setTimeout(calculateTotalFee, 100);
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount *</label>
                        <input type="number" required step="0.01" value={formData.total_amount} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                        <input type="date" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                        <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                        <input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                        <input type="text" value={formData.transaction_id} onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Additional notes..." />
                      </div>
                    </div>
                  </>
                )}

                {/* Expense Form */}
                {modalType === 'expense' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expense Category *</label>
                      <select required value={formData.expense_category} onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent">
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
                      <input type="date" required value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea required value={formData.expense_description} onChange={(e) => setFormData({ ...formData, expense_description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Describe the expense..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                      <input type="number" required step="0.01" value={formData.expense_amount} onChange={(e) => setFormData({ ...formData, expense_amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
                      <input type="text" value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bill/Invoice Number</label>
                      <input type="text" value={formData.bill_number} onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                      <select value={formData.payment_mode} onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Receipt/Bill Document</label>
                      <div className="flex items-center gap-2">
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'receipt_doc')} className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                        {formData.receipt_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                  </div>
                )}

                {/* Salary Form */}
                {modalType === 'salary' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff Member *</label>
                      <select
                        required
                        value={formData.staff_id}
                        onChange={(e) => {
                          const staffMember = staff.find(s => s._id === e.target.value);
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
                        {staff.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name} - {member.designation}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Month *</label>
                        <input type="month" required value={formData.salary_month} onChange={(e) => setFormData({ ...formData, salary_month: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary *</label>
                        <input type="number" required step="0.01" value={formData.basic_salary} onChange={(e) => {
                          setFormData({ ...formData, basic_salary: e.target.value });
                          setTimeout(calculateNetSalary, 100);
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowances</label>
                        <input type="number" step="0.01" value={formData.allowance} onChange={(e) => {
                          setFormData({ ...formData, allowance: e.target.value });
                          setTimeout(calculateNetSalary, 100);
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Deductions</label>
                        <input type="number" step="0.01" value={formData.deductions} onChange={(e) => {
                          setFormData({ ...formData, deductions: e.target.value });
                          setTimeout(calculateNetSalary, 100);
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Net Salary *</label>
                        <input type="number" required step="0.01" value={formData.net_salary} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 font-semibold" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status *</label>
                        <select required value={formData.payment_status} onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                        <input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                        <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Additional remarks..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Slip Document</label>
                        <div className="flex items-center gap-2">
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'salary_slip')} className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                          {formData.salary_slip && <FileText size={20} className="text-green-600" />}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all">
                    {editingItem ? 'Update' : 'Add'} Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}