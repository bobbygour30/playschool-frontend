import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Mail, Phone, FileText, 
  CheckCircle, XCircle, AlertCircle, Filter, Search,
  Eye, EyeOff, ChevronDown, ChevronUp, RefreshCw,
  Calendar as CalendarIcon, Users, TrendingUp, 
  Clock as ClockIcon, CheckSquare, XSquare, MessageSquare,
  UserCheck, UserX, UserMinus, Briefcase, BookOpen
} from 'lucide-react';
import { 
  getLeaveRequests, 
  approveLeave, 
  rejectLeave, 
  getLeaveStats 
} from '../services/api';

// Types
interface LeaveRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyEmail: string;
  facultyMobile: string;
  leaveType: string;
  leaveDate: string;
  formattedDate: string;
  duration: string;
  title: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  adminRemarks?: string;
  createdAt: string;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LEAVE_TYPES = [
  'Single Day',
  'Half Day',
  'Multiple Days',
  'Emergency',
  'Medical',
  'Personal',
  'Other'
];

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200'
};

const STATUS_ICONS = {
  Pending: AlertCircle,
  Approved: CheckCircle,
  Rejected: XCircle
};

export default function LeaveManagement() {
  // State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [statusFilter, leaveTypeFilter, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (leaveTypeFilter !== 'all') params.append('leaveType', leaveTypeFilter);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      // Fetch leave requests
      const leavesRes = await getLeaveRequests(params.toString());
      console.log('Leaves Response:', leavesRes.data);
      
      setLeaves(leavesRes.data.leaves || []);
      setStats(leavesRes.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      setPagination(leavesRes.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });

    } catch (error) {
      console.error('Error loading leave requests:', error);
      alert('Failed to load leave requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    setActionType('approve');
    const leave = leaves.find(l => l.id === leaveId);
    setSelectedLeave(leave || null);
    setRemarks('');
    setShowRemarksModal(true);
  };

  const handleReject = async (leaveId: string) => {
    setActionType('reject');
    const leave = leaves.find(l => l.id === leaveId);
    setSelectedLeave(leave || null);
    setRemarks('');
    setShowRemarksModal(true);
  };

  const confirmAction = async () => {
    if (!selectedLeave) return;

    try {
      if (actionType === 'approve') {
        await approveLeave(selectedLeave.id, remarks || 'Approved');
        alert('Leave request approved successfully!');
      } else if (actionType === 'reject') {
        await rejectLeave(selectedLeave.id, remarks || 'Rejected');
        alert('Leave request rejected successfully!');
      }
      
      setShowRemarksModal(false);
      setSelectedLeave(null);
      setRemarks('');
      setActionType(null);
      await loadData();
    } catch (error) {
      console.error('Error processing leave request:', error);
      alert('Failed to process leave request. Please try again.');
    }
  };

  const viewLeaveDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const getFilteredLeaves = () => {
    let filtered = leaves;
    
    if (searchTerm) {
      filtered = filtered.filter(leave =>
        leave.facultyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.facultyEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.facultyMobile?.includes(searchTerm)
      );
    }
    
    return filtered;
  };

  const filteredLeaves = getFilteredLeaves();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Stats Cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <CalendarIcon className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Total</h3>
        <p className="text-gray-600 text-sm">Leave Requests</p>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
            <ClockIcon className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-orange-600">{stats.pending}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Pending</h3>
        <p className="text-gray-600 text-sm">Awaiting Review</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <CheckSquare className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-green-600">{stats.approved}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Approved</h3>
        <p className="text-gray-600 text-sm">Leave Granted</p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-100 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
            <XSquare className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-red-600">{stats.rejected}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Rejected</h3>
        <p className="text-gray-600 text-sm">Leave Denied</p>
      </div>
    </div>
  );

  // Filters
  const renderFilters = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by faculty name, email, or leave title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="relative">
          <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Leave Types</option>
            {LEAVE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setLeaveTypeFilter('all');
            setCurrentPage(1);
            loadData();
          }}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Reset
        </button>
      </div>
    </div>
  );

  // Leave Cards
  const renderLeaveCards = () => {
    if (filteredLeaves.length === 0) {
      return (
        <div className="bg-white/80 rounded-2xl p-12 text-center">
          <CalendarIcon className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500">No leave requests found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeaves.map((leave) => {
          const StatusIcon = STATUS_ICONS[leave.status as keyof typeof STATUS_ICONS] || AlertCircle;
          
          return (
            <div 
              key={leave.id} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group"
            >
              {/* Header */}
              <div className={`p-4 ${
                leave.status === 'Pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                leave.status === 'Approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                'bg-gradient-to-r from-red-500 to-pink-500'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon size={20} className="text-white" />
                    <span className="font-semibold">{leave.status}</span>
                  </div>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                    {leave.leaveType}
                  </span>
                </div>
                <h4 className="font-bold text-lg mt-2">{leave.title}</h4>
                <p className="text-xs text-white/80 mt-1">
                  {formatDate(leave.leaveDate)} • {leave.duration}
                </p>
              </div>

              {/* Faculty Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{leave.facultyName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <Mail size={10} /> {leave.facultyEmail}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <Phone size={10} /> {leave.facultyMobile}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{leave.description || 'No description provided'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => viewLeaveDetails(leave)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  
                  {leave.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(leave.id)}
                        className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(leave.id)}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </>
                  )}

                  {leave.status !== 'Pending' && leave.adminRemarks && (
                    <div className="flex-1 text-xs text-gray-500 flex items-center gap-1">
                      <MessageSquare size={12} />
                      {leave.adminRemarks.length > 20 ? leave.adminRemarks.substring(0, 20) + '...' : leave.adminRemarks}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Pagination
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-3 mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {pagination.totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
          disabled={currentPage === pagination.totalPages}
          className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          Next
        </button>
      </div>
    );
  };

  // Details Modal
  const renderDetailsModal = () => {
    if (!selectedLeave || !showDetailsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className={`sticky top-0 px-6 py-4 flex items-center justify-between ${
            selectedLeave.status === 'Pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
            selectedLeave.status === 'Approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
            'bg-gradient-to-r from-red-500 to-pink-500'
          } text-white`}>
            <div>
              <h2 className="text-xl font-bold">Leave Request Details</h2>
              <p className="text-white/80 text-sm">Request ID: {selectedLeave.id}</p>
            </div>
            <button 
              onClick={() => setShowDetailsModal(false)} 
              className="text-white hover:bg-white/20 rounded-lg p-1"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Status and Type */}
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[selectedLeave.status]}`}>
                {selectedLeave.status}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                {selectedLeave.leaveType}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                {selectedLeave.duration}
              </span>
            </div>

            {/* Faculty Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Faculty Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} className="text-gray-400" />
                  <span>{selectedLeave.facultyName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <span>{selectedLeave.facultyEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{selectedLeave.facultyMobile}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Applied on: {formatDate(selectedLeave.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Leave Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Leave Details</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="text-sm font-medium text-gray-800">{selectedLeave.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-700">{selectedLeave.description || 'No description provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Leave Date</p>
                    <p className="text-sm font-medium text-gray-800">{selectedLeave.formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-800">{selectedLeave.duration}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Remarks */}
            {selectedLeave.adminRemarks && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Admin Remarks
                </h3>
                <p className="text-sm text-blue-800">{selectedLeave.adminRemarks}</p>
              </div>
            )}

            {/* Actions */}
            {selectedLeave.status === 'Pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleApprove(selectedLeave.id);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Approve Leave
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleReject(selectedLeave.id);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  Reject Leave
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Remarks Modal
  const renderRemarksModal = () => {
    if (!showRemarksModal || !selectedLeave) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className={`px-6 py-4 ${
            actionType === 'approve' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
          } text-white rounded-t-2xl`}>
            <h3 className="text-lg font-bold">
              {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-white/80 text-sm">
              {selectedLeave.facultyName} • {selectedLeave.leaveType}
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Remarks {actionType === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionType === 'approve' ? 
                  'Add remarks about approval...' : 
                  'Provide reason for rejection...'
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={actionType === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemarksModal(false);
                  setSelectedLeave(null);
                  setRemarks('');
                  setActionType(null);
                }}
                className="flex-1 px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-6 py-2 text-white rounded-xl hover:shadow-lg transition-all duration-300 ${
                  actionType === 'approve' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Leave Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-500" />
                Manage faculty leave requests, approvals, and tracking
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && renderStatsCards()}

        {/* Filters */}
        {renderFilters()}

        {/* Leave Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderLeaveCards()
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modals */}
      {renderDetailsModal()}
      {renderRemarksModal()}
    </div>
  );
}