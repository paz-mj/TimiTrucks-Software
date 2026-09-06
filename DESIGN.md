# Sistema de diseño — Flota Tracker

Este documento describe el sistema de diseño **tal como existe hoy en el código**
(`app/globals.css`, `components/ui/`). No introduce valores nuevos: es la
referencia fija para todo lo que se construya de acá en adelante. Si el código
cambia, actualizar este archivo en el mismo commit.

Filosofía declarada en el propio `globals.css`: el usuario final principal
(admin) tiene poco manejo de tecnología y probablemente vista cansada →
se prioriza legibilidad y contraste alto por sobre estética minimalista.
Las vistas de admin adoptan el lenguaje visual de sidebar + tarjetas de la
referencia "Horizon" (marca azul en vez de verde), con soporte de dark mode;
`/mi-vehiculo` (vista del conductor) queda al margen de ese rediseño.

## Paleta de colores

Definida como CSS variables en `@theme` (Tailwind v4, CSS-first — no hay
`tailwind.config.*`, todo vive en `app/globals.css`). Marca = **azul**
(`#2563eb`), no el verde de la referencia visual "Horizon" que inspiró el
rediseño del dashboard — decisión de negocio explícita. El trío
verde/ámbar/rojo de `EstadoBadge` es un sistema semántico aparte (documentos
vencidos, mantención próxima) y **nunca se reemplaza por azul** ni cambia de
significado.

### Light mode

| Token | Hex | Uso |
| --- | --- | --- |
| `--color-primary` | `#2563eb` | Fill de acciones principales (Button primary), mismo hex en dark |
| `--color-primary-hover` | `#1d4ed8` | Hover de `--color-primary`, mismo hex en dark |
| `--color-accent` | `#2563eb` | Texto/ícono de acento (ítem de sidebar activo, links) — en light es igual a `--color-primary`, pero es un token aparte porque en dark diverge |
| `--color-accent-bg` | `#eff6ff` | Fondo del ítem de sidebar activo |
| `--color-text` | `#1e293b` | Texto principal, títulos |
| `--color-text-secondary` | `#45556c` | Texto secundario/metadata |
| `--color-bg` | `#f8fafc` | Fondo general de la página |
| `--color-bg-card` | `#ffffff` | Fondo de tarjetas, inputs, modales, header |
| `--color-border` | `#cbd5e1` | Separadores internos de una tarjeta (`border-t-2`), tenues a propósito |
| `--color-border-strong` | `#64748b` | Bordes de elementos interactivos (inputs, botón secondary) |
| `--color-border-subtle` | `#e2e8f0` | Borde de 1px de las tarjetas del dashboard nuevo (grid, sidebar, topbar, modales) — look "borde sutil + sombra" |
| `--color-success` | `#166534` | Texto/ícono de estado "al día" |
| `--color-success-bg` | `#dcfce7` | Fondo del badge "al día" |
| `--color-warning` | `#a3450a` | Texto/ícono de estado "por vencer" |
| `--color-warning-bg` | `#fef3c7` | Fondo del badge "por vencer" |
| `--color-danger` | `#b91c1c` | Fill de Button danger (rojo sólido + texto blanco encima) |
| `--color-danger-hover` | `#991b1b` | Hover de `--color-danger` |
| `--color-danger-bg` | `#fee2e2` | Fondo del badge "vencido" |
| `--color-danger-text` | `#b91c1c` | Texto/ícono de peligro sobre el fondo de la página (FormError, ícono de eliminar, badge "vencido") — mismo hex que `--color-danger` en light, pero token aparte porque diverge en dark |

Regla de negocio para los tres colores de estado (`EstadoBadge`): se eligieron
para distinguirse tanto por matiz como por luminosidad en escala de grises, y
**nunca se usan solos** — siempre van acompañados de ícono + texto (ver
sección de accesibilidad).

`--color-danger` (fill) y `--color-danger-text` (texto/ícono) son dos tokens
separados aunque compartan hex en light: un rojo que funciona bien como fondo
sólido con texto blanco encima no necesariamente funciona como texto sobre el
fondo oscuro de dark mode, y viceversa. Mismo razonamiento para `--color-accent`
vs `--color-primary`.

### Dark mode

Estrategia de **clase** (no `prefers-color-scheme`): `.dark` en `<html>`,
activada/desactivada por `DarkModeToggle` y persistida en `localStorage`
(clave `"tema"`). Un script inline en `app/layout.tsx` aplica la clase antes
de la hidratación para no mostrar un flash en claro al recargar.

