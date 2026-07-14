import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Calendar, Clock, 
  Filter, Download, BookOpen, Users, ChevronRight,
  CheckCircle, Clock as ClockIcon, MapPin, User,
  Repeat, Calendar as CalendarIcon, ChevronDown,
  Eye, EyeOff, AlertCircle, Check, Trash,
  RefreshCw, Copy, MoreVertical, Edit2, Save
} from 'lucide-react';
import { 
  getMobileTeachers,
  getMobileClasses,
  getClassSchedules,
  getAssignments,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  markAssignmentComplete,
} from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

export default function ClassAssignment() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('schedule');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');
  const [activeTab, setActiveTab] = useState('assignment');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    classId: '',
    teacherId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    subject: '',
    roomNumber: '',
    title: '',
    description: '',
    assignedDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.teacherId) {
      const selectedTeacher = teachers.find(t => t._id === formData.teacherId);
      if (selectedTeacher && selectedTeacher.assigned_class_id) {
        const teacherClass = allClasses.find(c => c._id === selectedTeacher.assigned_class_id);
        if (teacherClass) {
          setClasses([teacherClass]);
        } else {
          setClasses([]);
        }
      } else {
        setClasses(allClasses);
      }
    } else {
      setClasses(allClasses);
    }
  }, [formData.teacherId, allClasses, teachers]);

  const loadData = async () => {
    try {
      setLoading(true);

      // ✅ FIXED: classes & teachers now come from the MOBILE backend,
      // so their _id values match what createSchedule/createAssignment expect.
      const classesRes = await getMobileClasses();
      const classesData = classesRes.data.classes || [];
      const formattedClasses = classesData.map(cls => ({
        _id: cls._id,
        name: cls.className || 'Unknown Class',
        section: cls.section || 'A',
      }));
      setAllClasses(formattedClasses);
      setClasses(formattedClasses);

      const teachersRes = await getMobileTeachers();
      const teachersData = teachersRes.data.teachers || [];
      setTeachers(teachersData.map(t => ({
        _id: t._id,
        name: t.name,
        assigned_class_id: t.assigned_class_id,
      })));

      await loadSchedules();
      await loadAssignments();
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load some data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await getClassSchedules();
      setSchedules(response.data.schedules || {});
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await getAssignments();
      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = modalType === 'schedule' 
        ? {
            classId: formData.classId,
            teacherId: formData.teacherId,
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            subject: formData.subject,
            roomNumber: formData.roomNumber,
          }
        : {
            classId: formData.classId,
            teacherId: formData.teacherId,
            title: formData.title,
            description: formData.description,
            assignedDate: formData.assignedDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            roomNumber: formData.roomNumber,
          };

      let response;
      if (editingItem) {
        if (modalType === 'schedule') {
          response = await updateSchedule(editingItem.id, payload);
        } else {
          response = await updateAssignment(editingItem.id, payload);
        }
        alert(`${modalType === 'schedule' ? 'Schedule' : 'Assignment'} updated successfully!`);
      } else {
        if (modalType === 'schedule') {
          response = await createSchedule(payload);
        } else {
          response = await createAssignment(payload);
        }
        alert(`${modalType === 'schedule' ? 'Schedule' : 'Assignment'} created successfully!`);
      }
      
      resetForm();
      await loadSchedules();
      await loadAssignments();
    } catch (error) {
      console.error('Error saving:', error);
      alert(error.response?.data?.msg || 'Failed to save. Please try again.');
    }
  };

  const handleDelete = async (id, type) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === 'schedule') {
        await deleteSchedule(id);
      } else {
        await deleteAssignment(id);
      }
      alert(`${type} deleted successfully!`);
      await loadSchedules();
      await loadAssignments();
    } catch (error) {
      console.error('Error deleting:', error);
      alert(error.response?.data?.msg || 'Failed to delete');
    }
  };

  const handleMarkComplete = async (assignmentId, isCompleted) => {
    try {
      await markAssignmentComplete(assignmentId, isCompleted);
      await loadAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment status');
    }
  };

  const resetForm = () => {
    setFormData({
      classId: '',
      teacherId: '',
      dayOfWeek: 'Monday',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      subject: '',
      roomNumber: '',
      title: '',
      description: '',
      assignedDate: '',
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setModalType(type);
    setShowModal(true);
    if (type === 'schedule') {
      setFormData({
        classId: item.classId,
        teacherId: item.teacherId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        subject: item.subject || '',
        roomNumber: item.roomNumber || '',
        title: '',
        description: '',
        assignedDate: '',
      });
    } else {
      setFormData({
        classId: item.classId,
        teacherId: item.teacherId,
        startTime: item.startTime,
        endTime: item.endTime,
        roomNumber: item.roomNumber || '',
        title: item.title || '',
        description: item.description || '',
        assignedDate: item.assignedDate ? item.assignedDate.split('T')[0] : '',
        dayOfWeek: 'Monday',
        subject: item.subject || '',
      });
    }
  };

  const getDaySchedules = (day) => {
    return schedules[day] || [];
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c._id === classId);
    return cls ? `${cls.name} ${cls.section || ''}`.trim() : 'Unknown Class';
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const filteredAssignments = assignments.filter(a => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      a.title?.toLowerCase().includes(search) ||
      getClassName(a.classId).toLowerCase().includes(search) ||
      getTeacherName(a.teacherId).toLowerCase().includes(search)
    );
  });

  const getTeacherAssignedClass = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    if (teacher && teacher.assigned_class_id) {
      const cls = allClasses.find(c => c._id === teacher.assigned_class_id);
      return cls ? cls.name : 'Not Assigned';
    }
    return 'Not Assigned';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-white/80 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Class Assignment
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-500" />
                Manage recurring schedules and one-time class assignments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalType('assignment');
                  setEditingItem(null);
                  setFormData({
                    classId: '',
                    teacherId: '',
                    startTime: '09:00 AM',
                    endTime: '10:30 AM',
                    roomNumber: '',
                    title: '',
                    description: '',
                    assignedDate: new Date().toISOString().split('T')[0],
                    dayOfWeek: 'Monday',
                    subject: '',
                  });
                  setShowModal(true);
                }}
                className="group relative px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <Plus size={18} />
                  <span className="font-semibold">Add Assignment</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Tab */}
        <div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search assignments by title, class, or teacher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
                <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-500">No assignments found</p>
                <button
                  onClick={() => {
                    setModalType('assignment');
                    setEditingItem(null);
                    setFormData({
                      ...formData,
                      assignedDate: new Date().toISOString().split('T')[0],
                      classId: '',
                      teacherId: '',
                      startTime: '09:00 AM',
                      endTime: '10:30 AM',
                    });
                    setShowModal(true);
                  }}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                >
                  Add Assignment
                </button>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <CalendarIcon className="text-white" size={18} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">
                              {assignment.title}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <BookOpen size={14} />
                              {getClassName(assignment.classId)}
                              <span className="mx-1">•</span>
                              <Clock size={14} />
                              {assignment.formattedTime}
                            </p>
                          </div>
                        </div>
                        
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {assignment.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Teacher</p>
                            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                              <User size={12} />
                              {assignment.teacherName}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Room</p>
                            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                              <MapPin size={12} />
                              {assignment.roomNumber || 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Status</p>
                            <button
                              onClick={() => handleMarkComplete(assignment.id, !assignment.isCompleted)}
                              className={`text-sm font-semibold flex items-center gap-1 ${
                                assignment.isCompleted ? 'text-green-600' : 'text-orange-500'
                              }`}
                            >
                              {assignment.isCompleted ? (
                                <>
                                  <CheckCircle size={14} />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <ClockIcon size={14} />
                                  Pending
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(assignment, 'assignment')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.id, 'assignment')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit' : 'Add'} Assignment
              </h2>
              <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher *</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value, classId: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} {teacher.assigned_class_id ? `(${getTeacherAssignedClass(teacher._id)})` : '(No Class Assigned)'}
                      </option>
                    ))}
                  </select>
                  {formData.teacherId && (
                    <p className="text-xs text-gray-500 mt-1">
                      👨‍🏫 Assigned Class: <span className="font-semibold">{getTeacherAssignedClass(formData.teacherId)}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    disabled={!formData.teacherId}
                  >
                    <option value="">
                      {formData.teacherId ? 'Select Class' : 'Select Teacher First'}
                    </option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} {cls.section || ''}
                      </option>
                    ))}
                  </select>
                  {formData.teacherId && classes.length === 0 && (
                    <p className="text-xs text-orange-500 mt-1">
                      ⚠️ No classes assigned to this teacher. Please assign a class to the teacher first.
                    </p>
                  )}
                  {formData.teacherId && classes.length > 0 && formData.classId && (
                    <p className="text-xs text-green-500 mt-1">
                      ✅ Class selected successfully
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter assignment title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.assignedDate}
                  onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                  <select
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  >
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                  <select
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  >
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter room number"
                />
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
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}