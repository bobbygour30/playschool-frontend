// services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== STUDENTS ====================
export const getStudents = () => api.get('/students');
export const getStudent = (id) => api.get(`/students/${id}`);
export const getStudentsByClass = (classId) => api.get(`/students/class/${classId}`);
export const getStudentsByTeacher = (teacherId) => api.get(`/students/teacher/${teacherId}`);
export const getStudentClassStats = () => api.get('/students/stats/class-wise');
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// ==================== STUDENT FEE MANAGEMENT ====================
export const updateStudentFee = (id, data) => api.patch(`/students/${id}/fee`, data);
export const getFeeSummary = () => api.get('/students/stats/fee-summary');

// Fee status helpers
export const markFeePaid = (id, paymentData) => {
  return api.patch(`/students/${id}/fee`, {
    fee_paid: true,
    payment_date: paymentData?.payment_date || new Date().toISOString().split('T')[0],
    payment_mode: paymentData?.payment_mode || 'Cash'
  });
};

export const markFeeUnpaid = (id) => {
  return api.patch(`/students/${id}/fee`, {
    fee_paid: false,
    payment_date: null
  });
};

// ==================== STAFF ====================
export const getStaff = () => api.get('/staff');
export const getStaffMember = (id) => api.get(`/staff/${id}`);
export const getTeachers = () => api.get('/staff/teachers/list');
export const getSupportStaff = () => api.get('/staff/support-staff/list');
export const getStaffByDepartment = (department) => api.get(`/staff/department/${department}`);
export const getStaffStats = () => api.get('/staff/stats/overview');
export const getUpcomingBirthdays = () => api.get('/staff/birthdays/upcoming');
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const updateStaffStatus = (id, status) => api.patch(`/staff/${id}/status`, { status });
export const deleteStaff = (id) => api.delete(`/staff/${id}`);
export const uploadStaffDocument = (data) => api.post('/staff/upload-document', data);

// ==================== ACADEMIC DOCUMENTS ====================
export const getDocumentsByClassAndMonth = (classId, month) => api.get(`/academics/documents/${classId}/${month}`);
export const getDocumentsByClass = (classId) => api.get(`/academics/documents/${classId}`);
export const getDocument = (id) => api.get(`/academics/document/${id}`);
export const uploadAcademicDocument = (data) => api.post('/academics/documents', data);
export const updateAcademicDocument = (id, data) => api.put(`/academics/document/${id}`, data);
export const deleteAcademicDocument = (id) => api.delete(`/academics/document/${id}`);
export const getDocumentStats = (classId) => api.get(`/academics/documents/stats/${classId}`);

// ==================== VENDORS ====================
export const getVendors = () => api.get('/vendors');
export const getVendor = (id) => api.get(`/vendors/${id}`);
export const getVendorsByType = (vendorType) => api.get(`/vendors/type/${vendorType}`);
export const getExpiringContracts = () => api.get('/vendors/contracts/expiring');
export const getVendorStats = () => api.get('/vendors/stats/overview');
export const createVendor = (data) => api.post('/vendors', data);
export const updateVendor = (id, data) => api.put(`/vendors/${id}`, data);
export const updateVendorStatus = (id, status) => api.patch(`/vendors/${id}/status`, { status });
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);
export const uploadVendorDocument = (data) => api.post('/vendors/upload-document', data);

// ==================== ACADEMICS ====================
// Classes
export const getAcademicClasses = () => api.get('/academics/classes');
export const createAcademicClass = (data) => api.post('/academics/classes', data);

// Assessments
export const getAssessments = () => api.get('/academics/assessments');
export const getAssessmentsByClass = (classId) => api.get(`/academics/assessments/${classId}`);
export const getAssessment = (id) => api.get(`/academics/assessment/${id}`);
export const createAssessment = (data) => api.post('/academics/assessments', data);
export const updateAssessment = (id, data) => api.put(`/academics/assessment/${id}`, data);
export const deleteAssessment = (id) => api.delete(`/academics/assessment/${id}`);

// Events
export const getEvents = () => api.get('/academics/events');
export const getEventsByClass = (classId) => api.get(`/academics/events/${classId}`);
export const getEvent = (id) => api.get(`/academics/event/${id}`);
export const createEvent = (data) => api.post('/academics/events', data);
export const updateEvent = (id, data) => api.put(`/academics/event/${id}`, data);
export const deleteEvent = (id) => api.delete(`/academics/event/${id}`);

// Culminations
export const getCulminations = () => api.get('/academics/culminations');
export const getCulminationsByClass = (classId) => api.get(`/academics/culminations/${classId}`);
export const getCulmination = (id) => api.get(`/academics/culmination/${id}`);
export const createCulmination = (data) => api.post('/academics/culminations', data);
export const updateCulmination = (id, data) => api.put(`/academics/culmination/${id}`, data);
export const deleteCulmination = (id) => api.delete(`/academics/culmination/${id}`);

// Academic Statistics
export const getAcademicStats = () => api.get('/academics/stats');
export const getUpcomingItems = () => api.get('/academics/upcoming');

