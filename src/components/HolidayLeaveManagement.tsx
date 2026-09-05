// components/HolidayLeaveManagement.jsx
import { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, X, Edit, Trash2,
  Users, GraduationCap, Briefcase, Clock, CheckCircle, XCircle,
  AlertCircle, Filter, Search, Download, Eye, UserCheck,
  CalendarDays, CalendarClock, List, Grid, Loader2,
  UserPlus, UserMinus, BookOpen, School, Star, Award,
  Sun, Moon, Cloud, CloudRain, Snowflake, Wind,
  MapPin, Phone, Mail, MessageCircle, Bell, BellOff,
  Settings, Upload, FileText, Printer, Share2,
  Heart, TrendingUp, TrendingDown, BarChart3,
  PieChart, Layers, ChevronDown, ChevronUp,
  Check, Clock as ClockIcon, Calendar as CalendarIcon,
  Users as UsersIcon, GraduationCap as GraduationIcon,
  Briefcase as BriefcaseIcon
} from 'lucide-react';
import { 
  holidayApi, 
  leaveApi, 
  statsApi, 
  settingsApi, 
  helpersApi 
} from '../services/api';
import axios from 'axios';

const CLASSES = ['Toddler', 'Pre-Nursery', 'Nursery', 'KG-1'];
const LEAVE_TYPES = ['sick', 'casual', 'earned', 'study', 'other'];
const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];
const HOLIDAY_TYPES = ['public', 'academic', 'optional', 'custom'];

