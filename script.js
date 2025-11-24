// Массив с данными о блюдах
const dishes = [
  {
    keyword: "gazpacho",
    name: "Гаспачо",
    price: 195,
    category: "soup",
    count: "350г",
    image: "dishes/gazpacho.jpg"
  },
  {
    keyword: "mushroom_soup",
    name: "Грибной суп-пюре",
    price: 185,
    category: "soup",
    count: "330г",
    image: "dishes/mushroom_soup.jpg"
  },
  {
    keyword: "norwegian_soup",
    name: "Норвежский суп",
    price: 270,
    category: "soup",
    count: "330г",
    image: "dishes/norv.jpg"
  },
  {
    keyword: "fried_potatoes",
    name: "Жареная картошка с грибами",
    price: 150,
    category: "main",
    count: "250г",
    image: "dishes/kart.jpg"
  },
  {
    keyword: "lasagna",
    name: "Лазанья",
    price: 385,
    category: "main",
    count: "310г",
    image: "dishes/laz.jpg"
  },
  {
    keyword: "chicken_cutlets",
    name: "Котлеты из курицы с картофельным пюре",
    price: 225,
    category: "main",
    count: "280г",
    image: "dishes/kotl.jpg"
  },
  {
    keyword: "apple_juice",
    name: "Яблочный сок",
    price: 90,
    category: "drink",
    count: "300мл",
    image: "dishes/apple.jpg"
  },
  {
    keyword: "orange_juice",
    name: "Апельсиновый сок",
    price: 120,
    category: "drink",
    count: "300мл",
    image: "dishes/orange.jpg"
  },
  {
    keyword: "carrot_juice",
    name: "Морковный сок",
    price: 110,
    category: "drink",
    count: "300мл",
    image: "dishes/carrot.jpg"
  }
];

// Объект для хранения выбранных блюд
let selectedDishes = {
  soup: null,
  main: null,
  drink: null
};

// Основная функция инициализации
document.addEventListener('DOMContentLoaded', function() {
  displayAllDishes();
  setupEventListeners();
  updateOrderSummary();
});

// Функция отображения всех блюд
function displayAllDishes() {
  // Сортируем блюда по алфавиту
  const sortedDishes = [...dishes].sort((a, b) => a.name.localeCompare(b.name));
  
  // Группируем блюда по категориям
  const dishesByCategory = {
    soup: sortedDishes.filter(dish => dish.category === 'soup'),
    main: sortedDishes.filter(dish => dish.category === 'main'),
    drink: sortedDishes.filter(dish => dish.category === 'drink')
  };
  
  // Отображаем блюда в соответствующих секциях
  displayDishesInSection(dishesByCategory.soup, '.soups .dishes_cards', 'супы');
  displayDishesInSection(dishesByCategory.main, '.main_dishes .dishes_cards', 'основные блюда');
  displayDishesInSection(dishesByCategory.drink, '.drinks .dishes_cards', 'напитки');
}

// Функция отображения блюд в секции
function displayDishesInSection(dishesArray, sectionSelector, categoryName) {
  const section = document.querySelector(sectionSelector);
  
  if (!section) {
    console.error(`Секция ${sectionSelector} не найдена`);
    return;
  }
  
  // Очищаем секцию
  section.innerHTML = '';
  
  if (dishesArray.length === 0) {
    section.innerHTML = `<p>Нет доступных ${categoryName}</p>`;
    return;
  }
  
  // Создаем карточки для каждого блюда
  dishesArray.forEach(dish => {
    const dishCard = createDishCard(dish);
    section.appendChild(dishCard);
  });
}

// Функция создания карточки блюда
function createDishCard(dish) {
  const card = document.createElement('div');
  card.className = 'dish_card';
  card.setAttribute('data-dish', dish.keyword);
  
  card.innerHTML = `
    <img src="${dish.image}" alt="${dish.name}" width="200" height="200">
    <p class="price">${dish.price}₽</p>
    <p class="name">${dish.name}</p>
    <p class="weight">${dish.count}</p>
    <button>Добавить</button>
  `;
  
  return card;
}

// Настройка обработчиков событий
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
  });
  
  // Обработчик сброса формы
  document.querySelector('.btn-reset').addEventListener('click', function() {
    resetOrder();
  });
}

// Функция выбора блюда
function selectDish(dish) {
  selectedDishes[dish.category] = dish;
  updateOrderSummary();
  updateFormSelects();
}

// Функция сброса заказа
function resetOrder() {
  selectedDishes = {
    soup: null,
    main: null,
    drink: null
  };
  updateOrderSummary();
  updateFormSelects();
}

// Функция обновления сводки заказа
function updateOrderSummary() {
  const orderColumn = document.querySelector('.order-column');
  
  // Создаем или находим контейнер для сводки заказа
  let orderSummary = orderColumn.querySelector('.order-summary');
  if (!orderSummary) {
    orderSummary = document.createElement('div');
    orderSummary.className = 'order-summary';
    orderColumn.insertBefore(orderSummary, orderColumn.firstChild);
  }
  
  // Очищаем контейнер
  orderSummary.innerHTML = '';
  
  // Добавляем заголовок
  const title = document.createElement('h3');
  title.textContent = 'Ваш заказ';
  orderSummary.appendChild(title);
  
  // Проверяем, есть ли выбранные блюда
  const hasSelectedDishes = Object.values(selectedDishes).some(dish => dish !== null);
  
  if (!hasSelectedDishes) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Ничего не выбрано';
    emptyMessage.className = 'empty-order-message';
    orderSummary.appendChild(emptyMessage);
    
    // Скрываем блок стоимости заказа
    hideOrderCost();
    return;
  }
  
  // Отображаем выбранные блюда по категориям
  const categories = [
    { key: 'soup', label: 'Суп' },
    { key: 'main', label: 'Главное блюдо' },
    { key: 'drink', label: 'Напиток' }
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
      dishInfo.textContent = category.key === 'drink' ? 'Напиток не выбран' : 'Блюдо не выбрано';
      dishInfo.className += ' not-selected';
    }
    
    categoryDiv.appendChild(categoryLabel);
    categoryDiv.appendChild(dishInfo);
    orderSummary.appendChild(categoryDiv);
  });
  
  // Добавляем блок стоимости заказа
  updateOrderCost();
}

// Функция обновления стоимости заказа
function updateOrderCost() {
  let costBlock = document.querySelector('.order-cost');
  
  if (!costBlock) {
    costBlock = document.createElement('div');
    costBlock.className = 'order-cost';
    document.querySelector('.order-column').appendChild(costBlock);
  }
  
  // Вычисляем общую стоимость
  const totalCost = Object.values(selectedDishes)
    .filter(dish => dish !== null)
    .reduce((sum, dish) => sum + dish.price, 0);
  
  costBlock.innerHTML = `
    <div class="total-cost">
      <p class="cost-label">Стоимость заказа:</p>
      <p class="cost-value">${totalCost}₽</p>
    </div>
  `;
  
  // Показываем блок стоимости
  costBlock.style.display = 'block';
}

// Функция скрытия блока стоимости
function hideOrderCost() {
  const costBlock = document.querySelector('.order-cost');
  if (costBlock) {
    costBlock.style.display = 'none';
  }
}

// Функция обновления select элементов в форме (опционально)
function updateFormSelects() {
  // Можно добавить логику для синхронизации select элементов с выбранными блюдами
  // Например, установить соответствующие значения в выпадающих списках
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