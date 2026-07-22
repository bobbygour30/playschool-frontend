// ParentRegistration.tsx - Sync UI Removed
import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, 
  MapPin, Calendar, User, Lock, Eye, EyeOff, Filter,
  UserPlus, GraduationCap, TrendingUp, AlertCircle, CheckCircle,
  Clock, Award, Star, Heart, Baby, School, BookOpen, UserCheck,
  Link, Unlink
} from 'lucide-react';
import { 
  getParents, createParent, updateParent, deleteParent, 
  updateParentStatus, getParentStats, getStudents, 
  getParentStudents, linkStudentToParent, unlinkStudentFromParent,
  getClasses
} from '../services/api';

const CLASSES = [
  { id: 'toddler', name: 'Toddler', ageGroup: '1.5 - 2.5 years' },
  { id: 'pre-nursery', name: 'Pre-Nursery', ageGroup: '2.5 - 3.5 years' },
  { id: 'nursery', name: 'Nursery', ageGroup: '3.5 - 4.5 years' },
  { id: 'kg-1', name: 'KG-1', ageGroup: '4.5 - 5.5 years' },
];

const PARENT_ROLES = ['Father', 'Mother', 'Guardian'];

export default function ParentRegistration() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState(CLASSES);
  const [parentStudents, setParentStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [editingParent, setEditingParent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedClassForLinking, setSelectedClassForLinking] = useState('');
  const [selectedStudentsForLinking, setSelectedStudentsForLinking] = useState([]);
  const [selectedClassForForm, setSelectedClassForForm] = useState('');
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
    student_ids: [],
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
      
      let parentsData = [];
      try {
        const parentsRes = await getParents();
        if (parentsRes && parentsRes.data && Array.isArray(parentsRes.data)) {
          parentsData = parentsRes.data;
        } else if (Array.isArray(parentsRes)) {
          parentsData = parentsRes;
        } else {
          console.warn('Parents response is not an array:', parentsRes);
          parentsData = [];
        }
      } catch (parentError) {
        console.error('Error fetching parents:', parentError);
        parentsData = [];
      }
      
      setParents(parentsData);
      
      let statsData = { total: 0, active: 0, inactive: 0, suspended: 0 };
      try {
        const statsRes = await getParentStats();
        if (statsRes && statsRes.data) {
          statsData = statsRes.data;
        }
      } catch (statsError) {
        console.error('Error fetching stats:', statsError);
      }
      setStats(statsData);
      
      let studentsData = [];
      try {
        const studentsRes = await getStudents();
        if (studentsRes && studentsRes.data && Array.isArray(studentsRes.data)) {
          studentsData = studentsRes.data;
        } else if (Array.isArray(studentsRes)) {
          studentsData = studentsRes;
        }
      } catch (studentError) {
        console.error('Error fetching students:', studentError);
        studentsData = [];
      }
      setStudents(studentsData);
      
      let classesData = CLASSES;
      try {
        const classesRes = await getClasses();
        if (classesRes && classesRes.data && Array.isArray(classesRes.data) && classesRes.data.length > 0) {
          classesData = classesRes.data;
        }
      } catch (classError) {
        console.error('Error fetching classes:', classError);
      }
      setClasses(classesData);
      
      const studentMap = {};
      if (parentsData.length > 0) {
        for (const parent of parentsData) {
          try {
            if (parent && parent._id) {
              const studentsRes = await getParentStudents(parent._id);
              studentMap[parent._id] = (studentsRes && studentsRes.data && Array.isArray(studentsRes.data)) 
                ? studentsRes.data 
                : [];
            } else {
              studentMap[parent._id] = [];
            }
          } catch (error) {
            console.error(`Error loading students for parent ${parent._id}:`, error);
            studentMap[parent._id] = [];
          }
        }
      }
      setParentStudents(studentMap);
      
      console.log('Parent Data:', parentsData);
      console.log('Students Data:', studentsData);
      console.log('Classes Data:', classesData);
    } catch (error) {
      console.error('Error loading parent data:', error);
      alert('Failed to load parent data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggleInForm = (studentId) => {
    setFormData(prev => {
      const currentIds = prev.student_ids || [];
      if (currentIds.includes(studentId)) {
        return { ...prev, student_ids: currentIds.filter(id => id !== studentId) };
      } else {
        return { ...prev, student_ids: [...currentIds, studentId] };
      }
    });
  };

  const getStudentsByClassForForm = (classId) => {
    if (!classId) return students;
    return students.filter(s => s.class_id === classId);
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
      student_ids: parent.student_ids || [],
      emergency_contact: parent.emergency_contact || '',
      username: parent.username || '',
      password: '',
      status: parent.status || 'Active',
      notes: parent.notes || '',
    });
    if (parent.student_ids && parent.student_ids.length > 0) {
      const firstStudent = students.find(s => s._id === parent.student_ids[0]);
      if (firstStudent) {
        setSelectedClassForForm(firstStudent.class_id);
      }
    } else {
      setSelectedClassForForm('');
    }
    setShowModal(true);
  };

  const handleLinkStudents = (parent) => {
    setSelectedParent(parent);
    setSelectedClassForLinking('');
    setSelectedStudentsForLinking([]);
    setShowLinkModal(true);
  };

  const handleClassSelectForLinking = (classId) => {
    setSelectedClassForLinking(classId);
    setSelectedStudentsForLinking([]);
  };

  const handleStudentToggleForLinking = (studentId) => {
    setSelectedStudentsForLinking(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleLinkSelectedStudents = async () => {
    if (selectedStudentsForLinking.length === 0) {
      alert('Please select at least one student to link.');
      return;
    }

    try {
      for (const studentId of selectedStudentsForLinking) {
        await linkStudentToParent(selectedParent._id, studentId);
      }
      await loadData();
      alert(`${selectedStudentsForLinking.length} student(s) linked successfully!`);
      setShowLinkModal(false);
      setSelectedClassForLinking('');
      setSelectedStudentsForLinking([]);
    } catch (error) {
      console.error('Error linking students:', error);
      alert('Failed to link students');
    }
  };

  const handleUnlinkStudent = async (parentId, studentId) => {
    if (confirm('Remove this student from parent?')) {
      try {
        await unlinkStudentFromParent(parentId, studentId);
        await loadData();
        alert('Student unlinked successfully!');
      } catch (error) {
        console.error('Error unlinking student:', error);
        alert('Failed to unlink student');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      parent_name: '',
      parent_role: 'Father',
      mobile_number: '',
      email: '',
      address: '',
      student_ids: [],
      emergency_contact: '',
      username: '',
      password: '',
      status: 'Active',
      notes: '',
    });
    setSelectedClassForForm('');
    setEditingParent(null);
    setShowModal(false);
    setSelectedParent(null);
    setShowLinkModal(false);
    setSelectedClassForLinking('');
    setSelectedStudentsForLinking([]);
  };

  const getFilteredParents = () => {
    const parentsArray = Array.isArray(parents) ? parents : [];
    let filtered = parentsArray;
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p?.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p?.mobile_number?.includes(searchTerm) ||
        p?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p?.status === statusFilter);
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

  const getStudentsByClassForLinking = (classId) => {
    if (!classId) return [];
    const classStudents = students.filter(s => s.class_id === classId);
    const linkedStudentIds = parentStudents[selectedParent?._id]?.map(s => s._id) || [];
    return classStudents.filter(s => !linkedStudentIds.includes(s._id));
  };

  const getClassName = (classId) => {
    const classObj = classes.find(c => c.id === classId || c._id === classId);
    return classObj ? classObj.name : classId || 'Not Assigned';
  };

  const getClassDisplayName = (classId) => {
    const classObj = classes.find(c => c.id === classId || c._id === classId);
    if (classObj) {
      return `${classObj.name} ${classObj.ageGroup ? `(${classObj.ageGroup})` : ''}`;
    }
    return classId || 'Not Assigned';
  };

  const getSelectedStudentsForForm = () => {
    return formData.student_ids || [];
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
                Manage parent accounts and student links
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

        {/* Stats Cards - Removed Sync stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <TrendingUp className="text-blue-500" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.total || 0}</h3>
            <p className="text-gray-600 text-sm">Total Parents</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.active || 0}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Active</h3>
            <p className="text-gray-600 text-sm">Active accounts</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-600">{stats.inactive || 0}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Inactive</h3>
            <p className="text-gray-600 text-sm">Inactive accounts</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                <Clock className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.suspended || 0}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Suspended</h3>
            <p className="text-gray-600 text-sm">Suspended accounts</p>
          </div>
        </div>

        {/* Search and Filter - Removed Sync filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, or username..."
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

        {/* Parents Table - Removed Sync column */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Parent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Students</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Users className="mx-auto mb-3 text-gray-400" size={48} />
                      <p className="text-lg">No parents found</p>
                    </td>
                  </tr>
                ) : (
                  filteredParents.map((parent) => {
                    const studentList = parentStudents[parent._id] || [];
                    
                    return (
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
                          <div className="flex flex-wrap gap-1">
                            {studentList.length > 0 ? (
                              studentList.map(student => (
                                <span 
                                  key={student._id} 
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1"
                                >
                                  {student.name}
                                  <button
                                    onClick={() => handleUnlinkStudent(parent._id, student._id)}
                                    className="hover:text-red-600"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No students linked</span>
                            )}
                            <button
                              onClick={() => handleLinkStudents(parent)}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold hover:bg-green-200"
                            >
                              <Plus size={12} className="inline" /> Link
                            </button>
                          </div>
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
                            className="text-blue-600 hover:text-blue-800 mr-2 transition-colors"
                            title="Edit Parent"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(parent._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete Parent"
                          >
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

        {/* Parent Registration Modal WITH STUDENT ASSIGNMENT */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                </div>

                {/* STUDENT ASSIGNMENT SECTION IN FORM */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      Assign Students
                    </label>
                    <span className="text-xs text-gray-500">
                      {getSelectedStudentsForForm().length} student(s) selected
                    </span>
                  </div>

                  <div className="mb-3">
                    <select
                      value={selectedClassForForm}
                      onChange={(e) => setSelectedClassForForm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">-- Filter by class --</option>
                      {classes.map((cls) => {
                        const classId = cls.id || cls._id;
                        const className = cls.name || cls.className;
                        const studentCount = students.filter(s => s.class_id === classId).length;
                        return (
                          <option key={classId} value={classId}>
                            {className} ({studentCount} students)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50">
                    {students.length === 0 ? (
                      <p className="text-center text-gray-500 py-2 text-sm">
                        No students available. Please add students first.
                      </p>
                    ) : (
                      getStudentsByClassForForm(selectedClassForForm).map((student) => {
                        const isSelected = formData.student_ids?.includes(student._id) || false;
                        return (
                          <label
                            key={student._id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50 border border-blue-300'
                                : 'hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleStudentToggleInForm(student._id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800 text-sm">{student.name}</p>
                                <p className="text-xs text-gray-500">
                                  {getClassName(student.class_id)} | Section: {student.section || 'A'}
                                </p>
                              </div>
                              {student.rollNumber && (
                                <span className="text-xs text-gray-400">Roll: {student.rollNumber}</span>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                    {selectedClassForForm && getStudentsByClassForForm(selectedClassForForm).length === 0 && (
                      <p className="text-center text-gray-500 py-2 text-sm">
                        No students in this class.
                      </p>
                    )}
                  </div>

                  {getSelectedStudentsForForm().length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {getSelectedStudentsForForm().map(studentId => {
                        const student = students.find(s => s._id === studentId);
                        return student ? (
                          <span 
                            key={studentId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            {student.name}
                            <button
                              type="button"
                              onClick={() => handleStudentToggleInForm(studentId)}
                              className="hover:text-red-600"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
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

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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

        {/* Link Students Modal */}
        {showLinkModal && selectedParent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Link Students to {selectedParent.parent_name}</h2>
                  <p className="text-white/80 text-sm mt-1">Select a class, then choose students to assign</p>
                </div>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 1: Select Class
                  </label>
                  <select
                    value={selectedClassForLinking}
                    onChange={(e) => handleClassSelectForLinking(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">-- Select a class --</option>
                    {classes.map((cls) => {
                      const classId = cls.id || cls._id;
                      const className = cls.name || cls.className;
                      const ageGroup = cls.ageGroup || '';
                      const studentsInClass = students.filter(s => s.class_id === classId).length;
                      const linkedCount = parentStudents[selectedParent?._id]?.filter(s => s.class_id === classId).length || 0;
                      const availableCount = studentsInClass - linkedCount;
                      
                      return (
                        <option key={classId} value={classId}>
                          {className} {ageGroup ? `(${ageGroup})` : ''} - {availableCount} available
                        </option>
                      );
                    })}
                  </select>
                  {selectedClassForLinking && (
                    <p className="text-xs text-green-600 mt-1">
                      Showing students from {getClassDisplayName(selectedClassForLinking)}
                    </p>
                  )}
                </div>

                {selectedClassForLinking && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Step 2: Select Students ({getStudentsByClassForLinking(selectedClassForLinking).length} available)
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                      {getStudentsByClassForLinking(selectedClassForLinking).length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          No students available in this class to link.
                          <br />
                          <span className="text-xs">All students are already linked to this parent.</span>
                        </p>
                      ) : (
                        getStudentsByClassForLinking(selectedClassForLinking).map((student) => (
                          <label
                            key={student._id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              selectedStudentsForLinking.includes(student._id)
                                ? 'bg-green-50 border-2 border-green-400'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudentsForLinking.includes(student._id)}
                              onChange={() => handleStudentToggleForLinking(student._id)}
                              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{student.name}</p>
                              <p className="text-xs text-gray-500">
                                Class: {getClassName(student.class_id)} | 
                                Section: {student.section || 'A'} | 
                                Roll: {student.rollNumber || 'N/A'}
                              </p>
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Users className="text-white" size={14} />
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedStudentsForLinking.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      Selected: <strong>{selectedStudentsForLinking.length}</strong> student(s)
                    </span>
                    <button
                      onClick={() => setSelectedStudentsForLinking([])}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLinkSelectedStudents}
                    disabled={selectedStudentsForLinking.length === 0}
                    className={`px-6 py-2 rounded-xl text-white transition-all ${
                      selectedStudentsForLinking.length > 0
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Link size={16} className="inline mr-2" />
                    Link {selectedStudentsForLinking.length} Student(s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}