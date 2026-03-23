import { useEffect, useState } from 'react';
import { Users, GraduationCap, Phone, Bus, TrendingUp } from 'lucide-react';
import { getStudents, getFaculty, getLeads, getVehicles } from '../services/api';

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalFaculty: number;
  activeFaculty: number;
  totalLeads: number;
  newLeads: number;
  totalVehicles: number;
  activeVehicles: number;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    totalFaculty: 0,
    activeFaculty: 0,
    totalLeads: 0,
    newLeads: 0,
    totalVehicles: 0,
    activeVehicles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, facultyRes, leadsRes, vehiclesRes] = await Promise.all([
        getStudents(),
        getFaculty(),
        getLeads(),
        getVehicles(),
      ]);

      const students = studentsRes.data;
      const faculty = facultyRes.data;
      const leads = leadsRes.data;
      const vehicles = vehiclesRes.data;

      const activeStudents = students.filter((s: any) => s.status === 'Active').length;
      const activeFaculty = faculty.filter((f: any) => f.status === 'Active').length;
      const newLeads = leads.filter((l: any) => l.status === 'New').length;
      const activeVehicles = vehicles.filter((v: any) => v.status === 'Active').length;

      setStats({
        totalStudents: students.length,
        activeStudents,
        totalFaculty: faculty.length,
        activeFaculty,
        totalLeads: leads.length,
        newLeads,
        totalVehicles: vehicles.length,
        activeVehicles,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Students',
      value: stats.totalStudents,
      subtext: `${stats.activeStudents} active`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Faculty',
      value: stats.totalFaculty,
      subtext: `${stats.activeFaculty} active`,
      icon: GraduationCap,
      color: 'bg-green-500',
    },
    {
      title: 'Leads',
      value: stats.totalLeads,
      subtext: `${stats.newLeads} new`,
      icon: Phone,
      color: 'bg-orange-500',
    },
    {
      title: 'Vehicles',
      value: stats.totalVehicles,
      subtext: `${stats.activeVehicles} active`,
      icon: Bus,
      color: 'bg-cyan-500',
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Welcome to PlaySchool Admin Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm text-gray-500">{card.subtext}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}