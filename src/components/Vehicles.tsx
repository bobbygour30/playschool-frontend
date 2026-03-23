import { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Users, Bus, MapPin, 
  Phone, User, Fuel, Gauge, Filter, Download, TrendingUp,
  AlertCircle, CheckCircle, Wrench, Car, Navigation
} from 'lucide-react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, getStudents } from '../services/api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [studentCounts, setStudentCounts] = useState({});
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'Bus',
    driver_name: '',
    driver_phone: '',
    capacity: '10',
    route: '',
    status: 'Active',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, studentsRes] = await Promise.all([
        getVehicles(),
        getStudents(),
      ]);

      setVehicles(vehiclesRes.data || []);

      const counts = {};
      (studentsRes.data || []).forEach((student) => {
        if (student.vehicle_id) {
          const vehicleId = student.vehicle_id._id || student.vehicle_id;
          counts[vehicleId] = (counts[vehicleId] || 0) + 1;
        }
      });
      setStudentCounts(counts);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        capacity: parseInt(formData.capacity),
        route: formData.route,
        status: formData.status,
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle._id, data);
        alert('Vehicle updated successfully!');
      } else {
        await createVehicle(data);
        alert('Vehicle added successfully!');
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save vehicle. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    const studentCount = studentCounts[id] || 0;
    if (studentCount > 0) {
      alert(`Cannot delete this vehicle. ${studentCount} student(s) are currently assigned to it.`);
      return;
    }

    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
        await loadData();
        alert('Vehicle deleted successfully!');
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Failed to delete vehicle. Please try again.');
      }
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      vehicle_type: vehicle.vehicle_type || 'Bus',
      driver_name: vehicle.driver_name || '',
      driver_phone: vehicle.driver_phone || '',
      capacity: vehicle.capacity ? vehicle.capacity.toString() : '10',
      route: vehicle.route || '',
      status: vehicle.status || 'Active',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      vehicle_type: 'Bus',
      driver_name: '',
      driver_phone: '',
      capacity: '10',
      route: '',
      status: 'Active',
    });
    setEditingVehicle(null);
    setShowModal(false);
  };

  const getFilteredVehicles = () => {
    let filtered = vehicles;
    
    if (searchTerm) {
      filtered = filtered.filter((vehicle) =>
        vehicle.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.route?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((vehicle) => vehicle.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter((vehicle) => vehicle.vehicle_type === typeFilter);
    }
    
    return filtered;
  };

  const filteredVehicles = getFilteredVehicles();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} />, gradient: 'from-green-500 to-emerald-500', badge: 'operational' };
      case 'Maintenance':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Wrench size={12} />, gradient: 'from-yellow-500 to-orange-500', badge: 'in service' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle size={12} />, gradient: 'from-gray-500 to-gray-600', badge: 'inactive' };
    }
  };

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'Active').length,
    maintenance: vehicles.filter(v => v.status === 'Maintenance').length,
    inactive: vehicles.filter(v => v.status === 'Inactive').length,
    totalCapacity: vehicles.reduce((sum, v) => sum + v.capacity, 0),
    totalStudents: Object.values(studentCounts).reduce((sum, count) => sum + count, 0),
    utilization: vehicles.length ? Math.floor((Object.values(studentCounts).reduce((sum, count) => sum + count, 0) / vehicles.reduce((sum, v) => sum + v.capacity, 0)) * 100) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-white/80 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Fleet Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Bus size={18} className="text-cyan-500" />
                Manage school transport, vehicles, and routes efficiently
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <Car size={20} />
                <span className="font-semibold">Add New Vehicle</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Bus className="text-white" size={24} />
              </div>
              <TrendingUp className="text-cyan-500" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Total Vehicles</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.active}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Active Fleet</h3>
            <p className="text-gray-600 text-sm">Operational vehicles</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Wrench className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-orange-600">{stats.maintenance}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Maintenance</h3>
            <p className="text-gray-600 text-sm">Under service</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.utilization}%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Utilization</h3>
            <p className="text-gray-600 text-sm">Fleet capacity used</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by vehicle number, driver name, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="relative">
                <Bus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Bus">Buses</option>
                  <option value="Van">Vans</option>
                </select>
              </div>
              <button className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:shadow-md transition-all">
                <Download size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Bus className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No vehicles found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const studentCount = studentCounts[vehicle._id] || 0;
              const occupancyPercentage = (studentCount / vehicle.capacity) * 100;
              const statusStyle = getStatusColor(vehicle.status);
              
              return (
                <div
                  key={vehicle._id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:scale-105"
                >
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${statusStyle.gradient} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Bus className="text-white" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{vehicle.vehicle_number}</h3>
                          <p className="text-xs text-white/80">{vehicle.vehicle_type}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} text-xs font-semibold flex items-center gap-1`}>
                        {statusStyle.icon}
                        <span>{vehicle.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Driver Info */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={14} className="text-cyan-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Driver</span>
                      </div>
                      <p className="font-semibold text-gray-900">{vehicle.driver_name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone size={12} />
                        {vehicle.driver_phone}
                      </p>
                    </div>

                    {/* Route Info */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation size={14} className="text-cyan-600" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Route</span>
                      </div>
                      <p className="text-sm text-gray-900 flex items-start gap-2">
                        <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{vehicle.route}</span>
                      </p>
                    </div>

                    {/* Capacity & Utilization */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-600">Capacity Utilization</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {studentCount} / {vehicle.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            occupancyPercentage >= 100
                              ? 'bg-gradient-to-r from-red-500 to-pink-500'
                              : occupancyPercentage >= 80
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}
                          style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {occupancyPercentage >= 100 ? 'At full capacity' : `${Math.round(occupancyPercentage)}% occupied`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle._id)}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., ABC-1234"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    >
                      <option value="Bus">Bus</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.driver_name}
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.driver_phone}
                      onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="+1 234 567 890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Route *</label>
                    <textarea
                      required
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      rows={3}
                      placeholder="Describe the route (e.g., Main Street > Park Ave > School)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
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
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
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