Como todos los componentes usan los tokens semánticos de arriba (nunca un
color crudo de Tailwind tipo `bg-white` o `text-slate-800`), el modo oscuro
se logra **redefiniendo el valor de cada variable dentro de `:root.dark`**,
sin escribir `dark:` en cada componente:

| Token | Hex (dark) | Nota |
| --- | --- | --- |
| `--color-accent` | `#60a5fa` | Más claro que en light para mantener contraste sobre fondo oscuro |
| `--color-accent-bg` | `#203662` | Azul oscuro tintado (equivalente dark de `#eff6ff`) |
| `--color-text` | `#f1f5f9` | |
| `--color-text-secondary` | `#94a3b8` | |
| `--color-bg` | `#0f172a` | |
| `--color-bg-card` | `#1e293b` | |
| `--color-border` | `#334155` | Sigue siendo tenue, mismo rol que en light |
| `--color-border-strong` | `#94a3b8` | Más claro que `--color-border-subtle` para no perder la jerarquía |
| `--color-border-subtle` | `#64748b` | Más visible que en light: en dark el `box-shadow` casi no se nota, así que el borde carga un poco más la definición de la tarjeta |
| `--color-success` | `#4ade80` | |
| `--color-success-bg` | `#1f4541` | |
| `--color-warning` | `#fbbf24` | |
| `--color-warning-bg` | `#453e32` | |
| `--color-danger-text` | `#f87171` | |
| `--color-danger-bg` | `#372c3c` | |

`--color-primary`/`--color-primary-hover`/`--color-danger` (los tres fills
con texto blanco encima) **no** se redefinen en dark: el mismo hex ya cumple
4.5:1 con texto blanco en cualquier fondo, así que cambiarlos sería
inconsistencia sin beneficio.

Cada combinación de arriba se verificó con la fórmula de contraste WCAG
(mínimo 4.5:1 para texto, 3:1 para bordes de componentes UI) antes de
fijarla — no a ojo. La única excepción deliberada es `--color-border-subtle`
en **light** (`#e2e8f0` sobre `#ffffff` ≈ 1.2:1): es un borde puramente
decorativo en tarjetas que ya se distinguen por espaciado y `shadow-sm`, así
que no se le exige el contraste de un límite funcional — es la misma
filosofía "borde sutil + sombra" que la referencia visual, aceptada
explícitamente al definir la paleta nueva. En dark ese mismo borde sí sube a
3:1 porque ahí la sombra no alcanza para dar definición por sí sola.

## Escala tipográfica

