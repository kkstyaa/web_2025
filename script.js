//заменяем константный массив dishes на переменную
let dishes = []; //данные будут загружаться с API

// объект для хранения выбранных блюд
let selectedDishes = {
  soup: null,
  main: null,
  drink: null,
  salad_starter: null,
  dessert: null
};

// объект для хранения активных фильтров
let activeFilters = {
  soup: null,
  main: null,
  drink: null,
  salad_starter: null,
  dessert: null
};

// определяем возможные комбинации комбо
const validCombos = [
  // Комбо 1: Суп, Главное блюдо, Салат, Напиток
  { soup: true, main: true, salad_starter: true, drink: true },
  // Комбо 2: Суп, Главное блюдо, Напиток
  { soup: true, main: true, drink: true },
  // Комбо 3: Суп, Салат, Напиток
  { soup: true, salad_starter: true, drink: true },
  // Комбо 4: Главное блюдо, Салат, Напиток
  { main: true, salad_starter: true, drink: true },
  // Комбо 5: Главное блюдо, Напиток
  { main: true, drink: true },
  // Комбо 6: Десерт (можно к любому)
  { dessert: true }
];

// ФУНКЦИЯ loadDishes() ДЛЯ ЗАГРУЗКИ ДАННЫХ С API
async function loadDishes() {
  try {
    //используем url для GitHub Pages 
    const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api/dishes';
    
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    //проверяем структуру полученных данных
    if (!Array.isArray(data)) {
      throw new Error('API вернул не массив данных');
    }
    
    //группируем блюда по категориям для отладки
    const categoriesCount = {};
    data.forEach(item => {
      const cat = item.category || 'unknown';
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    });
    
    
    // Нормализуем названия категорий
    const categoryMap = {
      'main-course': 'main',           //API использует main-course, у меня main
      'salad': 'salad_starter',        //API использует salad, у меня salad_starter
      'soup': 'soup',                 
      'drink': 'drink',                
      'dessert': 'dessert'            
    };
    
    //преобразуем данные API в формат, совместимый с приложением
    dishes = data.map(item => {
      //получаем нормализованную категорию
      const normalizedCategory = categoryMap[item.category] || item.category;
      
      return {
        keyword: item.keyword || 'unknown',
        name: item.name || 'Без названия',
        price: item.price || 0,
        category: normalizedCategory,  //используем нормализованную категорию
        count: item.count || '0 г',
        image: item.image || `dishes/default.jpg`,
        kind: item.kind || 'other'
      };
    });
    
    //проверяем нормализацию
    const normalizedCategoriesCount = {};
    dishes.forEach(dish => {
      const cat = dish.category || 'unknown';
      normalizedCategoriesCount[cat] = (normalizedCategoriesCount[cat] || 0) + 1;
    });
    
    //обновляем отображение блюд
    displayAllDishes();
    
    return dishes;
    
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    
    //показываем сообщение об ошибке пользователю
    showErrorMessage('Не удалось загрузить меню. Используем локальные данные для демонстрации.');
    
    //используем локальные данные как fallback
    console.log('Использую локальные данные для тестирования');
    dishes = getLocalDishes(); //используем функцию для получения локальных данных
    displayAllDishes();
    
    return dishes;
  }
}

//вспомогательная функция для показа сообщения об ошибке
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'api-error-message';
  errorDiv.innerHTML = `
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="color: #856404; margin: 0; font-weight: bold;"> ${message}</p>
      <p style="color: #856404; margin: 10px 0 0 0; font-size: 14px;">Проверьте подключение к интернету и попробуйте снова.</p>
    </div>
  `;
  
  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(errorDiv, main.firstChild);
    
    //удаляем сообщение через 10 секунд
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }
}

//основная функция инициализации
document.addEventListener('DOMContentLoaded', async function() {
  
  //показываем сообщение о загрузке
  showLoadingMessage();
  
  //загружаем данные с API
  await loadDishes();
  
  //скрываем сообщение о загрузке
  hideLoadingMessage();
  
  // Инициализируем остальные компоненты
  setupEventListeners();
  updateOrderSummary();
  
  // Находим форму и добавляем обработчик отправки
  const orderForm = document.querySelector('.order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', validateForm);
  }
});

// Вспомогательные функции для показа/скрытия сообщения о загрузке
function showLoadingMessage() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-message';
  loadingDiv.innerHTML = `
    <div style="text-align: center; padding: 20px; color: #321832;">
      <p style="font-size: 18px; font-weight: bold;">Загрузка меню...</p>
    </div>
  `;
  
  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(loadingDiv, main.firstChild);
  }
}

