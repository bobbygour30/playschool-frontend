import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Calendar, Users, 
  Mail, Phone, BookOpen, Filter, Download, TrendingUp,
  UserPlus, Heart, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { getLeads, createLead, updateLead, deleteLead } from '../services/api';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    child_name: '',
    child_age: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    interested_class: '',
    source: 'Walk-in',
    status: 'New',
    notes: '',
    follow_up_date: '',
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await getLeads();
      setLeads(response.data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      alert('Failed to load leads. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        child_name: formData.child_name,
        child_age: parseInt(formData.child_age),
        parent_name: formData.parent_name,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
        interested_class: formData.interested_class,
        source: formData.source,
        status: formData.status,
        notes: formData.notes || '',
        follow_up_date: formData.follow_up_date || null,
      };

      if (editingLead) {
        await updateLead(editingLead._id, data);
        alert('Lead updated successfully!');
      } else {
        await createLead(data);
        alert('Lead added successfully!');
      }

      await loadLeads();
      resetForm();
    } catch (error) {
      console.error('Error saving lead:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save lead. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead(id);
        await loadLeads();
        alert('Lead deleted successfully!');
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Failed to delete lead. Please try again.');
      }
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      child_name: lead.child_name || '',
      child_age: lead.child_age ? lead.child_age.toString() : '',
      parent_name: lead.parent_name || '',
      parent_email: lead.parent_email || '',
      parent_phone: lead.parent_phone || '',
      interested_class: lead.interested_class || '',
      source: lead.source || 'Walk-in',
      status: lead.status || 'New',
      notes: lead.notes || '',
      follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      child_name: '',
      child_age: '',
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      interested_class: '',
      source: 'Walk-in',
      status: 'New',
      notes: '',
      follow_up_date: '',
    });
    setEditingLead(null);
    setShowModal(false);
  };

  const getFilteredLeads = () => {
    let filtered = leads;
    
    if (searchTerm) {
      filtered = filtered.filter((lead) =>
        lead.child_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.parent_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }
    
    return filtered;
  };

  const filteredLeads = getFilteredLeads();

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <AlertCircle size={12} />, gradient: 'from-blue-500 to-blue-600' };
      case 'Contacted':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Phone size={12} />, gradient: 'from-yellow-500 to-orange-500' };
      case 'Converted':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} />, gradient: 'from-green-500 to-emerald-500' };
      case 'Lost':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={12} />, gradient: 'from-red-500 to-pink-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null, gradient: 'from-gray-500 to-gray-600' };
    }
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    lost: leads.filter(l => l.status === 'Lost').length,
    conversionRate: leads.length ? ((leads.filter(l => l.status === 'Converted').length / leads.length) * 100).toFixed(1) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-orange-200 to-red-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Lead Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Heart size={18} className="text-orange-500" />
                Track inquiries and nurture potential enrollments
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <UserPlus size={20} />
                <span className="font-semibold">Add New Lead</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Total Leads</h3>
            <p className="text-gray-600 text-sm">All inquiries</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-white" size={20} />
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.new}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">New Leads</h3>
            <p className="text-gray-600 text-sm">Awaiting contact</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Phone className="text-white" size={20} />
              </div>
              <span className="text-2xl font-bold text-orange-600">{stats.contacted}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Contacted</h3>
            <p className="text-gray-600 text-sm">In progress</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={20} />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.converted}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Converted</h3>
            <p className="text-gray-600 text-sm">Enrolled</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={20} />
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Conversion Rate</h3>
            <p className="text-gray-600 text-sm">Success rate</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by child name, parent name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Sources</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:shadow-md transition-all">
                <Download size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Leads Cards Grid (Mobile/Tablet) */}
        <div className="lg:hidden space-y-4">
          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Heart className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 text-lg">No leads found</p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const statusStyle = getStatusColor(lead.status);
              return (
                <div key={lead._id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                        <Users className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{lead.child_name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock size={12} />
                          <span>{lead.child_age} years old</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} text-xs font-semibold flex items-center gap-1`}>
                      {statusStyle.icon}
                      <span>{lead.status}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={14} className="text-gray-400" />
                      <span className="font-medium">Parent:</span>
                      <span>{lead.parent_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      <span>{lead.parent_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      <span>{lead.parent_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen size={14} className="text-gray-400" />
                      <span>Interested: <span className="font-medium">{lead.interested_class}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp size={14} className="text-gray-400" />
                      <span>Source: {lead.source}</span>
                    </div>
                    {lead.follow_up_date && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Calendar size={14} />
                        <span>Follow-up: {new Date(lead.follow_up_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {lead.notes && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{lead.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(lead)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lead._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Leads Table (Desktop) */}
        <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-red-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Child Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent Information</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interested Class</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Follow Up</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Heart className="mx-auto mb-3 text-gray-400" size={48} />
                      <p className="text-lg">No leads found</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => {
                    const statusStyle = getStatusColor(lead.status);
                    return (
                      <tr key={lead._id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-300 group">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{lead.child_name}</div>
                            <div className="text-sm text-gray-500">{lead.child_age} years old</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{lead.parent_name}</div>
                          <div className="text-sm text-gray-500">{lead.parent_email}</div>
                          <div className="text-sm text-gray-500">{lead.parent_phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                            {lead.interested_class}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{lead.source}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.icon}
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {lead.follow_up_date ? (
                            <div className="flex items-center gap-1 text-sm text-orange-600">
                              <Calendar size={14} />
                              {new Date(lead.follow_up_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(lead)}
                            className="text-blue-600 hover:text-blue-800 mr-3 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(lead._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingLead ? 'Edit Lead' : 'Add New Lead'}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.child_name}
                      onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child Age *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="18"
                      value={formData.child_age}
                      onChange={(e) => setFormData({ ...formData, child_age: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Jane Doe"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="jane@example.com"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="+1 234 567 890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interested Class *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 1st Standard, Nursery"
                      value={formData.interested_class}
                      onChange={(e) => setFormData({ ...formData, interested_class: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source *</label>
                    <select
                      required
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="Walk-in">Walk-in</option>
                      <option value="Website">Website</option>
                      <option value="Referral">Referral</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Advertisement">Advertisement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Additional information about the lead..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
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
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingLead ? 'Update Lead' : 'Add Lead'}
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