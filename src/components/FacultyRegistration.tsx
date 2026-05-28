import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, 
  MapPin, Calendar, User, Lock, Eye, EyeOff, Filter, Download,
  UserPlus, GraduationCap, TrendingUp, AlertCircle, CheckCircle,
  Clock, Award, Star, BookOpen, Briefcase, Building, UserCheck,
  School, Baby, GraduationHat, BookMarked, ChevronRight
} from 'lucide-react';
import { getFacultyAuth, createFacultyAuth, updateFacultyAuth, deleteFacultyAuth, updateFacultyAuthStatus, getFacultyAuthStats, getStudents } from '../services/api';

const CLASSES = [
  { id: 'toddler', name: 'Toddler', ageGroup: '1.5 - 2.5 years', icon: Baby },
  { id: 'pre-nursery', name: 'Pre-Nursery', ageGroup: '2.5 - 3.5 years', icon: School },
  { id: 'nursery', name: 'Nursery', ageGroup: '3.5 - 4.5 years', icon: GraduationCap },
  { id: 'kg-1', name: 'KG-1', ageGroup: '4.5 - 5.5 years', icon: Star },
];

const SECTIONS = ['A', 'B', 'C', 'D'];

export default function FacultyRegistration() {
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    onLeave: 0
  });
  const [formData, setFormData] = useState({
    faculty_name: '',
    mobile_number: '',
    email: '',
    qualification: '',
    address: '',
    assigned_class: '',
    assigned_section: 'A',
    subject: '',
    employee_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    username: '',
    password: '',
    status: 'Active',
    experience_years: '',
    specialization: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facultyRes, statsRes, studentsRes] = await Promise.all([
        getFacultyAuth(),
        getFacultyAuthStats(),
        getStudents(),
      ]);
      setFaculty(facultyRes.data || []);
      setStats(statsRes.data || { total: 0, active: 0, inactive: 0, onLeave: 0 });
      setStudents(studentsRes.data || []);
      
      // Debug log to check data
      console.log('Faculty Data:', facultyRes.data);
      console.log('Students Data:', studentsRes.data);
    } catch (error) {
      console.error('Error loading faculty:', error);
      alert('Failed to load faculty data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await updateFacultyAuth(editingFaculty._id, formData);
        alert('Faculty updated successfully!');
      } else {
        await createFacultyAuth(formData);
        alert('Faculty registered successfully!');
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert(error.response?.data?.message || 'Failed to save faculty');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await deleteFacultyAuth(id);
        await loadData();
        alert('Faculty deleted successfully!');
      } catch (error) {
        console.error('Error deleting faculty:', error);
        alert('Failed to delete faculty');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateFacultyAuthStatus(id, status);
      await loadData();
      alert(`Faculty status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleEdit = (facultyMember) => {
    setEditingFaculty(facultyMember);
    setFormData({
      faculty_name: facultyMember.faculty_name || '',
      mobile_number: facultyMember.mobile_number || '',
      email: facultyMember.email || '',
      qualification: facultyMember.qualification || '',
      address: facultyMember.address || '',
      assigned_class: facultyMember.assigned_class || '',
      assigned_section: facultyMember.assigned_section || 'A',
      subject: facultyMember.subject || '',
      employee_id: facultyMember.employee_id || '',
      joining_date: facultyMember.joining_date ? facultyMember.joining_date.split('T')[0] : new Date().toISOString().split('T')[0],
      username: facultyMember.username || '',
      password: '',
      status: facultyMember.status || 'Active',
      experience_years: facultyMember.experience_years?.toString() || '',
      specialization: facultyMember.specialization || '',
      notes: facultyMember.notes || '',
    });
    setShowModal(true);
  };

  const handleViewStudents = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setShowStudentsModal(true);
  };

  // FIXED: Get students by class and section (not by teacher ID)
  const getStudentsByFaculty = () => {
    if (!selectedFaculty) return [];
    
    // Match students based on class_id and section
    const matchedStudents = students.filter(student => 
      student.class_id === selectedFaculty.assigned_class && 
      student.section === selectedFaculty.assigned_section
    );
    
    console.log('Selected Faculty:', selectedFaculty.faculty_name, selectedFaculty.assigned_class, selectedFaculty.assigned_section);
    console.log('Matched Students:', matchedStudents.length);
    
    return matchedStudents;
  };

  // FIXED: Get student count for each faculty card
  const getStudentCountForFaculty = (facultyMember) => {
    // Count students that match this faculty's class and section
    const count = students.filter(student => 
      student.class_id === facultyMember.assigned_class && 
      student.section === facultyMember.assigned_section
    ).length;
    
    return count;
  };

  const resetForm = () => {
    setFormData({
      faculty_name: '',
      mobile_number: '',
      email: '',
      qualification: '',
      address: '',
      assigned_class: '',
      assigned_section: 'A',
      subject: '',
      employee_id: '',
      joining_date: new Date().toISOString().split('T')[0],
      username: '',
      password: '',
      status: 'Active',
      experience_years: '',
      specialization: '',
      notes: '',
    });
    setEditingFaculty(null);
    setShowModal(false);
  };

  const getFilteredFaculty = () => {
    let filtered = faculty;
    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.mobile_number?.includes(searchTerm) ||
        f.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-gray-100 text-gray-700';
      case 'On Leave': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getClassIcon = (classId) => {
    const classObj = CLASSES.find(c => c.id === classId);
    if (classObj) return classObj.icon;
    return GraduationCap;
  };

  const getClassName = (classId) => {
    const classObj = CLASSES.find(c => c.id === classId);
    return classObj ? classObj.name : classId || 'Not Assigned';
  };

  const filteredFaculty = getFilteredFaculty();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-green-200 to-emerald-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Faculty Registration
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <GraduationCap size={18} className="text-green-500" />
                Manage faculty accounts, class assignments, and student roster
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <UserPlus size={20} />
                <span className="font-semibold">Register Faculty</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Total Faculty</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.active}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Active</h3>
            <p className="text-gray-600 text-sm">Currently teaching</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-orange-600">{stats.onLeave}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">On Leave</h3>
            <p className="text-gray-600 text-sm">Temporarily away</p>
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
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Faculty Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.length === 0 ? (
            <div className="col-span-full bg-white/80 rounded-2xl p-12 text-center">
              <GraduationCap className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">No faculty members found</p>
            </div>
          ) : (
            filteredFaculty.map((facultyMember) => {
              const ClassIcon = getClassIcon(facultyMember.assigned_class);
              // FIXED: Use the new function to get student count
              const studentCount = getStudentCountForFaculty(facultyMember);
              
              return (
                <div key={facultyMember._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group">
                  {/* Faculty Header */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <User className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{facultyMember.faculty_name}</h3>
                          <p className="text-xs text-white/80 flex items-center gap-2">
                            <Briefcase size={10} /> {facultyMember.employee_id}
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              facultyMember.status === 'Active' ? 'bg-green-600' : 
                              facultyMember.status === 'On Leave' ? 'bg-yellow-600' : 'bg-gray-600'
                            }`}>
                              {facultyMember.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Faculty Details */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Assigned Class</p>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          <ClassIcon size={12} />
                          {getClassName(facultyMember.assigned_class)} - {facultyMember.assigned_section}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Subject</p>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          <BookMarked size={12} />
                          {facultyMember.subject || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Contact Information</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail size={10} /> {facultyMember.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <Phone size={10} /> {facultyMember.mobile_number}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-lg">
                          <Users size={12} className="text-purple-600" />
                          <span className="text-xs font-semibold text-purple-600">{studentCount} Students</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewStudents(facultyMember)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="View Students"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(facultyMember)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Faculty"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(facultyMember._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Faculty"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Status Change Dropdown */}
                    <div className="pt-2 border-t border-gray-200">
                      <select
                        value={facultyMember.status}
                        onChange={(e) => handleStatusChange(facultyMember._id, e.target.value)}
                        className={`w-full px-3 py-1 rounded-lg text-xs font-semibold border-0 ${getStatusColor(facultyMember.status)}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Faculty Registration Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingFaculty ? 'Edit Faculty' : 'Register New Faculty'}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Name *</label>
                    <input type="text" required value={formData.faculty_name} onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                    <input type="tel" required value={formData.mobile_number} onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email ID *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qualification *</label>
                    <input type="text" required value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <textarea required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Class *</label>
                    <select required value={formData.assigned_class} onChange={(e) => setFormData({ ...formData, assigned_class: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                      <option value="">Select Class</option>
                      {CLASSES.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Section</label>
                    <select value={formData.assigned_section} onChange={(e) => setFormData({ ...formData, assigned_section: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                      {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                    <input type="text" required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date *</label>
                    <input type="date" required value={formData.joining_date} onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                    <input type="number" step="0.5" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                    <input type="text" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                    <input type="text" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password {!editingFaculty && '*'}</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required={!editingFaculty} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-xl">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg">
                    {editingFaculty ? 'Update Faculty' : 'Register Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Students Modal */}
        {showStudentsModal && selectedFaculty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Students of {selectedFaculty.faculty_name}</h2>
                  <p className="text-white/80 text-sm mt-1">
                    {getClassName(selectedFaculty.assigned_class)} - Section {selectedFaculty.assigned_section}
                  </p>
                </div>
                <button onClick={() => setShowStudentsModal(false)} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {getStudentsByFaculty().length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500">No students assigned to this faculty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getStudentsByFaculty().map((student) => (
                      <div key={student._id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Users className="text-white" size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">
                              Roll No: {student.rollNumber} | Section {student.section || 'A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {student.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}