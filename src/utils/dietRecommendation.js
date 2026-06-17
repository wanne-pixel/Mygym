/**
 * Calculates BMR using the Mifflin-St Jeor equation.
 * Men: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) + 5
 * Women: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) - 161
 */
export function calculateBMR(gender, age, height, weight) {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);

    if (isNaN(w) || isNaN(h) || isNaN(a) || !gender) {
        return 0;
    }

    const isMale = gender.toLowerCase() === 'male';
    if (isMale) {
        return 10 * w + 6.25 * h - 5 * a + 5;
    } else {
        return 10 * w + 6.25 * h - 5 * a - 161;
    }
}

/**
 * Calculates TDEE (Total Daily Energy Expenditure) based on BMR and activity level.
 * Multipliers:
 * - sedentary: 1.2
 * - light: 1.375
 * - moderate: 1.55
 * - heavy: 1.725
 */
export function calculateTDEE(bmr, activityLevel) {
    let multiplier = 1.2;
    switch (activityLevel) {
        case 'sedentary':
            multiplier = 1.2;
            break;
        case 'light':
            multiplier = 1.375;
            break;
        case 'moderate':
            multiplier = 1.55;
            break;
        case 'heavy':
            multiplier = 1.725;
            break;
        default:
            multiplier = 1.2;
    }
    return bmr * multiplier;
}

/**
 * Gets recommended target calories and macronutrients based on body profile.
 */
export function getRecommendedDietTargets({ gender, age, height, weight, activityLevel, goal }) {
    const bmr = calculateBMR(gender, age, height, weight);
    if (bmr === 0) return null;

    const tdee = calculateTDEE(bmr, activityLevel);

    // Goal adjustment
    let adjustment = 0;
    // primary goal: weight loss (-500 kcal), hypertrophy/strength (+300 kcal), maintenance (no change)
    if (goal === 'weight_loss') {
        adjustment = -500;
    } else if (goal === 'hypertrophy' || goal === 'strength') {
        adjustment = 300;
    }

    const calories = Math.round(tdee + adjustment);

    // Macro split calculation
    // Protein = weight * 2
    const w = parseFloat(weight);
    const protein = Math.round(w * 2);

    // Fat = 25% of total calories (1g fat = 9 kcal)
    const fat = Math.round((calories * 0.25) / 9);

    // Carbs = remainder (1g carb = 4 kcal, 1g protein = 4 kcal, 1g fat = 9 kcal)
    const proteinKcal = protein * 4;
    const fatKcal = fat * 9;
    const carbs = Math.round(Math.max(0, (calories - proteinKcal - fatKcal) / 4));

    return {
        calories,
        carbs,
        protein,
        fat
    };
}
