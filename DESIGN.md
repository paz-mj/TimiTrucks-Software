# Sistema de diseño — Flota Tracker

Este documento describe el sistema de diseño **tal como existe hoy en el código**
(`app/globals.css`, `components/ui/`). No introduce valores nuevos: es la
referencia fija para todo lo que se construya de acá en adelante. Si el código
cambia, actualizar este archivo en el mismo commit.

Filosofía declarada en el propio `globals.css`: el usuario final principal
(admin) tiene poco manejo de tecnología y probablemente vista cansada →
se prioriza legibilidad y contraste alto por sobre estética minimalista.
Un solo tema, sin modo oscuro, para mantener todo simple y predecible.

## Paleta de colores

Definida como CSS variables en `@theme` (Tailwind v4, CSS-first — no hay
`tailwind.config.*`, todo vive en `app/globals.css`).

| Token                  | Hex       | Uso                                                              |
| ---------------------- | --------- | ----------------------------------------------------------------- |
| `--color-primary`      | `#3e5c76` | Acciones principales (Button primary), íconos de marca/navegación |
| `--color-primary-hover`| `#2c4356` | Hover de acciones principales                                     |
| `--color-text`         | `#1e293b` | Texto principal, títulos                                          |
| `--color-text-secondary`| `#45556c`| Texto secundario/metadata (fechas, detalles, labels de apoyo)     |
| `--color-bg`           | `#f8fafc` | Fondo general de la página                                        |
| `--color-bg-card`      | `#ffffff` | Fondo de tarjetas, inputs, modales, header                        |
| `--color-border`       | `#cbd5e1` | Bordes suaves (separadores, contenedores no interactivos)         |
| `--color-border-strong`| `#64748b` | Bordes de elementos interactivos (inputs, botón secondary)        |
| `--color-success`      | `#166534` | Texto/ícono de estado "al día"                                    |
| `--color-success-bg`   | `#dcfce7` | Fondo del badge "al día"                                          |
| `--color-warning`      | `#a3450a` | Texto/ícono de estado "por vencer"                                |
| `--color-warning-bg`   | `#fef3c7` | Fondo del badge "por vencer"                                      |
| `--color-danger`       | `#b91c1c` | Texto/ícono de estado "vencido", Button danger, errores           |
| `--color-danger-hover` | `#991b1b` | Hover de Button danger                                            |
| `--color-danger-bg`    | `#fee2e2` | Fondo del badge "vencido"                                         |

Regla de negocio para los tres colores de estado (`EstadoBadge`): se eligieron
para distinguirse tanto por matiz como por luminosidad en escala de grises, y
**nunca se usan solos** — siempre van acompañados de ícono + texto (ver
sección de accesibilidad).

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

- **Bordes**: siempre `border-2` (2px), nunca 1px — decisión deliberada de
  contraste/visibilidad. `border-t-2`/`divide-y-2` para separadores internos
  de una tarjeta.
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
- **Foco visible**: `focus-visible:outline-2 outline-offset-2 outline-primary`
  en todos los elementos interactivos (botones, inputs, selects).
- **El color nunca es el único portador de información**: `EstadoBadge`
  siempre combina ícono + texto; `FormError` siempre combina `AlertTriangle`
  + mensaje.
- **`ConfirmDialog`**: trampa de foco (Tab/Shift+Tab circular), `Escape`
  cancela, y el foco inicial va al botón "Cancelar" (no a la acción
  destructiva) para que un Enter reflejo no borre nada.
- **Un solo tema, sin modo oscuro**: decisión consciente de simplicidad y
  predictibilidad para un usuario con poco manejo de tecnología, no una
  limitación técnica.

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
inferior. Es el único elemento de navegación superior en toda la app.

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
| `Wrench`       | Información relacionada a mantención                                 |
| `History`      | Historial / registro cronológico (lecturas de km)                     |

Todo ícono decorativo lleva `aria-hidden="true"`.
