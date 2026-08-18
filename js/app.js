/**
 * Estado y lógica principal del panel de cotizaciones.
 * Persistencia en Firestore (js/firestore-service.js) — este archivo
 * mantiene un espejo local en `state`/`CATALOG` actualizado en vivo
 * por los listeners que arranca initAppData().
 */
const EMPRESA_NOMBRE = 'Fiesta Feliz';

const state = {
  currentOrder: { clientName: '', clientPhone: '', eventDate: '', items: [] },
  history: []
};

let CATALOG = [];

function persistOrder() {
  if (window.firestoreService) window.firestoreService.writeCurrentOrder(state.currentOrder);
}

function money(n) {
  return 'S/ ' + (n || 0).toFixed(2);
}

function findCategory(catId) {
  return CATALOG.find(c => c.id === catId);
}

function findItem(itemId) {
  for (const cat of CATALOG) {
    const it = cat.items.find(i => i.id === itemId);
    if (it) return { item: it, category: cat };
  }
  return null;
}

/* ---------------------------------------------------------
   TOAST SYSTEM (reemplaza alert())
   --------------------------------------------------------- */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const iconMap = { success: 'check', error: 'x', info: 'party' };
  toast.innerHTML = `
    <span class="toast__icon">${icon(iconMap[type] || 'party', 14)}</span>
    <span class="toast__text">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ---------------------------------------------------------
   AGREGAR / QUITAR ITEMS DEL PEDIDO
   --------------------------------------------------------- */
function addItemToOrder(itemId, qty, unlimited) {
  const found = findItem(itemId);
  if (!found) return null;
  const { item } = found;

  const finalQty = unlimited ? 1 : Math.max(1, parseInt(qty, 10) || 1);
  const subtotal = unlimited ? item.price : item.price * finalQty;

  const orderLine = {
    lineId: 'l' + Date.now() + Math.random().toString(16).slice(2),
    itemId: item.id,
    name: item.name,
    unit: item.unit,
    qty: finalQty,
    unlimited: !!unlimited,
    unitPrice: item.price,
    subtotal
  };

  state.currentOrder.items.push(orderLine);
  persistOrder();
  renderOrder();
  updateOrderFab();
  return orderLine;
}

function removeOrderLine(lineId) {
  state.currentOrder.items = state.currentOrder.items.filter(l => l.lineId !== lineId);
  persistOrder();
  renderOrder();
  updateOrderFab();
}

function clearOrder() {
  state.currentOrder = { clientName: '', clientPhone: '', eventDate: '', items: [] };
  persistOrder();
  document.getElementById('clientName').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('eventDate').value = '';
  renderOrder();
  updateOrderFab();
}

function computeTotal() {
  return state.currentOrder.items.reduce((sum, l) => sum + l.subtotal, 0);
}

/* ---------------------------------------------------------
   RENDER: CATEGORIAS / ITEMS
   --------------------------------------------------------- */
function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = CATALOG.map(cat => `
    <button class="category-card" data-cat="${cat.id}">
      <span class="category-card__photo">
        <img src="img/cat/${cat.id}.jpg" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span class="category-card__icon-fallback cat-bg-${cat.id || 'default'}" style="display:none">${categoryIcon(cat.id, 28)}</span>
      </span>
      <span class="category-card__name">${cat.name}</span>
      <span class="category-card__count">${cat.items.length} opciones</span>
    </button>
  `).join('');

  grid.querySelectorAll('.category-card').forEach(btn => {
    btn.addEventListener('click', () => openCategory(btn.dataset.cat));
  });

  if (window.onCatalogRendered) window.onCatalogRendered();
}

function openCategory(catId) {
  const cat = findCategory(catId);
  if (!cat) return;

  currentCategoryId = catId;

  document.getElementById('categoryGrid').hidden = true;
  document.querySelector('.catalog__header').hidden = true;
  const panel = document.getElementById('itemsPanel');
  panel.hidden = false;

  document.getElementById('itemsPanelTitle').innerHTML = `${categoryIcon(catId, 24)} ${cat.name}`;

  const list = document.getElementById('itemList');
  list.innerHTML = cat.items.map(item => `
    <div class="item-card" data-item="${item.id}">
      <div class="item-card__info">
        <p class="item-card__name">${item.name}</p>
        <p class="item-card__desc">${item.desc}</p>
        <p class="item-card__price">${money(item.price)} / ${item.unit}</p>
      </div>
      <div class="item-card__controls">
        ${item.allowUnlimited ? `
          <label class="unlimited-toggle">
            <input type="checkbox" class="unlimited-check">
            Ilimitado
          </label>
        ` : ''}
        <input type="number" class="qty-input" min="1" value="1" aria-label="Cantidad">
        <button class="btn-add">${icon('plus', 16)} Agregar</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.item-card').forEach(card => {
    const itemId = card.dataset.item;
    const qtyInput = card.querySelector('.qty-input');
    const unlimitedCheck = card.querySelector('.unlimited-check');
    const addBtn = card.querySelector('.btn-add');

    if (unlimitedCheck) {
      unlimitedCheck.addEventListener('change', () => {
        qtyInput.disabled = unlimitedCheck.checked;
      });
    }

    addBtn.addEventListener('click', () => {
      const unlimited = unlimitedCheck ? unlimitedCheck.checked : false;
      addItemToOrder(itemId, qtyInput.value, unlimited);
      addBtn.innerHTML = `${icon('check', 16)} Agregado`;
      addBtn.classList.add('btn-add--added');
      showToast(`${card.querySelector('.item-card__name').textContent} agregado al pedido`, 'success', 2000);
      setTimeout(() => {
        addBtn.innerHTML = `${icon('plus', 16)} Agregar`;
        addBtn.classList.remove('btn-add--added');
      }, 1200);
    });
  });

  if (window.onCatalogRendered) window.onCatalogRendered();
}

