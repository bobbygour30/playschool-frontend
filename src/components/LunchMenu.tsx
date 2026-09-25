// components/LunchMenu.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Edit, Trash2, X, Clock, Utensils, Coffee, Soup,
  Cookie, Sun, Sunset, Moon, CalendarDays, AlertCircle,
  CheckCircle, Loader2, ChevronRight, Info, Salad,
} from 'lucide-react';
import {
  getLunchMenuWeek,
  saveLunchMenuDay,
  addLunchMenuMeal,
  updateLunchMenuMeal,
  deleteLunchMenuMeal,
  toggleLunchMenuDayStatus,
  getCurrentMeal,
} from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Pick an icon based on the meal's time of day, purely cosmetic.
const getMealIcon = (time) => {
  if (!time) return Utensils;
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 10) return Coffee;       // early morning
  if (hour < 12) return Salad;        // mid-morning snack
  if (hour < 15) return Soup;         // lunch
  if (hour < 18) return Cookie;       // evening snack
  return Moon;                        // dinner
};

const formatTime12hr = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

const getTodayName = () => DAYS[(new Date().getDay() + 6) % 7]; // Sunday=0 -> map to Mon-first

export default function LunchMenu() {
  const [weekMenu, setWeekMenu] = useState([]); // array of 7 day objects, Monday->Sunday
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(getTodayName());
  const [currentMealInfo, setCurrentMealInfo] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null); // { dayDocId, mealId } or null for new
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    meal_label: '',
    meal_name: '',
    time: '08:00',
    itemsText: '',
    description: '',
  });

  useEffect(() => {
    loadWeekMenu();
    loadCurrentMeal();
  }, []);

  const loadWeekMenu = async () => {
    try {
      setLoading(true);
      const res = await getLunchMenuWeek();
      setWeekMenu(res.data?.data || []);
    } catch (error) {
      console.error('Error loading lunch menu:', error);
      alert('Failed to load lunch menu. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentMeal = async () => {
    try {
      const res = await getCurrentMeal();
      setCurrentMealInfo(res.data?.data || null);
    } catch (error) {
      console.error('Error loading current meal:', error);
    }
  };

  const getActiveDayMenu = () => {
    return weekMenu.find((d) => d.day === activeDay) || { day: activeDay, meals: [], is_active: true };
  };

  const openAddMealModal = () => {
    setEditingMeal(null);
    setFormData({
      meal_label: '',
      meal_name: '',
      time: '08:00',
      itemsText: '',
      description: '',
    });
    setShowModal(true);
  };

  const openEditMealModal = (meal) => {
    setEditingMeal({ mealId: meal._id });
    setFormData({
      meal_label: meal.meal_label || '',
      meal_name: meal.meal_name || '',
      time: meal.time || '08:00',
      itemsText: (meal.items || []).join(', '),
      description: meal.description || '',
    });
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingMeal(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const items = formData.itemsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (items.length === 0) {
      alert('Please enter at least one food item.');
      return;
    }
    if (!formData.time) {
      alert('Please set a time for this meal.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        meal_label: formData.meal_label || undefined,
        meal_name: formData.meal_name,
        time: formData.time,
        items,
        description: formData.description,
      };

      if (editingMeal) {
        await updateLunchMenuMeal(activeDay, editingMeal.mealId, payload);
        alert('Meal updated successfully!');
      } else {
        await addLunchMenuMeal(activeDay, payload);
        alert('Meal added successfully!');
      }

      await loadWeekMenu();
      await loadCurrentMeal();
      resetModal();
    } catch (error) {
      console.error('Error saving meal:', error);
      const msg = error.response?.data?.message || 'Failed to save meal. Please try again.';
      alert(msg);
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal slot?')) return;
    try {
      await deleteLunchMenuMeal(activeDay, mealId);
      await loadWeekMenu();
      await loadCurrentMeal();
      alert('Meal deleted successfully!');
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    }
  };

  const handleToggleDayActive = async (dayName, currentStatus) => {
    try {
      await toggleLunchMenuDayStatus(dayName, !currentStatus);
      await loadWeekMenu();
    } catch (error) {
      console.error('Error toggling day status:', error);
      alert('Failed to update day status.');
    }
  };

  const activeDayMenu = getActiveDayMenu();
  const sortedMeals = [...(activeDayMenu.meals || [])].sort((a, b) =>
    a.time > b.time ? 1 : a.time < b.time ? -1 : 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-amber-200 to-orange-200 rounded-2xl"></div>
          <div className="h-96 bg-white/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Lunch Menu
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Utensils size={18} className="text-amber-500 flex-shrink-0" />
                Day-wise meal schedule with timings for the whole week
              </p>
            </div>
            <button
              onClick={openAddMealModal}
              className="group relative px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              <div className="flex items-center gap-2 relative">
                <Plus size={20} />
                <span className="font-semibold">Add Meal to {activeDay}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Current Meal Banner */}
        {currentMealInfo?.current_meal && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 mb-8 shadow-lg text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-white/80">Happening now — {currentMealInfo.day}</p>
                <p className="text-lg font-bold truncate">
                  {currentMealInfo.current_meal.meal_label}
                  {currentMealInfo.current_meal.meal_name ? ` · ${currentMealInfo.current_meal.meal_name}` : ''}
                  {' '}at {formatTime12hr(currentMealInfo.current_meal.time)}
                </p>
                <p className="text-sm text-white/90 truncate">
                  {(currentMealInfo.current_meal.items || []).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Day Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 mb-8 shadow-lg overflow-x-auto">
          <div className="flex gap-2 min-w-max md:min-w-0">
            {DAYS.map((day) => {
              const dayData = weekMenu.find((d) => d.day === day);
              const mealCount = dayData?.meals?.length || 0;
              const isToday = day === getTodayName();
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeDay === day
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <CalendarDays size={16} />
                  {day.slice(0, 3)}
                  {isToday && (
                    <span className={`w-2 h-2 rounded-full ${activeDay === day ? 'bg-white' : 'bg-orange-500'}`}></span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeDay === day ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {mealCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Day Header + Active Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sun className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{activeDay}</h2>
              <p className="text-sm text-gray-500">
                {sortedMeals.length} meal{sortedMeals.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-gray-600">Menu Active</span>
            <input
              type="checkbox"
              checked={activeDayMenu.is_active !== false}
              onChange={() => handleToggleDayActive(activeDay, activeDayMenu.is_active !== false)}
              className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
          </label>
        </div>

        {/* Meals List (chronological) */}
        {sortedMeals.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
            <Utensils className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-lg text-gray-500">No meals scheduled for {activeDay} yet</p>
            <button
              onClick={openAddMealModal}
              className="mt-4 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus size={18} /> Add First Meal
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 to-orange-300 hidden md:block"></div>

            <div className="space-y-4">
              {sortedMeals.map((meal) => {
                const MealIcon = getMealIcon(meal.time);
                return (
                  <div key={meal._id} className="relative md:pl-16">
                    {/* Timeline dot */}
                    <div className="hidden md:flex absolute left-0 top-4 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full items-center justify-center shadow-lg z-10">
                      <MealIcon className="text-white" size={20} />
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 md:hidden">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MealIcon className="text-white" size={18} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                {meal.meal_label}
                              </span>
                              {meal.meal_name && (
                                <span className="font-bold text-gray-800">{meal.meal_name}</span>
                              )}
                              <span className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock size={14} />
                                {formatTime12hr(meal.time)}
                              </span>
                              {!meal.is_active && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full text-xs">Inactive</span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {(meal.items || []).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>

                            {meal.description && (
                              <p className="mt-2 text-sm text-gray-500 flex items-start gap-1">
                                <Info size={14} className="flex-shrink-0 mt-0.5" />
                                {meal.description}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openEditMealModal(meal)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit meal"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteMeal(meal._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete meal"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Meal Modal */}
        {showModal && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Utensils size={22} />
                  {editingMeal ? 'Edit Meal' : `Add Meal — ${activeDay}`}
                </h2>
                <button
                  onClick={resetModal}
                  disabled={isSubmitting}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors disabled:opacity-50"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Label
                      <span className="text-xs text-gray-400 ml-1">(e.g. "Meal 1")</span>
                    </label>
                    <input
                      type="text"
                      value={formData.meal_label}
                      onChange={(e) => setFormData({ ...formData, meal_label: e.target.value })}
                      disabled={isSubmitting}
                      placeholder="Auto: Meal 1, Meal 2..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Name
                    <span className="text-xs text-gray-400 ml-1">(e.g. "Breakfast", "Lunch", "Evening Snack")</span>
                  </label>
                  <input
                    type="text"
                    value={formData.meal_name}
                    onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="Optional friendly name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Items <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 ml-1">(comma-separated)</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.itemsText}
                    onChange={(e) => setFormData({ ...formData, itemsText: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="e.g. Vegetable Khichdi, Curd, Banana"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes / Description
                    <span className="text-xs text-gray-400 ml-1">(allergens, prep notes, etc.)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetModal}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingMeal ? 'Update Meal' : 'Add Meal'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}