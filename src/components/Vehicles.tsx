import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Users } from 'lucide-react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, getStudents } from '../services/api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 mt-1">Manage school transport and vehicles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search vehicles by number, driver, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No vehicles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const studentCount = studentCounts[vehicle._id] || 0;
            const occupancyPercentage = (studentCount / vehicle.capacity) * 100;

            return (
              <div
                key={vehicle._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{vehicle.vehicle_number}</h3>
                    <p className="text-sm text-gray-600">{vehicle.vehicle_type}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      vehicle.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : vehicle.status === 'Maintenance'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Driver</p>
                    <p className="text-sm font-medium text-gray-900">{vehicle.driver_name}</p>
                    <p className="text-sm text-gray-600">{vehicle.driver_phone}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Route</p>
                    <p className="text-sm text-gray-900">{vehicle.route}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500">Capacity</p>
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Users size={14} />
                        {studentCount} / {vehicle.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          occupancyPercentage >= 100
                            ? 'bg-red-500'
                            : occupancyPercentage >= 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle._id)}
                    className="px-3 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., ABC-1234"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    required
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Van">Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
                  <textarea
                    required
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    rows={3}
                    placeholder="Describe the route (e.g., Main Street > Park Ave > School)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}