function hideLoadingMessage() {
  const loadingDiv = document.getElementById('loading-message');
  if (loadingDiv && loadingDiv.parentNode) {
    loadingDiv.parentNode.removeChild(loadingDiv);
  }
}

// функция отображения всех блюд
function displayAllDishes() {
  // Проверяем, есть ли загруженные блюда
  if (!dishes || dishes.length === 0) {
    console.log('Нет данных для отображения');
    return;
  }
  
  // отображаем все блюда с учетом текущих фильтров
  const categories = ['soup', 'main', 'drink', 'salad_starter', 'dessert'];
  
  categories.forEach(category => {
    console.log(`Обрабатываю категорию: ${category}`);
    
    // Проверяем, есть ли блюда в этой категории
    const dishesInCategory = dishes.filter(dish => dish.category === category);
    console.log(`Блюд в категории ${category}: ${dishesInCategory.length}`);
    
    if (dishesInCategory.length === 0) {
      console.warn(`В категории ${category} нет блюд! Проверьте нормализацию категорий.`);
    }
    
    applyFilterToCategory(category);
    updateFilterButtons(category);
  });
}

// функция получения DOM-элемента секции по категории
function getCategorySection(category) {
  const sections = {
    soup: '.soups',
    main: '.main_dishes',
    drink: '.drinks',
    salad_starter: '.salads_starters',
    dessert: '.desserts'
  };
  
  return document.querySelector(sections[category]);
}

// функция получения селектора контейнера для блюд
function getDishesContainerSelector(category) {
  const selectors = {
    soup: '.soups .dishes_cards',
    main: '.main_dishes .dishes_cards',
    drink: '.drinks .dishes_cards',
    salad_starter: '.salads_starters .dishes_cards',
    dessert: '.desserts .dishes_cards'
  };
  
  return selectors[category];
}

// функция обновления состояния кнопок фильтров
function updateFilterButtons(category) {
  const categorySection = getCategorySection(category);
  const filterBtns = categorySection.querySelectorAll('.filter-btn');
  const activeFilter = activeFilters[category];
  
  filterBtns.forEach(btn => {
    btn.classList.remove('active');
    
    // Кнопка активна только если ее kind совпадает с активным фильтром
    if (btn.dataset.kind === activeFilter) {
      btn.classList.add('active');
    }
  });
}

// функция применения фильтра к категории
function applyFilterToCategory(category) {
  const containerSelector = getDishesContainerSelector(category);
  const dishesContainer = document.querySelector(containerSelector);
  const activeFilter = activeFilters[category];
  
  // получаем все блюда данной категории
  let filteredDishes = dishes.filter(dish => dish.category === category);
  
  // применяем фильтр если он есть
  if (activeFilter) {
    filteredDishes = filteredDishes.filter(dish => dish.kind === activeFilter);
  }
  
  // сортируем по алфавиту
  filteredDishes.sort((a, b) => a.name.localeCompare(b.name));
  
  // очистка контейнера
  dishesContainer.innerHTML = '';
  
  if (filteredDishes.length === 0) {
    dishesContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Блюда не найдены</p>';
    return;
  }
  
  // создаем карточки для каждого блюда
  filteredDishes.forEach(dish => {
    const dishCard = createDishCard(dish);
    dishesContainer.appendChild(dishCard);
  });
}

// функция создания карточки блюда
function createDishCard(dish) {
  const card = document.createElement('div');
  card.className = 'dish_card';
  card.setAttribute('data-dish', dish.keyword);
  card.setAttribute('data-kind', dish.kind);
  
  // Используем изображение из API, если оно есть
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

// настройка обработчиков событий
function setupEventListeners() {
   // Обработчик клика по карточкам блюд
  document.addEventListener('click', function(e) {
    if (e.target.closest('.dish_card')) {
      const dishCard = e.target.closest('.dish_card');
      const dishKeyword = dishCard.getAttribute('data-dish');
      const dish = dishes.find(d => d.keyword === dishKeyword);
      
      if (dish) {
        selectDish(dish);
      }
    }
    
    // обработчик клика по фильтрам
    if (e.target.classList.contains('filter-btn')) {
      const filterBtn = e.target;
      const category = filterBtn.dataset.category;
      const kind = filterBtn.dataset.kind;
      
      // если кликнул на уже активный фильтр - снимаем выделение
      if (activeFilters[category] === kind) {
        activeFilters[category] = null; // сброс фильтра
      } else {
        // устанавливаем новый фильтр
        activeFilters[category] = kind;
      }
      
      updateFilterButtons(category);
      applyFilterToCategory(category);
    }
  });
  
  // обработчик сброса формы
  const resetBtn = document.querySelector('.btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      resetOrder();
    });
  }
}

