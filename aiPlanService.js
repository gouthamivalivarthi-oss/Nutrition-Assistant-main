const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const shuffle = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const normalizeMealIdeas = (mealIdeas, mealsPerDay) => {
  const slots = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Post-Dinner Snack', 'Late Snack', 'Mini Meal'];
  const clean = Array.isArray(mealIdeas) ? mealIdeas.filter(Boolean).map((x) => String(x).trim()) : [];
  const ideas = [];
  for (let i = 0; i < mealsPerDay; i += 1) {
    const fallback = `${slots[i] || `Meal ${i + 1}`}: Balanced meal around your calorie target`;
    ideas.push(clean[i] || fallback);
  }
  return ideas;
};

const buildLocalPlan = ({ weight, goal, mealsPerDay, totals }) => {
  const consumedCalories = totals?.calories > 0 ? totals.calories : Math.round(weight * 30);
  const goalAdjust = goal === 'weightloss' ? -400 : goal === 'weightgain' ? 350 : 0;
  const targetCalories = Math.max(1200, consumedCalories + goalAdjust);
  const proteinPerKg = goal === 'weightgain' ? 1.8 : goal === 'weightloss' ? 1.9 : 1.6;
  const protein = Math.round(weight * proteinPerKg);
  const fats = Math.round((targetCalories * 0.25) / 9);
  const carbs = Math.max(80, Math.round((targetCalories - (protein * 4 + fats * 9)) / 4));
  const caloriesPerMeal = Math.round(targetCalories / mealsPerDay);
  const templates = {
    weightloss: [
      'Breakfast: Oats + yogurt + chia',
      'Breakfast: Moong chilla + mint chutney',
      'Lunch: Lean protein + salad + quinoa',
      'Lunch: Dal + brown rice + sauteed veggies',
      'Snack: Fruit + mixed nuts',
      'Snack: Roasted chana + buttermilk',
      'Dinner: Paneer/tofu + veggies',
      'Dinner: Soup + grilled fish/tofu'
    ],
    maintain: [
      'Breakfast: Eggs/paneer + toast + fruit',
      'Breakfast: Upma + curd',
      'Lunch: Dal/chicken + rice + vegetables',
      'Lunch: Rajma + roti + salad',
      'Snack: Yogurt + seeds',
      'Snack: Banana + peanut butter',
      'Dinner: Fish/paneer + roti',
      'Dinner: Khichdi + curd + salad'
    ],
    weightgain: [
      'Breakfast: PB toast + banana shake',
      'Breakfast: Paneer paratha + curd',
      'Lunch: Chicken/paneer bowl + rice',
      'Lunch: Soya curry + potato + roti',
      'Snack: Trail mix + smoothie',
      'Snack: Dates + nuts + milk',
      'Dinner: Fish/soy + potatoes',
      'Dinner: Pasta + chicken/tofu + veggies'
    ]
  };
  const pool = shuffle(templates[goal]);
  const mealIdeas = Array.from({ length: mealsPerDay }, (_, i) => pool[i % pool.length]);
  return { targetCalories, protein, carbs, fats, mealsPerDay, caloriesPerMeal, mealIdeas, source: 'local-fallback' };
};

const generatePlanWithAI = async ({ weight, goal, mealsPerDay, totals, variationId }) => {
  const localBase = buildLocalPlan({ weight, goal, mealsPerDay, totals });

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return localBase;
  }

  const prompt = {
    role: 'user',
    content: [
      {
        type: 'text',
        text:
          `Generate only menu items in strict JSON for a daily diet plan. ` +
          `User goal: ${goal}. Weight: ${weight}kg. Meals per day: ${mealsPerDay}. ` +
          `Variation token: ${variationId || Date.now()} (use this to vary meal selection each request). ` +
          `Target calories per day: ${localBase.targetCalories}. Calories per meal: ${localBase.caloriesPerMeal}. ` +
          `Return ONLY JSON with this exact shape: ` +
          `{ "mealIdeas": string[] }. ` +
          `mealIdeas length must be exactly ${mealsPerDay}. Include meal labels and practical Indian-friendly foods.`
      }
    ]
  };

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'text',
                text: 'You are a nutrition assistant. Output valid JSON only.'
              }
            ]
          },
          prompt
        ]
      })
    });

    if (!response.ok) return localBase;

    const data = await response.json();
    const text = data.output_text || '';
    const parsed = safeParse(text);

    if (!parsed || !Array.isArray(parsed.mealIdeas)) return localBase;

    return {
      ...localBase,
      mealIdeas: normalizeMealIdeas(parsed.mealIdeas, mealsPerDay),
      source: 'openai'
    };
  } catch {
    return localBase;
  }
};

module.exports = {
  generatePlanWithAI
};
