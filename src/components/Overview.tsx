
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Award,
  Target,
  Gauge,
  Activity,
  Star,
  Truck,
  Wallet,
  Hourglass,
  ArrowUpRight,
  LucideIcon,
  AlertCircle,
  Bus,
} from 'lucide-react';

import {
  getStudents,
  getStaff,
  getVehicles,
  getVendors,
  getFinancialOverview,
} from '../services/api';

// ---------- Types ----------

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

// ---------- Default Stats ----------

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

// ---------- Helper Functions ----------

const safeGetData = (response: any, fallback: any[] = []) => {
  if (!response) return fallback;

  if (Array.isArray(response)) {
    return response;
  }

  if (response.data !== undefined) {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (
      typeof response.data === 'object' &&
      response.data !== null
    ) {
      const possibleKeys = [
        'students',
        'staff',
        'vendors',
        'vehicles',
        'items',
        'results',
        'data',
      ];

      for (const key of possibleKeys) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }

      const values = Object.values(response.data);

      if (
        values.length > 0 &&
        Array.isArray(values[0])
      ) {
        return values[0];
      }
    }
  }

  if (response.items && Array.isArray(response.items)) {
    return response.items;
  }

  if (response.results && Array.isArray(response.results)) {
    return response.results;
  }

  if (response._embedded) {
    const embeddedKeys = Object.keys(response._embedded);

    for (const key of embeddedKeys) {
      if (Array.isArray(response._embedded[key])) {
        return response._embedded[key];
      }
    }
  }

  return fallback;
};

// ---------- Presentational Sub-components ----------

