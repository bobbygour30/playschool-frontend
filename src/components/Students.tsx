// components/StudentDetails.jsx
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Edit, Trash2, X, Users, Mail, Phone, 
  MapPin, Calendar, Bus, Heart, Star, Award, Filter, Download,
  UserPlus, GraduationCap, TrendingUp, AlertCircle, Upload, FileText,
  UserCheck, Briefcase, Baby, School, Truck, Eye, FolderOpen, BookOpen,
  DollarSign, CreditCard, Receipt, CheckCircle, XCircle, Loader2,
  Dropbox, File, ArrowUpCircle, User, Hash, Clock, CalendarDays,
  Info, ChevronDown, ChevronUp, Printer, Camera, Shield, UserCog,
  FileSpreadsheet, Repeat, RefreshCw, Calendar as CalendarIcon,
  Wallet, Banknote, TrendingDown
} from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent, getClasses, getVehicles, getStaff, getVendors, promoteAllStudents } from '../services/api';

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
const RELATIONSHIP_TYPES = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Aunt', 'Uncle', 'Sibling', 'Other'];
const TRANSPORT_TYPES = ['Walker', 'Cab', 'Bus'];
const FEE_FREQUENCIES = ['Monthly', 'Quarterly', 'Annual'];
const FEE_PLANS = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
const ENROLLMENT_TYPES = ['New Admission', 'Transfer', 'Returning'];
const ACADEMIC_YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 5; i >= 0; i--) {
    const year = currentYear - i;
    years.push(`${year}-${year + 1}`);
  }
  return years;
})();

// ==================== FEE STRUCTURES (must match backend) ====================
const FEE_STRUCTURES = {
  toddler: {
    name: 'Toddler Fee Plan',
    registration_fee: 5000,
    admission_fee: 15000,
    kit_fee: 2500,
    camera_fee: 800,
  },
  'pre-nursery': {
    name: 'Pre-Nursery Fee Plan',
    registration_fee: 5500,
    admission_fee: 18000,
    kit_fee: 3000,
    camera_fee: 1000,
  },
  nursery: {
    name: 'Nursery Fee Plan',
    registration_fee: 6000,
    admission_fee: 20000,
    kit_fee: 3500,
    camera_fee: 1200,
  },
  'kg-1': {
    name: 'KG-1 Fee Plan',
    registration_fee: 7000,
    admission_fee: 25000,
    kit_fee: 4000,
    camera_fee: 1500,
  },
  other: {
    name: 'Other / Custom',
    registration_fee: 0,
    admission_fee: 0,
    kit_fee: 0,
    camera_fee: 0,
  },
};

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

