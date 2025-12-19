//===============================ОСНОВНЫЕ ПЕРЕМЕННЫЕ==========================

let dishes = [];
const STORAGE_KEY = 'food_constructor_order';
const API_KEY = 'cfaa433f-0bdc-4590-95ed-028417a2eb49'; //персональный ключ

let selectedDishes = {
  soup: null,
  main: null,
  drink: null,
  salad_starter: null,
  dessert: null
};

let activeFilters = {
  soup: null,
  main: null,
  drink: null,
  salad_starter: null,
  dessert: null
};

const validCombos = [
  { soup: true, main: true, salad_starter: true, drink: true },
  { soup: true, main: true, drink: true },
  { soup: true, salad_starter: true, drink: true },
  { main: true, salad_starter: true, drink: true },
  { main: true, drink: true },
  { dessert: true }
];

// ==============================РАБОТА С API========================================

async function loadDishes() {
  try {
    const API_URL = `https://edu.std-900.ist.mospolytech.ru/labs/api/dishes?api_key=${API_KEY}`; //добавлен api_key
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    const categoryMap = {
      'main-course': 'main',
      'salad': 'salad_starter',
      'soup': 'soup',
      'drink': 'drink',
      'dessert': 'dessert'
    };
    
    dishes = data.map(item => ({
      id: item.id, //сохраняем id для отправки на сервер
      keyword: item.keyword,
      name: item.name,
      price: item.price,
      category: categoryMap[item.category] || item.category,
      count: item.count,
      image: item.image,
      kind: item.kind
    }));
    
    console.log('Блюда загружены:', dishes.length);
    displayAllDishes();
    
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    showError('Не удалось загрузить меню. Пожалуйста, обновите страницу.');
  }
}

//===================РАБОТА С LOCALSTORAGE==========================================

function saveOrderToStorage() {
  const orderData = {};
  
  for (const [category, dish] of Object.entries(selectedDishes)) {
    if (dish) {
      orderData[category] = dish.keyword;
    }
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orderData));
}

function loadOrderFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  
  try {
    const orderData = JSON.parse(saved);
    
    for (const [category, keyword] of Object.entries(orderData)) {
      const dish = dishes.find(d => d.keyword === keyword);
      if (dish) {
        selectedDishes[category] = dish;
      }
    }
    
  } catch (error) {
    console.error('Ошибка при загрузке из localStorage:', error);
  }
}

// ===========================ОТОБРАЖЕНИЕ БЛЮД=========================================

function displayAllDishes() {
  if (dishes.length === 0) return;
  
  const categories = ['soup', 'main', 'drink', 'salad_starter', 'dessert'];
  
  categories.forEach(category => {
    applyFilterToCategory(category);
    updateFilterButtons(category);
  });
  
  updateDishCardButtons();
}

function applyFilterToCategory(category) {
  const selectors = {
    soup: '.soups .dishes_cards',
    main: '.main_dishes .dishes_cards',
    drink: '.drinks .dishes_cards',
    salad_starter: '.salads_starters .dishes_cards',
    dessert: '.desserts .dishes_cards'
  };
  
  const container = document.querySelector(selectors[category]);
  if (!container) return;
  
  let filteredDishes = dishes.filter(dish => dish.category === category);
  
  if (activeFilters[category]) {
    filteredDishes = filteredDishes.filter(dish => dish.kind === activeFilters[category]);
  }
  
  filteredDishes.sort((a, b) => a.name.localeCompare(b.name));
  
  container.innerHTML = '';
  
  if (filteredDishes.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Блюда не найдены</p>';
    return;
  }
  
  filteredDishes.forEach(dish => {
    const dishCard = createDishCard(dish);
    container.appendChild(dishCard);
  });
}

function createDishCard(dish) {
  const card = document.createElement('div');
  card.className = 'dish_card';
  card.setAttribute('data-dish', dish.keyword);
  card.setAttribute('data-kind', dish.kind);
  
  const imageSrc = dish.image || `dishes/${dish.keyword}.jpg`;
  
  card.innerHTML = `
    <img src="${imageSrc}" alt="${dish.name}" width="200" height="200">
    <p class="price">${dish.price}₽</p>
    <p class="name">${dish.name}</p>
    <p class="weight">${dish.count}</p>
    <button>Добавить</button>
  `;
  
  return card;
}

