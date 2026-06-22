export const FOOD_DATABASE = [
    {
        id: 'food_chicken_breast',
        name: '닭가슴살',
        baseWeight: 100, // g
        kcal: 110,
        carbs: 0,
        protein: 23,
        fat: 1.5
    },
    {
        id: 'food_brown_rice',
        name: '현미밥',
        baseWeight: 100,
        kcal: 150,
        carbs: 32,
        protein: 3,
        fat: 1
    },
    {
        id: 'food_pork_tenderloin',
        name: '돼지 안심',
        baseWeight: 100,
        kcal: 140,
        carbs: 0,
        protein: 21,
        fat: 5
    },
    {
        id: 'food_sweet_potato',
        name: '고구마 (찐 것)',
        baseWeight: 100,
        kcal: 130,
        carbs: 30,
        protein: 1.5,
        fat: 0.2
    },
    {
        id: 'food_tuna_canned',
        name: '참치캔 (기름 뺀 것)',
        baseWeight: 100,
        kcal: 150,
        carbs: 0,
        protein: 25,
        fat: 5
    },
    {
        id: 'food_egg',
        name: '계란 (1개 기준, 약 50g)',
        baseWeight: 50,
        kcal: 70,
        carbs: 0.5,
        protein: 6,
        fat: 5
    },
    {
        id: 'food_cabbage',
        name: '양배추',
        baseWeight: 100,
        kcal: 25,
        carbs: 6,
        protein: 1.3,
        fat: 0.1
    },
    {
        id: 'food_mushroom',
        name: '새송이버섯',
        baseWeight: 100,
        kcal: 24,
        carbs: 5,
        protein: 3,
        fat: 0.4
    },
    {
        id: 'food_tomato',
        name: '방울토마토',
        baseWeight: 100,
        kcal: 16,
        carbs: 4,
        protein: 0.9,
        fat: 0.2
    }
];

export const calculateMacros = (foodId, inputWeight) => {
    const food = FOOD_DATABASE.find(f => f.id === foodId);
    if (!food || !inputWeight) return { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    
    const ratio = Number(inputWeight) / food.baseWeight;
    return {
        kcal: Math.round(food.kcal * ratio),
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        protein: Math.round(food.protein * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10
    };
};
