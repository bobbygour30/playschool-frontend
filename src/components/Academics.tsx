import { useEffect, useState } from 'react';
import { 
  BookOpen, Calendar, Award, Star, Users, Plus, Search, Edit, 
  Trash2, X, Filter, Download, TrendingUp, Clock, CheckCircle,
  FileText, Upload, Eye, ChevronDown, ChevronRight, Activity,
  Trophy, Gift, Music, PenTool, Book, GraduationCap, Heart
} from 'lucide-react';
import { getClasses, getStudents, getFaculty } from '../services/api';

// Class definitions
const CLASSES = [
  { id: 'toddler', name: 'Toddler', ageGroup: '1.5 - 2.5 years', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { id: 'pre-nursery', name: 'Pre-Nursery', ageGroup: '2.5 - 3.5 years', icon: Star, color: 'from-blue-500 to-cyan-500' },
  { id: 'nursery', name: 'Nursery', ageGroup: '3.5 - 4.5 years', icon: Book, color: 'from-green-500 to-emerald-500' },
  { id: 'kg-1', name: 'KG-1', ageGroup: '4.5 - 5.5 years', icon: GraduationCap, color: 'from-purple-500 to-pink-500' },
];

export default function     () {
  const [selectedClass, setSelectedClass] = useState('toddler');
  const [expandedSections, setExpandedSections] = useState({
    assessments: true,
    events: true,
    culmination: true
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'assessment', 'event', 'culmination'
  const [editingItem, setEditingItem] = useState(null);
  const [classData, setClassData] = useState({
    toddler: {
      assessments: [],
      events: [],
      culmination: []
    },
    'pre-nursery': {
      assessments: [],
      events: [],
      culmination: []
    },
    nursery: {
      assessments: [],
      events: [],
      culmination: []
    },
    'kg-1': {
      assessments: [],
      events: [],
      culmination: []
    }
  });
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    subject: '',
    marks: '',
    type: '',
    status: 'upcoming',
    attachments: null
  });

  useEffect(() => {
    loadAcademicData();
  }, []);

  const loadAcademicData = async () => {
    try {
      setLoading(true);
      // In a real app, fetch from API
      // For now, using mock data
      const mockData = {
        toddler: {
          assessments: [
            { id: '1', title: 'Monthly Assessment - January', date: '2024-01-15', subject: 'General Knowledge', marks: '25/30', status: 'completed', description: 'Basic shapes, colors, and animals recognition' },
            { id: '2', title: 'Monthly Assessment - February', date: '2024-02-15', subject: 'Language Skills', marks: '28/30', status: 'completed', description: 'Alphabet recognition and basic words' },
            { id: '3', title: 'Monthly Assessment - March', date: '2024-03-15', subject: 'Motor Skills', marks: 'Pending', status: 'upcoming', description: 'Fine motor skills assessment' }
          ],
          events: [
            { id: '1', title: 'Color Day Celebration', date: '2024-01-20', type: 'celebration', status: 'completed', description: 'Students dressed in favorite colors' },
            { id: '2', title: 'Annual Day', date: '2024-02-10', type: 'event', status: 'completed', description: 'Annual cultural program' },
            { id: '3', title: 'Spring Festival', date: '2024-03-25', type: 'celebration', status: 'upcoming', description: 'Welcome spring with flowers' }
          ],
          culmination: [
            { id: '1', title: 'First Term Culmination', date: '2024-02-28', status: 'completed', description: 'Term 1 final activities and reports', report: 'Excellent progress in all areas' },
            { id: '2', title: 'Second Term Culmination', date: '2024-04-15', status: 'upcoming', description: 'Term 2 final assessment and parent meeting', report: 'Pending' }
          ]
        },
        'pre-nursery': {
          assessments: [
            { id: '1', title: 'Monthly Assessment - January', date: '2024-01-15', subject: 'Cognitive Skills', marks: '32/40', status: 'completed', description: 'Pattern recognition and matching' },
            { id: '2', title: 'Monthly Assessment - February', date: '2024-02-15', subject: 'Language & Literacy', marks: '35/40', status: 'completed', description: 'Letter sounds and simple words' }
          ],
          events: [
            { id: '1', title: 'Fancy Dress Competition', date: '2024-01-25', type: 'event', status: 'completed', description: 'Community helpers theme' },
            { id: '2', title: 'Parent-Teacher Meet', date: '2024-03-05', type: 'meeting', status: 'upcoming', description: 'Progress discussion' }
          ],
          culmination: [
            { id: '1', title: 'Mid-Year Culmination', date: '2024-02-20', status: 'completed', description: 'Half-yearly progress review', report: 'Students showing good progress' }
          ]
        },
        nursery: {
          assessments: [
            { id: '1', title: 'Monthly Assessment - January', date: '2024-01-15', subject: 'Mathematics', marks: '42/50', status: 'completed', description: 'Numbers 1-20 and basic addition' },
            { id: '2', title: 'Monthly Assessment - February', date: '2024-02-15', subject: 'English', marks: '45/50', status: 'completed', description: 'Reading simple sentences' }
          ],
          events: [
            { id: '1', title: 'Science Exhibition', date: '2024-02-05', type: 'event', status: 'completed', description: 'Simple science projects' },
            { id: '2', title: 'Sports Day', date: '2024-03-10', type: 'event', status: 'upcoming', description: 'Annual sports meet' }
          ],
          culmination: [
            { id: '1', title: 'Term 1 Culmination', date: '2024-02-25', status: 'completed', description: 'Term ending activities', report: 'Achieved learning milestones' }
          ]
        },
        'kg-1': {
          assessments: [
            { id: '1', title: 'Monthly Assessment - January', date: '2024-01-15', subject: 'All Subjects', marks: '85/100', status: 'completed', description: 'Comprehensive monthly test' }
          ],
          events: [
            { id: '1', title: 'Art & Craft Exhibition', date: '2024-02-15', type: 'event', status: 'completed', description: 'Student artwork display' },
            { id: '2', title: 'Graduation Ceremony', date: '2024-03-30', type: 'ceremony', status: 'upcoming', description: 'Moving to Grade 1' }
          ],
          culmination: [
            { id: '1', title: 'Final Culmination', date: '2024-03-28', status: 'upcoming', description: 'End of year culmination', report: 'Ready for Grade 1' }
          ]
        }
      };
      setClassData(mockData);
    } catch (error) {
      console.error('Error loading academic data:', error);
      alert('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newItem = {
        id: editingItem?.id || Date.now().toString(),
        title: formData.title,
        date: formData.date,
        description: formData.description,
        status: formData.status,
        ...(modalType === 'assessment' && {
          subject: formData.subject,
          marks: formData.marks
        }),
        ...(modalType === 'event' && {
          type: formData.type
        }),
        ...(modalType === 'culmination' && {
          report: formData.report || ''
        })
      };

      if (editingItem) {
        // Update existing item
        setClassData(prev => ({
          ...prev,
          [selectedClass]: {
            ...prev[selectedClass],
            [modalType === 'assessment' ? 'assessments' : modalType === 'event' ? 'events' : 'culmination']: 
              prev[selectedClass][modalType === 'assessment' ? 'assessments' : modalType === 'event' ? 'events' : 'culmination'].map(item =>
                item.id === editingItem.id ? newItem : item
              )
          }
        }));
        alert(`${modalType} updated successfully!`);
      } else {
        // Add new item
        setClassData(prev => ({
          ...prev,
          [selectedClass]: {
            ...prev[selectedClass],
            [modalType === 'assessment' ? 'assessments' : modalType === 'event' ? 'events' : 'culmination']: [
              ...prev[selectedClass][modalType === 'assessment' ? 'assessments' : modalType === 'event' ? 'events' : 'culmination'],
              newItem
            ]
          }
        }));
        alert(`${modalType} added successfully!`);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDelete = (itemId, section) => {
    if (confirm(`Are you sure you want to delete this ${section.slice(0, -1)}?`)) {
      setClassData(prev => ({
        ...prev,
        [selectedClass]: {
          ...prev[selectedClass],
          [section]: prev[selectedClass][section].filter(item => item.id !== itemId)
        }
      }));
      alert(`${section.slice(0, -1)} deleted successfully!`);
    }
  };

  const handleEdit = (item, section) => {
    setEditingItem(item);
    setModalType(section === 'assessments' ? 'assessment' : section === 'events' ? 'event' : 'culmination');
    setFormData({
      title: item.title || '',
      date: item.date || '',
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

  const currentClass = CLASSES.find(c => c.id === selectedClass);
  const currentClassData = classData[selectedClass];

  // Calculate statistics
  const stats = {
    totalAssessments: currentClassData?.assessments.length || 0,
    completedAssessments: currentClassData?.assessments.filter(a => a.status === 'completed').length || 0,
    totalEvents: currentClassData?.events.length || 0,
    upcomingEvents: currentClassData?.events.filter(e => e.status === 'upcoming').length || 0,
    averageScore: currentClassData?.assessments
      .filter(a => a.marks && !a.marks.includes('Pending'))
      .reduce((sum, a) => {
        const score = parseInt(a.marks.split('/')[0]);
        return sum + score;
      }, 0) / (currentClassData?.assessments.filter(a => a.marks && !a.marks.includes('Pending')).length || 1) || 0
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
                Manage class-wise assessments, events, and culmination activities
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              <span className="text-2xl font-bold text-orange-600">{currentClassData?.culmination.length || 0}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">Culminations</p>
            <p className="text-sm text-gray-600">Term completions</p>
          </div>
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
              {currentClassData?.assessments.length === 0 ? (
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
                  {currentClassData.assessments.map((assessment) => {
                    const statusBadge = getStatusBadge(assessment.status);
                    return (
                      <div key={assessment.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
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
                              onClick={() => handleDelete(assessment.id, 'assessments')}
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
              {currentClassData?.events.length === 0 ? (
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
                  {currentClassData.events.map((event) => {
                    const statusBadge = getStatusBadge(event.status);
                    const eventIcons = {
                      celebration: <Gift size={14} />,
                      event: <Music size={14} />,
                      meeting: <Users size={14} />,
                      ceremony: <Trophy size={14} />
                    };
                    return (
                      <div key={event.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
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
                              onClick={() => handleDelete(event.id, 'events')}
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
              {currentClassData?.culmination.length === 0 ? (
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
                  {currentClassData.culmination.map((culmination) => {
                    const statusBadge = getStatusBadge(culmination.status);
                    return (
                      <div key={culmination.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
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
                              onClick={() => handleDelete(culmination.id, 'culmination')}
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

        {/* Modal for Add/Edit */}
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