// Helper to calculate age
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years === 0) {
    return `${months} mon`;
  }
  return `${years} yrs ${months} mon`;
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
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionAcademicYear, setPromotionAcademicYear] = useState('');
  const [expandedFeeCard, setExpandedFeeCard] = useState(null);
  const [isFormSticky, setIsFormSticky] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  
  // Refs for scrolling to error fields
  const formRef = useRef(null);
  const fieldRefs = useRef({});

  // Track document changes - which documents have been updated
  const [documentChanges, setDocumentChanges] = useState({
    birth_certificate: false,
    aadhar_card: false,
    parent_aadhar_front: false,
    parent_aadhar_back: false,
    student_photo: false,
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
    medical_info: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    transport_type: 'Walker',
    vehicle_id: '',
    vendor_id: '',
    status: 'Active',
    // Fee fields
    fee_structure: '',
    registration_fee: '',
    admission_fee: '',
    tuition_fee: '',
    activity_fee: '',
    kit_fee: '',
    cab_fee: '',
    camera_fee: '',
    fee_frequency: 'Monthly',
    discount: '',
    fee_paid: false,
    payment_date: '',
    payment_mode: 'Cash',
    // Authorized Pickup
    authorized_pickup_name: '',
    authorized_pickup_relationship: '',
    authorized_pickup_phone: '',
    // Emergency Contact
    emergency_name: '',
    emergency_relationship: '',
    emergency_phone: '',
    // Enrollment Information
    admission_date: new Date().toISOString().split('T')[0],
    academic_year: ACADEMIC_YEARS[0],
    enrollment_type: 'New Admission',
    previous_class: '',
    // Recurring Fees
    recurring_tuition_fee: '',
    recurring_activity_fee: '',
    recurring_transport_fee: '',
    recurring_start_month: new Date().toISOString().slice(0, 7),
    recurring_end_month: '',
    recurring_fee_plan: 'Monthly',
    recurring_auto_generate: true,
    // Initial Payment
    initial_payment_amount: '',
    initial_payment_date: new Date().toISOString().split('T')[0],
    initial_payment_method: 'Cash',
    initial_payment_transaction: '',
    // Document fields - store both file data and existing URLs
    birth_certificate: null,
    birth_certificate_url: null,
    aadhar_card: null,
    aadhar_card_url: null,
    parent_aadhar_front: null,
    parent_aadhar_front_url: null,
    parent_aadhar_back: null,
    parent_aadhar_back_url: null,
    student_photo: null,
    student_photo_url: null,
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

  // Strips non-digits and caps length at 10 — used for parent_phone and emergency_contact
  const handleDigitInput = (value) => value.replace(/\D/g, '').slice(0, 10);

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

  // ==================== FEE STRUCTURE HANDLER ====================
  const handleFeeStructureChange = (structureKey) => {
    if (!structureKey || !FEE_STRUCTURES[structureKey]) {
      setFormData(prev => ({
        ...prev,
        fee_structure: '',
      }));
      return;
    }

    const structure = FEE_STRUCTURES[structureKey];
    setFormData(prev => ({
      ...prev,
      fee_structure: structureKey,
      registration_fee: structure.registration_fee,
      admission_fee: structure.admission_fee,
      kit_fee: structure.kit_fee,
      camera_fee: structure.camera_fee,
    }));
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentChanges(prev => ({ ...prev, [fieldName]: true }));
        setFormData(prev => ({ 
          ...prev, 
          [fieldName]: reader.result,
          [`${fieldName}_url`]: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotalFee = (data) => {
    const reg = parseFloat(data.registration_fee) || 0;
    const adm = parseFloat(data.admission_fee) || 0;
    const tui = parseFloat(data.tuition_fee) || 0;
    const act = parseFloat(data.activity_fee) || 0;
    const kit = parseFloat(data.kit_fee) || 0;
    const cab = parseFloat(data.cab_fee) || 0;
    const cam = parseFloat(data.camera_fee) || 0;
    const discount = parseFloat(data.discount) || 0;
    const subtotal = reg + adm + tui + act + kit + cab + cam;
    return Math.max(0, subtotal - discount);
  };

  const calculateRecurringTotal = (data) => {
    const tuition = parseFloat(data.recurring_tuition_fee) || 0;
    const activity = parseFloat(data.recurring_activity_fee) || 0;
    const transport = parseFloat(data.recurring_transport_fee) || 0;
    return tuition + activity + transport;
  };

  // ==================== VALIDATION FUNCTION ====================
  const validateForm = () => {
    const errors = {};
    let hasError = false;

    // Basic Information
    if (!formData.name.trim()) {
      errors.name = 'Student Name is required';
      hasError = true;
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of Birth is required';
      hasError = true;
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 1) {
        errors.date_of_birth = 'Student must be at least 1 year old';
        hasError = true;
      }
      if (age > 6) {
        errors.date_of_birth = 'Student age should be between 1 and 6 years for this school';
        hasError = true;
      }
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
      hasError = true;
    }

    if (!formData.blood_group) {
      errors.blood_group = 'Blood Group is required';
      hasError = true;
    }

    if (!formData.class_id) {
      errors.class_id = 'Class is required';
      hasError = true;
    }

    if (!formData.section) {
      errors.section = 'Section is required';
      hasError = true;
    }

    // Parent Information
    if (!formData.parent_name.trim()) {
      errors.parent_name = 'Parent Name is required';
      hasError = true;
    }

    if (!formData.parent_relationship) {
      errors.parent_relationship = 'Parent Relationship is required';
      hasError = true;
    }

    if (!formData.parent_email.trim()) {
      errors.parent_email = 'Parent Email is required';
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(formData.parent_email)) {
      errors.parent_email = 'Please enter a valid email address';
      hasError = true;
    }

    if (!formData.parent_phone) {
      errors.parent_phone = 'Parent Phone is required';
      hasError = true;
    } else if (formData.parent_phone.length !== 10) {
      errors.parent_phone = 'Parent Phone must be exactly 10 digits';
      hasError = true;
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
      hasError = true;
    }

    // Enrollment Information
    if (!formData.admission_date) {
      errors.admission_date = 'Admission Date is required';
      hasError = true;
    }

    if (!formData.academic_year) {
      errors.academic_year = 'Academic Year is required';
      hasError = true;
    }

    if (!formData.enrollment_type) {
      errors.enrollment_type = 'Enrollment Type is required';
      hasError = true;
    }

    if ((formData.enrollment_type === 'Transfer' || formData.enrollment_type === 'Returning') && !formData.previous_class) {
      errors.previous_class = 'Previous Class is required for Transfer or Returning students';
      hasError = true;
    }

    // Fee & Charges
    const regFee = parseFloat(formData.registration_fee);
    if (formData.registration_fee === '' || isNaN(regFee) || regFee < 0) {
      errors.registration_fee = 'Registration Fee is required and must be a valid number';
      hasError = true;
    }

    const admFee = parseFloat(formData.admission_fee);
    if (formData.admission_fee === '' || isNaN(admFee) || admFee < 0) {
      errors.admission_fee = 'Admission Fee is required and must be a valid number';
      hasError = true;
    }

    if (!formData.fee_frequency) {
      errors.fee_frequency = 'Fee Frequency is required';
      hasError = true;
    }

    // Transport Details
    if (!formData.transport_type) {
      errors.transport_type = 'Transport Type is required';
      hasError = true;
    }

    if (formData.transport_type !== 'Walker' && !formData.vendor_id) {
      errors.vendor_id = 'Please select a vendor for transport';
      hasError = true;
    }

    if (!formData.status) {
      errors.status = 'Status is required';
      hasError = true;
    }

    // Emergency Contact
    if (!formData.emergency_name.trim()) {
      errors.emergency_name = 'Emergency Contact Name is required';
      hasError = true;
    }

    if (!formData.emergency_relationship) {
      errors.emergency_relationship = 'Emergency Contact Relationship is required';
      hasError = true;
    }

    if (!formData.emergency_phone) {
      errors.emergency_phone = 'Emergency Contact Phone is required';
      hasError = true;
    } else if (formData.emergency_phone.length !== 10) {
      errors.emergency_phone = 'Emergency Contact Phone must be exactly 10 digits';
      hasError = true;
    }

    // Authorized Pickup - Only for Walker
    if (formData.transport_type === 'Walker') {
      if (formData.authorized_pickup_phone && formData.authorized_pickup_phone.length !== 10) {
        errors.authorized_pickup_phone = 'Authorized Pickup Phone must be exactly 10 digits';
        hasError = true;
      }
    }

    // Validate mandatory documents
    const hasStudentPhoto = formData.student_photo || formData.student_photo_url;
    const hasBirthCert = formData.birth_certificate || formData.birth_certificate_url;
    const hasParentAadharFront = formData.parent_aadhar_front || formData.parent_aadhar_front_url;
    const hasParentAadharBack = formData.parent_aadhar_back || formData.parent_aadhar_back_url;

    if (!hasStudentPhoto) {
      errors.student_photo = 'Student Photo is mandatory. Please upload.';
      hasError = true;
    }

    if (!hasBirthCert) {
      errors.birth_certificate = 'Birth Certificate is mandatory. Please upload.';
      hasError = true;
    }

    if (!hasParentAadharFront) {
      errors.parent_aadhar_front = 'Parent Aadhar (Front) is mandatory. Please upload.';
      hasError = true;
    }

    if (!hasParentAadharBack) {
      errors.parent_aadhar_back = 'Parent Aadhar (Back) is mandatory. Please upload.';
      hasError = true;
    }

    // Recurring Fees validation
    const recurringTotal = calculateRecurringTotal(formData);
    if (formData.fee_paid && recurringTotal === 0 && !formData.initial_payment_amount) {
      errors.fee_paid = 'Please set up recurring fees or initial payment amount when marking as paid';
      hasError = true;
    }

    setValidationErrors(errors);
    return { isValid: !hasError, errors };
  };

  // ==================== SCROLL TO ERROR FIELD ====================
  const scrollToError = (errors) => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField && fieldRefs.current[firstErrorField]) {
      // Find the field container in the form
      const element = fieldRefs.current[firstErrorField];
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight effect
      element.style.transition = 'all 0.3s ease';
      element.style.boxShadow = '0 0 0 3px #ef4444, 0 0 20px rgba(239, 68, 68, 0.2)';
      element.style.borderRadius = '12px';
      
      setTimeout(() => {
        element.style.boxShadow = '';
        element.style.borderRadius = '';
      }, 3000);
      
      // Focus on the input if it's an input element
      const input = element.querySelector('input, select, textarea');
      if (input) {
        input.focus();
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
          input.style.borderColor = '';
        }, 3000);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Run validation
    const { isValid, errors } = validateForm();
    
    if (!isValid) {
      setShowValidationSummary(true);
      scrollToError(errors);
      
      // Auto-hide validation summary after 8 seconds
      setTimeout(() => {
        setShowValidationSummary(false);
      }, 8000);
      
      return;
    }
    
    // Clear validation errors if all valid
    setValidationErrors({});
    setShowValidationSummary(false);
    
    try {
      setIsSubmitting(true);
      
      const totalAmount = calculateTotalFee(formData);
      const recurringTotalVal = calculateRecurringTotal(formData);
      
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
        student_photo: documentChanges.student_photo ? formData.student_photo : formData.student_photo_url,
      };
      
      // Prepare authorized pickup data
      const authorizedPickup = formData.transport_type === 'Walker' ? {
        name: formData.authorized_pickup_name || '',
        relationship: formData.authorized_pickup_relationship || '',
        phone: formData.authorized_pickup_phone || '',
      } : null;
      
      // Determine initial payment details
      const initialPaymentAmount = formData.fee_paid 
        ? (parseFloat(formData.initial_payment_amount) || recurringTotalVal || totalAmount)
        : 0;
      
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
        medical_info: formData.medical_info || '',
        enrollment_date: formData.enrollment_date,
        transport_type: formData.transport_type,
        vehicle_id: vehicleId,
        vendor_id: formData.transport_type !== 'Walker' ? formData.vendor_id : null,
        status: formData.status,
        // Fee fields
        fee_structure: formData.fee_structure || null,
        registration_fee: parseFloat(formData.registration_fee) || 0,
        admission_fee: parseFloat(formData.admission_fee) || 0,
        tuition_fee: parseFloat(formData.tuition_fee) || 0,
        activity_fee: parseFloat(formData.activity_fee) || 0,
        kit_fee: parseFloat(formData.kit_fee) || 0,
        cab_fee: parseFloat(formData.cab_fee) || 0,
        camera_fee: parseFloat(formData.camera_fee) || 0,
        fee_frequency: formData.fee_frequency,
        discount: parseFloat(formData.discount) || 0,
        total_amount: totalAmount,
        fee_paid: formData.fee_paid,
        payment_date: formData.fee_paid ? formData.payment_date : null,
        payment_mode: formData.payment_mode,
        // Authorized Pickup
        authorized_pickup: authorizedPickup,
        // Emergency Contact
        emergency_contact: {
          name: formData.emergency_name || '',
          relationship: formData.emergency_relationship || '',
          phone: formData.emergency_phone || '',
        },
        // Enrollment Information
        admission_date: formData.admission_date,
        academic_year: formData.academic_year,
        enrollment_type: formData.enrollment_type,
        previous_class: formData.previous_class || '',
        documents: documents,
        // Recurring Fees
        recurring_fees: {
          tuition_fee: parseFloat(formData.recurring_tuition_fee) || 0,
          activity_fee: parseFloat(formData.recurring_activity_fee) || 0,
          transport_fee: parseFloat(formData.recurring_transport_fee) || 0,
          total_monthly: recurringTotalVal,
          start_month: formData.recurring_start_month || new Date().toISOString().slice(0, 7),
          end_month: formData.recurring_end_month || null,
          fee_plan: formData.recurring_fee_plan || 'Monthly',
          auto_generate: formData.recurring_auto_generate,
          last_generated_month: null,
          initial_payment: {
            amount: initialPaymentAmount,
            paid: formData.fee_paid,
            payment_date: formData.fee_paid ? (formData.initial_payment_date || formData.payment_date || new Date().toISOString().split('T')[0]) : null,
            payment_method: formData.fee_paid ? (formData.initial_payment_method || formData.payment_mode || 'Cash') : 'Cash',
            invoice_id: null,
            transaction_id: formData.initial_payment_transaction || '',
          },
        },
      };
      
      if (editingStudent) {
        await updateStudent(editingStudent._id, studentData);
        alert('Student updated successfully!');
      } else {
        await createStudent(studentData);
        if (formData.fee_paid && initialPaymentAmount > 0) {
          alert('Student added successfully! Initial fee invoice and payment record created.');
        } else {
          alert('Student added successfully!');
        }
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

  const handlePromoteStudents = async () => {
    try {
      setIsPromoting(true);
      const res = await promoteAllStudents(promotionAcademicYear.trim());
      const { promoted, graduated, skipped } = res.data.results;
      alert(
        `Promotion complete!\n\n` +
        `Promoted to next class: ${promoted}\n` +
        `Graduated: ${graduated}\n` +
        `Skipped (no standard class assigned): ${skipped}`
      );
      await loadData();
      setShowPromoteModal(false);
      setPromotionAcademicYear('');
    } catch (error) {
      console.error('Error promoting students:', error);
      alert(error.response?.data?.message || 'Failed to promote students. Please try again.');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleEdit = (student) => {
    console.log('Editing student:', student);
    
    setEditingStudent(student);
    setDocumentChanges({
      birth_certificate: false,
      aadhar_card: false,
      parent_aadhar_front: false,
      parent_aadhar_back: false,
      student_photo: false,
    });
    
    // Clear any previous validation errors
    setValidationErrors({});
    setShowValidationSummary(false);
    
    // Find vendor ID from the student data
    let vendorId = student.vendor_id || '';
    if (vendorId && typeof vendorId === 'object' && vendorId._id) {
      vendorId = vendorId._id;
    }
    
    if (!vendorId && student.vehicle_id) {
      const vehicleId = typeof student.vehicle_id === 'object' ? student.vehicle_id._id : student.vehicle_id;
      const foundVendor = vendors.find(v => v.vehicle_id === vehicleId || v._id === vehicleId);
      if (foundVendor) {
        vendorId = foundVendor._id;
      }
    }
    
    let vehicleId = student.vehicle_id || '';
    if (vehicleId && typeof vehicleId === 'object' && vehicleId._id) {
      vehicleId = vehicleId._id;
    }
    
    if (vendorId) {
      const selectedVendor = vendors.find(v => v._id === vendorId);
      if (selectedVendor && selectedVendor.vehicle_id) {
        vehicleId = selectedVendor.vehicle_id;
      }
    }
    
    const authorizedPickup = student.authorized_pickup || {};
    const emergencyContact = student.emergency_contact || {};
    const recurringFees = student.recurring_fees || {};
    const initialPayment = recurringFees.initial_payment || {};
    
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
      medical_info: student.medical_info || '',
      enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      transport_type: student.transport_type || 'Walker',
      vehicle_id: vehicleId,
      vendor_id: vendorId,
      status: student.status || 'Active',
      // Fee structure
      fee_structure: student.fee_structure || '',
      registration_fee: student.registration_fee || '',
      admission_fee: student.admission_fee || '',
      tuition_fee: student.tuition_fee || '',
      activity_fee: student.activity_fee || '',
      kit_fee: student.kit_fee || '',
      cab_fee: student.cab_fee || '',
      camera_fee: student.camera_fee || '',
      fee_frequency: student.fee_frequency || 'Monthly',
      discount: student.discount || '',
      fee_paid: student.fee_paid || false,
      payment_date: student.payment_date ? student.payment_date.split('T')[0] : '',
      payment_mode: student.payment_mode || 'Cash',
      authorized_pickup_name: authorizedPickup.name || '',
      authorized_pickup_relationship: authorizedPickup.relationship || '',
      authorized_pickup_phone: authorizedPickup.phone || '',
      emergency_name: emergencyContact.name || '',
      emergency_relationship: emergencyContact.relationship || '',
      emergency_phone: emergencyContact.phone || '',
      admission_date: student.admission_date ? student.admission_date.split('T')[0] : new Date().toISOString().split('T')[0],
      academic_year: student.academic_year || ACADEMIC_YEARS[0],
      enrollment_type: student.enrollment_type || 'New Admission',
      previous_class: student.previous_class || '',
      // Recurring Fees
      recurring_tuition_fee: recurringFees.tuition_fee || '',
      recurring_activity_fee: recurringFees.activity_fee || '',
      recurring_transport_fee: recurringFees.transport_fee || '',
      recurring_start_month: recurringFees.start_month || new Date().toISOString().slice(0, 7),
      recurring_end_month: recurringFees.end_month || '',
      recurring_fee_plan: recurringFees.fee_plan || 'Monthly',
      recurring_auto_generate: recurringFees.auto_generate !== undefined ? recurringFees.auto_generate : true,
      // Initial Payment
      initial_payment_amount: initialPayment.amount || '',
      initial_payment_date: initialPayment.payment_date ? new Date(initialPayment.payment_date).toISOString().split('T')[0] : '',
      initial_payment_method: initialPayment.payment_method || 'Cash',
      initial_payment_transaction: initialPayment.transaction_id || '',
      // Document fields
      birth_certificate: null,
      birth_certificate_url: student.documents?.birth_certificate || null,
      aadhar_card: null,
      aadhar_card_url: student.documents?.aadhar_card || null,
      parent_aadhar_front: null,
      parent_aadhar_front_url: student.documents?.parent_aadhar_front || null,
      parent_aadhar_back: null,
      parent_aadhar_back_url: student.documents?.parent_aadhar_back || null,
      student_photo: null,
      student_photo_url: student.documents?.student_photo || null,
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
      medical_info: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      transport_type: 'Walker',
      vehicle_id: '',
      vendor_id: '',
      status: 'Active',
      fee_structure: '',
      registration_fee: '',
      admission_fee: '',
      tuition_fee: '',
      activity_fee: '',
      kit_fee: '',
      cab_fee: '',
      camera_fee: '',
      fee_frequency: 'Monthly',
      discount: '',
      fee_paid: false,
      payment_date: '',
      payment_mode: 'Cash',
      authorized_pickup_name: '',
      authorized_pickup_relationship: '',
      authorized_pickup_phone: '',
      emergency_name: '',
      emergency_relationship: '',
      emergency_phone: '',
      admission_date: new Date().toISOString().split('T')[0],
      academic_year: ACADEMIC_YEARS[0],
      enrollment_type: 'New Admission',
      previous_class: '',
      recurring_tuition_fee: '',
      recurring_activity_fee: '',
      recurring_transport_fee: '',
      recurring_start_month: new Date().toISOString().slice(0, 7),
      recurring_end_month: '',
      recurring_fee_plan: 'Monthly',
      recurring_auto_generate: true,
      initial_payment_amount: '',
      initial_payment_date: new Date().toISOString().split('T')[0],
      initial_payment_method: 'Cash',
      initial_payment_transaction: '',
      birth_certificate: null,
      birth_certificate_url: null,
      aadhar_card: null,
      aadhar_card_url: null,
      parent_aadhar_front: null,
      parent_aadhar_front_url: null,
      parent_aadhar_back: null,
      parent_aadhar_back_url: null,
      student_photo: null,
      student_photo_url: null,
    });
    setDocumentChanges({
      birth_certificate: false,
      aadhar_card: false,
      parent_aadhar_front: false,
      parent_aadhar_back: false,
      student_photo: false,
    });
    setValidationErrors({});
    setShowValidationSummary(false);
    setEditingStudent(null);
    setShowModal(false);
    setIsSubmitting(false);
  };

  // Handle scroll for sticky form footer
  useEffect(() => {
    if (showModal) {
      const modalContent = document.querySelector('.modal-scroll-content');
      if (modalContent) {
        const handleScroll = () => {
          const scrollTop = modalContent.scrollTop;
          const scrollHeight = modalContent.scrollHeight;
          const clientHeight = modalContent.clientHeight;
          setIsFormSticky(scrollTop + clientHeight < scrollHeight - 100);
        };
        modalContent.addEventListener('scroll', handleScroll);
        return () => modalContent.removeEventListener('scroll', handleScroll);
      }
    }
    return () => {};
  }, [showModal]);

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
    const discount = student.discount || 0;
    const subtotal = reg + adm + tui + act + kit + cab + cam;
    return Math.max(0, subtotal - discount);
  };

  const getRecurringTotal = (student) => {
    const rf = student.recurring_fees || {};
    return (rf.tuition_fee || 0) + (rf.activity_fee || 0) + (rf.transport_fee || 0);
  };

  const toggleFeeDetails = (studentId) => {
    setExpandedFeeCard(expandedFeeCard === studentId ? null : studentId);
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
    const hasError = validationErrors[fieldName];
    
    return (
      <div 
        ref={el => fieldRefs.current[fieldName] = el}
        className={`${hasError ? 'border-l-4 border-red-500 pl-3 rounded-r-lg' : ''}`}
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          {editingStudent && hasDocument && !isChanged && (
            <span className="text-xs text-green-600 ml-2">(Current document preserved)</span>
          )}
          {editingStudent && isChanged && (
            <span className="text-xs text-blue-600 ml-2">(New document uploaded)</span>
          )}
          {hasError && (
            <span className="text-xs text-red-500 ml-2 font-normal">⛔ {validationErrors[fieldName]}</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required={!editingStudent && required}
            onChange={(e) => handleFileUpload(e, fieldName)}
            disabled={isSubmitting}
            className={`flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed ${
              hasError ? 'border-red-500 ring-1 ring-red-500 rounded-lg' : ''
            }`}
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
        {hasError && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {validationErrors[fieldName]}
          </p>
        )}
      </div>
    );
  };

  // Render field with validation
  const renderField = (label, fieldName, component, required = false, className = '') => {
    const hasError = validationErrors[fieldName];
    
    return (
      <div 
        ref={el => fieldRefs.current[fieldName] = el}
        className={`${hasError ? 'border-l-4 border-red-500 pl-3 rounded-r-lg' : ''} ${className}`}
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          {hasError && (
            <span className="text-xs text-red-500 ml-2 font-normal">⛔ {validationErrors[fieldName]}</span>
          )}
        </label>
        {component}
        {hasError && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {validationErrors[fieldName]}
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
                <Users size={18} className="text-purple-500 flex-shrink-0" />
                Class-wise student management with complete documentation and fee tracking
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowPromoteModal(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
                <div className="flex items-center gap-2 relative">
                  <ArrowUpCircle size={20} />
                  <span className="font-semibold">Promote Students</span>
                </div>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
                <div className="flex items-center gap-2 relative">
                  <UserPlus size={20} />
                  <span className="font-semibold">Add New Student</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Fee Summary Cards */}
        {feeStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 flex-shrink-0" size={20} />
              <input
                type="text"
                placeholder="Search by student name, parent name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 flex-shrink-0" size={18} />
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
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 flex-shrink-0" size={18} />
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
              <button className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:shadow-md transition-all flex-shrink-0">
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
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{classSection.name}</h2>
                    <p className="text-sm text-gray-500">{classSection.ageGroup}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 text-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            {student.documents?.student_photo ? (
                              <img 
                                src={student.documents.student_photo} 
                                alt={student.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white/50 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <User size={24} className="text-white" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-bold text-lg flex items-center gap-2 flex-wrap">
                                <span className="truncate">{student.name}</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  ID: {student._id?.slice(-6) || 'N/A'}
                                </span>
                              </h3>
                              <div className="mt-0.5 space-y-0.5">
                                <p className="text-xs text-white/90 flex items-center gap-2">
                                  <span className="capitalize">{student.gender}</span>
                                  <span className="opacity-50">•</span>
                                  <span>{calculateAge(student.date_of_birth)}</span>
                                </p>
                                <p className="text-xs text-white/90 flex items-center gap-2">
                                  <span>{getClassName(student.class_id)}</span>
                                  <span className="opacity-50">•</span>
                                  <span>Section {student.section || 'A'}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          student.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Teacher Info */}
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                        <UserCheck size={14} className="text-purple-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          Teacher: {getTeacherName(student.assigned_teacher_id)}
                        </p>
                      </div>

                      {/* Parent Information */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Users size={12} className="flex-shrink-0" />
                          Parent Information
                        </p>
                        <p className="text-sm font-medium text-gray-800 truncate">{student.parent_name}</p>
                        <p className="text-xs text-gray-500">{student.parent_relationship}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1 flex-wrap">
                          <Mail size={10} className="flex-shrink-0" /> <span className="truncate">{student.parent_email}</span>
                          <Phone size={10} className="ml-1 flex-shrink-0" /> {student.parent_phone}
                        </div>
                        {student.blood_group && (
                          <div className="mt-1 flex items-center gap-1">
                            <Heart size={12} className="text-red-500 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-700">
                              Blood Group: <span className="text-red-600">{student.blood_group}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Emergency Contact */}
                      {student.emergency_contact && (
                        <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                          <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                            <AlertCircle size={12} className="flex-shrink-0" />
                            Emergency Contact
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                            <span className="text-gray-600 truncate">Name: {student.emergency_contact.name || 'N/A'}</span>
                            <span className="text-gray-600 truncate">Relation: {student.emergency_contact.relationship || 'N/A'}</span>
                            <span className="text-gray-600 col-span-2 truncate">Phone: {student.emergency_contact.phone || 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Authorized Pickup - Only for Walker */}
                      {student.transport_type === 'Walker' && student.authorized_pickup && (
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            <Shield size={12} className="flex-shrink-0" />
                            Authorized Pickup
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                            <span className="text-gray-600 truncate">Name: {student.authorized_pickup.name || 'N/A'}</span>
                            <span className="text-gray-600 truncate">Relation: {student.authorized_pickup.relationship || 'N/A'}</span>
                            <span className="text-gray-600 col-span-2 truncate">Phone: {student.authorized_pickup.phone || 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Recurring Fee Badge */}
                      {student.recurring_fees && getRecurringTotal(student) > 0 && (
                        <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                          <p className="text-xs text-purple-600 font-medium flex items-center gap-1">
                            <Repeat size={12} className="flex-shrink-0" />
                            Recurring Fee: ₹{getRecurringTotal(student)}/month
                          </p>
                          {student.recurring_fees.fee_plan && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({student.recurring_fees.fee_plan})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Fee Information */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <DollarSign size={12} className="flex-shrink-0" />
                            Fee Summary ({student.fee_frequency || 'Monthly'})
                          </p>
                          <button
                            onClick={() => toggleFeeDetails(student._id)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 flex-shrink-0"
                          >
                            {expandedFeeCard === student._id ? (
                              <>Hide Details <ChevronUp size={14} /></>
                            ) : (
                              <>View Details <ChevronDown size={14} /></>
                            )}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-500">Total</p>
                            <p className="text-sm font-bold text-purple-600">₹{getTotalFee(student)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-500">Paid</p>
                            <p className="text-sm font-bold text-green-600">
                              {student.fee_paid ? `₹${getTotalFee(student)}` : '₹0'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-500">Due</p>
                            <p className="text-sm font-bold text-red-600">
                              {student.fee_paid ? '₹0' : `₹${getTotalFee(student)}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-center mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            student.fee_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {student.fee_paid ? 'Paid ✓' : 'Unpaid'}
                          </span>
                        </div>

                        {/* Expanded Fee Details */}
                        {expandedFeeCard === student._id && (
                          <div className="mt-2 pt-2 border-t border-blue-200 space-y-1">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Full Breakdown:</p>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <span className="text-gray-600">Registration: ₹{student.registration_fee || 0}</span>
                              <span className="text-gray-600">Admission: ₹{student.admission_fee || 0}</span>
                              <span className="text-gray-600">Tuition: ₹{student.tuition_fee || 0}</span>
                              <span className="text-gray-600">Activity: ₹{student.activity_fee || 0}</span>
                              <span className="text-gray-600">Kit: ₹{student.kit_fee || 0}</span>
                              <span className="text-gray-600">Cab: ₹{student.cab_fee || 0}</span>
                              <span className="text-gray-600">Camera: ₹{student.camera_fee || 0}</span>
                              {student.discount > 0 && (
                                <span className="text-red-600">Discount: -₹{student.discount}</span>
                              )}
                              <span className="text-gray-600">Frequency: {student.fee_frequency || 'Monthly'}</span>
                              {student.fee_structure && (
                                <span className="text-purple-600 col-span-2">
                                  Plan: {FEE_STRUCTURES[student.fee_structure]?.name || student.fee_structure}
                                </span>
                              )}
                            </div>
                            {student.recurring_fees && getRecurringTotal(student) > 0 && (
                              <div className="mt-1 pt-1 border-t border-blue-200">
                                <p className="text-xs font-semibold text-purple-600">Recurring (Monthly):</p>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  <span className="text-gray-600">Tuition: ₹{student.recurring_fees.tuition_fee || 0}</span>
                                  <span className="text-gray-600">Activity: ₹{student.recurring_fees.activity_fee || 0}</span>
                                  <span className="text-gray-600">Transport: ₹{student.recurring_fees.transport_fee || 0}</span>
                                  <span className="text-gray-600 font-semibold">Total: ₹{getRecurringTotal(student)}</span>
                                </div>
                                {student.recurring_fees.start_month && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Start: {student.recurring_fees.start_month}
                                    {student.recurring_fees.end_month && ` - End: ${student.recurring_fees.end_month}`}
                                  </p>
                                )}
                                {student.recurring_fees.initial_payment?.paid && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Initial Payment: ₹{student.recurring_fees.initial_payment.amount} (Paid)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Promote Modal */}
{showPromoteModal && createPortal(
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ArrowUpCircle size={22} />
          Promote All Students
        </h2>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600">
          This will promote all active students to the next class according to the progression:
          <br />
          <span className="font-medium text-gray-800">Toddler → Pre-Nursery → Nursery → KG-1 → Graduated</span>
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Year (for record)
          </label>
          <input
            type="text"
            value={promotionAcademicYear}
            onChange={(e) => setPromotionAcademicYear(e.target.value)}
            placeholder="e.g. 2025-2026"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => {
              setShowPromoteModal(false);
              setPromotionAcademicYear('');
            }}
            disabled={isPromoting}
            className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePromoteStudents}
            disabled={isPromoting}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
          >
            {isPromoting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Promoting...
              </>
            ) : (
              'Confirm Promotion'
            )}
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
)}

        {/* Add/Edit Student Modal */}
{showModal && createPortal(
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll-content">
      {/* Modal Header - Sticky */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between z-10">
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

              {/* Validation Summary */}
              {showValidationSummary && Object.keys(validationErrors).length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4 rounded-lg shadow-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800">Please fix the following errors:</h4>
                      <ul className="mt-2 space-y-1">
                        {Object.entries(validationErrors).map(([field, message]) => (
                          <li key={field} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>
                              <span className="font-medium capitalize">{field.replace(/_/g, ' ')}</span>
                              : {message}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span className="animate-pulse">🔴</span>
                        Scroll to the highlighted field to fix the issue
                      </p>
                    </div>
                    <button
                      onClick={() => setShowValidationSummary(false)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-purple-600 flex-shrink-0" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderField(
                      'Student Name',
                      'name',
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter student name"
                      />,
                      true
                    )}
                    {renderField(
                      'Date of Birth',
                      'date_of_birth',
                      <input
                        type="date"
                        required
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />,
                      true
                    )}
                    {renderField(
                      'Gender',
                      'gender',
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>,
                      true
                    )}
                    {renderField(
                      'Blood Group',
                      'blood_group',
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
                      </select>,
                      true
                    )}
                    {renderField(
                      'Class',
                      'class_id',
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
                      </select>,
                      true
                    )}
                    {renderField(
                      'Section',
                      'section',
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
                      </select>,
                      true
                    )}
                  </div>
                </div>

                {/* Staff Assignment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCheck size={18} className="text-purple-600 flex-shrink-0" />
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
                    <Users size={18} className="text-purple-600 flex-shrink-0" />
                    Parent Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(
                      'Parent Name',
                      'parent_name',
                      <input
                        type="text"
                        required
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter parent name"
                      />,
                      true
                    )}
                    {renderField(
                      'Relationship',
                      'parent_relationship',
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
                      </select>,
                      true
                    )}
                    {renderField(
                      'Parent Email',
                      'parent_email',
                      <input
                        type="email"
                        required
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="parent@email.com"
                      />,
                      true
                    )}
                    {renderField(
                      'Parent Phone',
                      'parent_phone',
                      <div>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          maxLength={10}
                          pattern="\d{10}"
                          title="Enter exactly 10 digits"
                          value={formData.parent_phone}
                          onChange={(e) => setFormData({ ...formData, parent_phone: handleDigitInput(e.target.value) })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="10-digit phone number"
                        />
                      </div>,
                      true
                    )}
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
                    {renderField(
                      'Address',
                      'address',
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={isSubmitting}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Full address"
                      />,
                      true,
                      'md:col-span-2'
                    )}
                  </div>
                </div>

                {/* Enrollment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-green-600 flex-shrink-0" />
                    Enrollment Information
                    <span className="text-xs text-red-500 ml-2">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderField(
                      'Admission Date',
                      'admission_date',
                      <input
                        type="date"
                        required
                        value={formData.admission_date}
                        onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />,
                      true
                    )}
                    {renderField(
                      'Academic Year',
                      'academic_year',
                      <select
                        required
                        value={formData.academic_year}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {ACADEMIC_YEARS.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>,
                      true
                    )}
                    {renderField(
                      'Enrollment Type',
                      'enrollment_type',
                      <select
                        required
                        value={formData.enrollment_type}
                        onChange={(e) => setFormData({ ...formData, enrollment_type: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {ENROLLMENT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>,
                      true
                    )}
                    {renderField(
                      'Previous Class',
                      'previous_class',
                      <select
                        value={formData.previous_class}
                        onChange={(e) => setFormData({ ...formData, previous_class: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Previous Class</option>
                        {CLASSES.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>,
                      false,
                      'md:col-span-1'
                    )}
                    {(formData.enrollment_type === 'Transfer' || formData.enrollment_type === 'Returning') && !formData.previous_class && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ Previous class is required for {formData.enrollment_type} students.
                      </p>
                    )}
                  </div>
                </div>

                {/* ==================== FEE AND CHARGES (UPDATED) ==================== */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-purple-600 flex-shrink-0" />
                    Fee & Charges
                  </h3>

                  {/* Fee Structure Dropdown */}
                  <div className="mb-5 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fee Structure <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">(Select plan to auto-fill one-time fees)</span>
                    </label>
                    <select
                      value={formData.fee_structure}
                      onChange={(e) => handleFeeStructureChange(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white font-medium"
                    >
                      <option value="">-- Select Fee Structure --</option>
                      <option value="toddler">Toddler Fee Plan</option>
                      <option value="pre-nursery">Pre-Nursery Fee Plan</option>
                      <option value="nursery">Nursery Fee Plan</option>
                      <option value="kg-1">KG-1 Fee Plan</option>
                      <option value="other">Other / Custom</option>
                    </select>
                    {formData.fee_structure && FEE_STRUCTURES[formData.fee_structure] && (
                      <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                        <Info size={12} />
                        Auto-filled: Registration ₹{FEE_STRUCTURES[formData.fee_structure].registration_fee}, 
                        Admission ₹{FEE_STRUCTURES[formData.fee_structure].admission_fee}, 
                        Kit ₹{FEE_STRUCTURES[formData.fee_structure].kit_fee}, 
                        Camera ₹{FEE_STRUCTURES[formData.fee_structure].camera_fee}
                        {formData.fee_structure === 'other' && ' (Custom – enter values manually)'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderField(
                      'Registration Fee (₹)',
                      'registration_fee',
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
                      />,
                      true
                    )}
                    {renderField(
                      'Admission Fee (₹)',
                      'admission_fee',
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
                      />,
                      true
                    )}
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
                        <span className="text-xs text-gray-400 ml-1">(One time)</span>
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
                        <span className="text-xs text-gray-400 ml-1">(One time)</span>
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
                    {renderField(
                      'Fee Frequency',
                      'fee_frequency',
                      <select
                        required
                        value={formData.fee_frequency}
                        onChange={(e) => setFormData({ ...formData, fee_frequency: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {FEE_FREQUENCIES.map(freq => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </select>,
                      true
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount (₹)
                        <span className="text-xs text-gray-400 ml-1">(If applicable)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter discount amount"
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
                        onChange={(e) => {
                          const isPaid = e.target.value === 'paid';
                          const recurringTotal = calculateRecurringTotal(formData);
                          setFormData({ 
                            ...formData, 
                            fee_paid: isPaid,
                            initial_payment_amount: isPaid ? (recurringTotal || calculateTotalFee(formData)) : '',
                            initial_payment_date: isPaid ? new Date().toISOString().split('T')[0] : '',
                            initial_payment_method: isPaid ? 'Cash' : 'Cash',
                          });
                        }}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          validationErrors.fee_paid ? 'border-red-500' : ''
                        }`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                      {validationErrors.fee_paid && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {validationErrors.fee_paid}
                        </p>
                      )}
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

                {/* Recurring Fees Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Repeat size={18} className="text-blue-600 flex-shrink-0" />
                    Recurring Fees                    <span className="text-xs text-gray-400 ml-2">(Monthly recurring charges)</span>
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Tuition Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.recurring_tuition_fee}
                          onChange={(e) => setFormData({ ...formData, recurring_tuition_fee: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Enter monthly tuition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Activity Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.recurring_activity_fee}
                          onChange={(e) => setFormData({ ...formData, recurring_activity_fee: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Enter monthly activity"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Transport Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.recurring_transport_fee}
                          onChange={(e) => setFormData({ ...formData, recurring_transport_fee: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Enter monthly transport"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Total
                        </label>
                        <div className="w-full px-4 py-2 bg-gray-100 rounded-xl text-gray-700 font-semibold">
                          ₹{calculateRecurringTotal(formData)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fee Plan
                        </label>
                        <select
                          value={formData.recurring_fee_plan}
                          onChange={(e) => setFormData({ ...formData, recurring_fee_plan: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          {FEE_PLANS.map(plan => (
                            <option key={plan} value={plan}>{plan}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Month
                        </label>
                        <input
                          type="month"
                          value={formData.recurring_start_month}
                          onChange={(e) => setFormData({ ...formData, recurring_start_month: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Month <span className="text-xs text-gray-400">(Optional)</span>
                        </label>
                        <input
                          type="month"
                          value={formData.recurring_end_month}
                          onChange={(e) => setFormData({ ...formData, recurring_end_month: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="autoGenerate"
                          checked={formData.recurring_auto_generate}
                          onChange={(e) => setFormData({ ...formData, recurring_auto_generate: e.target.checked })}
                          disabled={isSubmitting}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="autoGenerate" className="text-sm font-medium text-gray-700">
                          Auto-generate monthly invoices
                        </label>
                      </div>
                    </div>
                    
                    {/* Initial Payment Section - Shows when Fee is marked as Paid */}
                    {formData.fee_paid && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <CreditCard size={16} className="text-green-600" />
                          Initial Payment Details
                          <span className="text-xs text-gray-400">(First month's fee)</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Initial Payment Amount (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required={formData.fee_paid}
                              value={formData.initial_payment_amount || calculateRecurringTotal(formData) || calculateTotalFee(formData)}
                              onChange={(e) => setFormData({ ...formData, initial_payment_amount: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="Enter initial payment"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Date
                            </label>
                            <input
                              type="date"
                              value={formData.initial_payment_date || formData.payment_date || new Date().toISOString().split('T')[0]}
                              onChange={(e) => setFormData({ ...formData, initial_payment_date: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Method
                            </label>
                            <select
                              value={formData.initial_payment_method || formData.payment_mode || 'Cash'}
                              onChange={(e) => setFormData({ ...formData, initial_payment_method: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              {PAYMENT_MODES.map(mode => (
                                <option key={mode} value={mode}>{mode}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Transaction/Receipt No. <span className="text-xs text-gray-400">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.initial_payment_transaction || ''}
                              onChange={(e) => setFormData({ ...formData, initial_payment_transaction: e.target.value })}
                              disabled={isSubmitting}
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="Enter transaction reference number"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <Info size={12} className="flex-shrink-0" />
                          This payment will create an initial invoice and payment record in the finance module with the student's name.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transport Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Truck size={18} className="text-purple-600 flex-shrink-0" />
                    Transport Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(
                      'Transport Type',
                      'transport_type',
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
                      </select>,
                      true
                    )}
                    {(formData.transport_type === 'Cab' || formData.transport_type === 'Bus') && (
                      renderField(
                        'Select Vendor/Vehicle',
                        'vendor_id',
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
                        </select>,
                        true
                      )
                    )}
                    {renderField(
                      'Status',
                      'status',
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
                      </select>,
                      true
                    )}
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

                {/* Authorized Pickup Section - Only for Walker */}
                {formData.transport_type === 'Walker' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-blue-600 flex-shrink-0" />
                      Authorized Pickup Person
                      <span className="text-xs text-gray-400 ml-2">(Only for Walker)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.authorized_pickup_name}
                          onChange={(e) => setFormData({ ...formData, authorized_pickup_name: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter authorized person name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          value={formData.authorized_pickup_relationship}
                          onChange={(e) => setFormData({ ...formData, authorized_pickup_relationship: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Relationship</option>
                          {RELATIONSHIP_TYPES.map(rel => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                      </div>
                      {renderField(
                        'Mobile Number',
                        'authorized_pickup_phone',
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          pattern="\d{10}"
                          title="Enter exactly 10 digits"
                          value={formData.authorized_pickup_phone}
                          onChange={(e) => setFormData({ ...formData, authorized_pickup_phone: handleDigitInput(e.target.value) })}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="10-digit phone number"
                        />,
                        false
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contact Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                    Emergency Contact
                    <span className="text-xs text-red-500 ml-2">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderField(
                      'Full Name',
                      'emergency_name',
                      <input
                        type="text"
                        required
                        value={formData.emergency_name}
                        onChange={(e) => setFormData({ ...formData, emergency_name: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter emergency contact name"
                      />,
                      true
                    )}
                    {renderField(
                      'Relationship',
                      'emergency_relationship',
                      <select
                        required
                        value={formData.emergency_relationship}
                        onChange={(e) => setFormData({ ...formData, emergency_relationship: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Relationship</option>
                        {RELATIONSHIP_TYPES.map(rel => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>,
                      true
                    )}
                    {renderField(
                      'Phone Number',
                      'emergency_phone',
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        pattern="\d{10}"
                        title="Enter exactly 10 digits"
                        value={formData.emergency_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_phone: handleDigitInput(e.target.value) })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="10-digit phone number"
                      />,
                      true
                    )}
                  </div>
                </div>

                {/* Documents Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload size={18} className="text-purple-600 flex-shrink-0" />
                    Documents Upload
                    <span className="text-xs text-red-500 ml-2">(* Mandatory)</span>
                    {editingStudent && (
                      <span className="text-xs text-blue-600 ml-2">(Upload new to replace existing)</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderDocumentUpload('Student Photo', 'student_photo', true)}
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

                {/* Form Footer - Sticky */}
                <div className={`sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t transition-shadow ${
                  isFormSticky ? 'shadow-lg' : ''
                }`}>
                  <div className="flex justify-end gap-3">
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
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}