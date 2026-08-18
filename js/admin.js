/**
 * Modo edición del catálogo: la dueña agrega/edita/elimina categorías
 * y servicios directamente sobre la misma pantalla de cotización
 * (sin pantalla ni navegación aparte). Reutiliza el patrón de modal
 * ya usado por #docModal, en un modal propio (#adminModal) para no
 * mezclarlo con la lógica de impresión de proforma/contrato.
 */
let editMode = false;

const CATEGORY_COLORS = ['#7C3AED', '#DB2777', '#0891B2', '#D97706', '#16A34A', '#2563EB'];

function openAdminModal(html) {
  document.getElementById('adminModalBody').innerHTML = html;
  document.getElementById('adminModal').hidden = false;
}

function closeAdminModal() {
  document.getElementById('adminModal').hidden = true;
}

/* ---------------------------------------------------------
   DECORAR LA GRILLA / LISTA CON LOS CONTROLES DE EDICION
   --------------------------------------------------------- */
function decorateForEdit() {
  const toggleBtn = document.getElementById('btnToggleEdit');
  if (toggleBtn) {
    toggleBtn.innerHTML = editMode
      ? `${icon('check', 15)} <span>Listo</span>`
      : `${icon('edit', 15)} <span>Editar catálogo</span>`;
    toggleBtn.classList.toggle('edit-toggle-btn--active', editMode);
  }
  if (!editMode) return;

  const grid = document.getElementById('categoryGrid');
  if (grid && !grid.hidden) {
    grid.querySelectorAll('.category-card').forEach(card => {
      const pencil = document.createElement('button');
      pencil.type = 'button';
      pencil.className = 'card-edit-btn';
      pencil.setAttribute('aria-label', 'Editar categoría');
      pencil.innerHTML = icon('edit', 14);
      pencil.addEventListener('click', e => {
        e.stopPropagation();
        openCategoryModal(card.dataset.cat);
      });
      card.appendChild(pencil);
    });

    const addCard = document.createElement('button');
    addCard.type = 'button';
    addCard.className = 'category-card category-card--add';
    addCard.innerHTML = `<span class="category-card__icon">${icon('plus', 24)}</span><span class="category-card__name">Nueva categoría</span>`;
    addCard.addEventListener('click', () => openCategoryModal(null));
    grid.appendChild(addCard);
  }

  const list = document.getElementById('itemList');
  const panel = document.getElementById('itemsPanel');
  if (list && panel && !panel.hidden) {
    list.querySelectorAll('.item-card').forEach(card => {
      const pencil = document.createElement('button');
      pencil.type = 'button';
      pencil.className = 'card-edit-btn card-edit-btn--item';
      pencil.setAttribute('aria-label', 'Editar servicio');
      pencil.innerHTML = icon('edit', 14);
      pencil.addEventListener('click', e => {
        e.stopPropagation();
        openItemModal(card.dataset.item);
      });
      card.appendChild(pencil);
    });

    const addCard = document.createElement('button');
    addCard.type = 'button';
    addCard.className = 'item-card item-card--add';
    addCard.innerHTML = `${icon('plus', 18)} Nuevo servicio`;
    addCard.addEventListener('click', () => openItemModal(null));
    list.appendChild(addCard);
  }
}

/* ---------------------------------------------------------
   MODAL: CATEGORIA
   --------------------------------------------------------- */