const StatCard = memo(function StatCard({
  card,
}: {
  card: StatCardData;
}) {
  const Icon = card.icon;

  const progress =
    card.value > 0
      ? Math.min((card.active / card.value) * 100, 100)
      : 0;

  return (
    <div
      className={`
        group relative overflow-hidden
        min-h-[230px]
        flex flex-col
        rounded-2xl
        border ${card.borderColor}
        bg-gradient-to-br ${card.bgGradient}
        p-5
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-xl
      `}
    >
      {/* Decorative Background Icon */}
      <Icon
        className="
          pointer-events-none
          absolute
          -right-5
          -bottom-5
          text-gray-900/[0.035]
          transition-all duration-500
          group-hover:scale-110
          group-hover:text-gray-900/[0.06]
        "
        size={105}
        strokeWidth={1}
      />

      {/* Top Row */}
      <div className="relative z-10 flex items-center justify-between">
        {/* Icon */}
        <div
          className={`
            flex h-14 w-14
            items-center justify-center
            rounded-2xl
            bg-gradient-to-br ${card.gradient}
            shadow-lg
            ring-4 ring-white/60
            transition-transform duration-300
            group-hover:scale-105
          `}
        >
          <Icon
            className="text-white"
            size={27}
            strokeWidth={2.2}
          />
        </div>

        {/* Trend */}
        <div
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-full
            border
            border-white/70
            bg-white/70
            px-2.5
            py-1.5
            text-xs
            font-bold
            backdrop-blur-sm
            ${
              card.trendUp
                ? 'text-emerald-600'
                : 'text-red-500'
            }
          `}
        >
          <TrendingUp
            size={13}
            strokeWidth={2.5}
          />

          <span>{card.trend}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mt-5">
        {/* Number */}
        <p
          className="
            text-4xl
            font-extrabold
            leading-none
            tracking-tight
            text-gray-900
          "
        >
          {card.value}
        </p>

        {/* Title */}
        <p
          className="
            mt-2
            text-sm
            font-bold
            tracking-wide
            text-gray-800
          "
        >
          {card.title}
        </p>

        {/* Active Count */}
        <p className="mt-0.5 text-xs font-medium text-gray-500">
          {card.subtext}
        </p>
      </div>

      {/* Bottom Progress */}
      <div className="relative z-10 mt-auto pt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Active
          </span>

          <span className="text-xs font-bold text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-white/80 shadow-inner">
          <div
            className={`
              h-full
              rounded-full
              bg-gradient-to-r ${card.gradient}
              shadow-sm
              transition-all duration-700
            `}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
});

// ---------- Finance Card ----------

const FinanceCard = memo(function FinanceCard({
  card,
}: {
  card: FinanceCardData;
}) {
  const Icon = card.icon;

  return (
    <div
      className={`
        group relative
        min-h-[230px]
        h-full
        overflow-hidden
        rounded-2xl
        border ${card.borderColor}
        bg-gradient-to-br ${card.bgGradient}
        p-5
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-xl
      `}
    >
      {/* Decorative Icon */}
      <Icon
        className="
          pointer-events-none
          absolute
          -right-5
          -bottom-5
          text-gray-900/[0.035]
          transition-all duration-500
          group-hover:scale-110
          group-hover:text-gray-900/[0.06]
        "
        size={105}
        strokeWidth={1}
      />

      {/* Icon */}
      <div
        className={`
          relative z-10
          flex h-14 w-14
          items-center justify-center
          rounded-2xl
          bg-gradient-to-br ${card.gradient}
          shadow-lg
          ring-4 ring-white/60
          transition-transform duration-300
          group-hover:scale-105
        `}
      >
        <Icon
          className="text-white"
          size={27}
          strokeWidth={2.2}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mt-6">
        <p className="text-sm font-bold tracking-wide text-gray-700">
          {card.title}
        </p>

        <p
          className="
            mt-2
            text-3xl
            font-extrabold
            leading-none
            tracking-tight
            text-gray-900
          "
        >
          {card.value}
        </p>

        <p className="mt-2 text-xs font-medium text-gray-500">
          {card.subtext}
        </p>
      </div>

      {/* Bottom Accent */}
      <div
        className={`
          absolute
          bottom-0
          left-0
          right-0
          h-1
          bg-gradient-to-r ${card.gradient}
          opacity-80
        `}
      />
    </div>
  );
});

// ---------- Quick Action Button ----------

const QuickActionButton = memo(function QuickActionButton({
  icon: Icon,
  label,
  sublabel,
  colorClass,
  bgClass,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  colorClass: string;
  bgClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group
        flex
        min-h-[110px]
        w-full
        items-center
        gap-3
        rounded-xl
        border border-white/80
        ${bgClass}
        p-4
        text-left
        shadow-sm
        transition-all duration-300
        hover:-translate-y-0.5
        hover:shadow-md
      `}
    >
      {/* Icon */}
      <div
        className="
          flex
          h-11
          w-11
          flex-shrink-0
          items-center
          justify-center
          rounded-xl
          bg-white/80
          shadow-sm
          transition-transform duration-300
          group-hover:scale-105
        "
      >
        <Icon
          className={colorClass}
          size={22}
          strokeWidth={2.3}
        />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-gray-800">
          {label}
        </div>

        <div className="mt-0.5 text-xs font-medium text-gray-500">
          {sublabel}
        </div>
      </div>

      {/* Arrow */}
      <ArrowUpRight
        className="
          ml-auto
          flex-shrink-0
          text-gray-400
          opacity-0
          transition-all duration-200
          group-hover:translate-x-0.5
          group-hover:-translate-y-0.5
          group-hover:opacity-100
        "
        size={17}
      />
    </button>
  );
});

// ---------- Section Header ----------

const SectionHeader = memo(function SectionHeader({
  icon: Icon,
  title,
  gradient,
}: {
  icon: LucideIcon;
  title: string;
  gradient: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div
        className={`
          flex h-9 w-9
          items-center justify-center
          rounded-xl
          bg-gradient-to-br ${gradient}
          shadow-sm
        `}
      >
        <Icon
          size={18}
          className="text-white"
          strokeWidth={2.3}
        />
      </div>

      <h2 className="text-lg font-extrabold text-gray-800">
        {title}
      </h2>
    </div>
  );
});

// ---------- Main Component ----------