export default function HolidayLeaveManagement() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [viewType, setViewType] = useState('faculty');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [editingLeave, setEditingLeave] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [holidays, setHolidays] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [substituteTeachers, setSubstituteTeachers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    faculty: 0,
    student: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0,
    holidays: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [calendarView, setCalendarView] = useState('month');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  // Holiday form state
  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    type: 'public',
    description: '',
    color: '#FF6B6B',
    for_faculty: true,
    for_students: true,
    affected_classes: [],
  });

  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    user_id: '',
    user_type: 'faculty',
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    reason: '',
    assigned_class: null,
    substitute_teacher_id: '',
    substitute_teacher_name: '',
  });

  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();

  // ==================== DATA FETCHING ====================

  // Fetch holidays
  const fetchHolidays = async (year, month) => {
    try {
      setIsLoading(true);
      const response = await holidayApi.getHolidays({ year, month });
      if (response.data.success) {
        setHolidays(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      setError('Failed to fetch holidays');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch leaves
  const fetchLeaves = async (params = {}) => {
    try {
      setIsLoading(true);
      const queryParams = {
        user_type: viewType === 'faculty' ? 'faculty' : 'student',
        ...(selectedClass !== 'all' && { assigned_class: selectedClass }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedLeaveType !== 'all' && { leave_type: selectedLeaveType }),
        ...(searchTerm && { search: searchTerm }),
        ...params,
      };
      
      const response = await leaveApi.getLeaves(queryParams);
      if (response.data.success) {
        setLeaves(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setError('Failed to fetch leaves');
      setLeaves([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await statsApi.getStats({
        user_type: viewType === 'faculty' ? 'faculty' : 'student',
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch faculty list
  const fetchFacultyList = async () => {
    try {
      const response = await helpersApi.getSubstituteTeachers();
      if (response.data && response.data.success) {
        const data = response.data.data;
        setFacultyList(Array.isArray(data) ? data : []);
      } else {
        setFacultyList([]);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setFacultyList([]);
    }
  };

  // Fetch student list
  const fetchStudentList = async () => {
    try {
      // Try using helpersApi first if available
      if (helpersApi.getStudentOptions) {
        const response = await helpersApi.getStudentOptions();
        if (response.data && response.data.success) {
          const data = response.data.data;
          setStudentList(Array.isArray(data) ? data : []);
          return;
        }
      }
      
      // Fallback to direct API call
      const response = await axios.get('/api/students', { 
        params: { status: 'Active' } 
      });
      
      // Handle different response formats
      let students = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          students = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          students = response.data.data;
        } else if (response.data.students && Array.isArray(response.data.students)) {
          students = response.data.students;
        }
      }
      setStudentList(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudentList([]);
    }
  };

  // Fetch substitute teachers
  const fetchSubstituteTeachers = async (date) => {
    try {
      const response = await helpersApi.getSubstituteTeachers({ 
        date: date || new Date().toISOString().split('T')[0] 
      });
      if (response.data.success) {
        const data = response.data.data;
        setSubstituteTeachers(Array.isArray(data) ? data : []);
      } else {
        setSubstituteTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching substitute teachers:', error);
      setSubstituteTeachers([]);
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      fetchHolidays(currentYear, currentMonth + 1),
      fetchLeaves(),
      fetchStats(),
      fetchFacultyList(),
      fetchStudentList(),
      fetchSettings(),
    ]);
  };

  // Initial load
  useEffect(() => {
    loadAllData();
    fetchSubstituteTeachers();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchLeaves();
  }, [viewType, selectedClass, selectedStatus, selectedLeaveType, searchTerm]);

  // Refetch holidays when month changes
  useEffect(() => {
    fetchHolidays(currentYear, currentMonth + 1);
  }, [currentDate]);

  // ==================== HELPER FUNCTIONS ====================

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get holiday for date
  const getHolidayForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays[dateStr] || null;
  };

  // Check if date has holiday
  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return !!holidays[dateStr];
  };

  // Check if date is weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Check if date is today
  const isToday = (date) => {
    const todayStr = today.toISOString().split('T')[0];
    const dateStr = date.toISOString().split('T')[0];
    return todayStr === dateStr;
  };

  // Get leave status color
  const getLeaveStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.pending;
  };

  // Get leave type label
  const getLeaveTypeLabel = (type) => {
    const labels = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      earned: 'Earned Leave',
      study: 'Study Leave',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Get holiday type color
  const getHolidayTypeColor = (type) => {
    const colors = {
      public: 'bg-red-100 text-red-700',
      academic: 'bg-blue-100 text-blue-700',
      optional: 'bg-purple-100 text-purple-700',
      custom: 'bg-green-100 text-green-700',
    };
    return colors[type] || colors.custom;
  };

  // ==================== HOLIDAY HANDLERS ====================

  const handleAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      name: '',
      type: 'public',
      description: '',
      color: '#FF6B6B',
      for_faculty: true,
      for_students: true,
      affected_classes: [],
    });
    setShowHolidayModal(true);
  };

  const handleEditHoliday = (date, holiday) => {
    setEditingHoliday({ date, ...holiday });
    setHolidayForm({
      date: date,
      name: holiday.name,
      type: holiday.type,
      description: holiday.description || '',
      color: holiday.color || '#FF6B6B',
      for_faculty: holiday.for_faculty !== undefined ? holiday.for_faculty : true,
      for_students: holiday.for_students !== undefined ? holiday.for_students : true,
      affected_classes: holiday.affected_classes || [],
    });
    setShowHolidayModal(true);
  };

  const handleDeleteHoliday = async (date) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        setLoadingAction('delete-holiday');
        await holidayApi.deleteHoliday(date);
        await fetchHolidays(currentYear, currentMonth + 1);
        await fetchStats();
        setError(null);
      } catch (error) {
        console.error('Error deleting holiday:', error);
        setError('Failed to delete holiday');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleSaveHoliday = async () => {
    const { date, name, type, description, color, for_faculty, for_students, affected_classes } = holidayForm;
    if (!date || !name) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoadingAction('save-holiday');
      if (editingHoliday) {
        await holidayApi.updateHoliday(editingHoliday.date, {
          name,
          type,
          description,
          color,
          for_faculty,
          for_students,
          affected_classes,
        });
      } else {
        await holidayApi.createHoliday({
          date,
          name,
          type,
          description,
          color,
          for_faculty,
          for_students,
          affected_classes,
        });
      }
      await fetchHolidays(currentYear, currentMonth + 1);
      await fetchStats();
      setShowHolidayModal(false);
      setError(null);
    } catch (error) {
      console.error('Error saving holiday:', error);
      setError(error.response?.data?.message || 'Failed to save holiday');
    } finally {
      setLoadingAction(null);
    }
  };

  // ==================== LEAVE HANDLERS ====================

  const handleAddLeave = () => {
    setEditingLeave(null);
    setLeaveForm({
      user_id: '',
      user_type: viewType,
      leave_type: 'casual',
      from_date: '',
      to_date: '',
      reason: '',
      assigned_class: null,
      substitute_teacher_id: '',
      substitute_teacher_name: '',
    });
    setShowLeaveModal(true);
  };

  const handleEditLeave = (leave) => {
    setEditingLeave(leave);
    setLeaveForm({
      user_id: leave.user_id,
      user_type: leave.user_type,
      leave_type: leave.leave_type,
      from_date: leave.from_date,
      to_date: leave.to_date,
      reason: leave.reason,
      assigned_class: leave.assigned_class || null,
      substitute_teacher_id: leave.substitute_teacher_id || '',
      substitute_teacher_name: leave.substitute_teacher || '',
    });
    setShowLeaveModal(true);
  };

  const handleDeleteLeave = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        setLoadingAction('delete-leave');
        await leaveApi.deleteLeave(id);
        await fetchLeaves();
        await fetchStats();
        setError(null);
      } catch (error) {
        console.error('Error deleting leave:', error);
        setError('Failed to delete leave request');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      setLoadingAction('approve-leave');
      await leaveApi.approveLeave(id);
      await fetchLeaves();
      await fetchStats();
      setError(null);
    } catch (error) {
      console.error('Error approving leave:', error);
      setError('Failed to approve leave');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      setLoadingAction('reject-leave');
      await leaveApi.rejectLeave(id);
      await fetchLeaves();
      await fetchStats();
      setError(null);
    } catch (error) {
      console.error('Error rejecting leave:', error);
      setError('Failed to reject leave');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveLeave = async () => {
    const { user_id, user_type, leave_type, from_date, to_date, reason, assigned_class, substitute_teacher_id, substitute_teacher_name } = leaveForm;
    if (!user_id || !from_date || !to_date || !reason) {
      alert('Please fill in all required fields.');
      return;
    }
    
    if (new Date(to_date) < new Date(from_date)) {
      alert('To date must be after from date.');
      return;
    }
    
    try {
      setLoadingAction('save-leave');
      const data = {
        user_id,
        user_type,
        leave_type,
        from_date,
        to_date,
        reason,
        assigned_class: assigned_class || null,
        substitute_teacher_id: substitute_teacher_id || null,
        substitute_teacher_name: substitute_teacher_name || null,
      };
      
      if (editingLeave) {
        await leaveApi.updateLeave(editingLeave.id, data);
      } else {
        await leaveApi.createLeave(data);
      }
      
      await fetchLeaves();
      await fetchStats();
      setShowLeaveModal(false);
      setError(null);
    } catch (error) {
      console.error('Error saving leave:', error);
      setError(error.response?.data?.message || 'Failed to save leave request');
    } finally {
      setLoadingAction(null);
    }
  };

  // ==================== RENDER USER OPTIONS ====================

  // Render user options for leave form - FIXED with proper array checking
  const getUserOptions = () => {
    if (leaveForm.user_type === 'faculty') {
      // Ensure facultyList is an array before mapping
      const list = Array.isArray(facultyList) ? facultyList : [];
      return list.map(f => ({
        id: f._id || f.id || f._id,
        name: f.faculty_name || f.name || 'Unknown Faculty',
        subtitle: f.department || f.assigned_class || 'Faculty',
      }));
    } else {
      // Ensure studentList is an array before mapping
      const list = Array.isArray(studentList) ? studentList : [];
      return list.map(s => ({
        id: s._id || s.id || s._id,
        name: s.name || 'Unknown Student',
        subtitle: `${s.class_id || s.class || 'No Class'} - Section ${s.section || 'A'}`,
      }));
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const holiday = holidays[dateStr];
      const isWeekendDay = isWeekend(date);
      const isTodayDay = isToday(date);
      const hasLeaves = leaves.some(leave => {
        const from = new Date(leave.from_date);
        const to = new Date(leave.to_date);
        return date >= from && date <= to;
      });

      days.push(
        <div 
          key={`day-${day}`} 
          className={`min-h-24 p-2 border border-gray-200 transition-all hover:shadow-md ${
            isTodayDay ? 'bg-blue-50' : ''
          } ${isWeekendDay ? 'bg-gray-50' : ''} ${
            holiday ? 'bg-red-50' : ''
          } cursor-pointer`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-semibold ${
              isTodayDay ? 'text-blue-600' : 
              isWeekendDay ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {day}
            </span>
            {holiday && (
              <span 
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: holiday.color + '30', color: holiday.color }}
              >
                {holiday.type}
              </span>
            )}
            {hasLeaves && !holiday && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                Leave
              </span>
            )}
          </div>
          {holiday && (
            <div className="mt-1">
              <p className="text-xs font-medium text-gray-700 truncate">{holiday.name}</p>
            </div>
          )}
          {isWeekendDay && !holiday && (
            <div className="mt-1">
              <p className="text-xs text-gray-400">Weekend</p>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // Render leave list
  const renderLeaveList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      );
    }

    if (!leaves || leaves.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <List className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500">No leave requests found</p>
          <button
            onClick={handleAddLeave}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Create a new leave request
          </button>
        </div>
      );
    }

    return leaves.map((leave) => (
      <div key={leave.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              leave.user_type === 'faculty' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              {leave.user_type === 'faculty' ? (
                <Briefcase className="w-5 h-5 text-purple-600" />
              ) : (
                <GraduationCap className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{leave.user_name}</h4>
              <p className="text-sm text-gray-500">
                {leave.user_type === 'faculty' ? leave.department : leave.class_name}
                {leave.section && ` (Section ${leave.section})`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeaveStatusColor(leave.status)}`}>
              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
              {getLeaveTypeLabel(leave.leave_type)}
            </span>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-gray-500">From:</span>
            <span className="ml-2 text-gray-700 font-medium">{leave.from_date}</span>
          </div>
          <div>
            <span className="text-gray-500">To:</span>
            <span className="ml-2 text-gray-700 font-medium">{leave.to_date}</span>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <span className="ml-2 text-gray-700 font-medium">
              {leave.duration_days || Math.ceil((new Date(leave.to_date) - new Date(leave.from_date)) / (1000 * 60 * 60 * 24)) + 1} days
            </span>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-600">{leave.reason}</p>
        </div>
        
        {leave.assigned_class && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Assigned Class:</span>
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {leave.assigned_class}
            </span>
          </div>
        )}
        
        {leave.substitute_teacher && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-500">Substitute:</span>
            <span className="text-xs font-medium text-purple-700">{leave.substitute_teacher}</span>
          </div>
        )}
        
        <div className="mt-3 flex items-center gap-2">
          <button 
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => handleEditLeave(leave)}
            disabled={loadingAction === 'save-leave'}
          >
            Edit
          </button>
          <button 
            className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
            onClick={() => handleDeleteLeave(leave.id)}
            disabled={loadingAction === 'delete-leave'}
          >
            Delete
          </button>
          {leave.status === 'pending' && (
            <>
              <button 
                className="text-xs text-green-600 hover:text-green-800 font-medium px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
                onClick={() => handleApproveLeave(leave.id)}
                disabled={loadingAction === 'approve-leave'}
              >
                Approve
              </button>
              <button 
                className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => handleRejectLeave(leave.id)}
                disabled={loadingAction === 'reject-leave'}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    ));
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Holiday & Leave Management
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-500" />
              Manage holidays, leaves, and class assignments
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 hover:shadow-md transition-all"
            >
              Today
            </button>
            <button
              onClick={handleAddLeave}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              disabled={loadingAction === 'save-leave'}
            >
              {loadingAction === 'save-leave' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              <span>New Leave</span>
            </button>
            <button
              onClick={handleAddHoliday}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              disabled={loadingAction === 'save-holiday'}
            >
              {loadingAction === 'save-holiday' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              <span>Add Holiday</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <p className="text-xs text-gray-500">Total Leaves</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <p className="text-xs text-gray-500">Faculty</p>
            <p className="text-2xl font-bold text-purple-600">{stats.faculty || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <p className="text-xs text-gray-500">Students</p>
            <p className="text-2xl font-bold text-blue-600">{stats.student || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <p className="text-xs text-gray-500">Today's Leave</p>
            <p className="text-2xl font-bold text-orange-600">{stats.today || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <p className="text-xs text-gray-500">Holidays</p>
            <p className="text-2xl font-bold text-red-600">{stats.holidays || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar size={18} />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'leaves'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List size={18} />
            Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          {activeTab === 'calendar' && (
            <div>
              {/* Calendar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold text-gray-800 min-w-[150px] text-center">
                    {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h2>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewType('faculty')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      viewType === 'faculty'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Briefcase size={14} />
                    Faculty
                  </button>
                  <button
                    onClick={() => setViewType('student')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      viewType === 'student'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <GraduationCap size={14} />
                    Students
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-500 text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                  <span className="text-gray-600">Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
                  <span className="text-gray-600">Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                  <span className="text-gray-600">Weekend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded ring-2 ring-blue-300"></div>
                  <span className="text-gray-600">Today</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name, reason, class..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Classes</option>
                    {CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    {LEAVE_STATUSES.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                  <select
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Types</option>
                    {LEAVE_TYPES.map(type => (
                      <option key={type} value={type}>{getLeaveTypeLabel(type)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Leave List */}
              <div className="space-y-3">
                {renderLeaveList()}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Holiday & Leave Settings</h3>
              <div className="space-y-6">
                {/* Holiday Types */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Holiday Types</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {HOLIDAY_TYPES.map(type => (
                      <div key={type} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHolidayTypeColor(type)}`}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Configure {type} holidays</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave Types */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Leave Types</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {LEAVE_TYPES.map(type => (
                      <div key={type} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <span className="font-medium text-gray-700">{getLeaveTypeLabel(type)}</span>
                        <p className="text-xs text-gray-500 mt-1">Configure {type} leave settings</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic Calendar */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Academic Calendar</h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Term Start</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={settings?.term_start ? new Date(settings.term_start).toISOString().split('T')[0] : ''}
                          onChange={(e) => setSettings({ ...settings, term_start: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Term End</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={settings?.term_end ? new Date(settings.term_end).toISOString().split('T')[0] : ''}
                          onChange={(e) => setSettings({ ...settings, term_end: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave Limits */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Leave Limits</h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {LEAVE_TYPES.map(type => (
                        <div key={type} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                          <span className="font-medium">{getLeaveTypeLabel(type)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Max Days:</span>
                            <input 
                              type="number" 
                              className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                              value={settings?.leave_limits?.[type]?.max_days || 0}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                if (!newSettings.leave_limits) newSettings.leave_limits = {};
                                if (!newSettings.leave_limits[type]) newSettings.leave_limits[type] = {};
                                newSettings.leave_limits[type].max_days = parseInt(e.target.value) || 0;
                                setSettings(newSettings);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                  onClick={async () => {
                    try {
                      setLoadingAction('save-settings');
                      await settingsApi.updateSettings(settings);
                      setError(null);
                      alert('Settings saved successfully!');
                    } catch (error) {
                      console.error('Error saving settings:', error);
                      setError('Failed to save settings');
                    } finally {
                      setLoadingAction(null);
                    }
                  }}
                  disabled={loadingAction === 'save-settings'}
                >
                  {loadingAction === 'save-settings' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
              </h2>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Name *</label>
                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter holiday name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {HOLIDAY_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="color"
                  value={holidayForm.color}
                  onChange={(e) => setHolidayForm({ ...holidayForm, color: e.target.value })}
                  className="w-full h-12 rounded-xl border border-gray-300 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setShowHolidayModal(false)}
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHoliday}
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                disabled={loadingAction === 'save-holiday'}
              >
                {loadingAction === 'save-holiday' && <Loader2 size={18} className="animate-spin" />}
                {editingHoliday ? 'Update' : 'Add'} Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
              <h2 className="text-xl font-bold text-white">
                {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
              </h2>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type *</label>
                <select
                  value={leaveForm.user_type}
                  onChange={(e) => {
                    setLeaveForm({ ...leaveForm, user_type: e.target.value, user_id: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="faculty">Faculty</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User *</label>
                <select
                  value={leaveForm.user_id}
                  onChange={(e) => setLeaveForm({ ...leaveForm, user_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select {leaveForm.user_type}</option>
                  {getUserOptions().map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.subtitle})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type *</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LEAVE_TYPES.map(type => (
                    <option key={type} value={type}>{getLeaveTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date *</label>
                <input
                  type="date"
                  value={leaveForm.from_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date *</label>
                <input
                  type="date"
                  value={leaveForm.to_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter reason for leave"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Class</label>
                <select
                  value={leaveForm.assigned_class || ''}
                  onChange={(e) => setLeaveForm({ ...leaveForm, assigned_class: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Substitute Teacher</label>
                <select
                  value={leaveForm.substitute_teacher_id || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const teachers = Array.isArray(substituteTeachers) ? substituteTeachers : [];
                    const teacher = teachers.find(t => (t._id || t.id) === selectedId);
                    setLeaveForm({ 
                      ...leaveForm, 
                      substitute_teacher_id: selectedId,
                      substitute_teacher_name: teacher ? (teacher.faculty_name || teacher.name) : ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select substitute teacher</option>
                  {(Array.isArray(substituteTeachers) ? substituteTeachers : []).map(teacher => (
                    <option key={teacher._id || teacher.id} value={teacher._id || teacher.id}>
                      {teacher.faculty_name || teacher.name} {teacher.assigned_class ? `(${teacher.assigned_class})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLeave}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                disabled={loadingAction === 'save-leave'}
              >
                {loadingAction === 'save-leave' && <Loader2 size={18} className="animate-spin" />}
                {editingLeave ? 'Update' : 'Submit'} Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}