function openCategoryModal(catId) {
  const isNew = !catId;
  const cat = isNew ? { name: '', icon: '', color: CATEGORY_COLORS[0] } : findCategory(catId);
  let selectedColor = cat.color;

  openAdminModal(`
    <h3>${isNew ? 'Nueva categoría' : 'Editar categoría'}</h3>
    <label>Nombre
      <input type="text" id="admCatName" value="${cat.name}" placeholder="Ej. Piñatas">
    </label>
    <label>Color</label>
    <div class="swatch-row">
      ${CATEGORY_COLORS.map(c => `<button type="button" class="swatch${c === cat.color ? ' swatch--active' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}
    </div>
    <div class="admin-modal__actions">
      ${isNew ? '<span></span>' : '<button type="button" class="btn btn--danger-ghost" id="admCatDelete">' + icon('trash', 16) + ' Eliminar</button>'}
      <button type="button" class="btn btn--primary" id="admCatSave">${icon('save', 16)} Guardar</button>
    </div>
  `);

  document.querySelectorAll('#adminModalBody .swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      selectedColor = sw.dataset.color;
      document.querySelectorAll('#adminModalBody .swatch').forEach(s => s.classList.remove('swatch--active'));
      sw.classList.add('swatch--active');
    });
  });

  document.getElementById('admCatSave').addEventListener('click', async () => {
    const name = document.getElementById('admCatName').value.trim();
    if (!name) { showToast('Ponle un nombre a la categoría.', 'error'); return; }
    if (isNew) {
      await window.firestoreService.addCategory({ name, icon: '', color: selectedColor, order: CATALOG.length });
    } else {
      await window.firestoreService.updateCategory(catId, { name, color: selectedColor });
    }
    closeAdminModal();
    showToast(isNew ? 'Categoría creada' : 'Categoría actualizada', 'success');
  });

  if (!isNew) {
    document.getElementById('admCatDelete').addEventListener('click', async () => {
      if (!confirm(`¿Eliminar "${cat.name}" y todos sus servicios? Esta acción no se puede deshacer.`)) return;
      await window.firestoreService.deleteCategory(catId);
      closeAdminModal();
      closeCategory();
      showToast('Categoría eliminada', 'info');
    });
  }
}

/* ---------------------------------------------------------
   MODAL: SERVICIO / ITEM
   --------------------------------------------------------- */
function openItemModal(itemId) {
  const isNew = !itemId;
  const found = isNew ? null : findItem(itemId);
  const item = isNew ? { name: '', desc: '', price: 0, unit: 'unidad', allowUnlimited: false } : found.item;

  openAdminModal(`
    <h3>${isNew ? 'Nuevo servicio' : 'Editar servicio'}</h3>
    <label>Nombre
      <input type="text" id="admItemName" value="${item.name}" placeholder="Ej. Carrito de nachos">
    </label>
    <label>Descripción
      <input type="text" id="admItemDesc" value="${item.desc || ''}" placeholder="Ej. Servicio por 2 horas">
    </label>
    <label>Precio (S/)
      <input type="number" id="admItemPrice" value="${item.price}" min="0" step="0.01">
    </label>
    <label>Unidad
      <input type="text" id="admItemUnit" value="${item.unit}" placeholder="unidad, evento, persona...">
    </label>
    <label class="checkbox-row">
      <input type="checkbox" id="admItemUnlimited" ${item.allowUnlimited ? 'checked' : ''}>
      Permitir "ilimitado"
    </label>
    <div class="admin-modal__actions">
      ${isNew ? '<span></span>' : '<button type="button" class="btn btn--danger-ghost" id="admItemDelete">' + icon('trash', 16) + ' Eliminar</button>'}
      <button type="button" class="btn btn--primary" id="admItemSave">${icon('save', 16)} Guardar</button>
    </div>
  `);

  document.getElementById('admItemSave').addEventListener('click', async () => {
    const name = document.getElementById('admItemName').value.trim();
    if (!name) { showToast('Ponle un nombre al servicio.', 'error'); return; }
    const data = {
      categoryId: currentCategoryId,
      name,
      desc: document.getElementById('admItemDesc').value.trim(),
      price: parseFloat(document.getElementById('admItemPrice').value) || 0,
      unit: document.getElementById('admItemUnit').value.trim() || 'unidad',
      allowUnlimited: document.getElementById('admItemUnlimited').checked,
      keywords: item.keywords || []
    };
    if (isNew) {
      await window.firestoreService.addItem({ ...data, order: 999 });
    } else {
      await window.firestoreService.updateItem(itemId, data);
    }
    closeAdminModal();
    showToast(isNew ? 'Servicio creado' : 'Servicio actualizado', 'success');
  });

  if (!isNew) {
    document.getElementById('admItemDelete').addEventListener('click', async () => {
      if (!confirm(`¿Eliminar "${item.name}"?`)) return;
      await window.firestoreService.deleteItem(itemId);
      closeAdminModal();
      showToast('Servicio eliminado', 'info');
    });
  }
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
window.onCatalogRendered = decorateForEdit;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnToggleEdit').addEventListener('click', () => {
    editMode = !editMode;
    renderCategories();
    if (currentCategoryId && !document.getElementById('itemsPanel').hidden) {
      openCategory(currentCategoryId);
    }
  });

  document.getElementById('adminModalClose').addEventListener('click', closeAdminModal);
  document.getElementById('adminModal').addEventListener('click', (e) => {
    if (e.target.id === 'adminModal') closeAdminModal();
  });
});
