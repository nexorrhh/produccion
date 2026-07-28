# Panel de Producción — Cimomet S.A. / Co.mo.ing S.R.L.

## 1. Qué es esto

App standalone (no integrada a ningún otro módulo/sector existente) para que el
**gerente de producción** gestione información y tome acciones desde un solo
lugar. Arranca con 3 módulos y está pensada para poder **agregar y quitar
módulos fácilmente** a futuro sin tocar el resto del sistema.

Prioridad explícita del dueño del proyecto: **preferir una arquitectura
correcta y desacoplada, aunque tarde más en construirse, sobre algo rápido y
compacto que después sea difícil de extender o falle.** Ante la duda entre
"simple ahora" y "modular a futuro", elegir modular.

## 2. Stack

- **Frontend:** React + Vite
- **Backend/datos:** Supabase (Postgres + REST autogenerada)
- **Hosting/repo:** todavía no decidido (se define más adelante). Nombre de
  carpeta/repo local: `panel-produccion`.

## 3. Supabase — proyecto y convención de tablas

**Proyecto:** "Legajos Cimomet/Comoing" (el mismo que usan los HTML de
referencia, ver sección 5). **No es un proyecto nuevo** — esta app comparte la
base con el sistema de RRHH/sync de Tango.

⚠️ Ese proyecto tiene muchas tablas de otros sistemas (RRHH, ARCA/comprobantes,
candidatos, vencimientos, etc.) que **no hay que tocar ni romper**. Antes de
escribir cualquier migración, revisar el esquema real en Supabase — no asumir
columnas por lo que dice este documento.

### Tablas EXISTENTES que este proyecto va a leer (y en algunos casos escribir)

| Tabla | Uso en este proyecto |
|---|---|
| `empleados` | Personal activo (legajo, empresa, apellido_y_nombre, desc_puesto, activo). Fuente de verdad para Operativos y Polivalencia. |
| `rrhh_puestos_config` | Clasificación mensual/quincenal de puestos (usada por Operativos). |
| `citaciones` / `citacion_detalle` | Ya existen, las usa el HTML de Operativos. Confirmar si se reutilizan tal cual o se migran. |
| `v_cumplimiento_persona` | Vista de cumplimiento histórico por persona, usada en Operativos. |
| `v_empleados_activos` | Vista de personal activo — evaluar si conviene usar esta en lugar de filtrar `empleados` a mano. |
| `solicitudes_personal` | Donde este proyecto **escribe** las solicitudes del gerente. **La lee y aprueba un tablero de Directorio externo (Google Sheets / otro HTML) que NO forma parte de este proyecto.** No cambiar su esquema sin verificar que no rompe ese tablero externo. |
| `habilidades_catalogo` / `puestos_catalogo` | Contenido incierto ("tienen alguna información pero no se sabe de qué"). **No usar todavía** — ver Decisiones Pendientes, punto 1. |

### Tablas NUEVAS (prefijo `produccion_`)

Todo lo que se cree específicamente para este proyecto lleva el prefijo
`produccion_` para poder identificarlo a simple vista en un Supabase con
decenas de tablas de otros sistemas. Ejemplos: `produccion_usuarios`,
`produccion_polivalencia`, `produccion_polivalencia_historial`.

## 4. Autenticación y auditoría

- **Login propio de la app**, no comparte auth con ningún otro sistema.
- Login por **PIN de 4 dígitos** (no email/contraseña).
- Tabla `produccion_usuarios`: pensada para crecer (hoy 2 personas, va a haber
  más pronto — ver Decisiones Pendientes, punto 2). Estructura mínima
  sugerida: `id, nombre_apellido, pin, rol, activo, creado_en`.
  - Usuarios iniciales: **Hernández, Javier** y **Angulo, Valentín Eduardo**
    (este último para gestión/administración del sistema).
  - No hay todavía un rol "Directorio" dentro de esta app.
- **Auditoría simple** (no versionado completo): cada registro que se cree o
  modifique en tablas `produccion_*` debe guardar `creado_por`,
  `creado_en`, `modificado_por`, `modificado_en`, referenciando al usuario
  logueado. No se requiere guardar el valor anterior de cada campo, solo
  quién y cuándo tocó el registro.

## 5. Módulos (v1)

### 5.1 Gestión de Operativos (ex "citaciones", sábados/feriados)

- **Referencia obligatoria:** `citaciones.html` (se copia a
  `/docs/reference/citaciones.html` en este repo). Leer ese archivo antes de
  construir el módulo — define look & feel, columnas, lógica de
  clasificación mensual/quincenal, y la integración con Supabase que ya
  funciona en producción.
- Usa las tablas existentes `empleados`, `rrhh_puestos_config`, `citaciones`,
  `citacion_detalle`, `v_cumplimiento_persona`.
- **Submódulo: Análisis de información.** Vista de detalle de operativos:
  cumplimiento general, cumplimiento por operativo, y cumplimiento por
  persona a lo largo del tiempo. (Sin más detalle todavía — definir pantallas
  concretas cuando se llegue a esta etapa.)

### 5.2 Búsqueda de Personal (ex "solicitud-personal")

