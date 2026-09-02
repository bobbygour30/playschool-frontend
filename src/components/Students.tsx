// components/StudentDetails.jsx
import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, 
  MapPin, Calendar, Bus, Heart, Star, Award, Filter, Download,
  UserPlus, GraduationCap, TrendingUp, AlertCircle, Upload, FileText,
  UserCheck, Briefcase, Baby, School, Truck, Eye, FolderOpen, BookOpen,
  DollarSign, CreditCard, Receipt, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent, getClasses, getVehicles, getStaff } from '../services/api';

// Class definitions
const CLASSES = [
  { id: 'toddler', name: 'Toddler', ageGroup: '1.5 - 2.5 years', icon: Baby },
  { id: 'pre-nursery', name: 'Pre-Nursery', ageGroup: '2.5 - 3.5 years', icon: School },
  { id: 'nursery', name: 'Nursery', ageGroup: '3.5 - 4.5 years', icon: GraduationCap },
  { id: 'kg-1', name: 'KG-1', ageGroup: '4.5 - 5.5 years', icon: Star },
];

const SECTIONS = ['A', 'B', 'C', 'D'];
const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'];

export default function StudentDetails() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [feeStats, setFeeStats] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: 'Male',
    class_id: '',
    section: 'A',
    assigned_teacher_id: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    parent_aadhar: '',
    address: '',
    emergency_contact: '',
    medical_info: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    transport_type: 'Walker',
    vehicle_id: '',
    status: 'Active',
    fee_amount: '',
    kit_charges: '',
    fee_paid: false,
    payment_date: '',
    payment_mode: 'Cash',
    birth_certificate: null,
    aadhar_card: null,
    parent_aadhar_front: null,
    parent_aadhar_back: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes, vehiclesRes, staffRes] = await Promise.all([
        getStudents(),
        getClasses(),
        getVehicles(),
        getStaff(),
      ]);

      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || CLASSES);
      
      const allStaff = staffRes.data || [];
      setTeachers(allStaff.filter(s => s.role === 'Teacher' && s.status === 'Active'));
      setVehicles((vehiclesRes.data || []).filter(v => v.status === 'Active'));
      
      // Calculate fee stats
      calculateFeeStats(studentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateFeeStats = (studentsList) => {
    const total = studentsList.length;
    const paid = studentsList.filter(s => s.fee_paid).length;
    const unpaid = total - paid;
    const totalAmount = studentsList.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const paidAmount = studentsList.filter(s => s.fee_paid).reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    setFeeStats({
      total,
      paid,
      unpaid,
      totalAmount,
      paidAmount,
      unpaidAmount
    });
  };

  // Auto-assign teacher when class is selected
  const handleClassChange = (classId) => {
    setFormData(prev => ({ ...prev, class_id: classId }));
    
    // Find teacher assigned to this class
    const matchingTeacher = teachers.find(teacher => 
      teacher.assigned_class_id && teacher.assigned_class_id._id === classId
    );
    
    if (matchingTeacher) {
      setFormData(prev => ({ ...prev, assigned_teacher_id: matchingTeacher._id }));
    } else {
      setFormData(prev => ({ ...prev, assigned_teacher_id: '' }));
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

  // Auto-calculate total when fee or kit changes
  const handleFeeChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      const fee = parseFloat(newData.fee_amount) || 0;
      const kit = parseFloat(newData.kit_charges) || 0;
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const studentData = {
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        class_id: formData.class_id,
        section: formData.section,
        assigned_teacher_id: formData.assigned_teacher_id || null,
        parent_name: formData.parent_name,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
        parent_aadhar: formData.parent_aadhar,
        address: formData.address,
        emergency_contact: formData.emergency_contact,
        medical_info: formData.medical_info || '',
        enrollment_date: formData.enrollment_date,
        transport_type: formData.transport_type,
        vehicle_id: formData.transport_type === 'Cab' ? formData.vehicle_id : null,
        status: formData.status,
        fee_amount: parseFloat(formData.fee_amount) || 0,
        kit_charges: parseFloat(formData.kit_charges) || 0,
        fee_paid: formData.fee_paid,
        payment_date: formData.fee_paid ? formData.payment_date : null,
        payment_mode: formData.payment_mode,
        documents: {
          birth_certificate: formData.birth_certificate,
          aadhar_card: formData.aadhar_card,
          parent_aadhar_front: formData.parent_aadhar_front,
          parent_aadhar_back: formData.parent_aadhar_back,
        },
      };
      
      if (editingStudent) {
        await updateStudent(editingStudent._id, studentData);
        alert('Student updated successfully!');
      } else {
        await createStudent(studentData);
        alert('Student added successfully!');
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save student. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(id);
        await loadData();
        alert('Student deleted successfully!');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
      gender: student.gender || 'Male',
      class_id: student.class_id || '',
      section: student.section || 'A',
      assigned_teacher_id: student.assigned_teacher_id?._id || student.assigned_teacher_id || '',
      parent_name: student.parent_name || '',
      parent_email: student.parent_email || '',
      parent_phone: student.parent_phone || '',
      parent_aadhar: student.parent_aadhar || '',
      address: student.address || '',
      emergency_contact: student.emergency_contact || '',
      medical_info: student.medical_info || '',
      enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      transport_type: student.transport_type || 'Walker',
      vehicle_id: student.vehicle_id?._id || student.vehicle_id || '',
      status: student.status || 'Active',
      fee_amount: student.fee_amount || '',
      kit_charges: student.kit_charges || '',
      fee_paid: student.fee_paid || false,
      payment_date: student.payment_date ? student.payment_date.split('T')[0] : '',
      payment_mode: student.payment_mode || 'Cash',
      birth_certificate: student.documents?.birth_certificate || null,
      aadhar_card: student.documents?.aadhar_card || null,
      parent_aadhar_front: student.documents?.parent_aadhar_front || null,
      parent_aadhar_back: student.documents?.parent_aadhar_back || null,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date_of_birth: '',
      gender: 'Male',
      class_id: '',
      section: 'A',
      assigned_teacher_id: '',
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      parent_aadhar: '',
      address: '',
      emergency_contact: '',
      medical_info: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      transport_type: 'Walker',
      vehicle_id: '',
      status: 'Active',
      fee_amount: '',
      kit_charges: '',
      fee_paid: false,
      payment_date: '',
      payment_mode: 'Cash',
      birth_certificate: null,
      aadhar_card: null,
      parent_aadhar_front: null,
      parent_aadhar_back: null,
    });
    setEditingStudent(null);
    setShowModal(false);
    setIsSubmitting(false);
  };

  const getFilteredStudents = () => {
    let filtered = students;
    
    if (searchTerm) {
      filtered = filtered.filter((student) =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter((student) => student.class_id === selectedClass);
    }
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter((student) => student.section === selectedSection);
    }
    
    return filtered;
  };

  const filteredStudents = getFilteredStudents();
  const studentsByClass = CLASSES.map(cls => ({
    ...cls,
    students: students.filter(s => s.class_id === cls.id),
    count: students.filter(s => s.class_id === cls.id).length
  }));

  const getClassName = (classId) => {
    const classObj = CLASSES.find(c => c.id === classId);
    return classObj ? classObj.name : 'Not Assigned';
  };

  const getTeacherName = (teacherId) => {
    if (!teacherId) return 'Not Assigned';
    if (typeof teacherId === 'object' && teacherId.name) {
      return teacherId.name;
    }
    const teacher = teachers.find(t => t._id === teacherId || t._id === teacherId?._id);
    return teacher ? teacher.name : 'Not Assigned';
  };

  const getVehicleNumber = (vehicleId) => {
    if (!vehicleId) return 'N/A';
    const vehicle = vehicles.find(v => v._id === vehicleId);
    return vehicle ? vehicle.vehicle_number : 'N/A';
  };

  // Get teacher for a specific class (for display)
  const getTeacherForClass = (classId, section) => {
    const teacher = teachers.find(t => 
      t.assigned_class_id?._id === classId || t.assigned_class_id === classId
    );
    return teacher ? teacher.name : 'Not Assigned';
  };

  const stats = {
    total: students.length,
    toddler: students.filter(s => s.class_id === 'toddler').length,
    preNursery: students.filter(s => s.class_id === 'pre-nursery').length,
    nursery: students.filter(s => s.class_id === 'nursery').length,
    kg1: students.filter(s => s.class_id === 'kg-1').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Calculate total fee + kit for display
  const getTotalAmount = (student) => {
    return (student.fee_amount || 0) + (student.kit_charges || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Student Details
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Users size={18} className="text-purple-500" />
                Class-wise student management with complete documentation and fee tracking
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <UserPlus size={20} />
                <span className="font-semibold">Add New Student</span>
              </div>
            </button>
          </div>
        </div>

        {/* Fee Summary Cards */}
        {feeStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-800">₹{feeStats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{feeStats.paidAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <XCircle className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Unpaid Amount</p>
                  <p className="text-2xl font-bold text-red-600">₹{feeStats.unpaidAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Users className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fee Status</p>
                  <p className="text-lg font-bold text-gray-800">
                    <span className="text-green-600">{feeStats.paid}</span> / <span className="text-red-600">{feeStats.unpaid}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Baby className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Toddler</p>
                <p className="text-2xl font-bold text-gray-800">{stats.toddler}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <School className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pre-Nursery</p>
                <p className="text-2xl font-bold text-gray-800">{stats.preNursery}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Nursery</p>
                <p className="text-2xl font-bold text-gray-800">{stats.nursery}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Star className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">KG-1</p>
                <p className="text-2xl font-bold text-gray-800">{stats.kg1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by student name, parent name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Classes</option>
                  {CLASSES.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Sections</option>
                  {SECTIONS.map(section => (
                    <option key={section} value={section}>Section {section}</option>
                  ))}
                </select>
              </div>
              <button className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:shadow-md transition-all">
                <Download size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Class-wise Student Sections */}
        {studentsByClass.map((classSection) => {
          const Icon = classSection.icon;
          const filteredClassStudents = classSection.students.filter(student =>
            (!searchTerm || 
              student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (selectedSection === 'all' || student.section === selectedSection)
          );

          if (selectedClass !== 'all' && selectedClass !== classSection.id) return null;
          if (filteredClassStudents.length === 0 && selectedClass === 'all') return null;

          return (
            <div key={classSection.id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{classSection.name}</h2>
                    <p className="text-sm text-gray-500">{classSection.ageGroup}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    {filteredClassStudents.length} Students
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    Teacher: {getTeacherForClass(classSection.id, 'A')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClassStudents.map((student) => (
                  <div key={student._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Users className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{student.name}</h3>
                            <p className="text-xs text-white/80 flex items-center gap-2">
                              {student.gender} • {new Date(student.date_of_birth).toLocaleDateString()}
                              <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                                Section {student.section || 'A'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          student.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Assigned Teacher</p>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          <UserCheck size={12} />
                          {getTeacherName(student.assigned_teacher_id)}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Parent Information</p>
                        <p className="text-sm font-medium text-gray-800">{student.parent_name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <Mail size={10} /> {student.parent_email}
                          <Phone size={10} className="ml-2" /> {student.parent_phone}
                        </div>
                      </div>

                      {/* Fee Information */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <DollarSign size={10} />
                          Fee Details
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-600">Fee: ₹{student.fee_amount || 0}</span>
                            <span className="text-xs text-gray-600 ml-2">Kit: ₹{student.kit_charges || 0}</span>
                            <span className="text-xs font-semibold text-purple-600 ml-2">Total: ₹{getTotalAmount(student)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            student.fee_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {student.fee_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                        {student.fee_paid && student.payment_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Paid on: {new Date(student.payment_date).toLocaleDateString()} • {student.payment_mode}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {student.transport_type === 'Cab' ? (
                            <>
                              <Truck size={14} className="text-cyan-600" />
                              <span className="text-sm text-gray-700">Cab: {getVehicleNumber(student.vehicle_id)}</span>
                            </>
                          ) : (
                            <>
                              <Users size={14} className="text-green-600" />
                              <span className="text-sm text-gray-700">Walker</span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Student"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {(student.documents?.birth_certificate || student.documents?.aadhar_card) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <FolderOpen size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">Documents uploaded</span>
                          <Eye size={12} className="text-gray-400 ml-auto cursor-pointer" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredClassStudents.length === 0 && selectedClass !== 'all' && (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <Users className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No students in {classSection.name}</p>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, class_id: classSection.id });
                      setShowModal(true);
                    }}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                  >
                    Add First Student
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add/Edit Student Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button 
                  onClick={resetForm} 
                  disabled={isSubmitting}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-purple-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter student name"
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
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                      <select
                        required
                        value={formData.class_id}
                        onChange={(e) => handleClassChange(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Class</option>
                        {CLASSES.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.ageGroup})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Section *
                      </label>
                      <select
                        required
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {SECTIONS.map(section => (
                          <option key={section} value={section}>Section {section}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Staff Assignment - Only Teacher now */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCheck size={18} className="text-purple-600" />
                    Staff Assignment
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Teacher
                    </label>
                    <select
                      value={formData.assigned_teacher_id}
                      onChange={(e) => setFormData({ ...formData, assigned_teacher_id: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Auto-assigned based on class</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name} - {teacher.designation} 
                          {teacher.assigned_class_id?.name ? ` (${teacher.assigned_class_id.name})` : ''}
                        </option>
                      ))}
                    </select>
                    {formData.class_id && !formData.assigned_teacher_id && (
                      <p className="text-xs text-orange-500 mt-1">
                        ⚠️ No teacher assigned to this class. Please select a teacher manually.
                      </p>
                    )}
                    {formData.class_id && formData.assigned_teacher_id && (
                      <p className="text-xs text-green-500 mt-1">
                        ✅ Teacher assigned successfully
                      </p>
                    )}
                  </div>
                </div>

                {/* Parent Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-purple-600" />
                    Parent Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Aadhar Number
                      </label>
                      <input
                        type="text"
                        value={formData.parent_aadhar}
                        onChange={(e) => setFormData({ ...formData, parent_aadhar: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="XXXX-XXXX-XXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={isSubmitting}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Full address"
                      />
                    </div>
                  </div>
                </div>

                {/* Fee and Charges */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-purple-600" />
                    Fee & Charges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fee Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.fee_amount}
                        onChange={(e) => handleFeeChange('fee_amount', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter fee amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kit Charges (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.kit_charges}
                        onChange={(e) => handleFeeChange('kit_charges', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter kit charges"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount (₹)
                      </label>
                      <div className="w-full px-4 py-2 bg-gray-100 rounded-xl text-gray-700 font-semibold">
                        ₹{(parseFloat(formData.fee_amount) || 0) + (parseFloat(formData.kit_charges) || 0)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fee Status
                      </label>
                      <select
                        value={formData.fee_paid ? 'paid' : 'unpaid'}
                        onChange={(e) => setFormData({ ...formData, fee_paid: e.target.value === 'paid' })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {formData.fee_paid && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Date
                          </label>
                          <input
                            type="date"
                            value={formData.payment_date}
                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Mode
                          </label>
                          <select
                            value={formData.payment_mode}
                            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            {PAYMENT_MODES.map(mode => (
                              <option key={mode} value={mode}>{mode}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Transport Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Truck size={18} className="text-purple-600" />
                    Transport Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transport Type *
                      </label>
                      <select
                        required
                        value={formData.transport_type}
                        onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="Walker">Walker</option>
                        <option value="Cab">Cab</option>
                      </select>
                    </div>
                    {formData.transport_type === 'Cab' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Vehicle
                        </label>
                        <select
                          value={formData.vehicle_id}
                          onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Vehicle</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle._id} value={vehicle._id}>
                              {vehicle.vehicle_number} - {vehicle.route}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical Information
                      </label>
                      <textarea
                        value={formData.medical_info}
                        onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
                        disabled={isSubmitting}
                        rows={2}
                        placeholder="Allergies, medical conditions, etc."
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload size={18} className="text-purple-600" />
                    Documents Upload
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Birth Certificate
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'birth_certificate')}
                          disabled={isSubmitting}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {formData.birth_certificate && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Aadhar Card
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'aadhar_card')}
                          disabled={isSubmitting}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {formData.aadhar_card && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Aadhar (Front)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'parent_aadhar_front')}
                          disabled={isSubmitting}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {formData.parent_aadhar_front && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Aadhar (Back)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'parent_aadhar_back')}
                          disabled={isSubmitting}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {formData.parent_aadhar_back && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>
                          {editingStudent ? 'Updating Student...' : 'Creating Student...'}
                        </span>
                      </>
                    ) : (
                      <span>
                        {editingStudent ? 'Update Student' : 'Add Student'}
                      </span>
                    )}
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