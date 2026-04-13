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

// ==================== DOCUMENT UPLOAD HELPERS ====================
export const uploadDocument = async (file, type = 'general') => {
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

export default api;