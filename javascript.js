const container = document.getElementById('recipes-container');

// Функция для поиска рецептов
function searchRecipes(searchTerm) {
    if (!searchTerm.trim()) {
        return window.allRecipes;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return window.allRecipes.filter(recipe => {
        const nameMatch = recipe.name.toLowerCase().includes(term);
        const ingredientsMatch = recipe.ingredients.some(ingredient => 
            ingredient.toLowerCase().includes(term)
        );
        return nameMatch || ingredientsMatch;
    });
}

// Функция для отрисовки карточек
function renderRecipes(recipesToShow) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (recipesToShow.length === 0) {
        container.innerHTML = '<p class="no-recipes">😢 Пока нет рецептов в этой категории</p>';
        return;
    }
    
    for (let recipe of recipesToShow) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        card.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.name}">
            <h2>${recipe.name}</h2>
            <p class="ingredients">🍅 ${recipe.ingredients.join(', ')}</p>
            <button class="btn view-recipe" data-id="${recipe.id}">Смотреть рецепт</button>
        `;
        
        container.appendChild(card);
    }
    
    // Добавляем обработчики для кнопок "Смотреть рецепт"
    document.querySelectorAll('.view-recipe').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = this.dataset.id;
            const recipe = window.allRecipes.find(r => r.id == recipeId);
            if (recipe) {
                showRecipeModal(recipe);
            }
        });
    });
}

// Функция для показа модального окна с рецептом
function showRecipeModal(recipe) {
    const modal = document.getElementById('recipeModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');
    const modalIngredients = document.getElementById('modalIngredients');
    const modalInstructionsText = document.getElementById('modalInstructionsText');
    
    modalImage.src = recipe.image;
    modalImage.alt = recipe.name;
    modalTitle.textContent = recipe.name;
    modalCategory.textContent = recipe.category;
    
    modalIngredients.innerHTML = '';
    recipe.ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = ingredient;
        modalIngredients.appendChild(li);
    });
    
    modalInstructionsText.textContent = recipe.instructions || 'Способ приготовления не указан';
    
    currentEditingRecipe = recipe;
    
    modal.classList.add('show');
}

// Загрузка рецептов с сервера
async function loadRecipes() {
    try {
        const response = await fetch('http://localhost:3000/api/recipes');
        if (!response.ok) {
            throw new Error('Ошибка загрузки рецептов');
        }
        const recipes = await response.json();
        window.allRecipes = recipes;
        return recipes;
    } catch (error) {
        console.error('Ошибка загрузки рецептов:', error);
        container.innerHTML = '<p class="no-recipes">😢 Ошибка загрузки рецептов с сервера</p>';
        return [];
    }
}

// Функция для обновления кнопок фильтрации
function updateFilterButtons() {
    const filtersContainer = document.getElementById('filters-container');
    if (!filtersContainer) return;
    
    if (!window.allRecipes) {
        console.error('allRecipes не загружен!');
        return;
    }
    
    const categories = ['all', ...new Set(window.allRecipes.map(r => r.category))];
    
    let buttonsHtml = '';
    categories.forEach((cat, index) => {
        if (cat === 'all') {
            buttonsHtml += `<button class="filter-btn ${index === 0 ? 'active' : ''}" data-filter="all">Все</button>`;
        } else {
            buttonsHtml += `<button class="filter-btn" data-filter="${cat}">${cat}</button>`;
        }
    });
    
    filtersContainer.innerHTML = buttonsHtml;
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            if (filter === 'all') {
                renderRecipes(window.allRecipes);
            } else {
                const filtered = window.allRecipes.filter(recipe => recipe.category === filter);
                renderRecipes(filtered);
            }
        });
    });
}

// Инициализация
if (!container) {
    console.error('Контейнер recipes-container не найден!');
} else {
    console.log('Начинаем загрузку рецептов с сервера...');
    
    loadRecipes().then(recipes => {
        renderRecipes(recipes);
        updateFilterButtons();
        console.log('Готово! Загружено рецептов:', recipes.length);
    });
    
    // Обработчик для закрытия модального окна
    const modal = document.getElementById('recipeModal');
    const closeBtn = document.getElementById('closeModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Поиск по рецептам
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value;
            const filteredRecipes = searchRecipes(searchTerm);
            renderRecipes(filteredRecipes);
            
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => btn.classList.remove('active'));
            const allButton = document.querySelector('.filter-btn[data-filter="all"]');
            if (allButton) allButton.classList.add('active');
        });
    }
}

// Переменные для редактирования
let currentEditingRecipe = null;
let currentEditingIndex = -1;
let editImageBase64 = null;

// Обработчик для кнопки редактирования
document.getElementById('editRecipeBtn').addEventListener('click', function() {
    if (currentEditingRecipe) {
        const index = window.allRecipes.findIndex(r => r.id === currentEditingRecipe.id);
        if (index !== -1) {
            openEditModal(currentEditingRecipe, index);
            document.getElementById('recipeModal').classList.remove('show');
        }
    }
});

// Функция открытия модального окна редактирования
function openEditModal(recipe, index) {
    currentEditingRecipe = recipe;
    currentEditingIndex = index;
    
    document.getElementById('editName').value = recipe.name;
    document.getElementById('editCategory').value = recipe.category;
    document.getElementById('editIngredients').value = recipe.ingredients.join(', ');
    document.getElementById('editInstructions').value = recipe.instructions || '';
    
    const preview = document.getElementById('editImagePreview');
    if (recipe.image && !recipe.image.includes('placehold.co')) {
        preview.innerHTML = `<img src="${recipe.image}" style="max-width: 200px; max-height: 150px; border-radius: 8px;">`;
    } else {
        preview.innerHTML = '';
    }
    
    editImageBase64 = null;
    document.getElementById('editImageFile').value = '';
    
    document.getElementById('editModal').classList.add('show');
}

// Загрузка картинки в форме редактирования
document.getElementById('editImageFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showEditMessage('Файл слишком большой! Максимум 5 МБ', 'error');
        this.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showEditMessage('Можно загружать только картинки!', 'error');
        this.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        editImageBase64 = event.target.result;
        const preview = document.getElementById('editImagePreview');
        preview.innerHTML = `<img src="${editImageBase64}" style="max-width: 200px; max-height: 150px; border-radius: 8px;">`;
    };
    reader.readAsDataURL(file);
});

// Функция для показа сообщений в модальном окне редактирования
function showEditMessage(text, type) {
    const messageDiv = document.getElementById('editMessage');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// Показывать/скрывать поле новой категории
document.getElementById('editCategory').addEventListener('change', function() {
    const newCategoryGroup = document.getElementById('editNewCategoryGroup');
    const newCategoryInput = document.getElementById('editNewCategory');
    
    if (this.value === 'new') {
        newCategoryGroup.style.display = 'block';
        newCategoryInput.required = true;
    } else {
        newCategoryGroup.style.display = 'none';
        newCategoryInput.required = false;
        newCategoryInput.value = '';
    }
});

// Отмена редактирования
document.getElementById('cancelEditBtn').addEventListener('click', function() {
    document.getElementById('editModal').classList.remove('show');
    if (currentEditingRecipe) {
        document.getElementById('recipeModal').classList.add('show');
    }
});

// Закрытие модального окна редактирования по крестику
document.getElementById('closeEditModal').addEventListener('click', function() {
    document.getElementById('editModal').classList.remove('show');
    if (currentEditingRecipe) {
        document.getElementById('recipeModal').classList.add('show');
    }
});

// Сохранение изменений на сервере (с картинкой)
document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (currentEditingIndex === -1) return;
    
    const name = document.getElementById('editName').value.trim();
    let category = document.getElementById('editCategory').value;
    const ingredientsText = document.getElementById('editIngredients').value.trim();
    const instructions = document.getElementById('editInstructions').value.trim() || 'Способ приготовления не указан';
    const imageFile = document.getElementById('editImageFile').files[0];
    
    if (category === 'new') {
        category = document.getElementById('editNewCategory').value.trim();
        if (!category) {
            showEditMessage('Введите название новой категории!', 'error');
            return;
        }
    }
    
    if (!name || !category || !ingredientsText) {
        showEditMessage('Заполните все обязательные поля!', 'error');
        return;
    }
    
    const ingredients = ingredientsText.split(',').map(i => i.trim());
    
    // Создаём FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('ingredients', JSON.stringify(ingredients));
    formData.append('instructions', instructions);
    
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/recipes/${currentEditingRecipe.id}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при обновлении рецепта');
        }
        
        const savedRecipe = await response.json();
        
        // Обновляем локальный массив
        window.allRecipes[currentEditingIndex] = savedRecipe;
        
        // Обновляем отображение
        renderRecipes(window.allRecipes);
        updateFilterButtons();
        
        document.getElementById('editModal').classList.remove('show');
        showRecipeModal(savedRecipe);
        
        currentEditingRecipe = null;
        currentEditingIndex = -1;
        editImageBase64 = null;
        document.getElementById('editImageFile').value = '';
        
        console.log('Рецепт обновлён:', savedRecipe);
    } catch (error) {
        console.error('Ошибка:', error);
        showEditMessage('Ошибка при сохранении на сервере', 'error');
    }
});