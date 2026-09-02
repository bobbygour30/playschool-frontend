import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  Users, GraduationCap, Briefcase, Bus, TrendingUp,
  Award, Target, Gauge, Activity, Star, Sparkles,
  Truck, Wallet, Hourglass, ArrowUpRight, LucideIcon,
} from 'lucide-react';
import { getStudents, getStaff, getVehicles, getVendors, getFinancialOverview } from '../services/api';

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  activeStaff: number;
  totalVendors: number;
  activeVendors: number;
  totalVehicles: number;
  activeVehicles: number;
  totalRevenue: number;
  pendingFees: number;
}

interface OverviewProps {
  onNavigate?: (page: string) => void;
}

interface StatCardData {
  title: string;
  value: number;
  active: number;
  subtext: string;
  icon: LucideIcon;
  gradient: string;
  bgGradient: string;
  borderColor: string;
  trend: string;
  trendUp: boolean;
}

interface FinanceCardData {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  gradient: string;
  bgGradient: string;
  borderColor: string;
}

const EMPTY_STATS: Stats = {
  totalStudents: 0,
  activeStudents: 0,
  totalStaff: 0,
  activeStaff: 0,
  totalVendors: 0,
  activeVendors: 0,
  totalVehicles: 0,
  activeVehicles: 0,
  totalRevenue: 0,
  pendingFees: 0,
};

// ---------- Presentational sub-components (memoized to avoid needless re-renders) ----------

const StatCard = memo(function StatCard({ card }: { card: StatCardData }) {
  const Icon = card.icon;
  const progress = card.value > 0 ? (card.active / card.value) * 100 : 0;

  return (
    <div
      className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-2xl border ${card.borderColor} p-6 transition-shadow duration-300 hover:shadow-xl overflow-hidden`}
    >
      <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-md mb-4`}>
        <Icon className="text-white" size={22} strokeWidth={2.25} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 text-sm font-medium">{card.title}</h3>
        <div className={`flex items-center gap-0.5 ${card.trendUp ? 'text-emerald-600' : 'text-red-500'} text-xs font-semibold`}>
          <TrendingUp size={12} />
          <span>{card.trend}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-4xl font-bold text-gray-900">{card.value}</p>
        <span className="text-sm text-gray-500">total</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{card.subtext}</p>
        <div className="w-16 h-1.5 bg-white/70 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${card.gradient} rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Icon className="absolute -bottom-2 -right-2 text-gray-900/5 group-hover:text-gray-900/10 transition-colors" size={72} strokeWidth={1.5} />
    </div>
  );
});

const FinanceCard = memo(function FinanceCard({ card }: { card: FinanceCardData }) {
  const Icon = card.icon;
  return (
    <div
      className={`relative h-full flex flex-col justify-between bg-gradient-to-br ${card.bgGradient} rounded-2xl border ${card.borderColor} p-6 transition-shadow duration-300 hover:shadow-xl overflow-hidden`}
    >
      <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-md mb-4`}>
        <Icon className="text-white" size={22} strokeWidth={2.25} />
      </div>
      <div>
        <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
        <p className="text-4xl font-bold text-gray-900 mb-1">{card.value}</p>
        <p className="text-sm text-gray-500">{card.subtext}</p>
      </div>
      <Icon className="absolute -bottom-2 -right-2 text-gray-900/5" size={72} strokeWidth={1.5} />
    </div>
  );
});

const QuickActionButton = memo(function QuickActionButton({
  icon: Icon, label, sublabel, colorClass, bgClass, onClick,
}: {
  icon: LucideIcon; label: string; sublabel: string; colorClass: string; bgClass: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group p-4 ${bgClass} rounded-xl transition-shadow duration-300 text-left hover:shadow-md`}
    >
      <Icon className={`${colorClass} mb-2 group-hover:scale-110 transition-transform duration-200`} size={22} strokeWidth={2.25} />
      <div className="font-semibold text-gray-800">{label}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </button>
  );
});

// ---------- Main component ----------

