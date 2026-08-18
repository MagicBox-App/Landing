const chat = { open: false, awaitingQtyItem: null, history: [], useAI: true };
const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const extractQty = t => { const m = t.match(/\d+/); return m ? parseInt(m[0]) : null; };
const allItemsFlat = () => CATALOG.flatMap(cat => cat.items.map(item => ({ ...item, categoryId: cat.id })));
const matchItem = norm => {
  const cands = allItemsFlat().flatMap(item =>
    [item.name, ...(item.keywords || [])].map(k => normalize(k).includes(norm) ? { item, len: normalize(k).length } : null)
  ).filter(Boolean);
  return cands.length ? cands.sort((a,b) => b.len - a.len)[0].item : null;
};
const pushMessage = (sender, text) => {
  chat.history.push({ sender, text });
  const box = document.getElementById('chatbotMessages');
  box.innerHTML = chat.history.map(m => `<div class="msg msg--${m.sender}">${m.text}</div>`).join('');
  box.scrollTop = box.scrollHeight;
  if (!chat.open && sender === 'bot') document.getElementById('chatbotBadge').hidden = false;
};
const setQuickReplies = opts => {
  const w = document.getElementById('chatbotQuickReplies');
  w.innerHTML = opts?.length ? opts.map(o => `<button class="qr-btn" data-value="${o.value}">${o.label}</button>`).join('') : '';
  w.querySelectorAll('.qr-btn').forEach(btn => btn.addEventListener('click', () => handleUserText(btn.dataset.value, btn.textContent)));
};
const showCats = () => setQuickReplies(CATALOG.map(c => ({ value: c.name, label: c.name })));
async function callGemini(msg) {
  if (!window.GEMINI_API_KEY) return null;
  try {
    const cat = CATALOG.map(c => `- ${c.name}: ${c.items.map(i => `${i.name} (${money(i.price)}/${i.unit})`).join(', ')}`).join('\n');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${window.GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `Eres asistente de "Magic Box" (fiestas infantiles Lima). Responde en español, amigable, máx 3 líneas.\nCATÁLOGO:\n${cat}\n\nMensaje: "${msg}"\nResponde:` }] }] })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { return null; }
}
const confirmAdded = line => {
  pushMessage('bot', `Listo, agregué <strong>${line.unlimited ? 'ilimitado' : line.qty} ${line.unlimited ? '' : line.unit}</strong> de <strong>${line.name}</strong> (${money(line.subtotal)}).<br>Total: <strong>${money(computeTotal())}</strong>.`);
  setQuickReplies([
    { value: 'ver categorias', label: 'Agregar otra cosa' },
    { value: 'ver total', label: 'Ver resumen' },
    { value: 'finalizar', label: 'Generar proforma' }
  ]);
};

async function handleUserText(rawText, displayText) {
  const text = displayText || rawText;
  pushMessage('user', text);
  document.getElementById('chatbotInput').value = '';
  const norm = normalize(rawText);

  if (chat.awaitingQtyItem) {
    const item = chat.awaitingQtyItem, unlimited = item.allowUnlimited && (norm.includes('ilimitado') || norm.includes('sin limite')), qty = extractQty(norm);
    if (unlimited || qty) { confirmAdded(addItemToOrder(item.id, qty, unlimited)); chat.awaitingQtyItem = null; }
    else pushMessage('bot', `No entendí la cantidad. Escribe "30"${item.allowUnlimited ? ' o "ilimitado"' : ''}.`);
    return;
  }

  if (/^(hola|buenas|buenos|hey)/.test(norm)) { pushMessage('bot', `¡Hola! Soy asistente de ${EMPRESA_NOMBRE}. ¿Qué necesitas?`); showCats(); return; }
  if (norm.includes('ayuda') || norm.includes('como')) { pushMessage('bot', '• Escribe qué necesitas: "50 hamburguesas"<br>• Toca una categoría<br>• "total" para resumen<br>• "finalizar" para proforma'); return; }
  if (norm.includes('total') || norm.includes('resumen') || norm.includes('cuanto')) {
    const items = state.currentOrder.items;
    if (!items.length) { pushMessage('bot', 'Aún no hay nada.'); return; }
    pushMessage('bot', `Esto llevas:<br>${items.map(l => `• ${l.name} — ${l.unlimited ? 'ilimitado' : l.qty + ' ' + l.unit} — ${money(l.subtotal)}`).join('<br>')}<br><br><strong>Total: ${money(computeTotal())}</strong>`);
    return;
  }
  if (norm.includes('finalizar') || norm.includes('proforma') || norm.includes('cotizacion')) {
    if (!state.currentOrder.items.length) { pushMessage('bot', 'Agrega algo primero.'); return; }
    showProforma(); pushMessage('bot', 'Generé la proforma.');
    return;
  }
  if (norm.includes('vaciar') || norm.includes('borrar') || norm.includes('cancelar')) { clearOrder(); pushMessage('bot', '¿Empezamos un nuevo pedido?'); showCats(); return; }
  if (norm.includes('ver categorias') || norm.includes('categorias') || norm.includes('menu')) { pushMessage('bot', '¿Qué te interesa?'); showCats(); return; }

  const item = matchItem(norm);
  if (item) {
    const qty = extractQty(norm), unlimited = item.allowUnlimited && norm.includes('ilimitado');
    if (qty || unlimited) confirmAdded(addItemToOrder(item.id, qty, unlimited));
    else { chat.awaitingQtyItem = item; pushMessage('bot', `¿Cuántos de <strong>${item.name}</strong>?${item.allowUnlimited ? ' (o "ilimitado")' : ''}`); setQuickReplies([]); }
    return;
  }

  let botReply = chat.useAI ? await callGemini(rawText) : null;
  botReply = botReply || `No estoy seguro. Puedo ayudarte con ${CATALOG.map(c => c.name.toLowerCase()).join(', ')}.`;
  pushMessage('bot', botReply);
  setQuickReplies([{ value: 'ver categorias', label: 'Ver catálogo' }, { value: 'ver total', label: 'Ver pedido' }]);
}

const toggleChat = (force) => { chat.open = typeof force === 'boolean' ? force : !chat.open; const w = document.getElementById('chatbotWindow'); w.hidden = !chat.open; if (chat.open) { document.getElementById('chatbotBadge').hidden = true; document.getElementById('chatbotInput').focus(); } };
const sendWelcome = () => { pushMessage('bot', `¡Hola! Soy asistente de ${EMPRESA_NOMBRE}. ¿Qué necesitas?`); showCats(); };

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chatbotFab').addEventListener('click', () => toggleChat());
  document.getElementById('chatbotMinimize').addEventListener('click', () => toggleChat(false));
  document.getElementById('chatbotForm').addEventListener('submit', async e => { e.preventDefault(); const input = document.getElementById('chatbotInput'); const text = input.value.trim(); if (text) await handleUserText(text); });
  if (typeof CATALOG !== 'undefined' && CATALOG.length) setTimeout(sendWelcome, 900);
  else window.addEventListener('catalog-ready', () => setTimeout(sendWelcome, 300), { once: true });
});
