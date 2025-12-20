
// Константы
const API_KEY = 'cfaa433f-0bdc-4590-95ed-028417a2eb49';
const BASE_URL = 'https://edu.std-900.ist.mospolytech.ru';
const ORDERS_URL = `${BASE_URL}/labs/api/orders?api_key=${API_KEY}`;
const DISHES_URL = `${BASE_URL}/labs/api/dishes?api_key=${API_KEY}`;

// Переменные
let orders = [];
let dishes = {};

// Загрузка страницы
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Загрузка данных
async function loadData() {
    try {
        // Загружаем заказы и блюда одновременно
        const [ordersResponse, dishesResponse] = await Promise.all([
            fetch(ORDERS_URL),
            fetch(DISHES_URL)
        ]);

        if (!ordersResponse.ok || !dishesResponse.ok) {
            throw new Error('Ошибка загрузки данных');
        }

        const ordersData = await ordersResponse.json();
        const dishesData = await dishesResponse.json();

        // Сортируем заказы по дате (новые сверху)
        orders = ordersData.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        // Преобразуем блюда в объект для быстрого поиска
        dishesData.forEach(dish => {
            dishes[dish.id] = dish;
        });

        displayOrders();
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить данные');
    }
}

// Отображение заказов
function displayOrders() {
    const tbody = document.getElementById('orders-tbody');
    const noOrders = document.getElementById('no-orders');
    const ordersList = document.getElementById('orders-list');
    const loading = document.getElementById('loading');

    loading.style.display = 'none';
    ordersList.style.display = 'block';

    if (orders.length === 0) {
        noOrders.style.display = 'block';
        return;
    }

    noOrders.style.display = 'none';
    tbody.innerHTML = '';

    orders.forEach((order, index) => {
        const row = createOrderRow(order, index + 1);
        tbody.appendChild(row);
    });
}

