import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
    Plus, 
    Trash2, 
    Flame, 
    Droplets, 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Utensils, 
    Coffee, 
    Sun, 
    Moon, 
    Apple, 
    Settings, 
    X,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../api/supabase';
import { getRecommendedDietTargets } from '../../utils/dietRecommendation';

// Helper to get date string in YYYY-MM-DD format
const getLocalDateString = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Helper to get default active category based on current local hour
const getActiveCategoryByTime = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 21) return 'dinner';
    return 'snack';
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DietScreen = () => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    
    // Diet Goals State (loaded from localStorage or default values)
    const [goals, setGoals] = useState(() => {
        const savedGoals = localStorage.getItem('mygym_diet_goals');
        if (savedGoals) {
            try {
                return JSON.parse(savedGoals);
            } catch (e) {
                // fall back to default
            }
        }
        return { kcal: 2000, carbs: 250, protein: 150, fat: 55 };
    });

    const [meals, setMeals] = useState([]);
    const [water, setWater] = useState(0);

    // Modals visibility
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

    // Active category for quick preset adds
    const [presetTargetCategory, setPresetTargetCategory] = useState(getActiveCategoryByTime());

    // Custom Food Form State
    const [customFoodForm, setCustomFoodForm] = useState({
        name: '',
        kcal: '',
        carbs: '',
        protein: '',
        fat: '',
        category: 'breakfast'
    });

    // Goals Form State
    const [goalsForm, setGoalsForm] = useState({ ...goals });

    // --- Weekly Diet Plan State Variables ---
    const [userId, setUserId] = useState(null);
    const [activeDietPlan, setActiveDietPlan] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    
    // Wizard State
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [wizardPlanName, setWizardPlanName] = useState('');
    const [wizardSelectedDay, setWizardSelectedDay] = useState('Monday');
    const [wizardPlanDays, setWizardPlanDays] = useState({
        Monday: { breakfast: [], lunch: [], dinner: [], snack: [] },
        Tuesday: { breakfast: [], lunch: [], dinner: [], snack: [] },
        Wednesday: { breakfast: [], lunch: [], dinner: [], snack: [] },
        Thursday: { breakfast: [], lunch: [], dinner: [], snack: [] },
        Friday: { breakfast: [], lunch: [], dinner: [], snack: [] },
        Saturday: { breakfast: [], lunch: [], dinner: [], snack: [] },
        Sunday: { breakfast: [], lunch: [], dinner: [], snack: [] }
    });

    // Wizard Modals
    const [isWizardAddFoodOpen, setIsWizardAddFoodOpen] = useState(false);
    const [wizardAddFoodTarget, setWizardAddFoodTarget] = useState({ day: 'Monday', category: 'breakfast' });
    
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [copySourceDay, setCopySourceDay] = useState('Monday');
    const [copyTargetDays, setCopyTargetDays] = useState([]);

    const [wizardCustomForm, setWizardCustomForm] = useState({
        name: '',
        kcal: '',
        carbs: '',
        protein: '',
        fat: ''
    });

    // Left Column Tab selection (in Dashboard mode)
    const [leftTab, setLeftTab] = useState('plan'); // 'plan' or 'presets'

    // Compute the weekday of the selectedDate
    const selectedWeekday = useMemo(() => {
        const d = new Date(selectedDate);
        const mapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return mapping[d.getDay()];
    }, [selectedDate]);

    // Helper to fetch user profile (merges local storage and DB profile)
    const getActiveProfile = async () => {
        const localInfo = localStorage.getItem('USER_BODY_INFO') || localStorage.getItem('mygym_user_body_info');
        let profile = null;
        if (localInfo) {
            try {
                profile = JSON.parse(localInfo);
            } catch (e) {}
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (data) {
                    profile = { ...profile, ...data };
                }
            }
        } catch (e) {
            console.error('Error fetching Supabase profile in diet:', e);
        }
        return profile;
    };

    // Load active_diet_plan from Supabase on mount
    const loadActiveDietPlan = async () => {
        setIsLoadingProfile(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('active_diet_plan')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (error) throw error;
                if (data && data.active_diet_plan) {
                    setActiveDietPlan(data.active_diet_plan);
                } else {
                    setActiveDietPlan(null);
                }
            }
        } catch (e) {
            console.error('Error loading active diet plan:', e);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        loadActiveDietPlan();
    }, []);

    // Save active_diet_plan to Supabase
    const saveActiveDietPlan = async (updatedPlan) => {
        try {
            const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
            if (!currentUserId) {
                toast.error(t('common.loginRequired') || '로그인이 필요합니다.');
                return;
            }
            
            const { error } = await supabase
                .from('user_profiles')
                .update({ active_diet_plan: updatedPlan })
                .eq('user_id', currentUserId);
            
            if (error) throw error;
            setActiveDietPlan(updatedPlan);
        } catch (error) {
            console.error('Error saving active diet plan:', error);
            toast.error(t('common.saveFailed') || '저장에 실패했습니다.');
            throw error;
        }
    };

    const handleApplyRecommendations = async () => {
        try {
            const profile = await getActiveProfile();
            
            // Check if profile is incomplete
            if (!profile || !profile.gender || !profile.age || !profile.height || !profile.weight) {
                toast.error(t('diet.incompleteProfileWarning'));
                return;
            }

            // Generate recommendations
            const targets = getRecommendedDietTargets({
                gender: profile.gender,
                age: profile.age,
                height: profile.height,
                weight: profile.weight,
                activityLevel: profile.activity_level || 'sedentary',
                goal: profile.goal || (profile.goals && profile.goals[0]) || 'strength'
            });

            if (!targets) {
                toast.error(t('diet.incompleteProfileWarning'));
                return;
            }

            // Auto-fill target inputs in the form
            setGoalsForm({
                kcal: targets.calories,
                carbs: targets.carbs,
                protein: targets.protein,
                fat: targets.fat
            });

            // Save automatically to state & localStorage
            const updatedGoals = {
                kcal: targets.calories,
                carbs: targets.carbs,
                protein: targets.protein,
                fat: targets.fat
            };
            setGoals(updatedGoals);
            localStorage.setItem('mygym_diet_goals', JSON.stringify(updatedGoals));
            
            toast.success(t('diet.recommendationApplied'));
        } catch (e) {
            console.error('Error applying recommendations:', e);
            toast.error(t('common.retry'));
        }
    };

    // Load meals and water for the selected date
    useEffect(() => {
        const savedData = localStorage.getItem(`mygym_diet_${selectedDate}`);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setMeals(parsed.meals || []);
                setWater(parsed.water || 0);
            } catch (e) {
                setMeals([]);
                setWater(0);
            }
        } else {
            setMeals([]);
            setWater(0);
        }
    }, [selectedDate]);

    // Save meals and water to localStorage
    const saveData = (updatedMeals, updatedWater) => {
        localStorage.setItem(
            `mygym_diet_${selectedDate}`,
            JSON.stringify({ meals: updatedMeals, water: updatedWater })
        );
    };

    // --- Wizard Actions ---
    const addPresetToWizard = (preset) => {
        const { day, category } = wizardAddFoodTarget;
        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            nameKey: preset.nameKey,
            name: preset.defaultName,
            kcal: preset.kcal,
            carbs: preset.carbs,
            protein: preset.protein,
            fat: preset.fat
        };
        
        setWizardPlanDays(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [category]: [...prev[day][category], newItem]
            }
        }));
        setIsWizardAddFoodOpen(false);
        toast.success(`${t(preset.nameKey)} added to ${t(`diet.${day.toLowerCase()}`)} ${t(`diet.${category}`)}`);
    };

    const handleWizardCustomSubmit = (e) => {
        e.preventDefault();
        if (!wizardCustomForm.name.trim()) {
            toast.error(t('diet.foodNameRequired') || '음식명을 입력해주세요.');
            return;
        }
        
        const { day, category } = wizardAddFoodTarget;
        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: wizardCustomForm.name.trim(),
            kcal: Number(wizardCustomForm.kcal) || 0,
            carbs: Number(wizardCustomForm.carbs) || 0,
            protein: Number(wizardCustomForm.protein) || 0,
            fat: Number(wizardCustomForm.fat) || 0
        };
        
        setWizardPlanDays(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [category]: [...prev[day][category], newItem]
            }
        }));
        
        // Reset custom form
        setWizardCustomForm({ name: '', kcal: '', carbs: '', protein: '', fat: '' });
        setIsWizardAddFoodOpen(false);
        toast.success(`${newItem.name} added to ${t(`diet.${day.toLowerCase()}`)} ${t(`diet.${category}`)}`);
    };

    const handleConfirmCopy = () => {
        if (copyTargetDays.length === 0) {
            toast.error(t('diet.noDaysSelected') || '복사할 요일을 선택해주세요.');
            return;
        }
        
        setWizardPlanDays(prev => {
            const updated = { ...prev };
            const sourceData = JSON.parse(JSON.stringify(prev[copySourceDay]));
            copyTargetDays.forEach(day => {
                updated[day] = JSON.parse(JSON.stringify(sourceData));
            });
            return updated;
        });
        
        setIsCopyModalOpen(false);
        toast.success(t('diet.copySuccess') || '복사 완료!');
    };

    const handleStartDietPlan = async () => {
        if (!wizardPlanName.trim()) {
            toast.error(t('diet.planNamePlaceholder') || '계획 이름을 입력해주세요.');
            return;
        }
        
        let hasFoods = false;
        Object.keys(wizardPlanDays).forEach(day => {
            ['breakfast', 'lunch', 'dinner', 'snack'].forEach(cat => {
                if (wizardPlanDays[day][cat].length > 0) {
                    hasFoods = true;
                }
            });
        });
        
        if (!hasFoods) {
            toast.error(t('diet.noFoodsPlanned') || '계획된 음식이 없습니다.');
            return;
        }
        
        const newPlan = {
            name: wizardPlanName.trim(),
            days: wizardPlanDays,
            history: {},
            createdAt: new Date().toISOString()
        };
        
        try {
            await saveActiveDietPlan(newPlan);
            toast.success(t('diet.planStarted') || '식단 계획이 시작되었습니다!');
            setIsCreatingPlan(false);
        } catch (e) {
            console.error("Error starting plan:", e);
        }
    };

    // --- Dashboard Actions ---
    const handleEatCategory = async (category) => {
        if (!activeDietPlan) return;
        
        const weekday = selectedWeekday;
        const plannedFoods = activeDietPlan.days?.[weekday]?.[category] || [];
        
        if (plannedFoods.length === 0) {
            toast.info(t('diet.noFoodsPlanned') || '계획된 음식이 없습니다.');
            return;
        }
        
        const clonedMeals = plannedFoods.map(food => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: food.name,
            nameKey: food.nameKey,
            kcal: food.kcal,
            carbs: food.carbs,
            protein: food.protein,
            fat: food.fat,
            category: category
        }));
        
        const updatedMeals = [...meals, ...clonedMeals];
        setMeals(updatedMeals);
        saveData(updatedMeals, water);
        
        const updatedHistory = {
            ...(activeDietPlan.history || {})
        };
        if (!updatedHistory[selectedDate]) {
            updatedHistory[selectedDate] = {};
        }
        updatedHistory[selectedDate][category] = true;
        
        const updatedPlan = {
            ...activeDietPlan,
            history: updatedHistory
        };
        
        try {
            await saveActiveDietPlan(updatedPlan);
            toast.success(t('diet.planSaved') || '식단 기록이 완료되었습니다.');
        } catch (e) {
            console.error("Error eating category:", e);
        }
    };

    const handleEatAllPlannedMeals = async () => {
        if (!activeDietPlan) return;
        
        const weekday = selectedWeekday;
        const dayPlan = activeDietPlan.days?.[weekday] || {};
        
        let clonedMeals = [];
        const updatedHistoryForDate = { ...(activeDietPlan.history?.[selectedDate] || {}) };
        
        let addedAny = false;
        
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(category => {
            if (!updatedHistoryForDate[category]) {
                const foods = dayPlan[category] || [];
                if (foods.length > 0) {
                    foods.forEach(food => {
                        clonedMeals.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            name: food.name,
                            nameKey: food.nameKey,
                            kcal: food.kcal,
                            carbs: food.carbs,
                            protein: food.protein,
                            fat: food.fat,
                            category: category
                        });
                    });
                    updatedHistoryForDate[category] = true;
                    addedAny = true;
                }
            }
        });
        
        if (!addedAny) {
            toast.info(t('diet.alreadyEaten') || '이미 오늘 계획된 식단을 다 드셨습니다.');
            return;
        }
        
        const updatedMeals = [...meals, ...clonedMeals];
        setMeals(updatedMeals);
        saveData(updatedMeals, water);
        
        const updatedHistory = {
            ...(activeDietPlan.history || {}),
            [selectedDate]: updatedHistoryForDate
        };
        
        const updatedPlan = {
            ...activeDietPlan,
            history: updatedHistory
        };
        
        try {
            await saveActiveDietPlan(updatedPlan);
            toast.success(t('diet.planSaved') || '식단 기록이 완료되었습니다.');
        } catch (e) {
            console.error("Error eating all planned meals:", e);
        }
    };

    const handleQuitPlan = async () => {
        if (!window.confirm(t('diet.quitPlanConfirm'))) return;
        
        try {
            await saveActiveDietPlan(null);
            toast.success(t('diet.planQuit'));
        } catch (e) {
            console.error("Error quitting plan:", e);
        }
    };

    // Calculate daily intake totals
    const totals = useMemo(() => {
        return meals.reduce((acc, meal) => {
            acc.kcal += Number(meal.kcal || 0);
            acc.carbs += Number(meal.carbs || 0);
            acc.protein += Number(meal.protein || 0);
            acc.fat += Number(meal.fat || 0);
            return acc;
        }, { kcal: 0, carbs: 0, protein: 0, fat: 0 });
    }, [meals]);

    // Date Navigation helpers
    const handlePrevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(getLocalDateString(d));
    };

    const handleNextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(getLocalDateString(d));
    };

    // Water Log handler (+250ml)
    const handleAddWater = () => {
        const newWater = water + 250;
        setWater(newWater);
        saveData(meals, newWater);
        toast.success(`+250ml ${t('diet.water')}`);
    };

    // Water Log handler (-250ml)
    const handleRemoveWater = () => {
        if (water <= 0) return;
        const newWater = Math.max(0, water - 250);
        setWater(newWater);
        saveData(meals, newWater);
        toast.info(`-250ml ${t('diet.water')}`);
    };

    // Quick Log Presets list
    const presets = [
        {
            nameKey: 'diet.chickenBreast',
            defaultName: '닭가슴살 100g',
            kcal: 120,
            carbs: 0,
            protein: 23,
            fat: 3
        },
        {
            nameKey: 'diet.rice',
            defaultName: '햇반 200g',
            kcal: 300,
            carbs: 65,
            protein: 6,
            fat: 1
        },
        {
            nameKey: 'diet.proteinShake',
            defaultName: '프로틴 쉐이크',
            kcal: 150,
            carbs: 3,
            protein: 25,
            fat: 2
        },
        {
            nameKey: 'diet.sweetPotato',
            defaultName: '고구마 150g',
            kcal: 130,
            carbs: 30,
            protein: 2,
            fat: 0
        }
    ];

    // Log Preset Item
    const handleAddPreset = (preset) => {
        const newMeal = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            nameKey: preset.nameKey,
            name: preset.defaultName,
            kcal: preset.kcal,
            carbs: preset.carbs,
            protein: preset.protein,
            fat: preset.fat,
            category: presetTargetCategory
        };
        const updatedMeals = [...meals, newMeal];
        setMeals(updatedMeals);
        saveData(updatedMeals, water);
        toast.success(`${t(preset.nameKey)} -> ${t(`diet.${presetTargetCategory}`)}`);
    };

    // Delete logged item
    const handleDeleteMeal = (mealId) => {
        const updatedMeals = meals.filter(m => m.id !== mealId);
        setMeals(updatedMeals);
        saveData(updatedMeals, water);
        toast.info(t('common.save') === '수정' ? '식단이 삭제되었습니다.' : 'Meal deleted.');
    };

    // Custom Food Modal Submit handler
    const handleCustomFoodSubmit = (e) => {
        e.preventDefault();
        if (!customFoodForm.name.trim()) {
            toast.error(t('diet.foodName'));
            return;
        }

        const newMeal = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: customFoodForm.name.trim(),
            kcal: Number(customFoodForm.kcal) || 0,
            carbs: Number(customFoodForm.carbs) || 0,
            protein: Number(customFoodForm.protein) || 0,
            fat: Number(customFoodForm.fat) || 0,
            category: customFoodForm.category
        };

        const updatedMeals = [...meals, newMeal];
        setMeals(updatedMeals);
        saveData(updatedMeals, water);
        
        // Reset form & close modal
        setCustomFoodForm({
            name: '',
            kcal: '',
            carbs: '',
            protein: '',
            fat: '',
            category: presetTargetCategory
        });
        setIsCustomModalOpen(false);
        toast.success(`${newMeal.name} -> ${t(`diet.${newMeal.category}`)}`);
    };

    // Goals Modal Submit handler
    const handleGoalsSubmit = (e) => {
        e.preventDefault();
        const updatedGoals = {
            kcal: Number(goalsForm.kcal) || 2000,
            carbs: Number(goalsForm.carbs) || 250,
            protein: Number(goalsForm.protein) || 150,
            fat: Number(goalsForm.fat) || 55
        };
        setGoals(updatedGoals);
        localStorage.setItem('mygym_diet_goals', JSON.stringify(updatedGoals));
        setIsGoalsModalOpen(false);
        toast.success(t('common.save') === '수정' ? '목표가 설정되었습니다.' : 'Goals updated successfully.');
    };

    // Setup Recharts Donut data
    const chartData = useMemo(() => {
        const consumed = totals.kcal;
        const remaining = Math.max(0, goals.kcal - consumed);
        if (consumed === 0) {
            return [
                { name: 'Remaining', value: goals.kcal, color: '#1e293b' } // Slate-800 empty color
            ];
        }
        return [
            { name: t('diet.intake'), value: consumed, color: '#ec4899' }, // Rose/Pink progress
            { name: t('diet.remaining'), value: remaining, color: '#1e293b' }
        ];
    }, [totals.kcal, goals.kcal, t]);

    // Macronutrient details
    const macroProgress = useMemo(() => {
        return [
            {
                key: 'carbs',
                label: t('diet.carbs'),
                current: totals.carbs,
                target: goals.carbs,
                colorClass: 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/20',
                textColor: 'text-blue-400',
                bgClass: 'bg-blue-950/40'
            },
            {
                key: 'protein',
                label: t('diet.protein'),
                current: totals.protein,
                target: goals.protein,
                colorClass: 'bg-gradient-to-r from-rose-600 to-pink-500 shadow-rose-500/20',
                textColor: 'text-rose-400',
                bgClass: 'bg-rose-950/40'
            },
            {
                key: 'fat',
                label: t('diet.fat'),
                current: totals.fat,
                target: goals.fat,
                colorClass: 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-amber-500/20',
                textColor: 'text-amber-400',
                bgClass: 'bg-amber-950/40'
            }
        ];
    }, [totals, goals, t]);

    // Group meals by category
    const groupedMeals = useMemo(() => {
        const groups = {
            breakfast: { name: t('diet.breakfast'), icon: <Coffee className="w-5 h-5 text-amber-400" />, items: [] },
            lunch: { name: t('diet.lunch'), icon: <Sun className="w-5 h-5 text-blue-400" />, items: [] },
            dinner: { name: t('diet.dinner'), icon: <Moon className="w-5 h-5 text-rose-400" />, items: [] },
            snack: { name: t('diet.snack'), icon: <Apple className="w-5 h-5 text-emerald-400" />, items: [] }
        };

        meals.forEach(meal => {
            const cat = meal.category || 'snack';
            if (groups[cat]) {
                groups[cat].items.push(meal);
            } else {
                groups.snack.items.push(meal);
            }
        });

        return Object.entries(groups).map(([id, group]) => {
            const groupKcal = group.items.reduce((sum, item) => sum + Number(item.kcal || 0), 0);
            return {
                id,
                ...group,
                subtotalKcal: groupKcal
            };
        });
    }, [meals, t]);

    return (
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-28">
            <h1 className="text-3xl font-black italic text-white uppercase underline decoration-blue-500 decoration-4 underline-offset-8 mb-8 flex items-center justify-center gap-3">
                <Apple className="text-blue-500 w-8 h-8" />
                {t('nav.diet', { defaultValue: '식단' })}
            </h1>
            
            {/* Header Date Selector */}
            <div className="flex items-center justify-between bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-4 mb-6">
                <button 
                    onClick={handlePrevDay} 
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('diet.title')}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white font-black text-base focus:outline-none cursor-pointer text-center"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleNextDay} 
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Top Dashboard Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                
                {/* Donut & Macros Dashboard */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                    <div className="absolute top-4 right-4 z-10">
                        <button 
                            onClick={() => {
                                setGoalsForm({ ...goals });
                                setIsGoalsModalOpen(true);
                            }}
                            className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all active:scale-95"
                            title={t('diet.editGoals')}
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Donut Chart Container */}
                    <div className="relative w-44 h-44 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('diet.calories')}</span>
                            <span className="text-2xl font-black text-white">{totals.kcal.toLocaleString()}</span>
                            <div className="w-6 h-[1.5px] bg-slate-800 my-0.5"></div>
                            <span className="text-[10px] text-slate-500">{t('diet.goal')} {goals.kcal}</span>
                        </div>
                    </div>

                    {/* Right: Calories Detail & Macros progress */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                                    <Flame className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
                                    {goals.kcal - totals.kcal >= 0 ? (
                                        <span>{(goals.kcal - totals.kcal).toLocaleString()} kcal {t('diet.remaining')}</span>
                                    ) : (
                                        <span className="text-rose-500">{(totals.kcal - goals.kcal).toLocaleString()} kcal 초과</span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{t('diet.title')}</p>
                            </div>
                        </div>

                        {/* Macros progress bars */}
                        <div className="space-y-3 pt-2">
                            {macroProgress.map((macro) => {
                                const percent = Math.min(100, macro.target > 0 ? Math.round((macro.current / macro.target) * 100) : 0);
                                return (
                                    <div key={macro.key} className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className={`font-black ${macro.textColor}`}>{macro.label}</span>
                                            <span className="text-slate-400 font-medium">
                                                <strong className="text-white font-bold">{macro.current}g</strong> / {macro.target}g ({percent}%)
                                            </span>
                                        </div>
                                        <div className={`h-2.5 w-full ${macro.bgClass} rounded-full overflow-hidden`}>
                                            <div 
                                                className={`h-full ${macro.colorClass} rounded-full transition-all duration-700 ease-out`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Water tracker section */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                                <Droplets className="w-4 h-4 text-blue-400 fill-blue-500" />
                                {t('diet.water')}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">{t('diet.waterGoal')}</p>
                        </div>
                        <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/10">
                            {Math.round((water / 2000) * 100)}%
                        </span>
                    </div>

                    <div className="flex items-center gap-6 my-2">
                        {/* Interactive Cup */}
                        <div 
                            onClick={handleAddWater}
                            className="relative w-20 h-24 bg-slate-950/80 border border-white/10 rounded-b-2xl rounded-t-sm overflow-hidden flex items-end justify-center shadow-inner group cursor-pointer hover:border-blue-500/30 transition-all active:scale-95"
                            title="Tap to log +250ml"
                        >
                            <div 
                                className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-500 ease-out relative"
                                style={{ height: `${Math.min(100, (water / 2000) * 100)}%` }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                <span className="text-lg font-black text-white drop-shadow-md">{water}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase drop-shadow-md">ml</span>
                            </div>
                        </div>

                        {/* Adjust buttons */}
                        <div className="flex-1 flex flex-col gap-2">
                            <button
                                onClick={handleAddWater}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                            >
                                +250ml
                            </button>
                            <button
                                onClick={handleRemoveWater}
                                disabled={water <= 0}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none active:scale-98 text-slate-300 font-bold text-xs rounded-xl transition-all"
                            >
                                -250ml
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Weekly Plan Banner (if not started and not in wizard) */}
            {!activeDietPlan && !isCreatingPlan && (
                <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/10 backdrop-blur-md rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shrink-0">
                            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white">{t('diet.weeklyPlan')}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{t('diet.planTab')}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setWizardPlanName('');
                            setWizardPlanDays({
                                Monday: { breakfast: [], lunch: [], dinner: [], snack: [] },
                                Tuesday: { breakfast: [], lunch: [], dinner: [], snack: [] },
                                Wednesday: { breakfast: [], lunch: [], dinner: [], snack: [] },
                                Thursday: { breakfast: [], lunch: [], dinner: [], snack: [] },
                                Friday: { breakfast: [], lunch: [], dinner: [], snack: [] },
                                Saturday: { breakfast: [], lunch: [], dinner: [], snack: [] },
                                Sunday: { breakfast: [], lunch: [], dinner: [], snack: [] }
                            });
                            setWizardSelectedDay('Monday');
                            setIsCreatingPlan(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition-all whitespace-nowrap active:scale-95"
                    >
                        {t('diet.createPlan')}
                    </button>
                </div>
            )}

            {/* Presets and Log Grid OR Diet Plan Wizard */}
            {!activeDietPlan && isCreatingPlan ? (
                /* Diet Plan Wizard UI */
                <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
                        <div>
                            <h3 className="text-lg font-black text-white">{t('diet.weeklyPlan')}</h3>
                            <p className="text-xs text-slate-400 mt-1">{t('diet.createPlan')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreatingPlan(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                            >
                                {t('diet.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleStartDietPlan}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                            >
                                {t('diet.startPlan')}
                            </button>
                        </div>
                    </div>

                    {/* Plan Name Input */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                            {t('diet.planName')}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={t('diet.planNamePlaceholder')}
                            value={wizardPlanName}
                            onChange={(e) => setWizardPlanName(e.target.value)}
                            className="w-full max-w-md bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                        />
                    </div>

                    {/* Weekday selector */}
                    <div className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-xl border border-white/5 mb-6">
                        {WEEKDAYS.map((day) => {
                            const hasMeals = ['breakfast', 'lunch', 'dinner', 'snack'].some(cat => wizardPlanDays[day][cat].length > 0);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => setWizardSelectedDay(day)}
                                    className={`flex-1 min-w-[70px] py-2.5 rounded-lg text-xs font-black tracking-tighter uppercase transition-all ${
                                        wizardSelectedDay === day
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    {t(`diet.${day.toLowerCase()}`)}
                                    {hasMeals && <span className="ml-1 text-[8px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">✓</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected Day template builder */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['breakfast', 'lunch', 'dinner', 'snack'].map((category) => {
                            const items = wizardPlanDays[wizardSelectedDay][category] || [];
                            const categoryKcal = items.reduce((sum, it) => sum + Number(it.kcal || 0), 0);
                            
                            return (
                                <div key={category} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                                    <div>
                                        {/* Header */}
                                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                                            <span className="text-xs font-black text-white uppercase">{t(`diet.${category}`)}</span>
                                            <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                                {categoryKcal} kcal
                                            </span>
                                        </div>

                                        {/* List of items */}
                                        <div className="space-y-2 mb-4">
                                            {items.length === 0 ? (
                                                <p className="text-[10px] text-slate-600 italic py-4 text-center">{t('diet.noPlannedMealsToday')}</p>
                                            ) : (
                                                items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-900 border border-white/5 rounded-lg">
                                                        <div className="min-w-0 flex-1 pr-2">
                                                            <p className="text-[10px] font-bold text-white truncate">
                                                                {item.nameKey ? t(item.nameKey) : item.name}
                                                            </p>
                                                            <p className="text-[8px] text-slate-500 mt-0.5">
                                                                {item.kcal} kcal • C {item.carbs}g • P {item.protein}g • F {item.fat}g
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setWizardPlanDays(prev => ({
                                                                    ...prev,
                                                                    [wizardSelectedDay]: {
                                                                        ...prev[wizardSelectedDay],
                                                                        [category]: prev[wizardSelectedDay][category].filter(it => it.id !== item.id)
                                                                    }
                                                                }));
                                                            }}
                                                            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWizardAddFoodTarget({ day: wizardSelectedDay, category });
                                            setIsWizardAddFoodOpen(true);
                                        }}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-lg border border-white/5 hover:text-white transition-all flex items-center justify-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        {t('diet.add')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Day footer options */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setCopySourceDay(wizardSelectedDay);
                                setCopyTargetDays([]);
                                setIsCopyModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-white/10 hover:text-white transition-all"
                        >
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            {t('diet.copyToOtherDays')}
                        </button>
                    </div>
                </div>
            ) : (
                /* Main Log & Preset/Plan split layout */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: Preset list OR Active Plan dashboard */}
                    <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 flex flex-col">
                        
                        {activeDietPlan ? (
                            /* Sub-tabs if active plan is present */
                            <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-white/5 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setLeftTab('plan')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-tighter uppercase transition-all ${
                                        leftTab === 'plan'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    {t('diet.planTab')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeftTab('presets')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-tighter uppercase transition-all ${
                                        leftTab === 'presets'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    {t('diet.mealsTab')}
                                </button>
                            </div>
                        ) : (
                            <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5 mb-4">
                                <Sparkles className="w-4 h-4 text-rose-400 fill-rose-500" />
                                {t('diet.presetTitle')}
                            </h4>
                        )}

                        {activeDietPlan && leftTab === 'plan' ? (
                            /* Diet Plan Dashboard */
                            <div className="flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <h4 className="text-sm font-black text-white truncate" title={activeDietPlan.name}>
                                            {activeDietPlan.name}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {t('diet.todayWeekday', { day: t(`diet.${selectedWeekday.toLowerCase()}`) })}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/10 shrink-0">
                                        {t('diet.currentPlan')}
                                    </span>
                                </div>

                                {/* Eat Today's Planned Meals Button */}
                                <button
                                    type="button"
                                    onClick={handleEatAllPlannedMeals}
                                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all mb-4"
                                >
                                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                                    {t('diet.eatAllPlanned')}
                                </button>

                                {/* List of planned categories */}
                                <div className="space-y-3 flex-1">
                                    {['breakfast', 'lunch', 'dinner', 'snack'].map((category) => {
                                        const plannedFoods = activeDietPlan.days?.[selectedWeekday]?.[category] || [];
                                        const isCategoryEaten = activeDietPlan.history?.[selectedDate]?.[category] === true;
                                        const categoryKcal = plannedFoods.reduce((sum, f) => sum + Number(f.kcal || 0), 0);
                                        
                                        return (
                                            <div key={category} className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-white uppercase">{t(`diet.${category}`)}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] text-slate-400">{categoryKcal} kcal</span>
                                                        {plannedFoods.length > 0 && (
                                                            <button
                                                                type="button"
                                                                disabled={isCategoryEaten}
                                                                onClick={() => handleEatCategory(category)}
                                                                className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${
                                                                    isCategoryEaten
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/5 hover:border-white/10 active:scale-95'
                                                                }`}
                                                            >
                                                                {isCategoryEaten ? t('diet.alreadyEaten') : t('diet.eatCategory')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Planned Foods under this category */}
                                                {plannedFoods.length === 0 ? (
                                                    <p className="text-[9px] text-slate-600 italic">{t('diet.noPlannedMealsToday')}</p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {plannedFoods.map((food, idx) => (
                                                            <div key={idx} className="flex justify-between text-[10px] text-slate-400 pl-1">
                                                                <span className="truncate max-w-[120px]">{food.nameKey ? t(food.nameKey) : food.name}</span>
                                                                <span>{food.kcal} kcal</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Quit Plan Button */}
                                <button
                                    type="button"
                                    onClick={handleQuitPlan}
                                    className="mt-6 w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10 hover:border-red-500/20 font-bold text-xs rounded-xl transition-all"
                                >
                                    {t('diet.quitPlan')}
                                </button>
                            </div>
                        ) : (
                            /* Quick Log Presets List (rendered when leftTab === 'presets' or when no plan is active) */
                            <div className="flex flex-col flex-1">
                                {/* Meal category target for presets */}
                                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-white/5 mb-4">
                                    {['breakfast', 'lunch', 'dinner', 'snack'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setPresetTargetCategory(cat)}
                                            className={`py-1.5 rounded-lg text-[10px] font-black tracking-tighter uppercase transition-all ${
                                                presetTargetCategory === cat
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {t(`diet.${cat}`)}
                                        </button>
                                    ))}
                                </div>

                                {/* Presets Buttons */}
                                <div className="space-y-2.5 flex-1">
                                    {presets.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddPreset(p)}
                                            className="w-full flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-800/40 border border-white/5 hover:border-blue-500/20 rounded-xl text-left transition-all active:scale-98 group"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {t(p.nameKey)}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                    C {p.carbs}g • P {p.protein}g • F {p.fat}g
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg">
                                                    +{p.kcal} kcal
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomFoodForm(prev => ({ ...prev, category: presetTargetCategory }));
                                        setIsCustomModalOpen(true);
                                    }}
                                    className="mt-6 w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-white/10 hover:border-white/20 text-slate-300 font-bold text-xs rounded-xl transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('diet.customFood')}
                                </button>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Daily Log list by Meal Category */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                                <Utensils className="w-4 h-4 text-blue-400" />
                                {t('diet.dailyLog')}
                            </h3>
                            <span className="text-xs font-bold text-slate-400">
                                {t('diet.intake')}: <strong className="text-rose-400">{totals.kcal} kcal</strong>
                            </span>
                        </div>

                        {meals.length === 0 ? (
                            <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-3xl p-12 text-center">
                                <Utensils className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-500">{t('diet.noLogs')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {groupedMeals.map((group) => {
                                    if (group.items.length === 0) return null;
                                    return (
                                        <div 
                                            key={group.id}
                                            className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-5"
                                        >
                                            {/* Category Header */}
                                            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    {group.icon}
                                                    <span className="text-sm font-black text-white">{group.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/5">
                                                    {group.subtotalKcal} kcal
                                                </span>
                                            </div>

                                            {/* Logged items in category */}
                                            <div className="space-y-2">
                                                {group.items.map((item) => {
                                                    const displayName = item.nameKey ? t(item.nameKey) : item.name;
                                                    return (
                                                        <div 
                                                            key={item.id}
                                                            className="flex items-center justify-between p-2.5 bg-slate-950/20 border border-white/5 rounded-xl group"
                                                        >
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <div className="flex items-baseline gap-2">
                                                                    <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                                                                        {displayName}
                                                                    </p>
                                                                    <span className="text-[10px] text-rose-400 font-black shrink-0">
                                                                        {item.kcal} kcal
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                                    C {item.carbs}g • P {item.protein}g • F {item.fat}g
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteMeal(item.id)}
                                                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title={t('diet.delete')}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* Modal: Custom Food Entry */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
                        <button 
                            type="button"
                            onClick={() => setIsCustomModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <Plus className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-base font-black text-white">{t('diet.addCustomFood')}</h3>
                        </div>

                        <form onSubmit={handleCustomFoodSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                    {t('diet.foodName')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 닭고기 볶음밥"
                                    value={customFoodForm.name}
                                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.kcal')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={customFoodForm.kcal}
                                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, kcal: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.category')}
                                    </label>
                                    <select
                                        value={customFoodForm.category}
                                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="breakfast">{t('diet.breakfast')}</option>
                                        <option value="lunch">{t('diet.lunch')}</option>
                                        <option value="dinner">{t('diet.dinner')}</option>
                                        <option value="snack">{t('diet.snack')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.carbs')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={customFoodForm.carbs}
                                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, carbs: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.protein')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={customFoodForm.protein}
                                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, protein: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.fat')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={customFoodForm.fat}
                                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, fat: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                            >
                                {t('diet.add')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Goals */}
            {isGoalsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
                        <button 
                            type="button"
                            onClick={() => setIsGoalsModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <Settings className="w-5 h-5 text-rose-400" />
                            </div>
                            <h3 className="text-base font-black text-white">{t('diet.editGoals')}</h3>
                        </div>

                        <form onSubmit={handleGoalsSubmit} className="space-y-4">
                            <button
                                type="button"
                                onClick={handleApplyRecommendations}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl shadow-md border border-white/5 active:scale-98"
                            >
                                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
                                <span>{t('diet.applyRecommendation')}</span>
                            </button>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                    {t('diet.targetKcal')}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={goalsForm.kcal}
                                    onChange={(e) => setGoalsForm({ ...goalsForm, kcal: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.targetCarbs')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={goalsForm.carbs}
                                        onChange={(e) => setGoalsForm({ ...goalsForm, carbs: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.targetProtein')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={goalsForm.protein}
                                        onChange={(e) => setGoalsForm({ ...goalsForm, protein: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.targetFat')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={goalsForm.fat}
                                        onChange={(e) => setGoalsForm({ ...goalsForm, fat: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                            >
                                {t('common.save') === '수정' ? '저장' : 'Save'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Wizard Add Food Entry */}
            {isWizardAddFoodOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
                        <button 
                            type="button"
                            onClick={() => setIsWizardAddFoodOpen(false)}
                            className="absolute top-4 right-4 p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <Plus className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-base font-black text-white">
                                {t('diet.addFoodToPlan')} ({t(`diet.${wizardAddFoodTarget.day.toLowerCase()}`)} - {t(`diet.${wizardAddFoodTarget.category}`)})
                            </h3>
                        </div>

                        {/* Presets List in Wizard */}
                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                                {t('diet.presetTitle')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {presets.map((p, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => addPresetToWizard(p)}
                                        className="p-3 bg-slate-950/60 hover:bg-slate-800 border border-white/5 rounded-xl text-left transition-all active:scale-95 group"
                                    >
                                        <p className="text-[10px] font-bold text-white group-hover:text-blue-400 truncate">
                                            {t(p.nameKey)}
                                        </p>
                                        <p className="text-[8px] text-slate-500 mt-1">
                                            {p.kcal} kcal • C {p.carbs}g • P {p.protein}g • F {p.fat}g
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full h-px bg-white/5 my-4" />

                        {/* Custom Food in Wizard */}
                        <form 
                            onSubmit={handleWizardCustomSubmit} 
                            className="space-y-4"
                        >
                            <h4 className="text-xs font-black text-white">{t('diet.customFood')}</h4>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                    {t('diet.foodName')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Chicken breast salad"
                                    value={wizardCustomForm.name}
                                    onChange={(e) => setWizardCustomForm({ ...wizardCustomForm, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.kcal')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={wizardCustomForm.kcal}
                                        onChange={(e) => setWizardCustomForm({ ...wizardCustomForm, kcal: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.carbs')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={wizardCustomForm.carbs}
                                        onChange={(e) => setWizardCustomForm({ ...wizardCustomForm, carbs: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.protein')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={wizardCustomForm.protein}
                                        onChange={(e) => setWizardCustomForm({ ...wizardCustomForm, protein: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                        {t('diet.fat')} (g)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={wizardCustomForm.fat}
                                        onChange={(e) => setWizardCustomForm({ ...wizardCustomForm, fat: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                            >
                                {t('diet.add')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Wizard Copy Template Days */}
            {isCopyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
                        <button 
                            type="button"
                            onClick={() => setIsCopyModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h3 className="text-base font-black text-white">{t('diet.copyTargetDays')}</h3>
                        </div>

                        <p className="text-xs text-slate-400 mb-4">
                            Copying {t(`diet.${copySourceDay.toLowerCase()}`)}'s planned meals to:
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {WEEKDAYS.filter(d => d !== copySourceDay).map(day => {
                                const isChecked = copyTargetDays.includes(day);
                                return (
                                    <label 
                                        key={day} 
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                                            isChecked 
                                                ? 'bg-blue-600/10 border-blue-500 text-white' 
                                                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setCopyTargetDays([...copyTargetDays, day]);
                                                } else {
                                                    setCopyTargetDays(copyTargetDays.filter(d => d !== day));
                                                }
                                            }}
                                            className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50 w-4 h-4"
                                        />
                                        <span className="text-xs font-bold">{t(`diet.${day.toLowerCase()}`)}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsCopyModalOpen(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                            >
                                {t('diet.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCopy}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                            >
                                {t('diet.copy')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DietScreen;