function updateFilterButtons(category) {
  const sections = {
    soup: '.soups',
    main: '.main_dishes',
    drink: '.drinks',
    salad_starter: '.salads_starters',
    dessert: '.desserts'
  };
  
  const categorySection = document.querySelector(sections[category]);
  if (!categorySection) return;
  
  const filterBtns = categorySection.querySelectorAll('.filter-btn');
  const activeFilter = activeFilters[category];
  
  filterBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.kind === activeFilter) {
      btn.classList.add('active');
    }
  });
}

// ============================ВЫБОР БЛЮД==================================================

function selectDish(dish) {
  const current = selectedDishes[dish.category];
  
  if (current && current.keyword === dish.keyword) {
    selectedDishes[dish.category] = null;
  } else {
    selectedDishes[dish.category] = dish;
  }
  
  updateOrderPanel();
  updateDishCardButtons();
  saveOrderToStorage();
}

function updateDishCardButtons() {
  document.querySelectorAll('.dish_card').forEach(card => {
    const button = card.querySelector('button');
    if (!button) return;
    
    const dishKeyword = card.getAttribute('data-dish');
    const dish = dishes.find(d => d.keyword === dishKeyword);
    if (!dish) return;
    
    const isSelected = selectedDishes[dish.category] && 
                      selectedDishes[dish.category].keyword === dishKeyword;
    
    if (isSelected) {
      button.textContent = 'Удалить';
      button.style.backgroundColor = '#ff6b6b';
      button.style.color = 'white';
    } else {
      button.textContent = 'Добавить';
      button.style.backgroundColor = '#fce592';
      button.style.color = '#321832';
    }
  });
}

// =======================ИНТЕРАКТИВНАЯ ПАНЕЛЬ И ПРОВЕРКА КОМБО=====================================================

function updateOrderPanel() {
  const panel = document.getElementById('order-panel');
  if (!panel) return;
  
  const hasSelectedDishes = Object.values(selectedDishes).some(dish => dish !== null);
  
  if (!hasSelectedDishes) {
    panel.classList.remove('visible');
    panel.querySelector('.total-amount').textContent = '0';
    return;
  }
  
  panel.classList.add('visible');
  
  let totalCost = 0;
  for (const category in selectedDishes) {
    if (selectedDishes[category]) {
      totalCost += selectedDishes[category].price;
    }
  }
  
  panel.querySelector('.total-amount').textContent = totalCost;
  
  const checkoutBtn = panel.querySelector('.btn-checkout');
  if (isValidCombo(selectedDishes)) {
    checkoutBtn.classList.remove('disabled');
    checkoutBtn.href = 'checkout.html';
  } else {
    checkoutBtn.classList.add('disabled');
    checkoutBtn.href = '#';
  }
}

function isValidCombo(selected) {
  for (const combo of validCombos) {
    let matches = true;
    
    for (const [key, required] of Object.entries(combo)) {
      if (required && !selected[key]) {
        matches = false;
        break;
      }
      
      if (!required && key !== 'dessert' && selected[key]) {
        if (!(combo.dessert && !combo.soup && !combo.main && !combo.salad_starter && !combo.drink)) {
          matches = false;
          break;
        }
      }
    }
    
    if (matches) return true;
  }
  
  return false;
}

// ==============================ОБРАБОТЧИКИ СОБЫТИЙ===================================================

function setupEventListeners() {
  document.addEventListener('click', function(e) {
    const dishCard = e.target.closest('.dish_card');
    if (dishCard) {
      const dishKeyword = dishCard.getAttribute('data-dish');
      const dish = dishes.find(d => d.keyword === dishKeyword);
      if (dish) selectDish(dish);
    }
    
    if (e.target.classList.contains('filter-btn')) {
      const filterBtn = e.target;
      const category = filterBtn.dataset.category;
      const kind = filterBtn.dataset.kind;
      
      if (activeFilters[category] === kind) {
        activeFilters[category] = null;
      } else {
        activeFilters[category] = kind;
      }
      
      updateFilterButtons(category);
      applyFilterToCategory(category);
      updateDishCardButtons();
    }
  });
}

// ======================ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ=================================================

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="color: #856404; margin: 0; font-weight: bold;">${message}</p>
    </div>
  `;
  
  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(errorDiv, main.firstChild);
  }
}

// =====================================ИНИЦИАЛИЗАЦИЯ=================================================

document.addEventListener('DOMContentLoaded', async function() {
  await loadDishes();
  loadOrderFromStorage();
  setupEventListeners();
  updateOrderPanel();
  updateDishCardButtons();
});

// ======================ЭКСПОРТ ДЛЯ CHECKOUT.JS============================================

window.getSelectedDishes = () => selectedDishes;
window.getAllDishes = () => dishes;
window.saveOrderToStorage = saveOrderToStorage;