// ==================== FINANCE ====================
// Fee Management
export const getFees = () => api.get('/finance/fees');
export const getFee = (id) => api.get(`/finance/fees/${id}`);
export const getFeesByStudent = (studentId) => api.get(`/finance/fees/student/${studentId}`);
export const createFee = (data) => api.post('/finance/fees', data);
export const updateFee = (id, data) => api.put(`/finance/fees/${id}`, data);
export const deleteFee = (id) => api.delete(`/finance/fees/${id}`);

// Expense Management
export const getExpenses = () => api.get('/finance/expenses');
export const getExpense = (id) => api.get(`/finance/expenses/${id}`);
export const createExpense = (data) => api.post('/finance/expenses', data);
export const updateExpense = (id, data) => api.put(`/finance/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/finance/expenses/${id}`);

// Salary Management
export const getSalaries = () => api.get('/finance/salaries');
export const getSalary = (id) => api.get(`/finance/salaries/${id}`);
export const getSalariesByStaff = (staffId) => api.get(`/finance/salaries/staff/${staffId}`);
export const createSalary = (data) => api.post('/finance/salaries', data);
export const updateSalary = (id, data) => api.put(`/finance/salaries/${id}`, data);
export const deleteSalary = (id) => api.delete(`/finance/salaries/${id}`);

// Financial Reports & Statistics
export const getFinancialOverview = () => api.get('/finance/dashboard/overview');
export const getMonthlyReport = (year) => api.get(`/finance/reports/monthly?year=${year}`);
export const uploadFinanceDocument = (data) => api.post('/finance/upload', data);

// ==================== VEHICLES (for transport reference) ====================
export const getVehicles = () => api.get('/vehicles');
export const getVehicle = (id) => api.get(`/vehicles/${id}`);
export const getActiveVehicles = () => api.get('/vehicles?status=Active');
export const createVehicle = (data) => api.post('/vehicles', data);
export const updateVehicle = (id, data) => api.put(`/vehicles/${id}`, data);
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);

// ==================== CLASSES (for reference) ====================
export const getClasses = () => api.get('/classes');
export const getClass = (id) => api.get(`/classes/${id}`);
export const createClass = (data) => api.post('/classes', data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/classes/${id}`);

// ==================== GENERAL DOCUMENT UPLOAD HELPER ====================
export const uploadGeneralDocument = async (file, type = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// ==================== DASHBOARD STATISTICS ====================
export const getDashboardStats = async () => {
  try {
    const [students, staff, vendors, academicStats, financeOverview] = await Promise.all([
      getStudents(),
      getStaffStats(),
      getVendorStats(),
      getAcademicStats(),
      getFinancialOverview(),
    ]);
    
    return {
      students: {
        total: students.data.length,
        active: students.data.filter(s => s.status === 'Active').length,
      },
      staff: staff.data,
      vendors: vendors.data,
      academics: academicStats.data,
      finance: financeOverview.data,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// ==================== PARENT API WITH ERROR HANDLING ====================
// Parent API with sync support - FIXED with proper error handling

export const getParents = async (params) => {
  try {
    const response = await api.get('/parents', { params });
    return response;
  } catch (error) {
    console.error('Error fetching parents:', error);
    // Return empty array instead of throwing to prevent UI crash
    return { data: [] };
  }
};

export const getParent = async (id) => {
  try {
    const response = await api.get(`/parents/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching parent:', error);
    throw error;
  }
};

export const createParent = async (data) => {
  try {
    const response = await api.post('/parents', data);
    return response;
  } catch (error) {
    console.error('Error creating parent:', error);
    throw error;
  }
};

