import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, 
  MapPin, Calendar, Briefcase, Filter, Download, TrendingUp,
  AlertCircle, CheckCircle, Clock, UserPlus, GraduationCap,
  FileText, Upload, Eye, FolderOpen, DollarSign, Award,
  Shield, Heart, BookOpen, UserCheck, Star
} from 'lucide-react';
import { getStaff, createStaff, updateStaff, deleteStaff, getClasses } from '../services/api';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showDocs, setShowDocs] = useState(null);
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: '',
    
    // Professional Information
    role: 'Teacher',
    designation: '',
    department: 'Academics',
    assigned_class_id: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    qualification: '',
    experience_years: '',
    specialization: '',
    
    // Salary & Banking
    salary: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    pan_number: '',
    uan_number: '',
    
    // Emergency & Documents
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    police_verification: '',
    
    // Status
    status: 'Active',
    
    // Documents
    photo: null,
    resume: null,
    qualification_doc: null,
    experience_doc: null,
    aadhar_doc: null,
    pan_doc: null,
    police_verification_doc: null,
    offer_letter: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffRes, classesRes] = await Promise.all([
        getStaff(),
        getClasses(),
      ]);
      setStaff(staffRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      alert('Failed to load staff data. Please check your connection.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const staffData = {
        // Personal Information
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group,
        
        // Professional Information
        role: formData.role,
        designation: formData.designation,
        department: formData.department,
        assigned_class_id: formData.assigned_class_id || null,
        date_of_joining: formData.date_of_joining,
        qualification: formData.qualification,
        experience_years: parseFloat(formData.experience_years) || 0,
        specialization: formData.specialization,
        
        // Salary & Banking
        salary: parseFloat(formData.salary) || 0,
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code,
        bank_name: formData.bank_name,
        pan_number: formData.pan_number,
        uan_number: formData.uan_number,
        
        // Emergency & Documents
        emergency_contact: {
          name: formData.emergency_contact_name,
          phone: formData.emergency_contact_phone,
          relation: formData.emergency_contact_relation
        },
        police_verification: formData.police_verification,
        
        // Status
        status: formData.status,
        
        // Documents
        documents: {
          photo: formData.photo,
          resume: formData.resume,
          qualification_doc: formData.qualification_doc,
          experience_doc: formData.experience_doc,
          aadhar_doc: formData.aadhar_doc,
          pan_doc: formData.pan_doc,
          police_verification_doc: formData.police_verification_doc,
          offer_letter: formData.offer_letter,
        }
      };

      if (editingStaff) {
        await updateStaff(editingStaff._id, staffData);
        alert('Staff updated successfully!');
      } else {
        await createStaff(staffData);
        alert('Staff added successfully!');
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving staff:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save staff. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id);
        await loadData();
        alert('Staff deleted successfully!');
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Failed to delete staff. Please try again.');
      }
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      // Personal Information
      name: staffMember.name || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      address: staffMember.address || '',
      date_of_birth: staffMember.date_of_birth ? staffMember.date_of_birth.split('T')[0] : '',
      gender: staffMember.gender || 'Male',
      blood_group: staffMember.blood_group || '',
      
      // Professional Information
      role: staffMember.role || 'Teacher',
      designation: staffMember.designation || '',
      department: staffMember.department || 'Academics',
      assigned_class_id: staffMember.assigned_class_id?._id || staffMember.assigned_class_id || '',
      date_of_joining: staffMember.date_of_joining ? staffMember.date_of_joining.split('T')[0] : new Date().toISOString().split('T')[0],
      qualification: staffMember.qualification || '',
      experience_years: staffMember.experience_years?.toString() || '',
      specialization: staffMember.specialization || '',
      
      // Salary & Banking
      salary: staffMember.salary?.toString() || '',
      account_number: staffMember.account_number || '',
      ifsc_code: staffMember.ifsc_code || '',
      bank_name: staffMember.bank_name || '',
      pan_number: staffMember.pan_number || '',
      uan_number: staffMember.uan_number || '',
      
      // Emergency & Documents
      emergency_contact_name: staffMember.emergency_contact?.name || '',
      emergency_contact_phone: staffMember.emergency_contact?.phone || '',
      emergency_contact_relation: staffMember.emergency_contact?.relation || '',
      police_verification: staffMember.police_verification || '',
      
      // Status
      status: staffMember.status || 'Active',
      
      // Documents
      photo: staffMember.documents?.photo || null,
      resume: staffMember.documents?.resume || null,
      qualification_doc: staffMember.documents?.qualification_doc || null,
      experience_doc: staffMember.documents?.experience_doc || null,
      aadhar_doc: staffMember.documents?.aadhar_doc || null,
      pan_doc: staffMember.documents?.pan_doc || null,
      police_verification_doc: staffMember.documents?.police_verification_doc || null,
      offer_letter: staffMember.documents?.offer_letter || null,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      gender: 'Male',
      blood_group: '',
      role: 'Teacher',
      designation: '',
      department: 'Academics',
      assigned_class_id: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      qualification: '',
      experience_years: '',
      specialization: '',
      salary: '',
      account_number: '',
      ifsc_code: '',
      bank_name: '',
      pan_number: '',
      uan_number: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      police_verification: '',
      status: 'Active',
      photo: null,
      resume: null,
      qualification_doc: null,
      experience_doc: null,
      aadhar_doc: null,
      pan_doc: null,
      police_verification_doc: null,
      offer_letter: null,
    });
    setEditingStaff(null);
    setShowModal(false);
    setShowDocs(null);
  };

  const getFilteredStaff = () => {
    let filtered = staff;
    
    if (searchTerm) {
      filtered = filtered.filter((member) =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm) ||
        member.designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((member) => member.status === statusFilter);
    }
    
    return filtered;
  };

  const filteredStaff = getFilteredStaff();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} />, gradient: 'from-green-500 to-emerald-500' };
      case 'Inactive':
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle size={12} />, gradient: 'from-gray-500 to-gray-600' };
      case 'On Leave':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={12} />, gradient: 'from-yellow-500 to-orange-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle size={12} />, gradient: 'from-gray-500 to-gray-600' };
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Teacher':
        return <GraduationCap size={14} />;
      case 'Support Staff':
        return <Briefcase size={14} />;
      case 'Administrator':
        return <UserCheck size={14} />;
      default:
        return <Users size={14} />;
    }
  };

  const stats = {
    total: staff.length,
    teachers: staff.filter(s => s.role === 'Teacher').length,
    supportStaff: staff.filter(s => s.role === 'Support Staff').length,
    administrators: staff.filter(s => s.role === 'Administrator').length,
    active: staff.filter(s => s.status === 'Active').length,
    onLeave: staff.filter(s => s.status === 'On Leave').length,
    totalSalary: staff.reduce((sum, s) => sum + (s.salary || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-white/80 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Staff Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Users size={18} className="text-indigo-500" />
                Manage teachers, support staff, and administrative personnel
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <UserPlus size={20} />
                <span className="font-semibold">Add New Staff</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <p className="text-xs text-gray-600">Total Staff</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-green-600">{stats.teachers}</span>
            </div>
            <p className="text-xs text-gray-600">Teachers</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Briefcase className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-purple-600">{stats.supportStaff}</span>
            </div>
            <p className="text-xs text-gray-600">Support Staff</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-4 border border-cyan-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
                <UserCheck className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-cyan-600">{stats.administrators}</span>
            </div>
            <p className="text-xs text-gray-600">Administrators</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-green-600">{stats.active}</span>
            </div>
            <p className="text-xs text-gray-600">Active</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <DollarSign className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-orange-600">₹{(stats.totalSalary / 1000).toFixed(0)}k</span>
            </div>
            <p className="text-xs text-gray-600">Total Salary</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="Teacher">Teachers</option>
                  <option value="Support Staff">Support Staff</option>
                  <option value="Administrator">Administrators</option>
                </select>
              </div>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <button className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:shadow-md transition-all">
                <Download size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No staff members found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Add Your First Staff Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((member) => {
              const statusStyle = getStatusColor(member.status);
              const hasDocuments = member.documents && Object.values(member.documents).some(doc => doc);
              const isTeacher = member.role === 'Teacher';
              
              return (
                <div
                  key={member._id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:scale-105"
                >
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${statusStyle.gradient} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          {member.photo ? (
                            <img src={member.photo} alt={member.name} className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <Users className="text-white" size={24} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{member.name}</h3>
                          <p className="text-xs text-white/80 flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role} • {member.designation}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} text-xs font-semibold flex items-center gap-1`}>
                        {statusStyle.icon}
                        <span>{member.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={14} className="text-indigo-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                          <Mail size={12} className="text-gray-400" />
                          {member.email}
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                          <Phone size={12} className="text-gray-400" />
                          {member.phone}
                        </p>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={14} className="text-indigo-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Professional</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Qualification</p>
                          <p className="font-medium text-gray-800">{member.qualification || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <p className="font-medium text-gray-800">{member.experience_years || 0} years</p>
                        </div>
                        {isTeacher && member.assigned_class_id && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Assigned Class</p>
                            <p className="font-medium text-gray-800 flex items-center gap-1">
                              <BookOpen size={12} />
                              {member.assigned_class_id?.name || 'Not Assigned'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Salary Information */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-indigo-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Salary</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">₹{member.salary?.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">Monthly</span>
                      </div>
                    </div>

                    {/* Documents Indicator */}
                    {hasDocuments && (
                      <div className="flex items-center gap-2 pt-2">
                        <FolderOpen size={14} className="text-green-600" />
                        <span className="text-xs text-gray-600">Documents uploaded</span>
                        <button 
                          onClick={() => setShowDocs(showDocs === member._id ? null : member._id)}
                          className="ml-auto text-indigo-600 hover:text-indigo-700"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    )}

                    {/* Documents Preview */}
                    {showDocs === member._id && member.documents && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Uploaded Documents:</p>
                        {member.documents.photo && <div className="flex items-center gap-1 text-xs text-gray-600"><FileText size={10} /> Profile Photo</div>}
                        {member.documents.resume && <div className="flex items-center gap-1 text-xs text-gray-600"><FileText size={10} /> Resume/CV</div>}
                        {member.documents.qualification_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><GraduationCap size={10} /> Qualification Certificate</div>}
                        {member.documents.experience_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><Award size={10} /> Experience Certificate</div>}
                        {member.documents.aadhar_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><FileText size={10} /> Aadhar Card</div>}
                        {member.documents.pan_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><FileText size={10} /> PAN Card</div>}
                        {member.documents.police_verification_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><Shield size={10} /> Police Verification</div>}
                        {member.documents.offer_letter && <div className="flex items-center gap-1 text-xs text-gray-600"><FileText size={10} /> Offer Letter</div>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Staff Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart size={18} className="text-indigo-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group
                      </label>
                      <select
                        value={formData.blood_group}
                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Full address"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Briefcase size={18} className="text-indigo-600" />
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="Teacher">Teacher</option>
                        <option value="Support Staff">Support Staff</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Senior Teacher, Coordinator"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="Academics">Academics</option>
                        <option value="Administration">Administration</option>
                        <option value="Transport">Transport</option>
                        <option value="Security">Security</option>
                        <option value="Housekeeping">Housekeeping</option>
                        <option value="Kitchen">Kitchen</option>
                      </select>
                    </div>
                    {formData.role === 'Teacher' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned Class
                        </label>
                        <select
                          value={formData.assigned_class_id}
                          onChange={(e) => setFormData({ ...formData, assigned_class_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">No Class Assigned</option>
                          {classes.map((cls) => (
                            <option key={cls._id} value={cls._id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Joining *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date_of_joining}
                        onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Highest Qualification *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., B.Ed, M.A., B.Tech"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Mathematics, Science, Early Childhood"
                      />
                    </div>
                  </div>
                </div>

                {/* Salary & Banking Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-indigo-600" />
                    Salary & Banking Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Salary (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter monthly salary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Bank account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={formData.ifsc_code}
                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="IFSC code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={formData.pan_number}
                        onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="PAN card number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UAN Number (PF)
                      </label>
                      <input
                        type="text"
                        value={formData.uan_number}
                        onChange={(e) => setFormData({ ...formData, uan_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="UAN number"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-indigo-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Emergency phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relation
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_relation}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Police Verification Number
                      </label>
                      <input
                        type="text"
                        value={formData.police_verification}
                        onChange={(e) => setFormData({ ...formData, police_verification: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Police verification reference"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Documents Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload size={18} className="text-indigo-600" />
                    Documents Upload
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Photo
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'photo')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.photo && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resume/CV
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, 'resume')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.resume && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qualification Certificate
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'qualification_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.qualification_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Certificate
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'experience_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.experience_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhar Card
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'aadhar_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.aadhar_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'pan_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.pan_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Police Verification Document
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'police_verification_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.police_verification_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offer Letter
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, 'offer_letter')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {formData.offer_letter && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
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
                    className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
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