import { useEffect, useState } from 'react';
import { 
  Users, GraduationCap, Phone, Bus, TrendingUp, 
  Calendar, Award, Target, Zap, BarChart, 
  Activity, Heart, Star, Sparkles
} from 'lucide-react';
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, facultyRes, leadsRes, vehiclesRes] = await Promise.all([
        getStudents(),
        getFaculty(),
        getLeads(),
        getVehicles(),
      ]);

      const students = studentsRes.data || [];
      const faculty = facultyRes.data || [];
      const leads = leadsRes.data || [];
      const vehicles = vehiclesRes.data || [];

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

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const cards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      active: stats.activeStudents,
      subtext: `${stats.activeStudents} active students`,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      trend: stats.totalStudents > 0 ? '+12%' : '0%',
      trendUp: true,
    },
    {
      title: 'Faculty Members',
      value: stats.totalFaculty,
      active: stats.activeFaculty,
      subtext: `${stats.activeFaculty} active staff`,
      icon: GraduationCap,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      trend: stats.totalFaculty > 0 ? '+5%' : '0%',
      trendUp: true,
    },
    {
      title: 'Active Leads',
      value: stats.totalLeads,
      active: stats.newLeads,
      subtext: `${stats.newLeads} new inquiries`,
      icon: Phone,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      trend: stats.newLeads > 0 ? '+28%' : '0%',
      trendUp: true,
    },
    {
      title: 'Fleet Status',
      value: stats.totalVehicles,
      active: stats.activeVehicles,
      subtext: `${stats.activeVehicles} vehicles active`,
      icon: Bus,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      trend: stats.activeVehicles > 0 ? '92%' : '0%',
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-gradient-to-r from-blue-200 to-purple-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-white/80 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <div className="p-6 md:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-yellow-300" size={24} />
                  <span className="text-yellow-300 font-semibold">Welcome Back!</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard Overview</h1>
                <p className="text-blue-100">Here's what's happening with your school today</p>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                <Calendar size={20} />
                <div>
                  <div className="text-sm font-medium">{formatDate()}</div>
                  <div className="text-xs text-blue-200">{formatTime()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl border ${card.borderColor} p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden`}
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Icon with Pulse Effect */}
                <div className="relative mb-4">
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>
                  <div className={`relative w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>

                {/* Stats */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">{card.title}</h3>
                    <div className={`flex items-center gap-1 ${card.trendUp ? 'text-green-500' : 'text-red-500'} text-xs font-semibold`}>
                      <TrendingUp size={12} />
                      <span>{card.trend}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-4xl font-bold text-gray-900">{card.value}</p>
                    <span className="text-sm text-gray-500">total</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">{card.subtext}</p>
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-500`}
                        style={{ width: `${(card.active / card.value) * 100 || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap size={48} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Target size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all duration-300 text-left">
                <Users className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                <div className="font-semibold text-gray-800">Add Student</div>
                <div className="text-xs text-gray-500">New enrollment</div>
              </button>
              <button className="group p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-300 text-left">
                <GraduationCap className="text-green-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                <div className="font-semibold text-gray-800">Add Faculty</div>
                <div className="text-xs text-gray-500">Hire new staff</div>
              </button>
              <button className="group p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl hover:shadow-md transition-all duration-300 text-left">
                <Phone className="text-orange-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                <div className="font-semibold text-gray-800">Add Lead</div>
                <div className="text-xs text-gray-500">Track inquiry</div>
              </button>
              <button className="group p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-300 text-left">
                <Bus className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                <div className="font-semibold text-gray-800">Manage Transport</div>
                <div className="text-xs text-gray-500">Update routes</div>
              </button>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BarChart size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Performance Metrics</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Student Attendance</span>
                  <span className="text-sm font-semibold text-gray-800">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Faculty Engagement</span>
                  <span className="text-sm font-semibold text-gray-800">88%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Lead Conversion</span>
                  <span className="text-sm font-semibold text-gray-800">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Vehicle Utilization</span>
                  <span className="text-sm font-semibold text-gray-800">82%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>

            {/* Achievement Badge */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                <Award className="text-yellow-600" size={24} />
                <div>
                  <div className="font-semibold text-gray-800">Great Achievement!</div>
                  <div className="text-xs text-gray-600">Student enrollment up by 12% this month</div>
                </div>
                <Star className="text-yellow-500 ml-auto" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all duration-300">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={14} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New student enrolled</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <span className="text-xs text-green-600 font-semibold">Active</span>
            </div>
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all duration-300">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone size={14} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New lead from website</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
              <span className="text-xs text-blue-600 font-semibold">New</span>
            </div>
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all duration-300">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <GraduationCap size={14} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Faculty training session scheduled</p>
                <p className="text-xs text-gray-500">Yesterday</p>
              </div>
              <span className="text-xs text-purple-600 font-semibold">Upcoming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}