- **Familia**: `var(--font-inter)` (Inter, cargada como font de Next) con
  fallback `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Base**: `18px` (`1.125rem`) en `<body>` — nunca se baja de `14px`, ni
  siquiera en metadata/texto secundario. Todo en `rem` para respetar el zoom
  del navegador.

| Token         | Tamaño            | Line-height | Uso típico                                              |
| ------------- | ----------------- | ----------- | -------------------------------------------------------- |
| `text-xs`     | 0.875rem (14px)   | 1.25rem     | Piso mínimo de tamaño (no se usa mucho en la práctica)   |
| `text-sm`     | 1rem (16px)       | 1.5rem      | Labels de formulario, metadata, texto de badges           |
| `text-base`   | 1.125rem (18px)   | 1.75rem     | Tamaño por defecto (body, párrafos, botones, inputs)      |
| `text-lg`     | 1.25rem (20px)    | 1.875rem    | Subtítulos de sección (h2/h3), título de ConfirmDialog    |
| `text-xl`     | 1.5rem (24px)     | 2rem        | Título del AppHeader                                      |
| `text-2xl`    | 1.875rem (30px)   | 2.375rem    | (reservado, sin uso actual detectado)                     |
| `text-3xl`    | 2.25rem (36px)    | 2.75rem     | Cifra destacada (ej. kilometraje actual en Mi Vehículo)   |

**Pesos** usados consistentemente:
- `font-medium` (500): labels, botones, subtítulos de sección, badges
- `font-semibold` (600): título del AppHeader, patente del vehículo, títulos de card
- `font-bold` (700): la cifra grande de kilometraje (único uso, para máximo énfasis)

## Espaciado y radios de borde

- **Bordes**: conviven dos convenciones a propósito.
  - `border-2` (2px) en **inputs y botones** (`FormField`, `Button`
    secondary, selects/textareas hechos a mano) — se mantiene grueso porque
    necesitan leerse como interactivos.
  - `border border-border-subtle` (1px) en el **contenedor exterior de
    tarjetas** del dashboard admin (Sidebar, TopBar, `VehiculoCard`,
    `StatCard`, `ConfirmDialog`, las cards de `CrearVehiculoForm`/
    `VehiculoRow`/etc.), acompañado siempre de `shadow-sm` — el límite de la
    tarjeta lo da el borde fino + la sombra, no un borde grueso. `/mi-vehiculo`
    (vista del conductor) no se tocó y sigue con `border-2 border-border`.
  - `border-t-2`/`divide-y-2 border-border` para separadores **internos**
    dentro de una tarjeta ya delimitada — se mantienen igual de tenues que
    antes, en cualquiera de los dos tipos de tarjeta.
- **Radios**:
  - `rounded-md` — inputs, botones, ítems de documento/vehículo dentro de listas
  - `rounded-lg` — contenedores de nivel tarjeta (cards, formularios, ConfirmDialog)
  - `rounded-full` — `EstadoBadge` (forma de píldora)
- **Padding de contenedores**: `p-4 sm:p-5` o `p-4 sm:p-6` en tarjetas/formularios;
  `p-4 sm:p-6` en el `<main>` de cada página.
- **Espaciado vertical**: `space-y-*` para ritmo entre bloques —
  `space-y-1.5` (label + input), `space-y-3/4` (dentro de una tarjeta),
  `space-y-5/6` (entre secciones de una página).
- **Espaciado horizontal**: `gap-1.5/2` en grupos de ícono+texto o botones
  chicos, `gap-3/4` en layouts flex/grid más espaciosos.

## Accesibilidad ya aplicada

- **Tamaño base 18px**, piso de 14px — nunca texto más chico que eso.
- **Área de toque mínima 44px** (`min-h-11`/`min-w-11` = 2.75rem) en `Button`,
  el input de `FormField`, y enlaces con rol de botón (ej. "Volver a flotas").
- **Bordes gruesos (2px)** en toda la UI en vez de hairlines de 1px, para
  mayor contraste visual.
- **Foco visible**: `focus-visible:outline-2 outline-offset-2 outline-accent`
  en todos los elementos interactivos (botones, inputs, selects, links del
  Sidebar). Usa `--color-accent`, no `--color-primary`: el primario
  (`#2563eb`) no llega a 3:1 contra el fondo de una tarjeta en dark mode,
  mientras que accent sí (se pensó justamente para eso).
- **El color nunca es el único portador de información**: `EstadoBadge`
  siempre combina ícono + texto; `FormError` siempre combina `AlertTriangle`
  + mensaje.
- **`ConfirmDialog`**: trampa de foco (Tab/Shift+Tab circular), `Escape`
  cancela, y el foco inicial va al botón "Cancelar" (no a la acción
  destructiva) para que un Enter reflejo no borre nada.
- **Dark mode**: opcional (el usuario lo activa), no reemplaza al tema claro
  por defecto. Cada combinación texto/fondo de la sección de paleta se
  verificó con la fórmula de contraste WCAG antes de fijar el hex, no a ojo.
  Todo `<input>`/`<select>`/`<textarea>` lleva `bg-bg-card` explícito (si no,
  el navegador les pone su propio fondo blanco por defecto, invisible en
  light pero roto en dark); además `color-scheme` en `:root`/`:root.dark`
  cubre lo que las clases no llegan a estilar (menú nativo de un `<select>`,
  scrollbar, autofill).
- **Sidebar responsive**: colapsa a un menú de hamburguesa por debajo de
  768px (`md` de Tailwind) — el admin lo usa desde el celular, no es
  opcional. `/mi-vehiculo` no lleva este shell: sigue siendo la vista
  simple de una sola columna que ya era.

## Catálogo de componentes reusables (`components/ui/`)

### `Button`
`variant`: `primary` (acción principal, fondo `--color-primary`) ·
`secondary` (fondo `bg-card`, borde `border-strong` — acciones alternativas,
cancelar, editar) · `danger` (fondo `--color-danger` — acciones destructivas
confirmadas). Base común: `min-h-11 min-w-11`, `rounded-md`, `font-medium`,
estado `disabled` con opacidad 50%, foco visible.

### `EstadoBadge`
Píldora (`rounded-full`) que representa uno de tres estados de negocio:
`al_dia` (verde, `CheckCircle2`), `por_vencer` (ámbar, `AlertTriangle`),
`vencido` (rojo, `XCircle`). Acepta `label` opcional para sobrescribir el
texto por defecto (ej. "Mantención atrasada" en vez de "Vencido").