// функция выбора блюда
function selectDish(dish) {
  selectedDishes[dish.category] = dish;
  updateOrderSummary();
  updateFormSelects();
}

// функция сброса заказа
function resetOrder() {
  selectedDishes = {
    soup: null,
    main: null,
    drink: null,
    salad_starter: null,  
    dessert: null
  };
  
  // сбросить все фильтры
  activeFilters = {
    soup: null,
    main: null,
    drink: null,
    salad_starter: null,
    dessert: null
  };
  
  // обновление отображения
  displayAllDishes();
  updateOrderSummary();
  updateFormSelects();
}

// функция обновления сводки заказа
function updateOrderSummary() {
  const orderColumn = document.querySelector('.order-column');
  
  if (!orderColumn) return;
  
  // создаем или находим контейнер для сводки заказа
  let orderSummary = orderColumn.querySelector('.order-summary');
  if (!orderSummary) {
    orderSummary = document.createElement('div');
    orderSummary.className = 'order-summary';
    orderColumn.insertBefore(orderSummary, orderColumn.firstChild);
  }
  
  // чистим контейнер
  orderSummary.innerHTML = '';
  
  // добавляем заголовок
  const title = document.createElement('h3');
  title.textContent = 'Ваш заказ';
  orderSummary.appendChild(title);
  
  // проверяем, есть ли выбранные блюда
  const hasSelectedDishes = Object.values(selectedDishes).some(dish => dish !== null);
  
  if (!hasSelectedDishes) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Ничего не выбрано';
    emptyMessage.className = 'empty-order-message';
    orderSummary.appendChild(emptyMessage);
    
    // скрываем блок стоимости заказа
    hideOrderCost();
    return;
  }
  
  // отображаем выбранные блюда по категориям
  const categories = [
    { key: 'soup', label: 'Суп' },
    { key: 'main', label: 'Главное блюдо' },
    { key: 'drink', label: 'Напиток' },
    { key: 'salad_starter', label: 'Салат/Стартер' }, 
    { key: 'dessert', label: 'Десерт' }    
  ];
  
  categories.forEach(category => {
    const dish = selectedDishes[category.key];
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'selected-category';
    
    const categoryLabel = document.createElement('p');
    categoryLabel.className = 'category-label';
    categoryLabel.textContent = category.label + ':';
    
    const dishInfo = document.createElement('p');
    dishInfo.className = 'dish-info';
    
    if (dish) {
      dishInfo.textContent = `${dish.name} - ${dish.price}₽`;
    } else {
      dishInfo.textContent = 'Не выбрано';
      dishInfo.className += ' not-selected';
    }
    
    categoryDiv.appendChild(categoryLabel);
    categoryDiv.appendChild(dishInfo);
    orderSummary.appendChild(categoryDiv);
  });
  
  // добавляем блок стоимости заказа
  updateOrderCost();
}

// функция обновления стоимости заказа
function updateOrderCost() {
  let costBlock = document.querySelector('.order-cost');
  
  if (!costBlock) {
    costBlock = document.createElement('div');
    costBlock.className = 'order-cost';
    const orderColumn = document.querySelector('.order-column');
    if (orderColumn) {
      orderColumn.appendChild(costBlock);
    }
  }
  
  // вычисляем общую стоимость
  const totalCost = Object.values(selectedDishes)
    .filter(dish => dish !== null)
    .reduce((sum, dish) => sum + dish.price, 0);
  
  costBlock.innerHTML = `
    <div class="total-cost">
      <p class="cost-label">Стоимость заказа:</p>
      <p class="cost-value">${totalCost}₽</p>
    </div>
  `;
  
  // показываем блок стоимости
  costBlock.style.display = 'block';
}

// функция скрытия блока стоимости
function hideOrderCost() {
  const costBlock = document.querySelector('.order-cost');
  if (costBlock) {
    costBlock.style.display = 'none';
  }
}

// функция обновления select элементов в форме
function updateFormSelects() {
  const soupSelect = document.getElementById('soup-select');
  const mainSelect = document.getElementById('main-dish-select');
  const drinkSelect = document.getElementById('drink-select');
  
  if (soupSelect && selectedDishes.soup) {
    soupSelect.value = selectedDishes.soup.keyword;
  }
  
  if (mainSelect && selectedDishes.main) {
    mainSelect.value = selectedDishes.main.keyword;
  }
  
  if (drinkSelect && selectedDishes.drink) {
    drinkSelect.value = selectedDishes.drink.keyword;
  }
}

// ФУНКЦИИ ДЛЯ ПРОВЕРКИ КОМБО И УВЕДОМЛЕНИЙ

