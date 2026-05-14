import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, 
  MapPin, Calendar, User, Lock, Eye, EyeOff, Filter, Download,
  UserPlus, GraduationCap, TrendingUp, AlertCircle, CheckCircle,
  Clock, Award, Star, Heart, Baby, School
} from 'lucide-react';
import { getParents, createParent, updateParent, deleteParent, updateParentStatus, getParentStats } from '../services/api';

const CLASSES = [
  'Toddler', 'Pre-Nursery', 'Nursery', 'KG-1', '1st Standard', 
  '2nd Standard', '3rd Standard', '4th Standard', '5th Standard'
];

const PARENT_ROLES = ['Father', 'Mother', 'Guardian'];

export default function ParentRegistration() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0
  });
  const [formData, setFormData] = useState({
    parent_name: '',
    parent_role: 'Father',
    mobile_number: '',
    email: '',
    address: '',
    student_name: '',
    student_dob: '',
    class_grade: '',
    emergency_contact: '',
    username: '',
    password: '',
    status: 'Active',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [parentsRes, statsRes] = await Promise.all([
        getParents(),
        getParentStats(),
      ]);
      setParents(parentsRes.data || []);
      setStats(statsRes.data || { total: 0, active: 0, inactive: 0, suspended: 0 });
    } catch (error) {
      console.error('Error loading parents:', error);
      alert('Failed to load parent data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParent) {
        await updateParent(editingParent._id, formData);
        alert('Parent updated successfully!');
      } else {
        await createParent(formData);
        alert('Parent registered successfully!');
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving parent:', error);
      alert(error.response?.data?.message || 'Failed to save parent');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this parent?')) {
      try {
        await deleteParent(id);
        await loadData();
        alert('Parent deleted successfully!');
      } catch (error) {
        console.error('Error deleting parent:', error);
        alert('Failed to delete parent');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateParentStatus(id, status);
      await loadData();
      alert(`Parent status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleEdit = (parent) => {
    setEditingParent(parent);
    setFormData({
      parent_name: parent.parent_name || '',
      parent_role: parent.parent_role || 'Father',
      mobile_number: parent.mobile_number || '',
      email: parent.email || '',
      address: parent.address || '',
      student_name: parent.student_name || '',
      student_dob: parent.student_dob ? parent.student_dob.split('T')[0] : '',
      class_grade: parent.class_grade || '',
      emergency_contact: parent.emergency_contact || '',
      username: parent.username || '',
      password: '',
      status: parent.status || 'Active',
      notes: parent.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      parent_name: '',
      parent_role: 'Father',
      mobile_number: '',
      email: '',
      address: '',
      student_name: '',
      student_dob: '',
      class_grade: '',
      emergency_contact: '',
      username: '',
      password: '',
      status: 'Active',
      notes: '',
    });
    setEditingParent(null);
    setShowModal(false);
  };

  const getFilteredParents = () => {
    let filtered = parents;
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.mobile_number?.includes(searchTerm) ||
        p.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-gray-100 text-gray-700';
      case 'Suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredParents = getFilteredParents();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Parent Registration
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                Manage parent accounts and student information
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <UserPlus size={20} />
                <span className="font-semibold">Register Parent</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <TrendingUp className="text-blue-500" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Total Parents</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.active}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Active</h3>
            <p className="text-gray-600 text-sm">Active accounts</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-600">{stats.inactive}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Inactive</h3>
            <p className="text-gray-600 text-sm">Inactive accounts</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                <Clock className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.suspended}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Suspended</h3>
            <p className="text-gray-600 text-sm">Suspended accounts</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, or student name..."
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parents Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Parent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Users className="mx-auto mb-3 text-gray-400" size={48} />
                      <p className="text-lg">No parents found</p>
                    </td>
                  </tr>
                ) : (
                  filteredParents.map((parent) => (
                    <tr key={parent._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <User className="text-white" size={16} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{parent.parent_name}</div>
                            <div className="text-xs text-gray-500">{parent.parent_role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{parent.mobile_number}</div>
                        <div className="text-xs text-gray-500">{parent.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{parent.student_name}</div>
                        <div className="text-xs text-gray-500">{parent.student_age} years old</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {parent.class_grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm text-gray-600">{parent.username}</code>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={parent.status}
                          onChange={(e) => handleStatusChange(parent._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getStatusColor(parent.status)}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(parent)}
                          className="text-blue-600 hover:text-blue-800 mr-3 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(parent._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
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

        {/* Parent Registration Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingParent ? 'Edit Parent' : 'Register New Parent'}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.parent_name} 
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Enter parent name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Role *</label>
                    <select 
                      required 
                      value={formData.parent_role} 
                      onChange={(e) => setFormData({ ...formData, parent_role: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PARENT_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                    <input 
                      type="tel" 
                      required 
                      value={formData.mobile_number} 
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email ID *</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <textarea 
                      required 
                      value={formData.address} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                      rows={2} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Full address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.student_name} 
                      onChange={(e) => setFormData({ ...formData, student_name: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Student name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student DOB *</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.student_dob} 
                      onChange={(e) => setFormData({ ...formData, student_dob: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class/Grade *</label>
                    <select 
                      required 
                      value={formData.class_grade} 
                      onChange={(e) => setFormData({ ...formData, class_grade: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact *</label>
                    <input 
                      type="tel" 
                      required 
                      value={formData.emergency_contact} 
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Emergency contact number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.username} 
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Login username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password {!editingParent && '*'}</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required={!editingParent} 
                        value={formData.password} 
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" 
                        placeholder="Login password"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea 
                      value={formData.notes} 
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                      rows={2} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingParent ? 'Update Parent' : 'Register Parent'}
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