// Создание строки заказа
function createOrderRow(order, number) {
    const row = document.createElement('tr');
    
    // Форматируем дату
    const date = new Date(order.created_at);
    const formattedDate = date.toLocaleDateString('ru-RU');
    
    // Получаем состав заказа
    const orderDishes = getOrderDishes(order);
    const dishesText = orderDishes.map(d => d.name).join(', ');
    
    // Считаем стоимость
    const total = orderDishes.reduce((sum, dish) => sum + dish.price, 0);
    
    // Время доставки
    let deliveryText = 'Как можно скорее';
    if (order.delivery_type === 'by_time' && order.delivery_time) {
        const [hours, minutes] = order.delivery_time.split(':');
        deliveryText = `${hours}:${minutes}`;
    }

    row.innerHTML = `
        <td>${number}</td>
        <td>${formattedDate}</td>
        <td>${dishesText || 'Нет блюд'}</td>
        <td>${total}₽</td>
        <td>${deliveryText}</td>
        <td>
            <div class="action-buttons">
                <button class="action-btn view-btn" onclick="viewOrder(${order.id})" title="Посмотреть">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editOrder(${order.id})" title="Редактировать">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteOrder(${order.id})" title="Удалить">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;

    return row;
}

// Получение блюд заказа
function getOrderDishes(order) {
    const dishIds = [
        order.soup_id,
        order.main_course_id,
        order.salad_id,
        order.drink_id,
        order.dessert_id
    ].filter(id => id && dishes[id]);

    return dishIds.map(id => dishes[id]);
}

// Просмотр заказа
function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const orderDishes = getOrderDishes(order);
    const total = orderDishes.reduce((sum, dish) => sum + dish.price, 0);
    
    let deliveryText = 'Как можно скорее (с 7:00 до 23:00)';
    if (order.delivery_type === 'by_time' && order.delivery_time) {
        const [hours, minutes] = order.delivery_time.split(':');
        deliveryText = `${hours}:${minutes}`;
    }

    const content = `
        <div class="order-detail">
            <label>Номер заказа</label>
            <span>${order.id}</span>
        </div>
        <div class="order-detail">
            <label>Дата оформления</label>
            <span>${new Date(order.created_at).toLocaleString('ru-RU')}</span>
        </div>
        <div class="order-detail">
            <label>ФИО</label>
            <span>${order.full_name}</span>
        </div>
        <div class="order-detail">
            <label>Телефон</label>
            <span>${order.phone}</span>
        </div>
        <div class="order-detail">
            <label>Адрес доставки</label>
            <span>${order.delivery_address}</span>
        </div>
        <div class="order-detail">
            <label>Время доставки</label>
            <span>${deliveryText}</span>
        </div>
        <div class="order-detail">
            <label>Комментарий</label>
            <span>${order.comment || 'Нет комментария'}</span>
        </div>
        <div class="order-detail">
            <label>Состав заказа</label>
            <div style="margin-top: 10px;">
                ${orderDishes.map(dish => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>${dish.name}</span>
                        <span>${dish.price}₽</span>
                    </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px;">
                    <span>Итого:</span>
                    <span>${total}₽</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('view-content').innerHTML = content;
    showModal('view-modal');
}

// Редактирование заказа
function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Заполняем форму
    document.getElementById('edit-id').value = order.id;
    document.getElementById('edit-name').value = order.full_name;
    document.getElementById('edit-email').value = order.email;
    document.getElementById('edit-phone').value = order.phone;
    document.getElementById('edit-address').value = order.delivery_address;
    document.getElementById('edit-comment').value = order.comment || '';

    // Тип доставки
    if (order.delivery_type === 'now') {
        document.getElementById('edit-type-now').checked = true;
        document.getElementById('edit-time-group').style.display = 'none';
    } else {
        document.getElementById('edit-type-time').checked = true;
        document.getElementById('edit-time-group').style.display = 'block';
        if (order.delivery_time) {
            const [hours, minutes] = order.delivery_time.split(':');
            document.getElementById('edit-time').value = `${hours}:${minutes}`;
        }
    }

    showModal('edit-modal');
}

// Сохранение изменений
async function saveOrder() {
    const orderId = document.getElementById('edit-id').value;
    const form = document.getElementById('edit-form');
    
    if (!form.checkValidity()) {
        alert('Заполните все обязательные поля');
        return;
    }

    const data = {
        full_name: document.getElementById('edit-name').value,
        email: document.getElementById('edit-email').value,
        phone: document.getElementById('edit-phone').value,
        delivery_address: document.getElementById('edit-address').value,
        delivery_type: document.querySelector('input[name="delivery-type"]:checked').value,
        comment: document.getElementById('edit-comment').value || ''
    };

    if (data.delivery_type === 'by_time') {
        const time = document.getElementById('edit-time').value;
        if (!time) {
            alert('Укажите время доставки');
            return;
        }
        data.delivery_time = time + ':00';
    }

    try {
        const response = await fetch(
            `${BASE_URL}/labs/api/orders/${orderId}?api_key=${API_KEY}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error('Ошибка сохранения');
        }

        const updatedOrder = await response.json();
        
        // Обновляем заказ в списке
        const index = orders.findIndex(o => o.id === parseInt(orderId));
        if (index !== -1) {
            orders[index] = updatedOrder;
        }

        closeModal();
        displayOrders();
        alert('Заказ успешно обновлен');
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось сохранить изменения');
    }
}

// Удаление заказа
function deleteOrder(orderId) {
    document.getElementById('delete-id').value = orderId;
    showModal('delete-modal');
}

// Подтверждение удаления
async function confirmDelete() {
    const orderId = document.getElementById('delete-id').value;

    try {
        const response = await fetch(
            `${BASE_URL}/labs/api/orders/${orderId}?api_key=${API_KEY}`,
            {
                method: 'DELETE'
            }
        );

        if (!response.ok) {
            throw new Error('Ошибка удаления');
        }

        // Удаляем заказ из списка
        orders = orders.filter(o => o.id !== parseInt(orderId));

        closeModal();
        displayOrders();
        alert('Заказ успешно удален');
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить заказ');
    }
}

// Управление модальными окнами
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Тип доставки в форме редактирования
    const timeGroup = document.getElementById('edit-time-group');
    const timeInputs = document.querySelectorAll('input[name="delivery-type"]');
    
    timeInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'by_time') {
                timeGroup.style.display = 'block';
            } else {
                timeGroup.style.display = 'none';
            }
        });
    });

    // Закрытие по клику на оверлей
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });

    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Валидация формы
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveOrder();
        });
    }
}
