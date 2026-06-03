# JBoss URL Switcher

Extensión para Chrome y Edge que redirige automáticamente dominios de staging/dev/pre a tu servidor JBoss local, preservando la sesión activa.

## Objetivo

En el desarrollo con JBoss, el flujo habitual es:

1. Loguearse en la app en un entorno remoto (staging, dev, pre) para crear la sesión
2. Continuar trabajando contra el servidor JBoss local (`localhost:8090`) sin tener que reautenticarse

Esta extensión automatiza el paso 2: detecta cuándo estás en un dominio configurado y redirige transparentemente a tu servidor local, manteniendo el path, query string y hash de la URL original.

---

## Características

- **Redirección automática** — en cuanto navegás a una página del dominio configurado, te redirige al servidor local
- **Toggle on/off** — activás la redirección solo cuando ya tenés sesión en staging; mientras te logueás, la tenés desactivada
- **Atajo de teclado `Alt+Shift+J`** — para activar/desactivar sin abrir el popup
- **"Redirigir esta página ahora"** — botón para redirigir el tab actual de forma inmediata al activar la extensión
- **"Volver a staging"** — guarda la última URL de staging para poder volver a loguearte cuando vence la sesión
- **Badge visual** — el ícono muestra `→` (naranja) cuando el dominio actual será redirigido, `ON` (verde) cuando está activo en otro dominio
- **Múltiples dominios origen** — podés configurar staging, dev y pre al mismo tiempo
- **Preserva la URL completa** — path, query parameters y hash se mantienen en la redirección

---

## Instalación

### Chrome

1. Abrí `chrome://extensions` en el navegador
2. Activá el **Modo desarrollador** (switch en la esquina superior derecha)
3. Hacé click en **Cargar descomprimida**
4. Seleccioná la carpeta `jboss-url-switcher`

### Edge

1. Abrí `edge://extensions` en el navegador
2. Activá el **Modo de desarrollador** (switch en el panel izquierdo)
3. Hacé click en **Cargar descomprimida**
4. Seleccioná la carpeta `jboss-url-switcher`

> La extensión aparecerá en la barra de herramientas con el ícono **J** azul. Si no aparece, fijala desde el menú de extensiones (ícono de puzzle).

---

## Configuración

1. Hacé click en el ícono de la extensión para abrir el popup
2. En **Dominios origen**, escribí los dominios de staging/dev/pre, uno por línea:
   ```
   staging.miapp.com
   dev.miapp.com
   pre.miapp.com
   ```
3. En **Dominio destino**, escribí la dirección de tu servidor JBoss local:
   ```
   localhost:8090
   ```
4. Hacé click en **Guardar**

---

## Uso

### Flujo típico de desarrollo

```
1. Desactivar extensión (toggle OFF o Alt+Shift+J)
         ↓
2. Navegar a staging.miapp.com e iniciar sesión
         ↓
3. Activar extensión (toggle ON o Alt+Shift+J)
         ↓
4. Click en "↪ Redirigir esta página ahora"
   — o navegar a cualquier página del dominio —
         ↓
5. La extensión redirige a http://localhost:8090/...
   manteniendo el path y la sesión activa
         ↓
6. Trabajar contra el servidor JBoss local
```

### Cuando vence la sesión

1. Abrí el popup de la extensión
2. Hacé click en **← Volver a staging** — te lleva de vuelta a la última URL de staging
3. Desactivá la extensión, relogueate, y volvé a activarla

### Badge del ícono

| Badge | Color | Significado |
|-------|-------|-------------|
| `→`  | Naranja | Estás en un dominio configurado — será redirigido |
| `ON` | Verde   | Extensión activa, dominio actual no está en la lista |
| _(sin badge)_ | — | Extensión desactivada |

---

## Estructura del proyecto

```
jboss-url-switcher/
├── manifest.json       # Configuración de la extensión (Manifest V3)
├── background.js       # Service worker: lógica de redirección y badge
├── popup.html          # Interfaz del popup
├── popup.css           # Estilos (tema oscuro)
├── popup.js            # Lógica del popup
├── create-icons.ps1    # Script PowerShell para regenerar íconos
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Regenerar íconos

Si necesitás regenerar los íconos PNG:

```powershell
powershell -ExecutionPolicy Bypass -File .\create-icons.ps1
```

Requiere Windows con .NET Framework (disponible por defecto en Windows 10/11).