// Функция проверки, соответствует ли выбранный набор одному из комбо
function isValidCombo(selected) {
  // Проверяем каждое комбо
  for (const combo of validCombos) {
    let matches = true;
    
    // Проверяем все поля комбо
    for (const [key, required] of Object.entries(combo)) {
      if (required && !selected[key]) {
        matches = false;
        break;
      }
      
      // Проверяем, что нет лишних блюд (кроме десерта)
      if (!required && key !== 'dessert' && selected[key]) {
        // Для комбо 6 (только десерт) разрешаем иметь другие блюда
        if (!(combo.dessert && !combo.soup && !combo.main && !combo.salad_starter && !combo.drink)) {
          matches = false;
          break;
        }
      }
    }
    
    if (matches) {
      return true;
    }
  }
  
  return false;
}

// Функция определения типа уведомления
function getNotificationType(selected) {
  const hasSoup = !!selected.soup;
  const hasMain = !!selected.main;
  const hasDrink = !!selected.drink;
  const hasSaladStarter = !!selected.salad_starter;
  const hasDessert = !!selected.dessert;
  
  // Проверяем, есть ли хоть одно блюдо
  const totalSelected = Object.values(selected).filter(Boolean).length;
  
  // Ничего не выбрано
  if (totalSelected === 0) {
    return {
      type: 'nothing_selected',
      message: 'Ничего не выбрано. Выберите блюда для заказа',
      image: 'sad.jpg'
    };
  }
  
  // Проверяем комбо с десертом
  if (hasDessert && !hasSoup && !hasMain && !hasSaladStarter && !hasDrink) {
    // Только десерт - это валидное комбо 6
    return null;
  }
  
  // Проверяем невалидные комбинации
  
  // Выбраны все необходимые блюда, кроме напитка
  if ((hasSoup && hasMain && hasSaladStarter && !hasDrink) || 
      (hasSoup && hasMain && !hasDrink) ||
      (hasSoup && hasSaladStarter && !hasDrink) ||
      (hasMain && hasSaladStarter && !hasDrink) ||
      (hasMain && !hasDrink)) {
    return {
      type: 'no_drink',
      message: 'Выберите напиток',
      image: 'sad.jpg'
    };
  }
  
  // Выбран суп, но не выбраны главное блюдо/салат/стартер
  if (hasSoup && !hasMain && !hasSaladStarter) {
    return {
      type: 'no_main_or_salad',
      message: 'Выберите главное блюдо/салат/стартер',
      image: 'sad.jpg'
    };
  }
  
  // Выбран салат/стартер, но не выбраны суп/главное блюдо
  if (hasSaladStarter && !hasSoup && !hasMain) {
    return {
      type: 'no_soup_or_main',
      message: 'Выберите суп или главное блюдо',
      image: 'sad.jpg'
    };
  }
  
  // Выбран напиток/десерт
  if ((hasDrink || hasDessert) && !hasSoup && !hasMain && !hasSaladStarter) {
    return {
      type: 'no_main',
      message: 'Выберите главное блюдо',
      image: 'sad.jpg'
    };
  }
  
  // Проверяем все возможные неполные комбинации
  if (!isValidCombo(selected)) {
    // Общий случай - что-то не так с комбо
    return {
      type: 'invalid_combo',
      message: 'Выбранные блюда не соответствуют ни одному комбо',
      image: 'sad.jpg'
    };
  }
  
  return null; // Валидное комбо
}

// Функция создания уведомления
function createNotification(message, imageSrc) {
  // Создаем overlay
  const overlay = document.createElement('div');
  overlay.className = 'notification-overlay';
  
  // Создаем само уведомление
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  notification.innerHTML = `
    <div class="notification-content">
      ${imageSrc ? `<img src="${imageSrc}" alt="Уведомление" class="notification-image">` : ''}
      <p class="notification-message">${message}</p>
      <button class="notification-ok">Окей</button>
    </div>
  `;
  
  overlay.appendChild(notification);
  document.body.appendChild(overlay);
  
  // Добавляем обработчик для кнопки
  const okButton = notification.querySelector('.notification-ok');
  okButton.addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  // Добавляем обработчик hover для кнопки
  okButton.addEventListener('mouseenter', function() {
    this.style.backgroundColor = '#f9d467';
    this.style.color = '#321832';
  });
  
  okButton.addEventListener('mouseleave', function() {
    this.style.backgroundColor = '#fce592';
    this.style.color = '#321832';
  });
  
  // Закрытие по клику на overlay
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

// Функция валидации формы
function validateForm(e) {
  // Проверяем выбранные блюда
  const notification = getNotificationType(selectedDishes);
  
  if (notification) {
    e.preventDefault(); // Блокируем отправку
    
    // Показываем уведомление об ошибке
    createNotification(notification.message, notification.image);
    return false;
  }
  return true;
}