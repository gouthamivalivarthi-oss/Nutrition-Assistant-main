const mealForm = document.getElementById('mealForm');
const mealId = document.getElementById('mealId');
const mealName = document.getElementById('mealName');
const calories = document.getElementById('calories');
const protein = document.getElementById('protein');
const carbs = document.getElementById('carbs');
const fats = document.getElementById('fats');
const clearBtn = document.getElementById('clearBtn');
const removeAll = document.getElementById('removeAll');
const mealTableBody = document.getElementById('mealTableBody');

const totalCalories = document.getElementById('totalCalories');
const totalProtein = document.getElementById('totalProtein');
const totalCarbs = document.getElementById('totalCarbs');
const totalFats = document.getElementById('totalFats');
const goalCalories = document.getElementById('goalCalories');
const goalLabel = document.getElementById('goalLabel');
const progressBar = document.getElementById('progressBar');
const goalStatus = document.getElementById('goalStatus');

const STORAGE_KEY = 'nutritrack_meals';

function getMeals() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveMeals(meals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

function renderMeals() {
  const meals = getMeals();
  mealTableBody.innerHTML = '';

  meals.forEach((meal) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${meal.name}</td>
      <td>${meal.calories}</td>
      <td>${meal.protein}g</td>
      <td>${meal.carbs}g</td>
      <td>${meal.fats}g</td>
      <td>
        <div class="actions">
          <button class="btn btn-sm edit" data-id="${meal.id}">Edit</button>
          <button class="btn btn-sm delete" data-id="${meal.id}">Delete</button>
        </div>
      </td>
    `;
    mealTableBody.appendChild(row);
  });

  updateSummary(meals);
}

function updateSummary(meals) {
  const totals = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fats += meal.fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  totalCalories.textContent = totals.calories;
  totalProtein.textContent = `${totals.protein}g`;
  totalCarbs.textContent = `${totals.carbs}g`;
  totalFats.textContent = `${totals.fats}g`;

  const goal = Number(goalCalories.value);
  const progress = Math.min((totals.calories / goal) * 100, 100);
  progressBar.style.width = `${progress}%`;
  goalStatus.textContent = `${progress.toFixed(1)}% of your goal reached.`;
}

function clearForm() {
  mealId.value = '';
  mealForm.reset();
}

mealForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const meals = getMeals();

  const payload = {
    id: mealId.value || crypto.randomUUID(),
    name: mealName.value.trim(),
    calories: Number(calories.value),
    protein: Number(protein.value),
    carbs: Number(carbs.value),
    fats: Number(fats.value)
  };

  if (mealId.value) {
    const index = meals.findIndex((m) => m.id === mealId.value);
    meals[index] = payload;
  } else {
    meals.push(payload);
  }

  saveMeals(meals);
  clearForm();
  renderMeals();
});

mealTableBody.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const id = target.dataset.id;
  const meals = getMeals();

  if (target.classList.contains('delete')) {
    const updatedMeals = meals.filter((meal) => meal.id !== id);
    saveMeals(updatedMeals);
    renderMeals();
  }

  if (target.classList.contains('edit')) {
    const meal = meals.find((item) => item.id === id);
    if (!meal) return;

    mealId.value = meal.id;
    mealName.value = meal.name;
    calories.value = meal.calories;
    protein.value = meal.protein;
    carbs.value = meal.carbs;
    fats.value = meal.fats;
  }
});

clearBtn.addEventListener('click', clearForm);

removeAll.addEventListener('click', () => {
  saveMeals([]);
  renderMeals();
});

goalCalories.addEventListener('input', () => {
  goalLabel.textContent = goalCalories.value;
  updateSummary(getMeals());
});

renderMeals();
