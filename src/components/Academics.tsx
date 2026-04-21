import { useEffect, useState } from 'react';
import { 
  BookOpen, Calendar, Award, Star, Users, Plus, Search, Edit, 
  Trash2, X, Filter, Download, TrendingUp, Clock, CheckCircle,
  FileText, Upload, Eye, ChevronDown, ChevronRight, Activity,
  Trophy, Gift, Music, PenTool, Book, GraduationCap, Heart,
  Folder, FolderOpen, Image, File, Pdf, DownloadCloud
} from 'lucide-react';
import { 
  getAcademicClasses, 
  getAssessmentsByClass, getEventsByClass, getCulminationsByClass,
  createAssessment, updateAssessment, deleteAssessment,
  createEvent, updateEvent, deleteEvent,
  createCulmination, updateCulmination, deleteCulmination,
  uploadAcademicDocument, deleteAcademicDocument, getDocumentsByClassAndMonth,
  getAcademicStats
} from '../services/api';

// Class definitions
const CLASSES = [
  { id: 'toddler', name: 'Toddler', ageGroup: '1.5 - 2.5 years', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { id: 'pre-nursery', name: 'Pre-Nursery', ageGroup: '2.5 - 3.5 years', icon: Star, color: 'from-blue-500 to-cyan-500' },
  { id: 'nursery', name: 'Nursery', ageGroup: '3.5 - 4.5 years', icon: Book, color: 'from-green-500 to-emerald-500' },
  { id: 'kg-1', name: 'KG-1', ageGroup: '4.5 - 5.5 years', icon: GraduationCap, color: 'from-purple-500 to-pink-500' },
];

// Months definition
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Academics() {
  const [selectedClass, setSelectedClass] = useState('toddler');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [expandedSections, setExpandedSections] = useState({
    assessments: true,
    events: true,
    culmination: true,
    documents: true
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Data states
  const [assessments, setAssessments] = useState([]);
  const [events, setEvents] = useState([]);
  const [culminations, setCulminations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    completedAssessments: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalDocuments: 0,
    averageScore: 0
  });
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    subject: '',
    marks: '',
    type: '',
    status: 'upcoming',
    report: '',
    attachments: null
  });
  
  const [documentFormData, setDocumentFormData] = useState({
    title: '',
    description: '',
    file: null,
    fileType: '',
    fileName: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load assessments, events, culminations for the selected class
      const [assessmentsRes, eventsRes, culminationsRes, documentsRes, statsRes] = await Promise.all([
        getAssessmentsByClass(selectedClass),
        getEventsByClass(selectedClass),
        getCulminationsByClass(selectedClass),
        getDocumentsByClassAndMonth(selectedClass, selectedMonth),
        getAcademicStats()
      ]);
      
      setAssessments(assessmentsRes.data || []);
      setEvents(eventsRes.data || []);
      setCulminations(culminationsRes.data || []);
      setDocuments(documentsRes.data || []);
      
      // Update stats
      const classStats = statsRes.data?.[selectedClass] || {};
      setStats({
        totalAssessments: classStats.totalAssessments || 0,
        completedAssessments: classStats.completedAssessments || 0,
        totalEvents: classStats.totalEvents || 0,
        upcomingEvents: classStats.upcomingEvents || 0,
        totalDocuments: classStats.totalDocuments || 0,
        averageScore: 0 // Calculate from assessments
      });
      
    } catch (error) {
      console.error('Error loading academic data:', error);
      alert('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentFormData({
          ...documentFormData,
          file: reader.result,
          fileName: file.name,
          fileType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    try {
      const documentData = {
        class_id: selectedClass,
        month: selectedMonth,
        title: documentFormData.title,
        description: documentFormData.description,
        file: documentFormData.file,
        file_name: documentFormData.fileName,
        file_type: documentFormData.fileType,
      };
      
      await uploadAcademicDocument(documentData);
      alert('Document uploaded successfully!');
      setShowDocumentModal(false);
      setDocumentFormData({
        title: '',
        description: '',
        file: null,
        fileType: '',
        fileName: ''
      });
      loadData(); // Reload documents
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteAcademicDocument(docId);
        alert('Document deleted successfully!');
        loadData(); // Reload documents
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleViewDocument = (doc) => {
    window.open(doc.file_url, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        class_id: selectedClass,
        title: formData.title,
        date: formData.date,
        description: formData.description,
        status: formData.status,
        ...(modalType === 'assessment' && {
          subject: formData.subject,
          marks: formData.marks || 'Pending'
        }),
        ...(modalType === 'event' && {
          type: formData.type
        }),
        ...(modalType === 'culmination' && {
          report: formData.report || ''
        })
      };

      if (editingItem) {
        if (modalType === 'assessment') {
          await updateAssessment(editingItem._id, itemData);
        } else if (modalType === 'event') {
          await updateEvent(editingItem._id, itemData);
        } else if (modalType === 'culmination') {
          await updateCulmination(editingItem._id, itemData);
        }
        alert(`${modalType} updated successfully!`);
      } else {
        if (modalType === 'assessment') {
          await createAssessment(itemData);
        } else if (modalType === 'event') {
          await createEvent(itemData);
        } else if (modalType === 'culmination') {
          await createCulmination(itemData);
        }
        alert(`${modalType} added successfully!`);
      }
      
      loadData(); // Reload data
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDelete = async (itemId, section) => {
    if (confirm(`Are you sure you want to delete this ${section.slice(0, -1)}?`)) {
      try {
        if (section === 'assessments') {
          await deleteAssessment(itemId);
        } else if (section === 'events') {
          await deleteEvent(itemId);
        } else if (section === 'culmination') {
          await deleteCulmination(itemId);
        }
        alert(`${section.slice(0, -1)} deleted successfully!`);
        loadData(); // Reload data
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  const handleEdit = (item, section) => {
    setEditingItem(item);
    setModalType(section === 'assessments' ? 'assessment' : section === 'events' ? 'event' : 'culmination');
    setFormData({
      title: item.title || '',
      date: item.date ? item.date.split('T')[0] : '',
      description: item.description || '',
      subject: item.subject || '',
      marks: item.marks || '',
      type: item.type || '',
      status: item.status || 'upcoming',
      report: item.report || '',
      attachments: null
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      description: '',
      subject: '',
      marks: '',
      type: '',
      status: 'upcoming',
      report: '',
      attachments: null
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} />, label: 'Completed' };
    } else if (status === 'upcoming') {
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={12} />, label: 'Upcoming' };
    } else {
      return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null, label: status };
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    if (fileType?.includes('image')) return <Image size={16} className="text-blue-500" />;
    if (fileType?.includes('zip')) return <Folder size={16} className="text-yellow-500" />;
    return <File size={16} className="text-gray-500" />;
  };

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
                Academics
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <BookOpen size={18} className="text-green-500" />
                Manage class-wise assessments, events, documents, and culmination activities
              </p>
            </div>
          </div>
        </div>

        {/* Class Selection Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {CLASSES.map((cls) => {
            const Icon = cls.icon;
            const isSelected = selectedClass === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`group relative p-4 rounded-2xl transition-all duration-300 ${
                  isSelected
                    ? `bg-gradient-to-r ${cls.color} text-white shadow-xl scale-105`
                    : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={isSelected ? 'text-white' : `text-${cls.color.split(' ')[1].replace('to-', '')}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{cls.name}</p>
                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{cls.ageGroup}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-600" size={20} />
              </div>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalAssessments}</p>
            <p className="text-sm text-gray-600">Total Assessments</p>
            <p className="text-xs text-gray-500 mt-1">{stats.completedAssessments} completed</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-purple-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.totalEvents}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">Events</p>
            <p className="text-sm text-gray-600">{stats.upcomingEvents} upcoming</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Award className="text-green-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.averageScore}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">Avg. Score</p>
            <p className="text-sm text-gray-600">Overall performance</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="text-orange-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-orange-600">{culminations.length}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">Culminations</p>
            <p className="text-sm text-gray-600">Term completions</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Folder className="text-cyan-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-cyan-600">{stats.totalDocuments}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">Documents</p>
            <p className="text-sm text-gray-600">Uploaded files</p>
          </div>
        </div>

        {/* Month Selection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(index)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedMonth === index
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('documents')}
            className="w-full px-6 py-4 bg-gradient-to-r from-cyan-50 to-blue-50 flex items-center justify-between hover:bg-gradient-to-r hover:from-cyan-100 hover:to-blue-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Folder className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Documents - {MONTHS[selectedMonth]}
                </h2>
                <p className="text-sm text-gray-600">Upload and manage class documents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDocumentModal(true);
                }}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
              >
                <Upload size={14} />
                Upload Document
              </button>
              {expandedSections.documents ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </button>

          {expandedSections.documents && (
            <div className="p-6">
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No documents uploaded for {MONTHS[selectedMonth]}</p>
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all flex items-center gap-2 mx-auto"
                  >
                    <Upload size={16} />
                    Upload First Document
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{doc.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{doc.file_name}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Document"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Monthly Assessments Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('assessments')}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Monthly Assessments</h2>
                <p className="text-sm text-gray-600">Track student progress and performance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalType('assessment');
                  setEditingItem(null);
                  setShowModal(true);
                }}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
              >
                <Plus size={14} />
                Add Assessment
              </button>
              {expandedSections.assessments ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </button>

          {expandedSections.assessments && (
            <div className="p-6">
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No assessments added yet</p>
                  <button
                    onClick={() => {
                      setModalType('assessment');
                      setShowModal(true);
                    }}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add First Assessment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => {
                    const statusBadge = getStatusBadge(assessment.status);
                    return (
                      <div key={assessment._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-800">{assessment.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text}`}>
                                {statusBadge.icon}
                                {statusBadge.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{assessment.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Calendar size={14} />
                                {new Date(assessment.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <BookOpen size={14} />
                                {assessment.subject}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Award size={14} />
                                Score: {assessment.marks}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(assessment, 'assessments')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(assessment._id, 'assessments')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Events & Celebrations Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('events')}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Calendar className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Events & Celebrations</h2>
                <p className="text-sm text-gray-600">School events, festivals, and special celebrations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalType('event');
                  setEditingItem(null);
                  setShowModal(true);
                }}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
              >
                <Plus size={14} />
                Add Event
              </button>
              {expandedSections.events ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </button>

          {expandedSections.events && (
            <div className="p-6">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No events scheduled yet</p>
                  <button
                    onClick={() => {
                      setModalType('event');
                      setShowModal(true);
                    }}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Schedule First Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => {
                    const statusBadge = getStatusBadge(event.status);
                    const eventIcons = {
                      celebration: <Gift size={14} />,
                      event: <Music size={14} />,
                      meeting: <Users size={14} />,
                      ceremony: <Trophy size={14} />
                    };
                    return (
                      <div key={event._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              {eventIcons[event.type] || <Star size={14} className="text-purple-600" />}
                            </div>
                            <h3 className="font-semibold text-gray-800">{event.title}</h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(event, 'events')}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(event._id, 'events')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar size={12} />
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Culmination Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('culmination')}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Trophy className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Culmination Activities</h2>
                <p className="text-sm text-gray-600">Final activities, reports, and term completions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalType('culmination');
                  setEditingItem(null);
                  setShowModal(true);
                }}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
              >
                <Plus size={14} />
                Add Culmination
              </button>
              {expandedSections.culmination ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </button>

          {expandedSections.culmination && (
            <div className="p-6">
              {culminations.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No culmination activities added</p>
                  <button
                    onClick={() => {
                      setModalType('culmination');
                      setShowModal(true);
                    }}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add First Culmination
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {culminations.map((culmination) => {
                    const statusBadge = getStatusBadge(culmination.status);
                    return (
                      <div key={culmination._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-800">{culmination.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.bg} ${statusBadge.text}`}>
                                {statusBadge.icon}
                                {statusBadge.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{culmination.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Calendar size={14} />
                                {new Date(culmination.date).toLocaleDateString()}
                              </span>
                              {culmination.report && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <FileText size={14} />
                                  Report: {culmination.report}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(culmination, 'culmination')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(culmination._id, 'culmination')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document Upload Modal */}
        {showDocumentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Upload Document - {MONTHS[selectedMonth]}
                </h2>
                <button onClick={() => setShowDocumentModal(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleDocumentSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentFormData.title}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter document title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={documentFormData.description}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter document description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip"
                      onChange={handleFileUpload}
                      className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG, DOC, ZIP (Max 10MB)</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDocumentModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Upload Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Assessments/Events/Culminations */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className={`sticky top-0 bg-gradient-to-r ${
                modalType === 'assessment' ? 'from-blue-500 to-indigo-600' :
                modalType === 'event' ? 'from-purple-500 to-pink-600' :
                'from-green-500 to-emerald-600'
              } px-6 py-4 flex items-center justify-between`}>
                <h2 className="text-xl font-bold text-white">
                  {editingItem ? `Edit ${modalType}` : `Add New ${modalType}`}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`Enter ${modalType} title`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {modalType === 'assessment' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Mathematics, English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marks / Score
                      </label>
                      <input
                        type="text"
                        value={formData.marks}
                        onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 25/30 or Pending"
                      />
                    </div>
                  </>
                )}

                {modalType === 'event' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="celebration">Celebration</option>
                      <option value="event">Event</option>
                      <option value="meeting">Meeting</option>
                      <option value="ceremony">Ceremony</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Detailed description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {modalType === 'culmination' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report / Outcome
                    </label>
                    <textarea
                      value={formData.report}
                      onChange={(e) => setFormData({ ...formData, report: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Summary of outcomes, achievements, etc."
                    />
                  </div>
                )}

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
                    className={`px-6 py-2 bg-gradient-to-r ${
                      modalType === 'assessment' ? 'from-blue-500 to-indigo-600' :
                      modalType === 'event' ? 'from-purple-500 to-pink-600' :
                      'from-green-500 to-emerald-600'
                    } text-white rounded-xl hover:shadow-lg transition-all`}
                  >
                    {editingItem ? 'Update' : 'Add'} {modalType}
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