// Enquiries.jsx
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, MapPin,
  Filter, UserPlus, TrendingUp, AlertCircle, CheckCircle, Clock,
  CalendarDays, GraduationCap, Baby, School, Star, Eye, History,
  MessageSquarePlus, ArrowRightCircle, PhoneCall, ChevronDown, ChevronUp,
  Info, UserCheck, Sparkles,
} from 'lucide-react';
import {
  getEnquiries, createEnquiry, updateEnquiry, deleteEnquiry,
  getEnquiryStats, getEnquiryOptions, recordFollowUp, convertEnquiry,
} from '../services/api';

// Fallbacks used until the options endpoint responds
const FALLBACK_STATUSES = ['New', 'Follow Up', 'Interested', 'Not Interested', 'Converted'];
const FALLBACK_SOURCES = [
  'Online', 'Instagram', 'Facebook', 'Walk-in', 'Parents Reference',
  'Google Search', 'Friend / Family', 'Newspaper', 'Pamphlet', 'Other',
];

const CLASS_OPTIONS = [
  { id: 'playgroup', name: 'Playgroup / Pre-Nursery', icon: Baby },
  { id: 'nursery', name: 'Nursery', icon: School },
  { id: 'lkg', name: 'LKG', icon: GraduationCap },
  { id: 'ukg', name: 'UKG', icon: Star },
];

const RELATIONSHIP_TYPES = ['Father', 'Mother', 'Guardian'];

