// components/StudentDetails.jsx
import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, 
  MapPin, Calendar, Bus, Heart, Star, Award, Filter, Download,
  UserPlus, GraduationCap, TrendingUp, AlertCircle, Upload, FileText,
  UserCheck, Briefcase, Baby, School, Truck, Eye, FolderOpen, BookOpen,
  DollarSign, CreditCard, Receipt, CheckCircle, XCircle, Loader2,
  Dropbox, File
} from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent, getClasses, getVehicles, getStaff, getVendors } from '../services/api';

// Class definitions
const CLASSES = [
  { id: 'toddler', name: 'Toddler', ageGroup: '1.5 - 2.5 years', icon: Baby },
  { id: 'pre-nursery', name: 'Pre-Nursery', ageGroup: '2.5 - 3.5 years', icon: School },
  { id: 'nursery', name: 'Nursery', ageGroup: '3.5 - 4.5 years', icon: GraduationCap },
  { id: 'kg-1', name: 'KG-1', ageGroup: '4.5 - 5.5 years', icon: Star },
];

const SECTIONS = ['A', 'B', 'C', 'D'];
const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONSHIP_TYPES = ['Mother', 'Father', 'Guardian'];
const TRANSPORT_TYPES = ['Walker', 'Cab', 'Bus'];

// Helper to check if document is a URL (Cloudinary or other)
const isDocumentUrl = (doc) => {
  if (!doc) return false;
  return doc.startsWith('http://') || doc.startsWith('https://') || doc.startsWith('data:');
};

// Helper to get file name from URL
const getFileNameFromUrl = (url) => {
  if (!url) return 'Document';
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const fileName = parts[parts.length - 1];
    return fileName || 'Document';
  } catch {
    return 'Document';
  }
};