export const updateParent = async (id, data) => {
  try {
    const response = await api.put(`/parents/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating parent:', error);
    throw error;
  }
};

export const deleteParent = async (id) => {
  try {
    const response = await api.delete(`/parents/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting parent:', error);
    throw error;
  }
};

export const updateParentStatus = async (id, status) => {
  try {
    const response = await api.patch(`/parents/${id}/status`, { status });
    return response;
  } catch (error) {
    console.error('Error updating parent status:', error);
    throw error;
  }
};

export const getParentStats = async () => {
  try {
    const response = await api.get('/parents/stats/overview');
    return response;
  } catch (error) {
    console.error('Error fetching parent stats:', error);
    // Return default stats to prevent UI crash
    return { 
      data: { 
        total: 0, 
        active: 0, 
        inactive: 0, 
        suspended: 0, 
        sync: { pending: 0, synced: 0, failed: 0 } 
      } 
    };
  }
};

// Parent-Student linking - FIXED with proper error handling
export const linkStudentToParent = async (parentId, studentId) => {
  try {
    const response = await api.post(`/parents/${parentId}/link-student`, { studentId });
    return response;
  } catch (error) {
    console.error('Error linking student:', error);
    throw error;
  }
};

export const unlinkStudentFromParent = async (parentId, studentId) => {
  try {
    const response = await api.delete(`/parents/${parentId}/link-student/${studentId}`);
    return response;
  } catch (error) {
    console.error('Error unlinking student:', error);
    throw error;
  }
};

export const getParentStudents = async (parentId) => {
  try {
    const response = await api.get(`/parents/${parentId}/students`);
    return response;
  } catch (error) {
    console.error('Error fetching parent students:', error);
    return { data: [] };
  }
};


// ==================== FACULTY AUTH ====================
export const getFacultyAuth = () => api.get('/faculty-auth');
export const getFacultyAuthMember = (id) => api.get(`/faculty-auth/${id}`);
export const createFacultyAuth = (data) => api.post('/faculty-auth', data);
export const updateFacultyAuth = (id, data) => api.put(`/faculty-auth/${id}`, data);
export const deleteFacultyAuth = (id) => api.delete(`/faculty-auth/${id}`);
export const updateFacultyAuthStatus = (id, status) => api.patch(`/faculty-auth/${id}/status`, { status });
export const getFacultyAuthStats = () => api.get('/faculty-auth/stats/overview');

// ==================== LEAVE MANAGEMENT ====================
const LEAVE_API_URL = 'https://golden-playschool-app-backend.vercel.app';

// Get all leave requests with filters (NO TOKEN REQUIRED)
export const getLeaveRequests = (params) => {
  const url = params ? `/api/leave/admin/all?${params}` : '/api/leave/admin/all';
  return axios.get(`${LEAVE_API_URL}${url}`);
};

// Get leave statistics (NO TOKEN REQUIRED)
export const getLeaveStats = (month, year) => {
  let url = '/api/leave/admin/stats';
  if (month && year) {
    url += `?month=${month}&year=${year}`;
  }
  return axios.get(`${LEAVE_API_URL}${url}`);
};

// Get leave request by ID (NO TOKEN REQUIRED)
export const getLeaveById = (leaveId) => {
  return axios.get(`${LEAVE_API_URL}/api/leave/admin/${leaveId}`);
};

// Approve leave request (NO TOKEN REQUIRED)
export const approveLeave = (leaveId, adminRemarks) => {
  return axios.put(
    `${LEAVE_API_URL}/api/leave/admin/${leaveId}/approve`,
    { adminRemarks: adminRemarks || 'Approved' },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

// Reject leave request (NO TOKEN REQUIRED)
export const rejectLeave = (leaveId, adminRemarks) => {
  return axios.put(
    `${LEAVE_API_URL}/api/leave/admin/${leaveId}/reject`,
    { adminRemarks: adminRemarks || 'Rejected' },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

// ==================== CLASS ASSIGNMENT (MOBILE BACKEND - NO AUTH) ====================
// ✅ Using mobile backend URL directly
const MOBILE_API_URL = import.meta.env.VITE_MOBILE_API_URL || 'https://golden-playschool-app-backend.vercel.app';

const mobileApi = axios.create({
  baseURL: MOBILE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ NEW: Teachers & Classes sourced from the MOBILE database.
// Use these (not getStaff / getAcademicClasses) when building payloads
// for createSchedule / createAssignment, since those endpoints validate
// classId/teacherId against the mobile DB, not the web DB.
export const getMobileTeachers = () => mobileApi.get('/api/class-assignment/teachers');
export const getMobileClasses = () => mobileApi.get('/api/class-assignment/classes');

export const getClassSchedules = (params) => {
  const query = params ? `?${params}` : '';
  return mobileApi.get(`/api/class-assignment/schedules${query}`);
};

export const getScheduleById = (id) => mobileApi.get(`/api/class-assignment/schedule/${id}`);

export const createSchedule = (data) => mobileApi.post('/api/class-assignment/schedule', data);

export const updateSchedule = (id, data) => mobileApi.put(`/api/class-assignment/schedule/${id}`, data);

export const deleteSchedule = (id) => mobileApi.delete(`/api/class-assignment/schedule/${id}`);

export const getTodayClasses = () => mobileApi.get('/api/class-assignment/today');

export const getUpcomingClasses = (days) => {
  const query = days ? `?days=${days}` : '';
  return mobileApi.get(`/api/class-assignment/upcoming${query}`);
};

export const getAssignments = (params) => {
  const query = params ? `?${params}` : '';
  return mobileApi.get(`/api/class-assignment/assignments${query}`);
};

export const createAssignment = (data) => mobileApi.post('/api/class-assignment/assignment', data);

export const updateAssignment = (id, data) => mobileApi.put(`/api/class-assignment/assignment/${id}`, data);

export const deleteAssignment = (id) => mobileApi.delete(`/api/class-assignment/assignment/${id}`);

export const markAssignmentComplete = (id, isCompleted) => 
  mobileApi.put(`/api/class-assignment/assignment/${id}/complete`, { isCompleted });

// ==================== TEACHER CLASS ASSIGNMENTS ====================
export const getTeachersWithClasses = () => {
  return api.get('/staff/teachers/with-classes');
};

export const getTeacherClasses = (teacherId) => {
  return api.get(`/staff/teachers/${teacherId}/classes`);
};

export const assignClassToTeacher = (teacherId, classId) => {
  return api.patch(`/staff/teachers/${teacherId}/assign-class`, { classId });
};

export default api;