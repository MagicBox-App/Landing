/**
 * Capa de datos — Firestore en producción, localStorage en modo demo.
 * Todo lo demás (app.js, chatbot.js, admin.js) pasa por
 * window.firestoreService — así el resto del código no sabe ni le
 * importa cuál es el backend.
 */

if (window.DEMO_MODE) {
  /* ===========================================================
     MODO DEMO: todo vive en localStorage
     =========================================================== */
  const STORAGE_KEY = 'fiestaFeliz_';

  function ls(key, fallback) {
    try {
      const v = localStorage.getItem(STORAGE_KEY + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  function lsSet(key, val) {
    localStorage.setItem(STORAGE_KEY + key, JSON.stringify(val));
  }

  let catalogListeners = [];
  let orderListeners = [];
  let historyListeners = [];
  let localCatalog = [];

  function emitCatalog() {
    catalogListeners.forEach(cb => cb(localCatalog));
  }
  function emitOrder() {
    const order = ls('currentOrder', { clientName: '', clientPhone: '', eventDate: '', items: [] });
    orderListeners.forEach(cb => cb(order));
  }
  function emitHistory() {
    const history = ls('history', []);
    historyListeners.forEach(cb => cb(history));
  }

  window.firestoreService = {
    seedCatalogIfEmpty: async (seedCatalog) => {
      let cats = ls('catalog_categories', null);
      if (!cats) {
        // First run — seed from SEED_CATALOG
        cats = seedCatalog.map((cat, i) => ({
          id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, order: i
        }));
        const items = seedCatalog.flatMap(cat =>
          cat.items.map((item, j) => ({
            id: item.id, categoryId: cat.id, name: item.name, desc: item.desc,
            price: item.price, unit: item.unit, allowUnlimited: !!item.allowUnlimited,
            keywords: item.keywords || [], order: j
          }))
        );
        lsSet('catalog_categories', cats);
        lsSet('catalog_items', items);
      }
    },

    listenCatalog: (callback) => {
      catalogListeners.push(callback);
      const cats = ls('catalog_categories', []);
      const items = ls('catalog_items', []);
      localCatalog = cats
        .slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(cat => ({
          id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, order: cat.order ?? 0,
          items: items
            .filter(it => it.categoryId === cat.id)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(it => ({
              id: it.id, name: it.name, desc: it.desc, price: it.price,
              unit: it.unit, allowUnlimited: !!it.allowUnlimited, keywords: it.keywords || []
            }))
        }));
      setTimeout(() => callback(localCatalog), 0);
      return () => { catalogListeners = catalogListeners.filter(c => c !== callback); };
    },

    listenCurrentOrder: (callback) => {
      orderListeners.push(callback);
      setTimeout(() => emitOrder(), 0);
      return () => { orderListeners = orderListeners.filter(c => c !== callback); };
    },

    writeCurrentOrder: (order) => {
      lsSet('currentOrder', order);
      return Promise.resolve();
    },

    listenHistory: (callback) => {
      historyListeners.push(callback);
      setTimeout(() => emitHistory(), 0);
      return () => { historyListeners = historyListeners.filter(c => c !== callback); };
    },

    saveOrderToHistory: (record) => {
      const history = ls('history', []);
      const newRec = { ...record, id: 'h' + Date.now(), savedAt: new Date().toISOString() };
      history.unshift(newRec);
      lsSet('history', history);
      emitHistory();
      return Promise.resolve();
    },

    addCategory: async (data) => {
      const cats = ls('catalog_categories', []);
      const newCat = { ...data, id: 'cat_' + Date.now() };
      cats.push(newCat);
      lsSet('catalog_categories', cats);
      const items = ls('catalog_items', []);
      localCatalog = cats.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(c => ({
        ...c, items: items.filter(i=>i.categoryId===c.id)
      }));
      emitCatalog();
    },

    updateCategory: async (id, data) => {
      const cats = ls('catalog_categories', []);
      const idx = cats.findIndex(c => c.id === id);
      if (idx >= 0) { Object.assign(cats[idx], data); lsSet('catalog_categories', cats); }
      const items = ls('catalog_items', []);
      localCatalog = cats.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(c => ({
        ...c, items: items.filter(i=>i.categoryId===c.id)
      }));
      emitCatalog();
    },

    deleteCategory: async (id) => {
      let cats = ls('catalog_categories', []);
      let items = ls('catalog_items', []);
      cats = cats.filter(c => c.id !== id);
      items = items.filter(i => i.categoryId !== id);
      lsSet('catalog_categories', cats);
      lsSet('catalog_items', items);
      localCatalog = cats.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(c => ({
        ...c, items: items.filter(i=>i.categoryId===c.id)
      }));
      emitCatalog();
    },

    addItem: async (data) => {
      const items = ls('catalog_items', []);
      const newItem = { ...data, id: 'item_' + Date.now() };
      items.push(newItem);
      lsSet('catalog_items', items);
      const cats = ls('catalog_categories', []);
      localCatalog = cats.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(c => ({
        ...c, items: items.filter(i=>i.categoryId===c.id)
      }));
      emitCatalog();
    },

    updateItem: async (id, data) => {
      const items = ls('catalog_items', []);
      const idx = items.findIndex(i => i.id === id);
      if (idx >= 0) { Object.assign(items[idx], data); lsSet('catalog_items', items); }
      const cats = ls('catalog_categories', []);
      localCatalog = cats.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(c => ({
        ...c, items: items.filter(i=>i.categoryId===c.id)
      }));
      emitCatalog();
    },

    deleteItem: async (id) => {
      let items = ls('catalog_items', []);
      items = items.filter(i => i.id !== id);
      lsSet('catalog_items', items);
      const cats = ls('catalog_categories', []);
      localCatalog = cats.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(c => ({
        ...c, items: items.filter(i=>i.categoryId===c.id)
      }));
      emitCatalog();
    }
  };

} else {
  /* ===========================================================
     MODO PRODUCCIÓN: Firestore real
     =========================================================== */
  const {
    collection,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    getDocs,
    writeBatch,
    serverTimestamp
  } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

  const db = window.firestoreDb;

  const CATEGORIES_COL = 'catalog_categories';
  const ITEMS_COL = 'catalog_items';
  const HISTORY_COL = 'order_history';
  const ORDER_DOC = ['state', 'currentOrder'];

  /* ---------------------------------------------------------
     CATALOGO (lectura en tiempo real + fusión categorias/items)
     --------------------------------------------------------- */
  let rawCategories = [];
  let rawItems = [];
  let catalogListeners = [];

  function emitCatalog() {
    const merged = rawCategories
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        order: cat.order ?? 0,
        items: rawItems
          .filter(it => it.categoryId === cat.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(it => ({
            id: it.id,
            name: it.name,
            desc: it.desc,
            price: it.price,
            unit: it.unit,
            allowUnlimited: !!it.allowUnlimited,
            keywords: it.keywords || []
          }))
      }));
    catalogListeners.forEach(cb => cb(merged));
  }

  function listenCatalog(callback) {
    catalogListeners.push(callback);
    const unsubCats = onSnapshot(collection(db, CATEGORIES_COL), snap => {
      rawCategories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      emitCatalog();
    });
    const unsubItems = onSnapshot(collection(db, ITEMS_COL), snap => {
      rawItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      emitCatalog();
    });
    return () => { unsubCats(); unsubItems(); };
  }

  /* ---------------------------------------------------------
     PEDIDO ACTUAL (doc singleton, sincronizado en vivo)
     --------------------------------------------------------- */
  function listenCurrentOrder(callback) {
    const ref = doc(db, ...ORDER_DOC);
    return onSnapshot(ref, snap => {
      const data = snap.data();
      callback(data || { clientName: '', clientPhone: '', eventDate: '', items: [] });
    });
  }

  function writeCurrentOrder(order) {
    const ref = doc(db, ...ORDER_DOC);
    return setDoc(ref, { ...order, updatedAt: serverTimestamp() });
  }

  /* ---------------------------------------------------------
     HISTORIAL
     --------------------------------------------------------- */
  function listenHistory(callback) {
    const q = query(collection(db, HISTORY_COL), orderBy('savedAt', 'desc'));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }

  function saveOrderToHistory(record) {
    const saved = { ...record, savedAt: new Date().toISOString() };
    const write = addDoc(collection(db, HISTORY_COL), saved);
    // GANCHO PARA GOOGLE SHEETS: cuando tengas publicada una Google Apps
    // Script Web App (deployment > Ejecutar como yo > Acceso: cualquiera),
    // descomenta esto para que cada pedido guardado tambien caiga como
    // fila nueva en una hoja de Google Sheets. No bloquea el guardado en
    // Firestore si falla (por eso el catch silencioso).
    //
    // fetch('PEGA_AQUI_TU_URL_DE_APPS_SCRIPT', {
    //   method: 'POST',
    //   mode: 'no-cors',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(saved)
    // }).catch(() => {});
    return write;
  }

  /* ---------------------------------------------------------
     ADMIN: CRUD DE CATEGORIAS E ITEMS
     --------------------------------------------------------- */
  function addCategory(data) {
    return addDoc(collection(db, CATEGORIES_COL), data);
  }

  function updateCategory(id, data) {
    return updateDoc(doc(db, CATEGORIES_COL, id), data);
  }

  async function deleteCategory(id) {
    const batch = writeBatch(db);
    batch.delete(doc(db, CATEGORIES_COL, id));
    rawItems.filter(it => it.categoryId === id).forEach(it => {
      batch.delete(doc(db, ITEMS_COL, it.id));
    });
    await batch.commit();
  }

  function addItem(data) {
    return addDoc(collection(db, ITEMS_COL), data);
  }

  function updateItem(id, data) {
    return updateDoc(doc(db, ITEMS_COL, id), data);
  }

  function deleteItem(id) {
    return deleteDoc(doc(db, ITEMS_COL, id));
  }

  /* ---------------------------------------------------------
     SIEMBRA INICIAL (solo si el catalogo esta vacio)
     --------------------------------------------------------- */
  async function seedCatalogIfEmpty(seedCatalog) {
    const existing = await getDocs(query(collection(db, CATEGORIES_COL), limit(1)));
    if (!existing.empty) return;

    const batch = writeBatch(db);
    seedCatalog.forEach((cat, catIndex) => {
      const catRef = doc(db, CATEGORIES_COL, cat.id);
      batch.set(catRef, { name: cat.name, icon: cat.icon, color: cat.color, order: catIndex });
      cat.items.forEach((item, itemIndex) => {
        const itemRef = doc(db, ITEMS_COL, item.id);
        batch.set(itemRef, {
          categoryId: cat.id,
          name: item.name,
          desc: item.desc,
          price: item.price,
          unit: item.unit,
          allowUnlimited: !!item.allowUnlimited,
          keywords: item.keywords || [],
          order: itemIndex
        });
      });
    });
    await batch.commit();
  }

  window.firestoreService = {
    listenCatalog,
    listenCurrentOrder,
    writeCurrentOrder,
    listenHistory,
    saveOrderToHistory,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    seedCatalogIfEmpty
  };
}
