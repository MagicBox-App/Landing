# Configuración de Variables de Entorno

Las API keys y credenciales sensibles **nunca deben subirse a GitHub**. Este proyecto usa un sistema seguro de variables de entorno.

## 🔐 Estructura

- **Desarrollo local** → `.env.local` (no versionado)
- **Producción (Netlify)** → Variables de entorno en dashboard de Netlify
- **Fallback** → El chat usa solo reglas locales si no hay API key

## 📝 Desarrollo Local

### 1. Crear archivo `.env.local`

```bash
# Copiar el template
cp .env.example .env.local

# Editar y agregar tu API key
nano .env.local  # o tu editor favorito
```

Contenido de `.env.local`:
```env
GEMINI_API_KEY=tu_clave_api_aqui
```

**Importante:** `.env.local` está en `.gitignore` — nunca se subirá a GitHub.

### 2. Probar en desarrollo

```bash
python -m http.server 8934
# Ir a http://localhost:8934
```

El script `js/env-loader.js` detectará `.env.local` y cargará la API key automáticamente.

---

## 🚀 Producción (Netlify)

### 1. Agregar variable de entorno en Netlify

En tu dashboard de Netlify:

1. **Settings** → **Environment variables**
2. **Add a variable**
3. Key: `GEMINI_API_KEY`
4. Value: `tu_clave_real_aqui`
5. Scope: `Production`

### 2. Cómo funciona en Netlify

Netlify inyecta las variables de entorno como:
- Variables disponibles en `process.env.*` (en build time)
- El archivo `.env.local` NO existe en servidor
- El script `env-loader.js` detecta que está en Netlify y usa las variables inyectadas

### 3. Desplegar

```bash
git push origin main
# Netlify redeploya automáticamente
```

---

## ✅ Verificar que funciona

### En desarrollo
1. Con `.env.local` → Chat usa Gemini API ✓
2. Sin `.env.local` → Chat usa solo reglas locales (está bien) ✓

### En Netlify
1. Abre el sitio
2. Abre la consola (F12)
3. Deberías ver: `✓ API keys cargadas correctamente` ✓

Si ves `⚠️ GEMINI_API_KEY no configurada`, verifica en Netlify que la variable esté en **Production**.

---

## 🔑 Obtener API key de Gemini

1. Ir a https://ai.google.dev/
2. **Get API key** → **Create API key in new project**
3. Copiar la key (la larga que empieza con `AI...`)
4. Pegar en `.env.local` y en Netlify

> **Cuidado:** La key de Gemini es gratuita pero tiene límites de uso. Si el chat se ve lento en producción, puede ser por límite de rate.

---

## 📋 Checklist de seguridad

- [ ] `.env.local` está en `.gitignore` ✓
- [ ] Nunca hiciste `git add .env.local` ✓
- [ ] La API key está en Netlify, no en código ✓
- [ ] Las credenciales nunca están en GitHub ✓
- [ ] En desarrollo funciona con `.env.local` ✓
- [ ] En producción funciona sin `.env.local` ✓

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| Chat siempre responde con reglas locales | Revisa la consola (F12) para error de API key |
| `.env.local` subida a GitHub | `git rm --cached .env.local` y repara el history |
| Netlify dice "variable no encontrada" | Verifica que esté en **Production** scope, no Draft |
| Chat lento en Netlify | Puede ser limit de Gemini API — revisa la cuenta |

