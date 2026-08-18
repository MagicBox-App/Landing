/**
 * Sistema de íconos SVG — reemplaza todos los emojis de la app.
 * Estilo: line icons con relleno suave (duotono), inspirado en Phosphor Icons.
 * Cada función retorna un string SVG listo para innerHTML.
 */
const ICONS = {
  /* ===== CATEGORIAS DEL CATALOGO ===== */
  sparkles: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m-7.07-2.93l.71-.71M4.22 5.64l.71.71M3 12h1m16 0h1m-2.93 7.07l-.71-.71M19.78 5.64l-.71.71"/><circle cx="12" cy="12" r="4" fill="currentColor" opacity=".12"/><path d="M12 8v8m-4-4h8"/></svg>`,

  shows: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.09 4.26L19 7.27l-3.5 3.41L16.18 16 12 13.77 7.82 16l.68-5.32L5 7.27l4.91-1.01L12 2z" fill="currentColor" opacity=".12"/><path d="M12 2l2.09 4.26L19 7.27l-3.5 3.41L16.18 16 12 13.77 7.82 16l.68-5.32L5 7.27l4.91-1.01L12 2z"/><path d="M8 21h8M10 21v-3M14 21v-3"/></svg>`,

  decoracion: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C9 2 7 5 7 8c0 3 2 4 5 4s5-1 5-4c0-3-2-6-5-6z" fill="currentColor" opacity=".12"/><path d="M12 2C9 2 7 5 7 8c0 3 2 4 5 4s5-1 5-4c0-3-2-6-5-6z"/><path d="M12 12v10"/><path d="M9 22h6"/><circle cx="7" cy="4" r="1" fill="currentColor" opacity=".3"/><circle cx="17" cy="4" r="1" fill="currentColor" opacity=".3"/><circle cx="5" cy="7" r=".5" fill="currentColor" opacity=".2"/><circle cx="19" cy="7" r=".5" fill="currentColor" opacity=".2"/></svg>`,

  local: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="18" height="11" rx="2" fill="currentColor" opacity=".12"/><path d="M3 10l9-7 9 7"/><rect x="9" y="15" width="6" height="6"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>`,

  torta: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="12" width="20" height="8" rx="3" fill="currentColor" opacity=".12"/><path d="M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M4 12V10a8 8 0 0116 0v2"/><path d="M12 6V3"/><circle cx="12" cy="2.5" r="1" fill="currentColor" opacity=".3"/></svg>`,

  carritos: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9H7.5L6 6z" fill="currentColor" opacity=".12"/><path d="M6 6H3"/><path d="M6 6l1.5 9h12L21 6"/><circle cx="9" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M9 17h9"/></svg>`,

  inflables: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V10l4-4h8l4 4v11" fill="currentColor" opacity=".12"/><path d="M4 21V10l4-4h8l4 4v11"/><path d="M4 21h16"/><rect x="9" y="14" width="6" height="7"/><path d="M8 6V3M16 6V3M12 6V4"/><path d="M7 10h10"/></svg>`,

  /* Un ícono propio por categoría: con 14 categorías, repetirlos hace que la
     grilla deje de ser escaneable de un vistazo. */
  'snacks-dulces': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3.4-2.5 5.5-5.5 5.5s-5.5-2.1-5.5-5.5z" fill="currentColor" opacity=".12"/><path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3.4-2.5 5.5-5.5 5.5s-5.5-2.1-5.5-5.5z"/><path d="M12 15v6M9.5 21h5"/></svg>`,

  'snacks-salados': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9h10l-1.2 11.6a1 1 0 0 1-1 .9H9.2a1 1 0 0 1-1-.9L7 9z" fill="currentColor" opacity=".12"/><path d="M7 9h10l-1.2 11.6a1 1 0 0 1-1 .9H9.2a1 1 0 0 1-1-.9L7 9z"/><path d="M9 9a2 2 0 0 1 .7-3.9A2.4 2.4 0 0 1 14.3 5 2 2 0 0 1 15 9"/></svg>`,

  'combos': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="9" width="17" height="11.5" rx="2" fill="currentColor" opacity=".12"/><rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M3.5 13.5h17M12 9v11.5"/><path d="M12 9S9.6 4.8 7.6 5.6 8.9 9 12 9zm0 0s2.4-4.2 4.4-3.4S15.1 9 12 9z"/></svg>`,

  'dulces': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11.5h12l-1.4 8.1a1.8 1.8 0 0 1-1.8 1.4H9.2a1.8 1.8 0 0 1-1.8-1.4L6 11.5z" fill="currentColor" opacity=".12"/><path d="M6 11.5h12l-1.4 8.1a1.8 1.8 0 0 1-1.8 1.4H9.2a1.8 1.8 0 0 1-1.8-1.4L6 11.5z"/><path d="M6.8 11.5a3 3 0 0 1 .8-5.3 3.4 3.4 0 0 1 6.4-1.1 3 3 0 0 1 3.2 6.4"/></svg>`,

  'gymkanas': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5.5a4 4 0 0 1-8 0V4z" fill="currentColor" opacity=".12"/><path d="M8 4h8v5.5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5.6A2.4 2.4 0 0 0 8 10.8M16 6h2.4A2.4 2.4 0 0 1 16 10.8"/><path d="M12 13.5V17M9.6 20.5l.4-3.5h4l.4 3.5h-4.8z"/></svg>`,

  'foto360': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7.5" width="18" height="12.5" rx="2.5" fill="currentColor" opacity=".12"/><rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><circle cx="12" cy="13.8" r="3.4"/><path d="M8.6 7.5l1.1-2a1 1 0 0 1 .9-.5h2.8a1 1 0 0 1 .9.5l1.1 2"/></svg>`,

  'alcancias': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.7 1.7-1.5 0-1-.9-1.4-.9-2.4 0-.9.8-1.6 1.7-1.6h1.6a4.9 4.9 0 0 0 4.9-4.9C21 6.8 17 3 12 3z" fill="currentColor" opacity=".12"/><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.7 1.7-1.5 0-1-.9-1.4-.9-2.4 0-.9.8-1.6 1.7-1.6h1.6a4.9 4.9 0 0 0 4.9-4.9C21 6.8 17 3 12 3z"/><circle cx="7.6" cy="11.5" r="1" fill="currentColor"/><circle cx="9.8" cy="7.6" r="1" fill="currentColor"/><circle cx="14.6" cy="7.4" r="1" fill="currentColor"/></svg>`,

  'caritas': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9.5C10.3 6.2 7.6 4.6 5.6 5.8S4 10.6 6 13c1.4 1.7 3.9 3.1 6 4.5" fill="currentColor" opacity=".12"/><path d="M12 7.5v10"/><path d="M12 9.5C10.3 6.2 7.6 4.6 5.6 5.8S4 10.6 6 13c1.4 1.7 3.9 3.1 6 4.5"/><path d="M12 9.5c1.7-3.3 4.4-4.9 6.4-3.7S20 10.6 18 13c-1.4 1.7-3.9 3.1-6 4.5"/></svg>`,

  'babyshower': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="15" r="4.6" fill="currentColor" opacity=".12"/><circle cx="11" cy="15" r="4.6"/><path d="M6.4 15h9.2"/><path d="M11 10.4V8.2A2.7 2.7 0 0 1 13.7 5.5h.6"/><circle cx="16.6" cy="5.4" r="2.1"/></svg>`,

  'mozo': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 9.6L4.9 7.2a1 1 0 0 0-1.4.9v7.8a1 1 0 0 0 1.4.9l5.5-2.4" fill="currentColor" opacity=".12"/><path d="M10.4 9.6L4.9 7.2a1 1 0 0 0-1.4.9v7.8a1 1 0 0 0 1.4.9l5.5-2.4"/><path d="M13.6 9.6l5.5-2.4a1 1 0 0 1 1.4.9v7.8a1 1 0 0 1-1.4.9l-5.5-2.4"/><rect x="9.8" y="8.6" width="4.4" height="6.8" rx="1.4"/></svg>`,

  'mobiliario': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5a2.5 2.5 0 0 0-2.5 2.5V18h19v-3a2.5 2.5 0 0 0-5 0v.8H7.5V15A2.5 2.5 0 0 0 5 12.5z" fill="currentColor" opacity=".12"/><path d="M5 12.5V9.5a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 9.5v3"/><path d="M5 12.5a2.5 2.5 0 0 0-2.5 2.5V18h19v-3a2.5 2.5 0 0 0-5 0v.8H7.5V15A2.5 2.5 0 0 0 5 12.5z"/><path d="M5 18v2M19 18v2"/></svg>`,

  /* ===== UI ICONS ===== */
  'arrow-left': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,

  'plus': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,

  'x': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,

  'check': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,

  'edit': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,

  'logout': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,

  'download': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,

  'file-text': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,

  'table': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,

  'save': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,

  'trash': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,

  'send': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,

  'message': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,

  'clock': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,

  'shopping-bag': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,

  'user': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,

  'phone': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,

  'calendar': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,

  'printer': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,

  'grid': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,

  'minus': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,

  'eye': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,

  'chevron-down': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,

  'mail': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,

  'lock': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,

  'party': (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3L2 22l10.7-3.8" fill="currentColor" opacity=".12"/><path d="M5.8 11.3L2 22l10.7-3.8"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M5.8 11.3C7.1 7.6 10.4 4.6 14.3 4c3-.5 5.7.7 7.2 2.2"/><path d="M12.7 18.2c3.7-1.3 6.7-4.6 7.3-8.5.5-3-.7-5.7-2.2-7.2"/></svg>`,

  'infinity': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>`,

  'sun': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,

  'moon': (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" opacity=".12"/><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
};

/** Retorna el SVG HTML de un ícono, o un span vacío si no existe. */
function icon(name, size) {
  const fn = ICONS[name];
  return fn ? fn(size) : '';
}

/** Mapa de ID de categoría → nombre de ícono SVG */
const CATEGORY_ICON_MAP = {
  'shows': 'shows',
  'decoracion': 'decoracion',
  'local': 'local',
  'torta': 'torta',
  'carritos': 'carritos',
  'inflables': 'inflables',
  'snacks-dulces': 'snacks-dulces',
  'snacks-salados': 'snacks-salados',
  'combos': 'combos',
  'dulces': 'dulces',
  'gymkanas': 'gymkanas',
  'foto360': 'foto360',
  'alcancias': 'alcancias',
  'caritas': 'caritas',
  'babyshower': 'babyshower',
  'mozo': 'mozo',
  'mobiliario': 'mobiliario',
};

/** Retorna el SVG del ícono de una categoría dado su ID. */
function categoryIcon(catId, size) {
  return icon(CATEGORY_ICON_MAP[catId] || 'party', size);
}