### `ConfirmDialog`
Modal de confirmación para acciones destructivas (eliminar vehículo,
eliminar documento). Encapsula toda la lógica de accesibilidad de foco
descrita arriba. Se dispara con `open`, expone `onConfirmar`/`onCancelar`.

### `FormField`
Input de texto con label asociado (`htmlFor`/`id`), envuelve los estilos
estándar de borde/foco/tamaño. Para campos que no son `<input>` (selects,
textareas, file inputs) las pantallas replican el mismo patrón visual a mano
(label `text-sm font-medium` + control `min-h-11 border-2 border-border-strong
rounded-md`) porque `FormField` solo cubre `InputHTMLAttributes`.

### `FormError`
Mensaje de error inline: ícono `AlertTriangle` + texto en `--color-danger`.
Devuelve `null` si no hay `message`, para poder montarlo siempre en el JSX
sin condicionales en el call site.

### `AppHeader`
Encabezado de página: ícono `Truck` + título + `LogoutButton`, con borde
inferior. Usado **solo** en `/mi-vehiculo` (vista del conductor) — las
vistas de admin usan `Sidebar`/`TopBar` en su lugar, ver abajo.

### `Sidebar` / `TopBar` / `DashboardChrome` (`components/dashboard/`)
Shell de las vistas de admin (todo bajo `/dashboard`, layout compartido en
`app/dashboard/layout.tsx`). `DashboardChrome` es el client component que
guarda el estado de "sidebar abierto" en mobile y renderiza `Sidebar` +
`TopBar` + `children`. `Sidebar` colapsa a un drawer con overlay por debajo
de `md` (768px); `TopBar` trae el selector de flota y el título/breadcrumb
de la sección actual, derivados del pathname (`lib/dashboard-nav.ts`), más
el botón de hamburguesa en mobile. `/mi-vehiculo` no usa este shell.

### `DarkModeToggle`
Switch de modo oscuro al final del Sidebar. Sin `useEffect`: lee la clase
`dark` del `<html>` en el inicializador perezoso de `useState` (ya la puso
el script inline de `app/layout.tsx` antes de hidratar), y al togglear
actualiza la clase + `localStorage` directamente.

### `VehiculoCard` / `StatCard` (`components/dashboard/`)
Tarjetas del grid de `/dashboard/[flotaId]`. `VehiculoCard` muestra foto
(o placeholder), patente, marca/modelo, el peor `EstadoBadge` entre sus
documentos y su mantención (`peorEstado` en `EstadoBadge.tsx`), km actual y
conductor asignado; al hacer click lleva a la ficha completa en
`/dashboard/flotas/[id]`. `StatCard` es un número + ícono + label, para la
fila de métricas arriba del grid.

## Convención de íconos (`lucide-react`)

| Ícono          | Concepto que representa                                             |
| -------------- | ----------------------------------------------------------------------|
| `Truck`        | Identidad de la app / flota / vehículo (logo, ítems de lista de flotas) |
| `CheckCircle2` | Estado "al día", confirmación positiva                               |
| `AlertTriangle`| Estado "por vencer", errores de formulario, advertencia en ConfirmDialog |
| `XCircle`      | Estado "vencido"                                                      |
| `FileText`     | Sección de documentos                                                 |
| `Pencil`       | Acción de editar                                                      |
| `Trash2`       | Acción de eliminar (siempre con `text-danger` dentro de un botón `secondary`) |
| `ArrowLeft`    | Navegación "volver"                                                   |
| `Wrench`       | Información relacionada a mantención, ítem de sidebar "Mantenciones y Repuestos" |
| `History`      | Historial / registro cronológico (lecturas de km)                     |
| `LayoutGrid`   | Ítem de sidebar "Dashboard" (grid de vehículos)                       |
| `Bell`         | Ítem de sidebar "Avisos"                                              |
| `Package`      | Registro de tipo "repuesto" (vs. `Wrench` para "mantención")          |
| `Gauge`        | Kilometraje actual, en `VehiculoCard`                                 |
| `User`         | Conductor asignado, en `VehiculoCard`                                 |
| `Menu` / `X`   | Abrir/cerrar el drawer del Sidebar en mobile                          |
| `Moon` / `Sun` | Estado del `DarkModeToggle` (oscuro/claro)                            |

Todo ícono decorativo lleva `aria-hidden="true"`.