export default function Overview({
  onNavigate,
}: OverviewProps) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Load Dashboard Stats ----------

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        setError(null);

        console.log('🔄 Loading overview stats...');

        const [
          studentsRes,
          staffRes,
          vehiclesRes,
          vendorsRes,
          financeRes,
        ] = await Promise.all([
          getStudents().catch((err) => {
            console.error(
              '❌ Error fetching students:',
              err
            );

            return { data: [] };
          }),

          getStaff().catch((err) => {
            console.error(
              '❌ Error fetching staff:',
              err
            );

            return { data: [] };
          }),

          getVehicles().catch((err) => {
            console.error(
              '❌ Error fetching vehicles:',
              err
            );

            return { data: [] };
          }),

          getVendors().catch((err) => {
            console.error(
              '❌ Error fetching vendors:',
              err
            );

            return { data: [] };
          }),

          getFinancialOverview().catch((err) => {
            console.error(
              '❌ Error fetching finance:',
              err
            );

            return {
              data: {
                fees: {
                  collected: 0,
                  pending: 0,
                },
              },
            };
          }),
        ]);

        if (cancelled) return;

        // Extract arrays safely
        const students = safeGetData(
          studentsRes,
          []
        );

        const staff = safeGetData(
          staffRes,
          []
        );

        const vehicles = safeGetData(
          vehiclesRes,
          []
        );

        const vendors = safeGetData(
          vendorsRes,
          []
        );

        console.log(
          '📊 Students:',
          students.length
        );

        console.log(
          '📊 Staff:',
          staff.length
        );

        console.log(
          '📊 Vehicles:',
          vehicles.length
        );

        console.log(
          '📊 Vendors:',
          vendors.length
        );

        // Finance
        const financeData =
          financeRes?.data || {
            fees: {
              collected: 0,
              pending: 0,
            },
          };

        const collected =
          financeData.fees?.collected || 0;

        const pending =
          financeData.fees?.pending || 0;

        const newStats: Stats = {
          totalStudents:
            students.length || 0,

          activeStudents:
            students.filter(
              (s: any) =>
                s.status === 'Active' ||
                s.status === 'active'
            ).length || 0,

          totalStaff:
            staff.length || 0,

          activeStaff:
            staff.filter(
              (s: any) =>
                s.status === 'Active' ||
                s.status === 'active'
            ).length || 0,

          totalVendors:
            vendors.length || 0,

          activeVendors:
            vendors.filter(
              (v: any) =>
                v.status === 'Active' ||
                v.status === 'active'
            ).length || 0,

          totalVehicles:
            vehicles.length || 0,

          activeVehicles:
            vehicles.filter(
              (v: any) =>
                v.status === 'Active' ||
                v.status === 'active'
            ).length || 0,

          totalRevenue: collected,
          pendingFees: pending,
        };

        console.log(
          '✅ Final Stats:',
          newStats
        );

        setStats(newStats);
      } catch (error) {
        console.error(
          '❌ Error loading stats:',
          error
        );

        setError(
          'Failed to load statistics. Please refresh the page.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Navigation ----------

  const handleNavigate = useCallback(
    (page: string) => {
      onNavigate?.(page);
    },
    [onNavigate]
  );

  // ---------- Main Stat Cards ----------

  const cards: StatCardData[] = useMemo(
    () => [
      {
        title: 'Students',
        value: stats.totalStudents,
        active: stats.activeStudents,
        subtext: `${stats.activeStudents} active`,
        icon: GraduationCap,
        gradient:
          'from-blue-500 to-cyan-500',
        bgGradient:
          'from-blue-50 via-white to-cyan-50',
        borderColor:
          'border-blue-200',
        trend:
          stats.totalStudents > 0
            ? '+12%'
            : '0%',
        trendUp: true,
      },

      {
        title: 'Staff',
        value: stats.totalStaff,
        active: stats.activeStaff,
        subtext: `${stats.activeStaff} active`,
        icon: Briefcase,
        gradient:
          'from-green-500 to-emerald-500',
        bgGradient:
          'from-green-50 via-white to-emerald-50',
        borderColor:
          'border-green-200',
        trend:
          stats.totalStaff > 0
            ? '+5%'
            : '0%',
        trendUp: true,
      },

      {
        title: 'Vendors',
        value: stats.totalVendors,
        active: stats.activeVendors,
        subtext: `${stats.activeVendors} active`,
        icon: Truck,
        gradient:
          'from-orange-500 to-red-500',
        bgGradient:
          'from-orange-50 via-white to-red-50',
        borderColor:
          'border-orange-200',
        trend:
          stats.totalVendors > 0
            ? '+8%'
            : '0%',
        trendUp: true,
      },

      {
        title: 'Vehicles',
        value: stats.totalVehicles,
        active: stats.activeVehicles,
        subtext: `${stats.activeVehicles} active`,
        icon: Bus,
        gradient:
          'from-purple-500 to-pink-500',
        bgGradient:
          'from-purple-50 via-white to-pink-50',
        borderColor:
          'border-purple-200',
        trend:
          stats.totalVehicles > 0
            ? '+6%'
            : '0%',
        trendUp: true,
      },
    ],
    [stats]
  );

  // ---------- Finance Cards ----------

  const financeCards: FinanceCardData[] =
    useMemo(
      () => [
        {
          title: 'Revenue',
          value: `₹${(
            stats.totalRevenue / 1000
          ).toFixed(1)}k`,
          subtext:
            'Total fees collected',
          icon: Wallet,
          gradient:
            'from-emerald-500 to-teal-500',
          bgGradient:
            'from-emerald-50 via-white to-teal-50',
          borderColor:
            'border-emerald-200',
        },

        {
          title: 'Pending Fees',
          value: `₹${(
            stats.pendingFees / 1000
          ).toFixed(1)}k`,
          subtext:
            'Awaiting collection',
          icon: Hourglass,
          gradient:
            'from-yellow-500 to-orange-500',
          bgGradient:
            'from-yellow-50 via-white to-orange-50',
          borderColor:
            'border-yellow-200',
        },
      ],
      [
        stats.totalRevenue,
        stats.pendingFees,
      ]
    );

  // ---------- Fee Collection ----------

  const feeCollectionRate = useMemo(() => {
    const denom =
      stats.totalRevenue +
      stats.pendingFees;

    return denom > 0
      ? Math.round(
          (stats.totalRevenue / denom) *
            100
        )
      : 0;
  }, [
    stats.totalRevenue,
    stats.pendingFees,
  ]);

  // ---------- Performance Metrics ----------

  const metrics = useMemo(
    () => [
      {
        label: 'Attendance',
        value: 94,
        gradient:
          'from-blue-500 to-cyan-500',
      },

      {
        label: 'Engagement',
        value: 88,
        gradient:
          'from-green-500 to-emerald-500',
      },

      {
        label: 'Fee Collection',
        value: feeCollectionRate,
        gradient:
          'from-orange-500 to-red-500',
      },

      {
        label: 'Utilization',
        value: 82,
        gradient:
          'from-purple-500 to-pink-500',
      },
    ],
    [feeCollectionRate]
  );

  // ---------- Loading State ----------

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-6">
        <div className="space-y-5 animate-pulse">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-[230px] rounded-2xl bg-white/80"
                />
              )
            )}
          </div>

          {/* Quick Actions */}
          <div className="h-[200px] rounded-2xl bg-white/80" />

          {/* Finance */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-[230px] rounded-2xl bg-white/80" />
            <div className="h-[230px] rounded-2xl bg-white/80" />
            <div className="h-[230px] rounded-2xl bg-white/80" />
          </div>

          {/* Achievement */}
          <div className="h-[100px] rounded-2xl bg-white/80" />

          {/* Activity */}
          <div className="h-[260px] rounded-2xl bg-white/80" />
        </div>
      </div>
    );
  }

  // ---------- Error State ----------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle
              className="text-red-500"
              size={34}
            />
          </div>

          <h3 className="mb-2 text-xl font-extrabold text-gray-800">
            Oops! Something went wrong
          </h3>

          <p className="mb-6 text-sm leading-6 text-gray-600">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              rounded-xl
              bg-gradient-to-r
              from-blue-500
              to-purple-500
              px-6
              py-3
              text-sm
              font-bold
              text-white
              shadow-md
              transition-all
              hover:-translate-y-0.5
              hover:shadow-lg
            "
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // ---------- Dashboard ----------

  return (
    <div
      className="
        min-h-screen
        space-y-5
        bg-gradient-to-br
        from-gray-50
        via-gray-100
        to-gray-200
        p-4
        md:p-6
      "
    >
      {/* ======================================================
          1. CORE STAT CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            card={card}
          />
        ))}
      </div>

      {/* ======================================================
          2. QUICK ACTIONS
      ====================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-5
          shadow-sm
          md:p-6
        "
      >
        <SectionHeader
          icon={Target}
          title="Quick Actions"
          gradient="from-blue-500 to-purple-500"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionButton
            icon={GraduationCap}
            label="Add Student"
            sublabel="Enroll a new student"
            colorClass="text-blue-600"
            bgClass="bg-gradient-to-br from-blue-50 to-indigo-50"
            onClick={() =>
              handleNavigate(
                'studentDetails'
              )
            }
          />

          <QuickActionButton
            icon={Briefcase}
            label="Add Staff"
            sublabel="Add a staff member"
            colorClass="text-green-600"
            bgClass="bg-gradient-to-br from-green-50 to-emerald-50"
            onClick={() =>
              handleNavigate('faculty')
            }
          />

          <QuickActionButton
            icon={Truck}
            label="Add Vendor"
            sublabel="Register a vendor"
            colorClass="text-orange-600"
            bgClass="bg-gradient-to-br from-orange-50 to-red-50"
            onClick={() =>
              handleNavigate('vendor')
            }
          />

          <QuickActionButton
            icon={Wallet}
            label="Add Fee"
            sublabel="Record a payment"
            colorClass="text-purple-600"
            bgClass="bg-gradient-to-br from-purple-50 to-pink-50"
            onClick={() =>
              handleNavigate('finance')
            }
          />
        </div>
      </div>

      {/* ======================================================
          3. FINANCE + PERFORMANCE
      ====================================================== */}

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        {/* Revenue */}
        <FinanceCard
          card={financeCards[0]}
        />

        {/* Pending Fees */}
        <FinanceCard
          card={financeCards[1]}
        />

        {/* Performance */}
        <div
          className="
            flex
            min-h-[230px]
            flex-col
            rounded-2xl
            border
            border-gray-200/70
            bg-white
            p-5
            shadow-sm
            md:p-6
          "
        >
          <SectionHeader
            icon={Gauge}
            title="Performance"
            gradient="from-green-500 to-emerald-500"
          />

          <div className="flex flex-1 flex-col justify-between space-y-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">
                    {metric.label}
                  </span>

                  <span className="text-xs font-extrabold text-gray-800">
                    {metric.value}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`
                      h-full
                      rounded-full
                      bg-gradient-to-r ${metric.gradient}
                      transition-all duration-700
                    `}
                    style={{
                      width: `${metric.value}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================
          4. ACHIEVEMENT
      ====================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-4
          shadow-sm
          md:p-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-yellow-100
            bg-gradient-to-r
            from-yellow-50
            via-orange-50
            to-yellow-50
            p-4
          "
        >
          {/* Award Icon */}
          <div
            className="
              flex
              h-11
              w-11
              flex-shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white
              shadow-sm
            "
          >
            <Award
              className="text-yellow-600"
              size={23}
              strokeWidth={2.2}
            />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-gray-800">
              Great achievement!
            </div>

            <div className="mt-0.5 text-xs font-medium text-gray-600">
              Enrollment is up by 12% this month
            </div>
          </div>

          {/* Star */}
          <div
            className="
              flex
              h-9
              w-9
              flex-shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/80
            "
          >
            <Star
              className="text-yellow-500"
              size={19}
              fill="currentColor"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          5. RECENT ACTIVITY
      ====================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-5
          shadow-sm
          md:p-6
        "
      >
        <SectionHeader
          icon={Activity}
          title="Recent Activity"
          gradient="from-indigo-500 to-purple-500"
        />

        <div className="space-y-1">
          {[
            {
              icon: Users,
              iconBg: 'bg-green-100',
              iconColor: 'text-green-600',
              text: 'New student enrolled',
              time: '2h ago',
              tag: 'Active',
              tagColor: 'text-green-600',
            },

            {
              icon: Wallet,
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600',
              text: 'Fee payment received',
              time: '5h ago',
              tag: 'Completed',
              tagColor: 'text-blue-600',
            },

            {
              icon: Briefcase,
              iconBg: 'bg-purple-100',
              iconColor: 'text-purple-600',
              text: 'Staff training scheduled',
              time: 'Yesterday',
              tag: 'Upcoming',
              tagColor: 'text-purple-600',
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.text}
                className="
                  group
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-transparent
                  p-3
                  transition-all duration-200
                  hover:border-gray-100
                  hover:bg-gray-50
                "
              >
                {/* Activity Icon */}
                <div
                  className={`
                    flex
                    h-10
                    w-10
                    flex-shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    ${item.iconBg}
                    transition-transform duration-200
                    group-hover:scale-105
                  `}
                >
                  <Icon
                    size={18}
                    className={item.iconColor}
                    strokeWidth={2.2}
                  />
                </div>

                {/* Activity Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800">
                    {item.text}
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-gray-500">
                    {item.time}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`
                    hidden
                    items-center
                    gap-1
                    rounded-full
                    bg-gray-50
                    px-2.5
                    py-1
                    text-xs
                    font-bold
                    sm:inline-flex
                    ${item.tagColor}
                  `}
                >
                  {item.tag}

                  <ArrowUpRight
                    size={12}
                    strokeWidth={2.5}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