function closeCategory() {
  currentCategoryId = null;
  document.getElementById('itemsPanel').hidden = true;
  document.getElementById('categoryGrid').hidden = false;
  document.querySelector('.catalog__header').hidden = false;
}

/* ---------------------------------------------------------
   RENDER: PEDIDO ACTUAL
   --------------------------------------------------------- */
function renderOrder() {
  const container = document.getElementById('orderItems');
  const items = state.currentOrder.items;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state empty-state--sm" id="orderEmpty">
        <img src="img/empty-order.png" alt="" class="empty-state__img">
        <p class="empty-state__title">Sin servicios aún</p>
        <p class="empty-state__text">Elige una categoría para empezar a agregar servicios al pedido</p>
      </div>
    `;
  } else {
    container.innerHTML = items.map(line => `
      <div class="order-item" data-line="${line.lineId}">
        <div class="order-item__info">
          <p class="order-item__name">${line.name}</p>
          <p class="order-item__meta">${line.unlimited ? 'Ilimitado' : line.qty + ' ' + line.unit}</p>
        </div>
        <span class="order-item__price">${money(line.subtotal)}</span>
        <button class="order-item__remove" aria-label="Quitar">${icon('x', 16)}</button>
      </div>
    `).join('');

    container.querySelectorAll('.order-item__remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lineId = e.target.closest('.order-item').dataset.line;
        removeOrderLine(lineId);
      });
    });
  }

  document.getElementById('orderTotal').textContent = money(computeTotal());
}

/* ---------------------------------------------------------
   MOBILE: ORDER FAB + BOTTOM SHEET
   --------------------------------------------------------- */
function updateOrderFab() {
  const count = state.currentOrder.items.length;
  const total = computeTotal();

  const fabTotal = document.getElementById('orderFabTotal');
  const fabBadge = document.getElementById('orderFabBadge');

  if (fabTotal) fabTotal.textContent = count > 0 ? money(total) : 'S/ 0';
  if (fabBadge) {
    fabBadge.hidden = count === 0;
    fabBadge.textContent = count;
  }

  // Update bottom nav badge too
  const bnBadge = document.getElementById('orderFabBadge');
  if (bnBadge) {
    bnBadge.hidden = count === 0;
    bnBadge.textContent = count;
  }
}

function toggleOrderPanel(open) {
  const panel = document.getElementById('orderPanel');
  const overlay = document.getElementById('orderPanelOverlay');
  if (open) {
    panel.classList.add('order-panel--open');
    overlay.classList.add('order-panel__overlay--visible');
    document.body.style.overflow = 'hidden';
  } else {
    panel.classList.remove('order-panel--open');
    overlay.classList.remove('order-panel__overlay--visible');
    document.body.style.overflow = '';
  }
}

/* ---------------------------------------------------------
   DOCUMENTOS: PROFORMA / CONTRATO
   --------------------------------------------------------- */
function openDocModal(html) {
  document.getElementById('docModalBody').innerHTML = html;
  document.getElementById('docModal').hidden = false;
}

function closeDocModal() {
  document.getElementById('docModal').hidden = true;
}

function docBrandHeader() {
  return `
    <div class="doc-brand">
      <div class="doc-brand-logo">${icon('party', 18)}</div>
      <div>
        <strong style="font-size:16px;">${EMPRESA_NOMBRE}</strong><br>
        <span style="font-size:12px;color:var(--color-text-muted)">Servicios para fiestas infantiles</span>
      </div>
    </div>
  `;
}

function buildItemsTableRows() {
  return state.currentOrder.items.map(l => `
    <tr>
      <td>${l.name}</td>
      <td>${l.unlimited ? 'Ilimitado' : l.qty + ' ' + l.unit}</td>
      <td style="text-align:right;font-weight:600">${money(l.subtotal)}</td>
    </tr>
  `).join('');
}

function showProforma() {
  const o = state.currentOrder;
  if (o.items.length === 0) {
    showToast('Agrega al menos un servicio antes de generar la proforma.', 'error');
    return;
  }
  const today = new Date().toLocaleDateString('es-PE');
  const html = `
    ${docBrandHeader()}
    <h3>Proforma</h3>
    <p class="doc-sub">Fecha de emisión: ${today}</p>
    <p><strong>Cliente:</strong> ${o.clientName || '—'}<br>
       <strong>Teléfono:</strong> ${o.clientPhone || '—'}<br>
       <strong>Fecha del evento:</strong> ${o.eventDate || '—'}</p>
    <table>
      <thead><tr><th>Servicio</th><th>Cantidad</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${buildItemsTableRows()}</tbody>
    </table>
    <p class="doc-total">Total: ${money(computeTotal())}</p>
  `;
  openDocModal(html);
}

function showContract() {
  const o = state.currentOrder;
  if (o.items.length === 0) {
    showToast('Agrega al menos un servicio antes de generar el contrato.', 'error');
    return;
  }
  const itemsList = o.items.map(l => `- ${l.name} (${l.unlimited ? 'ilimitado' : l.qty + ' ' + l.unit}): ${money(l.subtotal)}`).join('\n');
  const text = CONTRACT_TEMPLATE
    .replace('{{empresa}}', EMPRESA_NOMBRE)
    .replace('{{clientName}}', o.clientName || '________________')
    .replace('{{clientPhone}}', o.clientPhone || '________________')
    .replace('{{eventDate}}', o.eventDate || '________________')
    .replace('{{issueDate}}', new Date().toLocaleDateString('es-PE'))
    .replace('{{itemsList}}', itemsList)
    .replace('{{total}}', computeTotal().toFixed(2));

  openDocModal(`${docBrandHeader()}<h3>Contrato de servicio</h3><div style="white-space:pre-wrap">${text.replace(/\n/g, '<br>')}</div>`);
}

/* ---------------------------------------------------------
   EXPORTAR A EXCEL (CSV)
   --------------------------------------------------------- */
function exportToExcel() {
  const o = state.currentOrder;
  if (o.items.length === 0) {
    showToast('Agrega al menos un servicio antes de exportar.', 'error');
    return;
  }
  const rows = [['Cliente', 'Telefono', 'Fecha evento', 'Servicio', 'Cantidad', 'Precio unitario', 'Subtotal']];
  o.items.forEach(l => {
    rows.push([
      o.clientName || '',
      o.clientPhone || '',
      o.eventDate || '',
      l.name,
      l.unlimited ? 'Ilimitado' : l.qty,
      l.unitPrice.toFixed(2),
      l.subtotal.toFixed(2)
    ]);
  });
  rows.push(['', '', '', '', '', 'TOTAL', computeTotal().toFixed(2)]);

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedido_${(o.clientName || 'cliente').replace(/\s+/g, '_')}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Archivo Excel descargado', 'success');
}

/* ---------------------------------------------------------
   GUARDAR PEDIDO / HISTORIAL
   --------------------------------------------------------- */
function saveCurrentOrder() {
  const o = state.currentOrder;
  if (o.items.length === 0) {
    showToast('Agrega al menos un servicio antes de guardar el pedido.', 'error');
    return;
  }
  const record = {
    clientName: o.clientName || 'Sin nombre',
    clientPhone: o.clientPhone || '',
    eventDate: o.eventDate || '',
    items: JSON.parse(JSON.stringify(o.items)),
    total: computeTotal()
  };
  window.firestoreService.saveOrderToHistory(record).then(() => {
    showToast('Pedido guardado en el historial', 'success');
  });
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const emptyMsg = document.getElementById('historyEmpty');

  if (state.history.length === 0) {
    container.innerHTML = '';
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  container.innerHTML = state.history.map(r => `
    <div class="history-card" data-id="${r.id}">
      <div class="history-card__info">
        <p class="history-card__client">${r.clientName}</p>
        <div class="history-card__meta">
          <span>${icon('calendar', 14)} ${r.savedAt ? new Date(r.savedAt).toLocaleDateString('es-PE') : '—'}</span>
          <span>${icon('calendar', 14)} Evento: ${r.eventDate || '—'}</span>
        </div>
      </div>
      <span class="history-card__total">${money(r.total)}</span>
      <span class="history-card__action">${icon('eye', 16)} Ver</span>
    </div>
  `).join('');

  container.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      const rec = state.history.find(r => r.id === card.dataset.id);
      if (!rec) return;
      const html = `
        ${docBrandHeader()}
        <h3>Pedido guardado</h3>
        <p class="doc-sub">Guardado el ${rec.savedAt ? new Date(rec.savedAt).toLocaleString('es-PE') : '—'}</p>
        <p><strong>Cliente:</strong> ${rec.clientName}<br>
           <strong>Teléfono:</strong> ${rec.clientPhone || '—'}<br>
           <strong>Fecha del evento:</strong> ${rec.eventDate || '—'}</p>
        <table>
          <thead><tr><th>Servicio</th><th>Cantidad</th><th style="text-align:right">Subtotal</th></tr></thead>
          <tbody>${rec.items.map(l => `<tr><td>${l.name}</td><td>${l.unlimited ? 'Ilimitado' : l.qty + ' ' + l.unit}</td><td style="text-align:right;font-weight:600">${money(l.subtotal)}</td></tr>`).join('')}</tbody>
        </table>
        <p class="doc-total">Total: ${money(rec.total)}</p>
      `;
      openDocModal(html);
    });
  });
}

/* ---------------------------------------------------------
   NAVEGACION ENTRE VISTAS
   --------------------------------------------------------- */
function switchView(view) {
  document.getElementById('view-catalog').hidden = view !== 'catalog';
  document.getElementById('view-history').hidden = view !== 'history';

  // Topbar nav
  document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('navbtn--active', b.dataset.view === view));

  // Bottom nav
  document.querySelectorAll('.bottom-nav__btn[data-view]').forEach(b => b.classList.toggle('bottom-nav__btn--active', b.dataset.view === view));
}

/* ---------------------------------------------------------
   INJECT SVG ICONS INTO THE DOM
   --------------------------------------------------------- */
function injectIcons() {
  const inject = (id, name, size) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(name, size);
  };

  // Login
  inject('loginLogo', 'party', 32);

  // Note: loginEmailWrap/loginPasswordWrap already have input inside,
  // we prepend the SVG icon without replacing innerHTML
  const emailWrap = document.getElementById('loginEmailWrap');
  const passWrap = document.getElementById('loginPasswordWrap');
  if (emailWrap && !emailWrap.querySelector('svg')) emailWrap.insertAdjacentHTML('afterbegin', icon('mail', 18));
  if (passWrap && !passWrap.querySelector('svg')) passWrap.insertAdjacentHTML('afterbegin', icon('lock', 18));

  // Topbar
  inject('topbarLogo', 'party', 20);
  inject('navCatalogIcon', 'grid', 16);
  inject('navHistoryIcon', 'clock', 16);
  inject('editIcon', 'edit', 15);
  inject('logoutIcon', 'logout', 18);

  // Catalog
  inject('backIcon', 'arrow-left', 18);

  // Order panel
  inject('orderCloseIcon', 'x', 18);
  inject('proformaIcon', 'download', 18);
  inject('contractIcon', 'file-text', 16);
  inject('excelIcon', 'table', 16);
  inject('saveIcon', 'save', 16);
  inject('clearIcon', 'trash', 16);
  inject('orderFabIcon', 'shopping-bag', 20);

  // Bottom nav
  inject('bnCatalogIcon', 'grid', 22);
  inject('bnHistoryIcon', 'clock', 22);
  inject('bnChatIcon', 'message', 22);

  // Modals
  inject('docCloseIcon', 'x', 18);
  inject('adminCloseIcon', 'x', 18);
  inject('printIcon', 'printer', 16);

  // Chatbot
  inject('chatFabIcon', 'message', 26);
  inject('chatMinIcon', 'minus', 18);
  inject('chatSendIcon', 'send', 18);
}

/* ---------------------------------------------------------
   CARGA DE DATOS (arranca despues del login, ver auth-gate.js)
   --------------------------------------------------------- */
let currentCategoryId = null;
let catalogReady = false;

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function syncClientFields(order) {
  const nameEl = document.getElementById('clientName');
  const phoneEl = document.getElementById('clientPhone');
  const dateEl = document.getElementById('eventDate');
  if (document.activeElement !== nameEl) nameEl.value = order.clientName || '';
  if (document.activeElement !== phoneEl) phoneEl.value = order.clientPhone || '';
  if (document.activeElement !== dateEl) dateEl.value = order.eventDate || '';
}

window.initAppData = function initAppData() {
  window.firestoreService.seedCatalogIfEmpty(SEED_CATALOG).then(() => {
    window.firestoreService.listenCatalog(catalog => {
      CATALOG = catalog;
      renderCategories();
      if (currentCategoryId && !document.getElementById('itemsPanel').hidden) {
        openCategory(currentCategoryId);
      }
      if (!catalogReady && CATALOG.length > 0) {
        catalogReady = true;
        window.dispatchEvent(new CustomEvent('catalog-ready'));
      }
    });
    window.firestoreService.listenCurrentOrder(order => {
      state.currentOrder = order;
      renderOrder();
      syncClientFields(order);
      updateOrderFab();
    });
    window.firestoreService.listenHistory(history => {
      state.history = history;
      renderHistory();
    });
  });
};

/* ---------------------------------------------------------
   INIT (wiring de la UI, no depende de datos)
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Inject all SVG icons
  injectIcons();

  const debouncedPersistOrder = debounce(persistOrder, 400);

  document.getElementById('clientName').addEventListener('input', e => { state.currentOrder.clientName = e.target.value; debouncedPersistOrder(); });
  document.getElementById('clientPhone').addEventListener('input', e => { state.currentOrder.clientPhone = e.target.value; debouncedPersistOrder(); });
  document.getElementById('eventDate').addEventListener('input', e => { state.currentOrder.eventDate = e.target.value; debouncedPersistOrder(); });

  document.getElementById('backToCategories').addEventListener('click', closeCategory);

  document.getElementById('btnProforma').addEventListener('click', showProforma);
  document.getElementById('btnContract').addEventListener('click', showContract);
  document.getElementById('btnExcel').addEventListener('click', exportToExcel);
  document.getElementById('btnSave').addEventListener('click', saveCurrentOrder);
  document.getElementById('btnClear').addEventListener('click', () => {
    if (confirm('¿Vaciar el pedido actual?')) {
      clearOrder();
      showToast('Pedido vaciado', 'info');
    }
  });

  document.getElementById('docModalClose').addEventListener('click', closeDocModal);
  document.getElementById('docModal').addEventListener('click', (e) => {
    if (e.target.id === 'docModal') closeDocModal();
  });
  document.getElementById('docModalPrint').addEventListener('click', () => window.print());

  // Desktop nav
  document.querySelectorAll('.navbtn').forEach(b => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });

  // Mobile bottom nav
  document.querySelectorAll('.bottom-nav__btn[data-view]').forEach(b => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });

  // Mobile chat button in bottom nav
  const bnChat = document.getElementById('bnChat');
  if (bnChat) {
    bnChat.addEventListener('click', () => {
      if (typeof toggleChat === 'function') toggleChat(true);
    });
  }

  // Mobile: Order FAB opens order panel
  const orderFab = document.getElementById('orderFab');
  if (orderFab) {
    orderFab.addEventListener('click', () => toggleOrderPanel(true));
  }

  // Mobile: Close order panel
  const orderClose = document.getElementById('orderPanelClose');
  if (orderClose) {
    orderClose.addEventListener('click', () => toggleOrderPanel(false));
  }

  const orderOverlay = document.getElementById('orderPanelOverlay');
  if (orderOverlay) {
    orderOverlay.addEventListener('click', () => toggleOrderPanel(false));
  }
});
