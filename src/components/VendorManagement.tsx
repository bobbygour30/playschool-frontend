import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Truck, MapPin, 
  Phone, User, FileText, Filter, Download, TrendingUp,
  AlertCircle, CheckCircle, Clock, Car, Navigation, 
  Building, CreditCard, Shield, Upload, Eye, FolderOpen,
  FileCheck, Calendar, Bus
} from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../services/api';

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showDocs, setShowDocs] = useState(null);
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type: 'Bus',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    driving_license: '',
    vehicle_number: '',
    vehicle_type: 'Bus',
    route_details: '',
    police_verification: '',
    gst_number: '',
    pan_number: '',
    contract_start_date: new Date().toISOString().split('T')[0],
    contract_end_date: '',
    payment_terms: '',
    status: 'Active',
    // Documents
    license_doc: null,
    police_verification_doc: null,
    vehicle_registration_doc: null,
    insurance_doc: null,
    gst_doc: null,
    pan_doc: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const vendorsRes = await getVendors();
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      alert('Failed to load vendor data. Please check your connection.');
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
      const data = {
        vendor_name: formData.vendor_name,
        vendor_type: formData.vendor_type,
        address: formData.address,
        contact_person: formData.contact_person,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        driving_license: formData.driving_license,
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        route_details: formData.route_details,
        police_verification: formData.police_verification,
        gst_number: formData.gst_number,
        pan_number: formData.pan_number,
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        payment_terms: formData.payment_terms,
        status: formData.status,
        documents: {
          license_doc: formData.license_doc,
          police_verification_doc: formData.police_verification_doc,
          vehicle_registration_doc: formData.vehicle_registration_doc,
          insurance_doc: formData.insurance_doc,
          gst_doc: formData.gst_doc,
          pan_doc: formData.pan_doc,
        }
      };

      if (editingVendor) {
        await updateVendor(editingVendor._id, data);
        alert('Vendor updated successfully!');
      } else {
        await createVendor(data);
        alert('Vendor added successfully!');
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving vendor:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save vendor. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        await deleteVendor(id);
        await loadData();
        alert('Vendor deleted successfully!');
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Failed to delete vendor. Please try again.');
      }
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name || '',
      vendor_type: vendor.vendor_type || 'Bus',
      address: vendor.address || '',
      contact_person: vendor.contact_person || '',
      contact_phone: vendor.contact_phone || '',
      contact_email: vendor.contact_email || '',
      driving_license: vendor.driving_license || '',
      vehicle_number: vendor.vehicle_number || '',
      vehicle_type: vendor.vehicle_type || 'Bus',
      route_details: vendor.route_details || '',
      police_verification: vendor.police_verification || '',
      gst_number: vendor.gst_number || '',
      pan_number: vendor.pan_number || '',
      contract_start_date: vendor.contract_start_date ? vendor.contract_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      contract_end_date: vendor.contract_end_date ? vendor.contract_end_date.split('T')[0] : '',
      payment_terms: vendor.payment_terms || '',
      status: vendor.status || 'Active',
      license_doc: vendor.documents?.license_doc || null,
      police_verification_doc: vendor.documents?.police_verification_doc || null,
      vehicle_registration_doc: vendor.documents?.vehicle_registration_doc || null,
      insurance_doc: vendor.documents?.insurance_doc || null,
      gst_doc: vendor.documents?.gst_doc || null,
      pan_doc: vendor.documents?.pan_doc || null,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      vendor_type: 'Bus',
      address: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      driving_license: '',
      vehicle_number: '',
      vehicle_type: 'Bus',
      route_details: '',
      police_verification: '',
      gst_number: '',
      pan_number: '',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: '',
      payment_terms: '',
      status: 'Active',
      license_doc: null,
      police_verification_doc: null,
      vehicle_registration_doc: null,
      insurance_doc: null,
      gst_doc: null,
      pan_doc: null,
    });
    setEditingVendor(null);
    setShowModal(false);
    setShowDocs(null);
  };

  const getFilteredVendors = () => {
    let filtered = vendors;
    
    if (searchTerm) {
      filtered = filtered.filter((vendor) =>
        vendor.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contact_phone?.includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((vendor) => vendor.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter((vendor) => vendor.vendor_type === typeFilter);
    }
    
    return filtered;
  };

  const filteredVendors = getFilteredVendors();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} />, gradient: 'from-green-500 to-emerald-500' };
      case 'Inactive':
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle size={12} />, gradient: 'from-gray-500 to-gray-600' };
      case 'Pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={12} />, gradient: 'from-yellow-500 to-orange-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle size={12} />, gradient: 'from-gray-500 to-gray-600' };
    }
  };

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'Active').length,
    inactive: vendors.filter(v => v.status === 'Inactive').length,
    pending: vendors.filter(v => v.status === 'Pending').length,
    busVendors: vendors.filter(v => v.vendor_type === 'Bus').length,
    vanVendors: vendors.filter(v => v.vendor_type === 'Van').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-orange-200 to-amber-200 rounded-2xl"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Vendor Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Truck size={18} className="text-orange-500" />
                Manage transport vendors, contracts, and documentation
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <Plus size={20} />
                <span className="font-semibold">Add New Vendor</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Truck className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <p className="text-xs text-gray-600">Total Vendors</p>
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

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-gray-600">{stats.inactive}</span>
            </div>
            <p className="text-xs text-gray-600">Inactive</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-orange-600">{stats.pending}</span>
            </div>
            <p className="text-xs text-gray-600">Pending</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Bus className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-blue-600">{stats.busVendors}</span>
            </div>
            <p className="text-xs text-gray-600">Bus Vendors</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Car className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-purple-600">{stats.vanVendors}</span>
            </div>
            <p className="text-xs text-gray-600">Van Vendors</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by vendor name, contact person, vehicle number, or phone..."
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Bus">Bus Vendors</option>
                  <option value="Van">Van Vendors</option>
                </select>
              </div>
              <button className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:shadow-md transition-all">
                <Download size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Truck className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No vendors found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Add Your First Vendor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => {
              const statusStyle = getStatusColor(vendor.status);
              const hasDocuments = vendor.documents && Object.values(vendor.documents).some(doc => doc);
              
              return (
                <div
                  key={vendor._id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:scale-105"
                >
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${statusStyle.gradient} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Truck className="text-white" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{vendor.vendor_name}</h3>
                          <p className="text-xs text-white/80">{vendor.vendor_type} Vendor</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} text-xs font-semibold flex items-center gap-1`}>
                        {statusStyle.icon}
                        <span>{vendor.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={14} className="text-orange-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Person</span>
                      </div>
                      <p className="font-semibold text-gray-900">{vendor.contact_person}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone size={12} />
                          {vendor.contact_phone}
                        </p>
                        {vendor.contact_email && (
                          <p className="text-sm text-gray-600">{vendor.contact_email}</p>
                        )}
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Car size={14} className="text-orange-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Vehicle Number</p>
                          <p className="text-sm font-medium text-gray-900">{vendor.vehicle_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Vehicle Type</p>
                          <p className="text-sm font-medium text-gray-900">{vendor.vehicle_type}</p>
                        </div>
                      </div>
                    </div>

                    {/* Route & Contract */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation size={14} className="text-orange-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Route & Contract</span>
                      </div>
                      <p className="text-sm text-gray-700 flex items-start gap-1">
                        <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{vendor.route_details}</span>
                      </p>
                      {vendor.contract_end_date && (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <Calendar size={10} className="text-gray-400" />
                          <span className="text-gray-500">Contract until: {new Date(vendor.contract_end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Documents Indicator */}
                    {hasDocuments && (
                      <div className="flex items-center gap-2 pt-2">
                        <FolderOpen size={14} className="text-green-600" />
                        <span className="text-xs text-gray-600">Documents uploaded</span>
                        <button 
                          onClick={() => setShowDocs(showDocs === vendor._id ? null : vendor._id)}
                          className="ml-auto text-orange-600 hover:text-orange-700"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    )}

                    {/* Documents Preview */}
                    {showDocs === vendor._id && vendor.documents && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Uploaded Documents:</p>
                        {vendor.documents.license_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><FileCheck size={10} /> Driving License</div>}
                        {vendor.documents.police_verification_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><Shield size={10} /> Police Verification</div>}
                        {vendor.documents.vehicle_registration_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><FileText size={10} /> Vehicle Registration</div>}
                        {vendor.documents.insurance_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><FileCheck size={10} /> Insurance Document</div>}
                        {vendor.documents.gst_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><Building size={10} /> GST Certificate</div>}
                        {vendor.documents.pan_doc && <div className="flex items-center gap-1 text-xs text-gray-600"><FileText size={10} /> PAN Card</div>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor._id)}
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

        {/* Add/Edit Vendor Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building size={18} className="text-orange-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.vendor_name}
                        onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter vendor/company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor Type *
                      </label>
                      <select
                        required
                        value={formData.vendor_type}
                        onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="Bus">Bus Vendor</option>
                        <option value="Van">Van Vendor</option>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Full address"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Phone size={18} className="text-orange-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Name of contact person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driving License Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.driving_license}
                        onChange={(e) => setFormData({ ...formData, driving_license: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="DL Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Car size={18} className="text-orange-600" />
                    Vehicle Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.vehicle_number}
                        onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., ABC-1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Type *
                      </label>
                      <select
                        required
                        value={formData.vehicle_type}
                        onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="Bus">Bus</option>
                        <option value="Van">Van</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Route Details *
                      </label>
                      <textarea
                        required
                        value={formData.route_details}
                        onChange={(e) => setFormData({ ...formData, route_details: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Describe the route (e.g., Main Street > Park Ave > School)"
                      />
                    </div>
                  </div>
                </div>

                {/* Legal & Compliance */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-orange-600" />
                    Legal & Compliance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Police Verification Number
                      </label>
                      <input
                        type="text"
                        value={formData.police_verification}
                        onChange={(e) => setFormData({ ...formData, police_verification: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Police verification reference"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={formData.gst_number}
                        onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="GSTIN"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="PAN Card Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Contract Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-orange-600" />
                    Contract Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.contract_start_date}
                        onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract End Date
                      </label>
                      <input
                        type="date"
                        value={formData.contract_end_date}
                        onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms
                      </label>
                      <textarea
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., Monthly payment, Net 30 days, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Documents Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload size={18} className="text-orange-600" />
                    Document Upload
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driving License Document
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'license_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {formData.license_doc && <FileText size={20} className="text-green-600" />}
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
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {formData.police_verification_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Registration Document
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'vehicle_registration_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {formData.vehicle_registration_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Document
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'insurance_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {formData.insurance_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Certificate
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'gst_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {formData.gst_doc && <FileText size={20} className="text-green-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card Document
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'pan_doc')}
                          className="flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {formData.pan_doc && <FileText size={20} className="text-green-600" />}
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
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingVendor ? 'Update Vendor' : 'Add Vendor'}
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