- **Referencia obligatoria:** `solicitud-personal.html` (se copia a
  `/docs/reference/solicitud-personal.html`), con las siguientes
  **modificaciones respecto del original**:
  1. **Sacar el campo "Solicitado por"** del formulario — el valor se
     completa automáticamente con el usuario logueado (no se pide ni se
     puede editar).
  2. **Sacar el selector de Empresa** del formulario de solicitud. El
     gerente **no** elige empresa al solicitar. La empresa (Cimomet o
     Co.mo.ing) la define el Directorio recién en el momento de aprobar,
     **en el tablero externo** — no en esta app. (Ese tablero externo va a
     necesitar su propio ajuste para pedir la empresa al aprobar, pero esa
     modificación queda **fuera del alcance de este proyecto** salvo que se
     decida lo contrario más adelante.)
  3. **Cambiar "Puesto solicitado" de texto libre a un selector**, poblado
     con los puestos que existen **hoy** entre el personal activo (distinct
     de `desc_puesto` en `empleados` donde `activo = true`). No debe poder
     seleccionarse un puesto que no esté vigente actualmente entre la gente.
- Sigue escribiendo en la tabla existente `solicitudes_personal` (no crear
  una tabla nueva) para no romper la lectura del tablero de Directorio
  externo.
- Flujo: Gerente solicita (queda `estado = 'pendiente'`) → Directorio
  aprueba **en su propio tablero, fuera de esta app**, definiendo empresa →
  (a futuro) RRHH inicia búsqueda automáticamente a partir de esa
  aprobación. La parte de "RRHH inicia búsqueda automática" **todavía no
  está definida en detalle** — ver Decisiones Pendientes, punto 3.

### 5.3 Polivalencia

- Toma el personal activo desde `empleados` (`activo = true`).
- El gerente de producción arma y mantiene manualmente un cuadro de
  polivalencia por persona (qué puestos/tareas puede cubrir cada uno). Por
  ahora es 100% manual, no se infiere de otras tablas.
- Tabla nueva `produccion_polivalencia` (estructura orientativa, a definir
  con más precisión al empezar a codear):
  `legajo, empresa, puesto_o_habilidad, nivel, fecha_definicion,
  fecha_confirmacion, definido_por, confirmado_por`.
- **Regla de vigencia (obligatoria):**
  - La polivalencia de una persona debe **actualizarse/confirmarse cada 6
    meses**.
  - Si ya existe polivalencia definida y no hubo cambios, alcanza con
    **confirmar** que sigue vigente (no hace falta rehacerla).
  - Si ingresa una persona nueva, hay **30 días** para definir su
    polivalencia por primera vez.
  - Si se vence el plazo (los 6 meses de confirmación, o los 30 días de una
    persona nueva) sin que se haya hecho, debe aparecer una **alerta**
    visible indicando qué hay pendiente de corregir/confirmar.

### 5.4 Fuera de alcance por ahora (futuro)

- Dashboard de indicadores de calidad de producción. No diseñar ni dejar
  espacio reservado más allá de mencionar que existirá como módulo futuro.

## 6. Principio de modularidad (aplica a todos los módulos, presentes y futuros)

- Cada módulo vive en su propia carpeta de código y, cuando corresponda, en
  sus propias tablas `produccion_*`.
- La navegación (sidebar/rutas) debe permitir habilitar/deshabilitar un
  módulo sin romper los demás.
- Evitar acoplar lógica de un módulo dentro de otro. Si dos módulos
  necesitan compartir datos (ej: Operativos y Polivalencia comparten
  `empleados`), acceder a la tabla compartida desde cada módulo de forma
  independiente, no a través del código de otro módulo.

## 7. Decisiones pendientes / a confirmar antes o durante la construcción

No asumir nada de esta lista — confirmar con el dueño del proyecto en cuanto
se llegue a esa parte:

1. **`habilidades_catalogo` y `puestos_catalogo`**: contenido real
   desconocido. Antes de usarlas (por ejemplo, como diccionario de columnas
   para la matriz de Polivalencia), revisarlas en Supabase. Si no sirven o
   no se entiende su propósito, crear catálogos nuevos con prefijo
   `produccion_` en lugar de reutilizarlas a ciegas.
2. **Más usuarios próximamente**: hoy son 2 logins, pero se sabe que van a
   sumarse más pronto (ej: cobertura durante ausencias). El diseño de
   `produccion_usuarios` y de roles debe poder crecer sin refactor.
3. **Automatización de "RRHH inicia búsqueda"**: el paso final del flujo de
   Búsqueda de Personal (que RRHH arranque una búsqueda automáticamente tras
   la aprobación del Directorio) no está definido — ni el mecanismo
   (¿notificación? ¿nueva tabla de "búsquedas"? ¿tarea manual disparada por
   un cambio de estado?) ni si es parte de este proyecto o de otro sistema.
4. **Rol "Directorio" dentro de esta app**: hoy la aprobación ocurre en un
   tablero externo. Si en el futuro se decide traer esa aprobación adentro
   de este sistema, hay que definir el rol y sus permisos en
   `produccion_usuarios`.
5. **Estructura final de `produccion_polivalencia`**: la de este documento
   es orientativa. Definir con precisión las columnas reales (¿es una
   matriz puesto × habilidad, o un listado de puestos que cada persona
   puede cubrir?) antes de migrar.
6. **Hosting y repositorio remoto**: todavía no decidido.

## 8. Estilo de trabajo esperado (preferencias del dueño del proyecto)

- Prefiere **archivos completos y corregidos** antes que parches parciales.
- Prefiere **muchos archivos chicos y enfocados** antes que archivos
  monolíticos.
- Desarrollo **por fases con checkpoints explícitos** — no avanzar de fase
  sin confirmación.
- Nunca hardcodear porcentajes, escalas salariales, u otros valores de
  negocio que puedan cambiar — deben vivir en tablas de configuración.
- Ante cualquier ambigüedad de negocio no cubierta en este documento,
  **preguntar antes de asumir**, en particular sobre reglas de aprobación,
  permisos, y cualquier cosa que toque las tablas compartidas con otros
  sistemas.