const emptyForm = {
  student_name: '',
  student_dob: '',
  student_gender: '',
  class_interested: '',
  parent_name: '',
  parent_relationship: 'Father',
  parent_phone: '',
  parent_email: '',
  address: '',
  enquiry_date: new Date().toISOString().split('T')[0],
  first_visit_date: new Date().toISOString().split('T')[0],
  knowledge_source: '',
  knowledge_source_other: '',
  status: 'New',
  last_follow_up_date: '',
  next_follow_up_date: '',
  notes: '',
};

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState({
    total: 0, new: 0, follow_up: 0, interested: 0,
    not_interested: 0, converted: 0, overdue_follow_ups: 0,
    this_month_new: 0, this_month_converted: 0, conversion_rate: 0,
  });
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES);
  const [sources, setSources] = useState(FALLBACK_SOURCES);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Follow-up modal
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpTarget, setFollowUpTarget] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({
    note: '', status: '', next_follow_up_date: '',
  });
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState(true);

  // Convert modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertTarget, setConvertTarget] = useState(null);
  const [convertNote, setConvertNote] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // ---------- Load ----------
  useEffect(() => {
    loadData();
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const res = await getEnquiryOptions();
      const data = res?.data || res;
      if (Array.isArray(data?.statuses)) setStatuses(data.statuses);
      if (Array.isArray(data?.knowledge_sources)) setSources(data.knowledge_sources);
    } catch (err) {
      // Silent — fallbacks are fine
      console.warn('Could not load enquiry options, using fallbacks');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      let list = [];
      try {
        const res = await getEnquiries();
        if (res?.data?.data && Array.isArray(res.data.data)) list = res.data.data;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res)) list = res;
      } catch (err) {
        console.error('Error fetching enquiries:', err);
      }
      setEnquiries(list);

      let s = null;
      try {
        const res = await getEnquiryStats();
        s = res?.data || res;
      } catch (err) {
        console.error('Error fetching enquiry stats:', err);
      }
      if (s) {
        setStats({
          total: s.total || 0,
          new: s.new || 0,
          follow_up: s.follow_up || 0,
          interested: s.interested || 0,
          not_interested: s.not_interested || 0,
          converted: s.converted || 0,
          overdue_follow_ups: s.overdue_follow_ups || 0,
          this_month_new: s.this_month_new || 0,
          this_month_converted: s.this_month_converted || 0,
          conversion_rate: s.conversion_rate || 0,
        });
      }
    } catch (error) {
      console.error('Error loading enquiry data:', error);
      alert('Failed to load enquiry data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers ----------
  const handleDigitInput = (value) => value.replace(/\D/g, '').slice(0, 10);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'New':            return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Follow Up':      return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Interested':     return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Not Interested': return 'bg-red-100 text-red-700 border-red-200';
      case 'Converted':      return 'bg-purple-100 text-purple-700 border-purple-200';
      default:               return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'New':            return 'bg-blue-500';
      case 'Follow Up':      return 'bg-amber-500';
      case 'Interested':     return 'bg-emerald-500';
      case 'Not Interested': return 'bg-red-500';
      case 'Converted':      return 'bg-purple-500';
      default:               return 'bg-gray-400';
    }
  };

  const getClassName = (classId) => {
    const c = CLASS_OPTIONS.find((x) => x.id === classId);
    return c ? c.name : 'Not specified';
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) : '—');

  const isOverdue = (enq) => {
    if (!enq?.next_follow_up_date) return false;
    if (['Converted', 'Not Interested'].includes(enq.status)) return false;
    return new Date(enq.next_follow_up_date) < new Date();
  };

  // ---------- Filtering ----------
  const filteredEnquiries = useMemo(() => {
    let list = Array.isArray(enquiries) ? enquiries : [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((e) =>
        e.student_name?.toLowerCase().includes(term) ||
        e.parent_name?.toLowerCase().includes(term) ||
        e.parent_phone?.includes(searchTerm) ||
        e.parent_email?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') list = list.filter((e) => e.status === statusFilter);
    if (sourceFilter !== 'all') list = list.filter((e) => e.knowledge_source === sourceFilter);
    if (classFilter !== 'all') list = list.filter((e) => e.class_interested === classFilter);
    if (overdueOnly) list = list.filter(isOverdue);

    return list;
  }, [enquiries, searchTerm, statusFilter, sourceFilter, classFilter, overdueOnly]);

  // ---------- Validation ----------
  const validateForm = () => {
    const errors = {};
    if (!formData.student_name.trim()) errors.student_name = 'Student name is required';
    if (!formData.parent_name.trim()) errors.parent_name = 'Parent name is required';
    if (!formData.parent_phone) errors.parent_phone = 'Parent phone is required';
    else if (formData.parent_phone.length !== 10) errors.parent_phone = 'Must be exactly 10 digits';
    if (!formData.knowledge_source) errors.knowledge_source = 'Please select a source';
    if (!formData.enquiry_date) errors.enquiry_date = 'Enquiry date is required';
    if (!formData.first_visit_date) errors.first_visit_date = 'First visit date is required';
    if (!formData.status) errors.status = 'Status is required';
    return errors;
  };

  // ---------- Handlers ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});

    try {
      setIsSubmitting(true);
      const payload = { ...formData };

      // Only send `other` detail if source is "Other"
      if (payload.knowledge_source !== 'Other') payload.knowledge_source_other = '';

      if (editingEnquiry) {
        await updateEnquiry(editingEnquiry._id, payload);
        alert('Enquiry updated successfully!');
      } else {
        await createEnquiry(payload);
        alert('Enquiry added successfully!');
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving enquiry:', error);
      alert(error.response?.data?.message || 'Failed to save enquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (enq) => {
    setEditingEnquiry(enq);
    setFormData({
      student_name: enq.student_name || '',
      student_dob: enq.student_dob ? enq.student_dob.split('T')[0] : '',
      student_gender: enq.student_gender || '',
      class_interested: enq.class_interested || '',
      parent_name: enq.parent_name || '',
      parent_relationship: enq.parent_relationship || 'Father',
      parent_phone: enq.parent_phone || '',
      parent_email: enq.parent_email || '',
      address: enq.address || '',
      enquiry_date: enq.enquiry_date ? enq.enquiry_date.split('T')[0] : new Date().toISOString().split('T')[0],
      first_visit_date: enq.first_visit_date ? enq.first_visit_date.split('T')[0] : new Date().toISOString().split('T')[0],
      knowledge_source: enq.knowledge_source || '',
      knowledge_source_other: enq.knowledge_source_other || '',
      status: enq.status || 'New',
      last_follow_up_date: enq.last_follow_up_date ? enq.last_follow_up_date.split('T')[0] : '',
      next_follow_up_date: enq.next_follow_up_date ? enq.next_follow_up_date.split('T')[0] : '',
      notes: enq.notes || '',
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await deleteEnquiry(id);
      await loadData();
      alert('Enquiry deleted successfully!');
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      alert('Failed to delete enquiry');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingEnquiry(null);
    setValidationErrors({});
    setShowModal(false);
    setIsSubmitting(false);
  };

  // ---------- Follow-up ----------
  const openFollowUpModal = (enq) => {
    setFollowUpTarget(enq);
    setFollowUpForm({
      note: '',
      status: enq.status || 'Follow Up',
      next_follow_up_date: enq.next_follow_up_date
        ? enq.next_follow_up_date.split('T')[0]
        : '',
    });
    setShowFollowUpModal(true);
  };

  const closeFollowUpModal = () => {
    setShowFollowUpModal(false);
    setFollowUpTarget(null);
    setFollowUpForm({ note: '', status: '', next_follow_up_date: '' });
    setIsSavingFollowUp(false);
  };

  const handleSaveFollowUp = async () => {
    if (!followUpForm.note.trim()) {
      alert('Please enter a follow-up note.');
      return;
    }
    try {
      setIsSavingFollowUp(true);
      await recordFollowUp(followUpTarget._id, {
        note: followUpForm.note.trim(),
        status: followUpForm.status,
        next_follow_up_date: followUpForm.next_follow_up_date || null,
      });
      await loadData();
      alert('Follow-up recorded successfully!');
      closeFollowUpModal();
    } catch (error) {
      console.error('Error recording follow-up:', error);
      alert(error.response?.data?.message || 'Failed to record follow-up');
      setIsSavingFollowUp(false);
    }
  };

  // ---------- Convert ----------
  const openConvertModal = (enq) => {
    setConvertTarget(enq);
    setConvertNote('');
    setShowConvertModal(true);
  };

  const closeConvertModal = () => {
    setShowConvertModal(false);
    setConvertTarget(null);
    setConvertNote('');
    setIsConverting(false);
  };

  const handleConfirmConvert = async () => {
    try {
      setIsConverting(true);
      await convertEnquiry(convertTarget._id, { note: convertNote.trim() });
      await loadData();
      alert('Enquiry marked as Converted!');
      closeConvertModal();
    } catch (error) {
      console.error('Error converting enquiry:', error);
      alert(error.response?.data?.message || 'Failed to convert enquiry');
      setIsConverting(false);
    }
  };

  // ---------- Details ----------
  const openDetailsModal = (enq) => {
    setDetailsTarget(enq);
    setExpandedHistory(true);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setDetailsTarget(null);
    setShowDetailsModal(false);
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-orange-200 to-amber-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent pb-2">
                Admission Enquiries
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                Track prospective parents, follow-ups, and conversions
              </p>
            </div>
            <button
              onClick={() => { setFormData(emptyForm); setEditingEnquiry(null); setShowModal(true); }}
              className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <UserPlus size={20} />
                <span className="font-semibold">New Enquiry</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<Users size={22} />} label="Total Enquiries" value={stats.total}
            grad="from-orange-500 to-amber-600" bg="from-orange-50 to-amber-50" border="border-orange-100"
          />
          <StatCard
            icon={<Sparkles size={22} />} label="New" value={stats.new}
            grad="from-blue-500 to-indigo-600" bg="from-blue-50 to-indigo-50" border="border-blue-100"
          />
          <StatCard
            icon={<Clock size={22} />} label="Follow Up" value={stats.follow_up}
            grad="from-amber-500 to-yellow-600" bg="from-amber-50 to-yellow-50" border="border-amber-100"
          />
          <StatCard
            icon={<CheckCircle size={22} />} label="Interested" value={stats.interested}
            grad="from-emerald-500 to-teal-600" bg="from-emerald-50 to-teal-50" border="border-emerald-100"
          />
          <StatCard
            icon={<ArrowRightCircle size={22} />} label="Converted" value={stats.converted}
            grad="from-purple-500 to-pink-600" bg="from-purple-50 to-pink-50" border="border-purple-100"
          />
        </div>

        {/* Secondary stats strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Overdue Follow-ups</p>
                <p className="text-xl font-bold text-red-600">{stats.overdue_follow_ups}</p>
              </div>
            </div>
            <button
              onClick={() => setOverdueOnly((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                overdueOnly
                  ? 'bg-red-500 text-white'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              {overdueOnly ? 'Showing' : 'Show'}
            </button>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CalendarDays size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">New This Month</p>
              <p className="text-xl font-bold text-emerald-600">{stats.this_month_new}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-purple-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Conversion Rate</p>
              <p className="text-xl font-bold text-purple-600">{stats.conversion_rate}%</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by student, parent, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="relative">
                <Info className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Sources</option>
                  {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Classes</option>
                  {CLASS_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Parent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">First Visit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Last Follow-up</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Next Follow-up</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <Users className="mx-auto mb-3 text-gray-400" size={48} />
                      <p className="text-lg">No enquiries found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Click "New Enquiry" to log a parent's first visit
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((enq) => {
                    const overdue = isOverdue(enq);
                    return (
                      <tr key={enq._id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="text-white" size={16} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{enq.student_name}</div>
                              <div className="text-xs text-gray-500">
                                {getClassName(enq.class_interested)}
                                {enq.student_gender ? ` • ${enq.student_gender}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">{enq.parent_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone size={10} /> {enq.parent_phone}
                          </div>
                          {enq.parent_email && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[180px]">
                              <Mail size={10} /> {enq.parent_email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {enq.knowledge_source}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(enq.first_visit_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(enq.last_follow_up_date)}
                        </td>
                        <td className="px-6 py-4">
                          {enq.next_follow_up_date ? (
                            <span className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                              {formatDate(enq.next_follow_up_date)}
                              {overdue && <span className="ml-1 text-xs">🔴</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(enq.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(enq.status)}`} />
                            {enq.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetailsModal(enq)}
                              className="text-gray-600 hover:text-gray-900 p-1.5 hover:bg-gray-100 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openFollowUpModal(enq)}
                              className="text-amber-600 hover:text-amber-800 p-1.5 hover:bg-amber-50 rounded-lg transition"
                              title="Record Follow-up"
                            >
                              <MessageSquarePlus size={16} />
                            </button>
                            {enq.status !== 'Converted' && (
                              <button
                                onClick={() => openConvertModal(enq)}
                                className="text-purple-600 hover:text-purple-800 p-1.5 hover:bg-purple-50 rounded-lg transition"
                                title="Mark as Converted"
                              >
                                <ArrowRightCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(enq)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(enq._id)}
                              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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

        {/* =================== CREATE / EDIT MODAL =================== */}
        {showModal && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-white">
                  {editingEnquiry ? 'Edit Enquiry' : 'New Admission Enquiry'}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Student */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-orange-600" /> Student Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldError error={validationErrors.student_name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.student_name}
                        onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Child's name"
                      />
                    </FieldError>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.student_dob}
                        onChange={(e) => setFormData({ ...formData, student_dob: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        value={formData.student_gender}
                        onChange={(e) => setFormData({ ...formData, student_gender: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Class Interested In</label>
                      <select
                        value={formData.class_interested}
                        onChange={(e) => setFormData({ ...formData, class_interested: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select Class</option>
                        {CLASS_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parent */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCheck size={18} className="text-orange-600" /> Parent / Guardian
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldError error={validationErrors.parent_name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Parent / guardian name"
                      />
                    </FieldError>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <select
                        value={formData.parent_relationship}
                        onChange={(e) => setFormData({ ...formData, parent_relationship: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {RELATIONSHIP_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <FieldError error={validationErrors.parent_phone}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: handleDigitInput(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="10-digit mobile number"
                      />
                    </FieldError>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="parent@email.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Residential address"
                      />
                    </div>
                  </div>
                </div>

                {/* Enquiry meta */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Info size={18} className="text-orange-600" /> Enquiry Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldError error={validationErrors.enquiry_date}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enquiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.enquiry_date}
                        onChange={(e) => setFormData({ ...formData, enquiry_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </FieldError>

                    <FieldError error={validationErrors.first_visit_date}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Visit Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.first_visit_date}
                        onChange={(e) => setFormData({ ...formData, first_visit_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </FieldError>

                    <FieldError error={validationErrors.knowledge_source} className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How do you know about our school? <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.knowledge_source}
                        onChange={(e) => setFormData({ ...formData, knowledge_source: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select a source</option>
                        {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </FieldError>

                    {formData.knowledge_source === 'Other' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Please specify
                        </label>
                        <input
                          type="text"
                          value={formData.knowledge_source_other}
                          onChange={(e) => setFormData({ ...formData, knowledge_source_other: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Where did they hear about us?"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up & status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-orange-600" /> Status & Follow-up
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldError error={validationErrors.status}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </FieldError>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Follow-up Date</label>
                      <input
                        type="date"
                        value={formData.last_follow_up_date}
                        onChange={(e) => setFormData({ ...formData, last_follow_up_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Auto-updated when a follow-up note is recorded.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Next Follow-up Date</label>
                      <input
                        type="date"
                        value={formData.next_follow_up_date}
                        onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Any additional remarks..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg disabled:opacity-70"
                  >
                    {isSubmitting ? 'Saving...' : editingEnquiry ? 'Update Enquiry' : 'Save Enquiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* =================== FOLLOW-UP MODAL =================== */}
        {showFollowUpModal && followUpTarget && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquarePlus size={18} /> Record Follow-up
                  </h2>
                  <p className="text-white/80 text-sm mt-1">{followUpTarget.student_name} — {followUpTarget.parent_name}</p>
                </div>
                <button onClick={closeFollowUpModal} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Note <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={followUpForm.note}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })}
                    placeholder="e.g. Called parent, they want to visit again on Saturday."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status
                    </label>
                    <select
                      value={followUpForm.status}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={followUpForm.next_follow_up_date}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, next_follow_up_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={closeFollowUpModal}
                    disabled={isSavingFollowUp}
                    className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFollowUp}
                    disabled={isSavingFollowUp || !followUpForm.note.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingFollowUp ? 'Saving...' : 'Save Follow-up'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* =================== CONVERT MODAL =================== */}
        {showConvertModal && convertTarget && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowRightCircle size={18} /> Mark as Converted
                </h2>
                <button onClick={closeConvertModal} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700">
                  Confirm that <strong>{convertTarget.student_name}</strong> (parent:{' '}
                  <strong>{convertTarget.parent_name}</strong>) has been converted to an admission?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversion Note <span className="text-xs text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={convertNote}
                    onChange={(e) => setConvertNote(e.target.value)}
                    placeholder="e.g. Confirmed admission for Nursery, admission fee paid."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={closeConvertModal}
                    disabled={isConverting}
                    className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmConvert}
                    disabled={isConverting}
                    className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50"
                  >
                    {isConverting ? 'Converting...' : 'Confirm Conversion'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* =================== DETAILS MODAL =================== */}
        {showDetailsModal && detailsTarget && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye size={18} /> Enquiry Details
                </h2>
                <button onClick={closeDetailsModal} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{detailsTarget.student_name}</h3>
                    <p className="text-sm text-gray-500">
                      {getClassName(detailsTarget.class_interested)}
                      {detailsTarget.student_gender ? ` • ${detailsTarget.student_gender}` : ''}
                      {detailsTarget.student_dob ? ` • DOB ${formatDate(detailsTarget.student_dob)}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusStyle(detailsTarget.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(detailsTarget.status)}`} />
                    {detailsTarget.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <InfoItem icon={<Users size={14} />} label="Parent" value={detailsTarget.parent_name} />
                  <InfoItem icon={<UserCheck size={14} />} label="Relationship" value={detailsTarget.parent_relationship} />
                  <InfoItem icon={<Phone size={14} />} label="Phone" value={detailsTarget.parent_phone} />
                  <InfoItem icon={<Mail size={14} />} label="Email" value={detailsTarget.parent_email || '—'} />
                  <InfoItem icon={<MapPin size={14} />} label="Address" value={detailsTarget.address || '—'} colSpan />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <InfoItem icon={<Info size={14} />} label="Source" value={detailsTarget.knowledge_source} />
                  <InfoItem icon={<CalendarDays size={14} />} label="Enquiry Date" value={formatDate(detailsTarget.enquiry_date)} />
                  <InfoItem icon={<CalendarDays size={14} />} label="First Visit" value={formatDate(detailsTarget.first_visit_date)} />
                  <InfoItem icon={<Clock size={14} />} label="Last Follow-up" value={formatDate(detailsTarget.last_follow_up_date)} />
                  <InfoItem icon={<Clock size={14} />} label="Next Follow-up" value={formatDate(detailsTarget.next_follow_up_date)} />
                  {detailsTarget.converted_at && (
                    <InfoItem icon={<ArrowRightCircle size={14} />} label="Converted On" value={formatDate(detailsTarget.converted_at)} />
                  )}
                </div>

                {detailsTarget.knowledge_source === 'Other' && detailsTarget.knowledge_source_other && (
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-sm text-indigo-700">
                    <span className="font-semibold">Source detail:</span> {detailsTarget.knowledge_source_other}
                  </div>
                )}

                {detailsTarget.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-200 whitespace-pre-wrap">
                      {detailsTarget.notes}
                    </p>
                  </div>
                )}

                {/* Follow-up history */}
                <div>
                  <button
                    onClick={() => setExpandedHistory((v) => !v)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2"
                  >
                    <span className="flex items-center gap-2">
                      <History size={16} className="text-orange-500" />
                      Follow-up History ({detailsTarget.follow_up_history?.length || 0})
                    </span>
                    {expandedHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {expandedHistory && (
                    <div className="space-y-2">
                      {(!detailsTarget.follow_up_history || detailsTarget.follow_up_history.length === 0) ? (
                        <p className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-xl">
                          No follow-ups recorded yet.
                        </p>
                      ) : (
                        [...detailsTarget.follow_up_history].reverse().map((entry, idx) => (
                          <div key={entry._id || idx} className="border border-gray-200 rounded-xl p-3 bg-white">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(entry.status_at_time)}`}>
                                <span className={`w-1 h-1 rounded-full ${getStatusDot(entry.status_at_time)}`} />
                                {entry.status_at_time}
                              </span>
                              <span className="text-xs text-gray-500">
                                {entry.recorded_at ? new Date(entry.recorded_at).toLocaleString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.note}</p>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                              <span>By: {entry.recorded_by || 'Admin'}</span>
                              {entry.next_follow_up_date && (
                                <span>Next: {formatDate(entry.next_follow_up_date)}</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => { closeDetailsModal(); openFollowUpModal(detailsTarget); }}
                    className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 font-medium text-sm flex items-center gap-2"
                  >
                    <MessageSquarePlus size={16} /> Add Follow-up
                  </button>
                  <button
                    onClick={closeDetailsModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

// =================== Small subcomponents ===================

function StatCard({ icon, label, value, grad, bg, border }) {
  return (
    <div className={`bg-gradient-to-br ${bg} rounded-2xl p-5 border ${border} shadow-lg hover:shadow-xl transition-all`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function FieldError({ error, children, className = '' }) {
  return (
    <div className={`${error ? 'border-l-4 border-red-500 pl-3 rounded-r-lg' : ''} ${className}`}>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value, colSpan = false }) {
  return (
    <div className={colSpan ? 'md:col-span-2' : ''}>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <span className="text-gray-400">{icon}</span> {label}
      </p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );
}