export default function Overview({ onNavigate }: OverviewProps) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const [studentsRes, staffRes, vehiclesRes, vendorsRes, financeRes] = await Promise.all([
          getStudents(),
          getStaff(),
          getVehicles(),
          getVendors(),
          getFinancialOverview().catch(() => ({ data: { fees: { collected: 0, pending: 0 } } })),
        ]);

        if (cancelled) return;

        const students = studentsRes.data || [];
        const staff = staffRes.data || [];
        const vehicles = vehiclesRes.data || [];
        const vendors = vendorsRes.data || [];
        const finance = financeRes.data || { fees: { collected: 0, pending: 0 } };

        setStats({
          totalStudents: students.length,
          activeStudents: students.filter((s: any) => s.status === 'Active').length,
          totalStaff: staff.length,
          activeStaff: staff.filter((s: any) => s.status === 'Active').length,
          totalVendors: vendors.length,
          activeVendors: vendors.filter((v: any) => v.status === 'Active').length,
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.filter((v: any) => v.status === 'Active').length,
          totalRevenue: finance.fees?.collected || 0,
          pendingFees: finance.fees?.pending || 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = useCallback(
    (page: string) => {
      onNavigate?.(page);
    },
    [onNavigate]
  );

  const cards: StatCardData[] = useMemo(
    () => [
      {
        title: 'Total Students',
        value: stats.totalStudents,
        active: stats.activeStudents,
        subtext: `${stats.activeStudents} active students`,
        icon: GraduationCap,
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-200',
        trend: stats.totalStudents > 0 ? '+12%' : '0%',
        trendUp: true,
      },
      {
        title: 'Staff Members',
        value: stats.totalStaff,
        active: stats.activeStaff,
        subtext: `${stats.activeStaff} active staff`,
        icon: Briefcase,
        gradient: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        trend: stats.totalStaff > 0 ? '+5%' : '0%',
        trendUp: true,
      },
      {
        title: 'Total Vendors',
        value: stats.totalVendors,
        active: stats.activeVendors,
        subtext: `${stats.activeVendors} active vendors`,
        icon: Truck,
        gradient: 'from-orange-500 to-red-500',
        bgGradient: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-200',
        trend: stats.activeVendors > 0 ? '+8%' : '0%',
        trendUp: true,
      },
      {
        title: 'Total Vehicles',
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
    ],
    [stats]
  );

  const financeCards: FinanceCardData[] = useMemo(
    () => [
      {
        title: 'Total Revenue',
        value: `₹${(stats.totalRevenue / 1000).toFixed(1)}k`,
        subtext: 'Total fees collected',
        icon: Wallet,
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-200',
      },
      {
        title: 'Pending Fees',
        value: `₹${(stats.pendingFees / 1000).toFixed(1)}k`,
        subtext: 'Awaiting collection',
        icon: Hourglass,
        gradient: 'from-yellow-500 to-orange-500',
        bgGradient: 'from-yellow-50 to-orange-50',
        borderColor: 'border-yellow-200',
      },
    ],
    [stats.totalRevenue, stats.pendingFees]
  );

  const feeCollectionRate = useMemo(() => {
    const denom = stats.totalRevenue + stats.pendingFees;
    return denom > 0 ? Math.round((stats.totalRevenue / denom) * 100) : 0;
  }, [stats.totalRevenue, stats.pendingFees]);

  const metrics = useMemo(
    () => [
      { label: 'Student Attendance', value: 94, gradient: 'from-blue-500 to-cyan-500' },
      { label: 'Staff Engagement', value: 88, gradient: 'from-green-500 to-emerald-500' },
      { label: 'Fee Collection Rate', value: feeCollectionRate, gradient: 'from-orange-500 to-red-500' },
      { label: 'Vehicle Utilization', value: 82, gradient: 'from-purple-500 to-pink-500' },
    ],
    [feeCollectionRate]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white/80 rounded-2xl" />
            ))}
          </div>
          <div className="h-56 bg-white/80 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-white/80 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6 md:p-8 space-y-6">

      {/* 1. Core stat cards: Students, Staff, Vendors, Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <StatCard key={card.title} card={card} />
        ))}
      </div>

      {/* 2. Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Target size={16} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            icon={GraduationCap}
            label="Add Student"
            sublabel="New enrollment"
            colorClass="text-blue-600"
            bgClass="bg-gradient-to-br from-blue-50 to-indigo-50"
            onClick={() => handleNavigate('studentDetails')}
          />
          <QuickActionButton
            icon={Briefcase}
            label="Add Staff"
            sublabel="Hire new staff"
            colorClass="text-green-600"
            bgClass="bg-gradient-to-br from-green-50 to-emerald-50"
            onClick={() => handleNavigate('faculty')}
          />
          <QuickActionButton
            icon={Truck}
            label="Add Vendor"
            sublabel="Register vendor"
            colorClass="text-orange-600"
            bgClass="bg-gradient-to-br from-orange-50 to-red-50"
            onClick={() => handleNavigate('vendor')}
          />
          <QuickActionButton
            icon={Wallet}
            label="Add Fee"
            sublabel="Record payment"
            colorClass="text-purple-600"
            bgClass="bg-gradient-to-br from-purple-50 to-pink-50"
            onClick={() => handleNavigate('finance')}
          />
        </div>
      </div>

      {/* 3. Revenue, Pending Fees & Performance — aligned in a single row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <FinanceCard card={financeCards[0]} />
        <FinanceCard card={financeCards[1]} />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Gauge size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Performance</h2>
          </div>
          <div className="space-y-3.5 flex-1">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-gray-600">{m.label}</span>
                  <span className="text-xs font-semibold text-gray-800">{m.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`bg-gradient-to-r ${m.gradient} h-1.5 rounded-full`}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievement banner */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
          <Award className="text-yellow-600 flex-shrink-0" size={24} />
          <div>
            <div className="font-semibold text-gray-800">Great achievement!</div>
            <div className="text-xs text-gray-600">Student enrollment up by 12% this month</div>
          </div>
          <Star className="text-yellow-500 ml-auto flex-shrink-0" size={20} />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
        </div>
        <div className="space-y-2">
          {[
            { icon: Users, iconBg: 'bg-green-100', iconColor: 'text-green-600', text: 'New student enrolled', time: '2 hours ago', tag: 'Active', tagColor: 'text-green-600' },
            { icon: Wallet, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', text: 'Fee payment received', time: '5 hours ago', tag: 'Completed', tagColor: 'text-blue-600' },
            { icon: Briefcase, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', text: 'Staff training session scheduled', time: 'Yesterday', tag: 'Upcoming', tagColor: 'text-purple-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.text} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors duration-200">
                <div className={`w-8 h-8 ${item.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className={item.iconColor} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.text}</p>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
                <span className={`text-xs font-semibold ${item.tagColor} flex items-center gap-0.5`}>
                  {item.tag} <ArrowUpRight size={12} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}