export default function StudentDetails() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [feeStats, setFeeStats] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track document changes - which documents have been updated
  const [documentChanges, setDocumentChanges] = useState({
    birth_certificate: false,
    aadhar_card: false,
    parent_aadhar_front: false,
    parent_aadhar_back: false,
  });

  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: '',
    class_id: '',
    section: 'A',
    assigned_teacher_id: '',
    parent_name: '',
    parent_relationship: 'Mother',
    parent_email: '',
    parent_phone: '',
    parent_aadhar: '',
    address: '',
    emergency_contact: '',
    medical_info: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    transport_type: 'Walker',
    vehicle_id: '',
    vendor_id: '',
    status: 'Active',
    // New fee fields
    registration_fee: '',
    admission_fee: '',
    tuition_fee: '',
    activity_fee: '',
    kit_fee: '',
    cab_fee: '',
    camera_fee: '',
    fee_paid: false,
    payment_date: '',
    payment_mode: 'Cash',
    // Document fields - store both file data and existing URLs
    birth_certificate: null,
    birth_certificate_url: null,
    aadhar_card: null,
    aadhar_card_url: null,
    parent_aadhar_front: null,
    parent_aadhar_front_url: null,
    parent_aadhar_back: null,
    parent_aadhar_back_url: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes, vehiclesRes, staffRes, vendorsRes] = await Promise.all([
        getStudents(),
        getClasses(),
        getVehicles(),
        getStaff(),
        getVendors(),
      ]);

      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || CLASSES);
      
      const allStaff = staffRes.data || [];
      setTeachers(allStaff.filter(s => s.role === 'Teacher' && s.status === 'Active'));
      setVehicles((vehiclesRes.data || []).filter(v => v.status === 'Active'));
      
      const allVendors = vendorsRes.data || [];
      // Filter vendors that have vehicle_number and are active
      const activeVendorsWithVehicles = allVendors.filter(v => 
        v.status === 'Active' && 
        v.vehicle_number && 
        v.vehicle_number.trim() !== ''
      );
      setVendors(activeVendorsWithVehicles);
      
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

  const handleClassChange = (classId) => {
    setFormData(prev => ({ ...prev, class_id: classId }));
    
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
        // Mark this document as changed
        setDocumentChanges(prev => ({ ...prev, [fieldName]: true }));
        setFormData(prev => ({ 
          ...prev, 
          [fieldName]: reader.result,
          // Clear the URL since we're uploading a new file
          [`${fieldName}_url`]: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to get document display value
  const getDocumentDisplay = (fieldName) => {
    const fileData = formData[fieldName];
    const urlData = formData[`${fieldName}_url`];
    
    if (fileData && documentChanges[fieldName]) {
      return { type: 'new', data: fileData };
    }
    if (urlData) {
      return { type: 'existing', data: urlData };
    }
    return null;
  };

  const calculateTotalFee = (data) => {
    const reg = parseFloat(data.registration_fee) || 0;
    const adm = parseFloat(data.admission_fee) || 0;
    const tui = parseFloat(data.tuition_fee) || 0;
    const act = parseFloat(data.activity_fee) || 0;
    const kit = parseFloat(data.kit_fee) || 0;
    const cab = parseFloat(data.cab_fee) || 0;
    const cam = parseFloat(data.camera_fee) || 0;
    return reg + adm + tui + act + kit + cab + cam;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate mandatory documents
    const hasBirthCert = formData.birth_certificate || formData.birth_certificate_url;
    const hasParentAadharFront = formData.parent_aadhar_front || formData.parent_aadhar_front_url;
    const hasParentAadharBack = formData.parent_aadhar_back || formData.parent_aadhar_back_url;
    
    if (!hasBirthCert) {
      alert('Birth Certificate is mandatory. Please upload.');
      return;
    }
    if (!hasParentAadharFront) {
      alert('Parent Aadhar (Front) is mandatory. Please upload.');
      return;
    }
    if (!hasParentAadharBack) {
      alert('Parent Aadhar (Back) is mandatory. Please upload.');
      return;
    }
    
    // Validate transport selection
    if (formData.transport_type !== 'Walker' && !formData.vendor_id) {
      alert('Please select a vendor for transport.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const totalAmount = calculateTotalFee(formData);
      
      // Find the selected vendor to get vehicle_id
      let vehicleId = null;
      if (formData.transport_type !== 'Walker' && formData.vendor_id) {
        const selectedVendor = vendors.find(v => v._id === formData.vendor_id);
        if (selectedVendor) {
          vehicleId = selectedVendor.vehicle_id || selectedVendor._id;
        }
      }
      
      // Prepare documents - use existing URLs if not changed
      const documents = {
        birth_certificate: documentChanges.birth_certificate ? formData.birth_certificate : formData.birth_certificate_url,
        aadhar_card: documentChanges.aadhar_card ? formData.aadhar_card : formData.aadhar_card_url,
        parent_aadhar_front: documentChanges.parent_aadhar_front ? formData.parent_aadhar_front : formData.parent_aadhar_front_url,
        parent_aadhar_back: documentChanges.parent_aadhar_back ? formData.parent_aadhar_back : formData.parent_aadhar_back_url,
      };
      
      const studentData = {
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group,
        class_id: formData.class_id,
        section: formData.section,
        assigned_teacher_id: formData.assigned_teacher_id || null,
        parent_name: formData.parent_name,
        parent_relationship: formData.parent_relationship,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
        parent_aadhar: formData.parent_aadhar,
        address: formData.address,
        emergency_contact: formData.emergency_contact,
        medical_info: formData.medical_info || '',
        enrollment_date: formData.enrollment_date,
        transport_type: formData.transport_type,
        vehicle_id: vehicleId,
        vendor_id: formData.transport_type !== 'Walker' ? formData.vendor_id : null,
        status: formData.status,
        // Fee fields
        registration_fee: parseFloat(formData.registration_fee) || 0,
        admission_fee: parseFloat(formData.admission_fee) || 0,
        tuition_fee: parseFloat(formData.tuition_fee) || 0,
        activity_fee: parseFloat(formData.activity_fee) || 0,
        kit_fee: parseFloat(formData.kit_fee) || 0,
        cab_fee: parseFloat(formData.cab_fee) || 0,
        camera_fee: parseFloat(formData.camera_fee) || 0,
        total_amount: totalAmount,
        fee_paid: formData.fee_paid,
        payment_date: formData.fee_paid ? formData.payment_date : null,
        payment_mode: formData.payment_mode,
        documents: documents,
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
    console.log('Editing student:', student); // Debug log
    
    setEditingStudent(student);
    setDocumentChanges({
      birth_certificate: false,
      aadhar_card: false,
      parent_aadhar_front: false,
      parent_aadhar_back: false,
    });
    
    // Find vendor ID from the student data
    let vendorId = student.vendor_id || '';
    
    // If vendor_id is an object with _id, extract it
    if (vendorId && typeof vendorId === 'object' && vendorId._id) {
      vendorId = vendorId._id;
    }
    
    // If vendor_id is not set but vehicle_id is, try to find vendor by vehicle_id
    if (!vendorId && student.vehicle_id) {
      const vehicleId = typeof student.vehicle_id === 'object' ? student.vehicle_id._id : student.vehicle_id;
      const foundVendor = vendors.find(v => v.vehicle_id === vehicleId || v._id === vehicleId);
      if (foundVendor) {
        vendorId = foundVendor._id;
      }
    }
    
    // Also find vehicle_id from vendor if available
    let vehicleId = student.vehicle_id || '';
    if (vehicleId && typeof vehicleId === 'object' && vehicleId._id) {
      vehicleId = vehicleId._id;
    }
    
    // If we have a vendor selected, try to get vehicle_id from vendor
    if (vendorId) {
      const selectedVendor = vendors.find(v => v._id === vendorId);
      if (selectedVendor && selectedVendor.vehicle_id) {
        vehicleId = selectedVendor.vehicle_id;
      }
    }
    
    setFormData({
      name: student.name || '',
      date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
      gender: student.gender || 'Male',
      blood_group: student.blood_group || '',
      class_id: student.class_id || '',
      section: student.section || 'A',
      assigned_teacher_id: student.assigned_teacher_id?._id || student.assigned_teacher_id || '',
      parent_name: student.parent_name || '',
      parent_relationship: student.parent_relationship || 'Mother',
      parent_email: student.parent_email || '',
      parent_phone: student.parent_phone || '',
      parent_aadhar: student.parent_aadhar || '',
      address: student.address || '',
      emergency_contact: student.emergency_contact || '',
      medical_info: student.medical_info || '',
      enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      transport_type: student.transport_type || 'Walker',
      vehicle_id: vehicleId,
      vendor_id: vendorId, // Set the vendor ID for the dropdown
      status: student.status || 'Active',
      registration_fee: student.registration_fee || '',
      admission_fee: student.admission_fee || '',
      tuition_fee: student.tuition_fee || '',
      activity_fee: student.activity_fee || '',
      kit_fee: student.kit_fee || '',
      cab_fee: student.cab_fee || '',
      camera_fee: student.camera_fee || '',
      fee_paid: student.fee_paid || false,
      payment_date: student.payment_date ? student.payment_date.split('T')[0] : '',
      payment_mode: student.payment_mode || 'Cash',
      // Document fields - store existing URLs
      birth_certificate: null,
      birth_certificate_url: student.documents?.birth_certificate || null,
      aadhar_card: null,
      aadhar_card_url: student.documents?.aadhar_card || null,
      parent_aadhar_front: null,
      parent_aadhar_front_url: student.documents?.parent_aadhar_front || null,
      parent_aadhar_back: null,
      parent_aadhar_back_url: student.documents?.parent_aadhar_back || null,
    });
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date_of_birth: '',
      gender: 'Male',
      blood_group: '',
      class_id: '',
      section: 'A',
      assigned_teacher_id: '',
      parent_name: '',
      parent_relationship: 'Mother',
      parent_email: '',
      parent_phone: '',
      parent_aadhar: '',
      address: '',
      emergency_contact: '',
      medical_info: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      transport_type: 'Walker',
      vehicle_id: '',
      vendor_id: '',
      status: 'Active',
      registration_fee: '',
      admission_fee: '',
      tuition_fee: '',
      activity_fee: '',
      kit_fee: '',
      cab_fee: '',
      camera_fee: '',
      fee_paid: false,
      payment_date: '',
      payment_mode: 'Cash',
      birth_certificate: null,
      birth_certificate_url: null,
      aadhar_card: null,
      aadhar_card_url: null,
      parent_aadhar_front: null,
      parent_aadhar_front_url: null,
      parent_aadhar_back: null,
      parent_aadhar_back_url: null,
    });
    setDocumentChanges({
      birth_certificate: false,
      aadhar_card: false,
      parent_aadhar_front: false,
      parent_aadhar_back: false,
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
    // Handle object case
    if (typeof vehicleId === 'object' && vehicleId._id) {
      vehicleId = vehicleId._id;
    }
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (vehicle) return vehicle.vehicle_number;
    
    const vendor = vendors.find(v => v._id === vehicleId || v.vehicle_id === vehicleId);
    if (vendor) return vendor.vehicle_number || vendor.vendor_name || 'N/A';
    
    return 'N/A';
  };

  const getVendorName = (vendorId) => {
    if (!vendorId) return 'N/A';
    // Handle object case
    if (typeof vendorId === 'object' && vendorId._id) {
      vendorId = vendorId._id;
    }
    const vendor = vendors.find(v => v._id === vendorId);
    return vendor ? vendor.vendor_name : 'N/A';
  };

  const getTeacherForClass = (classId, section) => {
    const teacher = teachers.find(t => 
      t.assigned_class_id?._id === classId || t.assigned_class_id === classId
    );
    return teacher ? teacher.name : 'Not Assigned';
  };

  const getTotalFee = (student) => {
    const reg = student.registration_fee || 0;
    const adm = student.admission_fee || 0;
    const tui = student.tuition_fee || 0;
    const act = student.activity_fee || 0;
    const kit = student.kit_fee || 0;
    const cab = student.cab_fee || 0;
    const cam = student.camera_fee || 0;
    return reg + adm + tui + act + kit + cab + cam;
  };

  const stats = {
    total: students.length,
    toddler: students.filter(s => s.class_id === 'toddler').length,
    preNursery: students.filter(s => s.class_id === 'pre-nursery').length,
    nursery: students.filter(s => s.class_id === 'nursery').length,
    kg1: students.filter(s => s.class_id === 'kg-1').length,
  };

  // Render document upload field with preview
  const renderDocumentUpload = (label, fieldName, required = false) => {
    const isChanged = documentChanges[fieldName];
    const fileData = formData[fieldName];
    const urlData = formData[`${fieldName}_url`];
    const hasDocument = fileData || urlData;
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          {editingStudent && hasDocument && !isChanged && (
            <span className="text-xs text-green-600 ml-2">(Current document preserved)</span>
          )}
          {editingStudent && isChanged && (
            <span className="text-xs text-blue-600 ml-2">(New document uploaded)</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required={!editingStudent && required}
            onChange={(e) => handleFileUpload(e, fieldName)}
            disabled={isSubmitting}
            className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {hasDocument && (
            <div className="flex items-center gap-1">
              {isChanged ? (
                <CheckCircle size={20} className="text-blue-600" title="New document uploaded" />
              ) : (
                <CheckCircle size={20} className="text-green-600" title="Document exists" />
              )}
              {urlData && !isChanged && (
                <a 
                  href={urlData} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 text-xs underline ml-1"
                  title="View existing document"
                >
                  View
                </a>
              )}
              {urlData && !isChanged && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove ${label}?`)) {
                      setFormData(prev => ({ 
                        ...prev, 
                        [`${fieldName}_url`]: null,
                        [fieldName]: null
                      }));
                      setDocumentChanges(prev => ({ ...prev, [fieldName]: true }));
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-xs ml-1"
                  title="Remove document"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
        {editingStudent && urlData && !isChanged && (
          <p className="text-xs text-gray-400 mt-1">
            Current file: {getFileNameFromUrl(urlData)}
          </p>
        )}
        {isChanged && fileData && (
          <p className="text-xs text-blue-500 mt-1">
            New file uploaded. Will replace existing document.
          </p>
        )}
      </div>
    );
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
                              {student.blood_group && (
                                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                                  {student.blood_group}
                                </span>
                              )}
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
                        {student.parent_relationship && (
                          <p className="text-xs text-gray-500">Relationship: {student.parent_relationship}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <Mail size={10} /> {student.parent_email}
                          <Phone size={10} className="ml-2" /> {student.parent_phone}
                        </div>
                      </div>

                      {/* Fee Information */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <DollarSign size={10} />
                          Fee Breakdown
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span className="text-gray-600">Registration: ₹{student.registration_fee || 0}</span>
                          <span className="text-gray-600">Admission: ₹{student.admission_fee || 0}</span>
                          <span className="text-gray-600">Tuition: ₹{student.tuition_fee || 0}</span>
                          <span className="text-gray-600">Activity: ₹{student.activity_fee || 0}</span>
                          <span className="text-gray-600">Kit: ₹{student.kit_fee || 0}</span>
                          <span className="text-gray-600">Cab: ₹{student.cab_fee || 0}</span>
                          <span className="text-gray-600">Camera: ₹{student.camera_fee || 0}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-blue-200">
                          <span className="text-xs font-semibold text-purple-600">Total: ₹{getTotalFee(student)}</span>
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
                          {(student.transport_type === 'Cab' || student.transport_type === 'Bus') ? (
                            <>
                              <Truck size={14} className="text-cyan-600" />
                              <span className="text-sm text-gray-700">
                                {student.transport_type}: {getVehicleNumber(student.vehicle_id)}
                                {student.vendor_id && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({getVendorName(student.vendor_id)})
                                  </span>
                                )}
                              </span>
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

                      {/* Documents indicator */}
                      {student.documents && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <FolderOpen size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Documents: {Object.values(student.documents).filter(d => d).length} uploaded
                          </span>
                          {student.documents.birth_certificate && (
                            <a 
                              href={student.documents.birth_certificate} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              View Birth Cert
                            </a>
                          )}
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
                        Student Name <span className="text-red-500">*</span>
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
                        Date of Birth <span className="text-red-500">*</span>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.blood_group}
                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Blood Group</option>
                        {BLOOD_GROUPS.map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class <span className="text-red-500">*</span>
                      </label>
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
                        Section <span className="text-red-500">*</span>
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

                {/* Staff Assignment */}
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
                        Parent Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter parent name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.parent_relationship}
                        onChange={(e) => setFormData({ ...formData, parent_relationship: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {RELATIONSHIP_TYPES.map(rel => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="parent@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter phone number"
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
                        Address <span className="text-red-500">*</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Fee (₹) <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-400 ml-1">(One time)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.registration_fee}
                        onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter registration fee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Fee (₹) <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-400 ml-1">(One time)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.admission_fee}
                        onChange={(e) => setFormData({ ...formData, admission_fee: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter admission fee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tuition Fee (₹)
                        <span className="text-xs text-gray-400 ml-1">(Monthly)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tuition_fee}
                        onChange={(e) => setFormData({ ...formData, tuition_fee: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter tuition fee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Fee (₹)
                        <span className="text-xs text-gray-400 ml-1">(Annual)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.activity_fee}
                        onChange={(e) => setFormData({ ...formData, activity_fee: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter activity fee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kit Fee (₹)
                        <span className="text-xs text-gray-400 ml-1">(Annual)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.kit_fee}
                        onChange={(e) => setFormData({ ...formData, kit_fee: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter kit fee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cab Fee (₹)
                        <span className="text-xs text-gray-400 ml-1">(Monthly)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cab_fee}
                        onChange={(e) => setFormData({ ...formData, cab_fee: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter cab fee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Camera Fee (₹)
                        <span className="text-xs text-gray-400 ml-1">(Monthly)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.camera_fee}
                        onChange={(e) => setFormData({ ...formData, camera_fee: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter camera fee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount (₹)
                      </label>
                      <div className="w-full px-4 py-2 bg-gray-100 rounded-xl text-gray-700 font-semibold">
                        ₹{calculateTotalFee(formData)}
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

                {/* Transport Details - UPDATED to show selected vendor */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Truck size={18} className="text-purple-600" />
                    Transport Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transport Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.transport_type}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            transport_type: e.target.value,
                            vendor_id: '',
                            vehicle_id: ''
                          });
                        }}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {TRANSPORT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {editingStudent && formData.transport_type !== 'Walker' && formData.vendor_id && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Currently assigned to: {getVendorName(formData.vendor_id)}
                        </p>
                      )}
                    </div>
                    {(formData.transport_type === 'Cab' || formData.transport_type === 'Bus') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Vendor/Vehicle <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.vendor_id}
                          onChange={(e) => {
                            const vendorId = e.target.value;
                            setFormData({ 
                              ...formData, 
                              vendor_id: vendorId
                            });
                          }}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Vendor/Vehicle</option>
                          {vendors.map((vendor) => {
                            // Check if this vendor is the currently selected one
                            const isSelected = vendor._id === formData.vendor_id;
                            return (
                              <option key={vendor._id} value={vendor._id}>
                                {vendor.vendor_name} - {vendor.vehicle_number} 
                                {vendor.vendor_type && ` (${vendor.vendor_type})`}
                                {vendor.route_details && ` - ${vendor.route_details.substring(0, 30)}${vendor.route_details.length > 30 ? '...' : ''}`}
                                {isSelected && ' ✓'}
                              </option>
                            );
                          })}
                        </select>
                        {vendors.length === 0 && (
                          <p className="text-xs text-orange-500 mt-1">
                            ⚠️ No active vendors with vehicles found. Please add vendors in Vendor Management.
                          </p>
                        )}
                        {formData.vendor_id && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Vendor selected: {getVendorName(formData.vendor_id)}
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter emergency contact"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
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
                    <span className="text-xs text-gray-400 ml-2">(* Mandatory)</span>
                    {editingStudent && (
                      <span className="text-xs text-blue-600 ml-2">(Upload new to replace existing)</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderDocumentUpload('Birth Certificate', 'birth_certificate', true)}
                    {renderDocumentUpload('Student Aadhar Card', 'aadhar_card', false)}
                    {renderDocumentUpload('Parent Aadhar (Front)', 'parent_aadhar_front', true)}
                    {renderDocumentUpload('Parent Aadhar (Back)', 'parent_aadhar_back', true)}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    <span className="text-red-500">*</span> Fields marked with asterisk are mandatory
                  </p>
                  <p className="text-xs text-gray-400">
                    Supported formats: PDF, JPG, JPEG, PNG
                  </p>
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