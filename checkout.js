// ===================================КОНСТАНТЫ И ПЕРЕМЕННЫЕ=================================================

const STORAGE_KEY = 'food_constructor_order';
const API_KEY = 'cfaa433f-0bdc-4590-95ed-028417a2eb49'; // персональный ключ
const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api/orders';

let dishes = [];
let selectedDishes = {};

// ==========================ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ==============================================

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Страница оформления заказа загружается...');
  
  if (window.getAllDishes) {
    dishes = window.getAllDishes();
    selectedDishes = window.getSelectedDishes();
    console.log('Данные получены из основного скрипта');
  } else {
    await loadDishesFromAPI();
    loadOrderFromStorage();
  }
  
  displaySelectedDishes();
  setupFormHandlers();
});

// ===========================ЗАГРУЗКА ДАННЫХ================================================================

async function loadDishesFromAPI() {
  try {
    const response = await fetch(`https://edu.std-900.ist.mospolytech.ru/labs/api/dishes?api_key=${API_KEY}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
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
      id: item.id,
      keyword: item.keyword,
      name: item.name,
      price: item.price,
      category: categoryMap[item.category] || item.category,
      count: item.count,
      image: item.image,
      kind: item.kind
    }));
    
    console.log('Блюда загружены с API:', dishes.length);
    
  } catch (error) {
    console.error('Ошибка загрузки блюд:', error);
    showNotification('Не удалось загрузить меню. Пожалуйста, обновите страницу.', 'error');
  }
}

function loadOrderFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    console.log('В localStorage нет сохраненного заказа');
    return;
  }
  
  try {
    const orderData = JSON.parse(saved);
    console.log('Загружен заказ из localStorage:', orderData);
    
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

// ===========================ОТОБРАЖЕНИЕ ВЫБРАННЫХ БЛЮД===============
function displaySelectedDishes() {
  const container = document.getElementById('selected-dishes-container');
  const totalPriceElement = document.getElementById('total-price');
  
  if (!container) return;
  
  container.innerHTML = '';
  
  const hasSelectedDishes = Object.values(selectedDishes).some(dish => dish !== null && dish !== undefined);
  
  if (!hasSelectedDishes) {
    container.innerHTML = `
      <div class="empty-order-message">
        <p>Ничего не выбрано. Чтобы добавить блюда в заказ, перейдите на страницу 
          <a href="order.html">Собрать ланч</a>.
        </p>
      </div>
    `;
    totalPriceElement.textContent = '0';
    return;
  }
  
  let totalPrice = 0;
  const categories = [
    { key: 'soup', label: 'Суп', required: false },
    { key: 'main', label: 'Главное блюдо', required: false },
    { key: 'drink', label: 'Напиток', required: true },
    { key: 'salad_starter', label: 'Салат/Стартер', required: false },
    { key: 'dessert', label: 'Десерт', required: false }
  ];
  
  categories.forEach(category => {
    const dish = selectedDishes[category.key];
    
    if (dish) {
      totalPrice += dish.price;
      
      const dishCard = document.createElement('div');
      dishCard.className = 'dish-card-checkout';
      dishCard.innerHTML = `
        <img src="${dish.image || 'dishes/default.jpg'}" alt="${dish.name}">
        <div class="dish-info-checkout">
          <h3>${dish.name}</h3>
          <p>${category.label}</p>
          <p>${dish.count}</p>
        </div>
        <div class="dish-price-checkout">${dish.price}₽</div>
        <button class="btn-remove" data-category="${category.key}">Удалить</button>
      `;
      
      container.appendChild(dishCard);
      
      const fieldId = `${category.key}_id`;
      const field = document.getElementById(fieldId);
      if (field && dish.id) {
        field.value = dish.id;
      }
    } else if (category.required) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'dish-card-checkout';
      emptyCard.style.opacity = '0.6';
      emptyCard.innerHTML = `
        <div class="dish-info-checkout" style="width: 100%; text-align: center;">
          <h3 style="color: #999;">${category.label}</h3>
          <p style="color: #999; font-style: italic;">Не выбрано</p>
        </div>
      `;
      container.appendChild(emptyCard);
    }
  });
  
  totalPriceElement.textContent = totalPrice;
  
  document.querySelectorAll('.btn-remove').forEach(button => {
    button.addEventListener('click', function() {
      const category = this.dataset.category;
      removeDishFromOrder(category);
    });
  });
}

// ==================================УДАЛЕНИЕ БЛЮД ИЗ ЗАКАЗА=========================================================

function removeDishFromOrder(category) {
  if (selectedDishes[category]) {
    selectedDishes[category] = null;
    
    const orderData = {};
    for (const [cat, dish] of Object.entries(selectedDishes)) {
      if (dish) {
        orderData[cat] = dish.keyword;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderData));
    
    displaySelectedDishes();
    showNotification('Блюдо удалено из заказа', 'success');
  }
}

// =======================ОБРАБОТКА ФОРМЫ====================================================

function setupFormHandlers() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  
  const deliveryNow = document.getElementById('delivery_now');
  const deliveryByTime = document.getElementById('delivery_by_time');
  const deliveryTimeGroup = document.getElementById('delivery-time-group');
  const deliveryTimeInput = document.getElementById('delivery_time');
  
  if (deliveryNow && deliveryByTime) {
    deliveryNow.addEventListener('change', function() {
      deliveryTimeGroup.style.display = 'none';
      deliveryTimeInput.required = false;
    });
    
    deliveryByTime.addEventListener('change', function() {
      deliveryTimeGroup.style.display = 'block';
      deliveryTimeInput.required = true;
      
      const now = new Date();
      const minTime = new Date(now.getTime() + 60 * 60 * 1000);
      
      const minHours = minTime.getHours().toString().padStart(2, '0');
      const minMinutes = Math.ceil(minTime.getMinutes() / 5) * 5;
      const formattedMinMinutes = minMinutes.toString().padStart(2, '0');
      
      deliveryTimeInput.min = `${minHours}:${formattedMinMinutes}`;
      
      const defaultTime = new Date(minTime.getTime() + 30 * 60 * 1000);
      const defaultHours = defaultTime.getHours().toString().padStart(2, '0');
      const defaultMinutes = Math.ceil(defaultTime.getMinutes() / 5) * 5;
      const formattedDefaultMinutes = defaultMinutes.toString().padStart(2, '0');
      
      deliveryTimeInput.value = `${defaultHours}:${formattedDefaultMinutes}`;
    });
    
    deliveryNow.checked = true;
  }
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const hasSelectedDishes = Object.values(selectedDishes).some(dish => dish !== null && dish !== undefined);
    if (!hasSelectedDishes) {
      showNotification('Ваш заказ пуст. Пожалуйста, выберите блюда.', 'error');
      return;
    }
    
    await submitOrder();
  });
}

function validateForm() {
  const form = document.getElementById('checkout-form');
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      showFieldError(field, 'Это поле обязательно для заполнения');
      isValid = false;
    }
    
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        showFieldError(field, 'Введите корректный email');
        isValid = false;
      }
    }
    
    if (field.name === 'phone' && field.value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(field.value) || field.value.replace(/\D/g, '').length < 10) {
        showFieldError(field, 'Введите корректный номер телефона');
        isValid = false;
      }
    }
  });
  
  const deliveryByTime = document.getElementById('delivery_by_time');
  const deliveryTimeInput = document.getElementById('delivery_time');
  
  if (deliveryByTime && deliveryByTime.checked) {
    if (!deliveryTimeInput.value) {
      showFieldError(deliveryTimeInput, 'Укажите время доставки');
      isValid = false;
    } else if (deliveryTimeInput.value < deliveryTimeInput.min) {
      showFieldError(deliveryTimeInput, `Время доставки должно быть не раньше ${deliveryTimeInput.min}`);
      isValid = false;
    }
    
    const [hours, minutes] = deliveryTimeInput.value.split(':').map(Number);
    if (hours < 7 || hours > 23 || (hours === 23 && minutes > 0)) {
      showFieldError(deliveryTimeInput, 'Доставка возможна только с 7:00 до 23:00');
      isValid = false;
    }
    
    if (minutes % 5 !== 0) {
      showFieldError(deliveryTimeInput, 'Время должно быть кратно 5 минутам (например, 12:05, 12:10)');
      isValid = false;
    }
  }
  
  return isValid;
}

function showFieldError(field, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  field.style.borderColor = '#ff6b6b';
  field.parentNode.appendChild(errorDiv);
  
  field.addEventListener('input', function() {
    errorDiv.remove();
    field.style.borderColor = '#e0e0e0';
  });
}

// ======================ОТПРАВКА ЗАКАЗА НА СЕРВЕР==============================================

async function submitOrder() {
  const submitBtn = document.getElementById('submit-order');
  const originalText = submitBtn.textContent;
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправка...';
  
  try {
    const formData = {
      full_name: document.getElementById('full_name').value,
      email: document.getElementById('email').value,
      subscribe: document.getElementById('subscribe').checked ? 1 : 0,
      phone: document.getElementById('phone').value,
      delivery_address: document.getElementById('delivery_address').value,
      delivery_type: document.querySelector('input[name="delivery_type"]:checked').value,
      comment: document.getElementById('comment').value || ''
    };
    
    if (formData.delivery_type === 'by_time') {
      formData.delivery_time = document.getElementById('delivery_time').value + ':00';
    }
    
    const dishFields = [
      { field: 'soup_id', category: 'soup' },
      { field: 'main_course_id', category: 'main' },
      { field: 'salad_id', category: 'salad_starter' },
      { field: 'drink_id', category: 'drink' },
      { field: 'dessert_id', category: 'dessert' }
    ];
    
    dishFields.forEach(({ field, category }) => {
      if (selectedDishes[category] && selectedDishes[category].id) {
        formData[field] = selectedDishes[category].id;
      }
    });
    
    console.log('Отправляемые данные:', formData);
    
    const url = `${API_URL}?api_key=${API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Заказ успешно создан:', result);
    
    localStorage.removeItem(STORAGE_KEY);
    
    showNotification(`Заказ успешно оформлен! Номер заказа: ${result.id}`, 'success');
    
    /*setTimeout(() => {
      window.location.href = 'index.html';
    }, 30000);*/
    
  } catch (error) {
    console.error('Ошибка при оформлении заказа:', error);
    showNotification(`Ошибка при оформлении заказа: ${error.message}`, 'error');
    
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ==========================УВЕДОМЛЕНИЯ======================================================

function showNotification(message, type = 'success') {
  document.querySelectorAll('.notification').forEach(el => el.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<p>${message}</p>`;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// ========================ЭКСПОРТ ФУНКЦИЙ=========================================

window.removeDishFromOrder = removeDishFromOrder;