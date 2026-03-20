# Manual de Usuario - ICSA Portal de Gestión Técnica

Bienvenido al **Portal de Gestión Técnica de ICSA (Ingeniería Comunicaciones S.A.)**. Este manual ha sido redactado para guiar paso a paso a los Administradores y Supervisores en el uso eficiente de la plataforma.

El objetivo de esta aplicación es digitalizar, agilizar y transparentar la creación de Órdenes de Trabajo (OTs), el control de proyectos, y el seguimiento de las herramientas y equipos de la empresa.

---

## Índice
1. [Roles y Acceso al Sistema](#1-roles-y-acceso-al-sistema)
2. [Navegación y Panel Principal (Dashboard)](#2-navegación-y-panel-principal)
3. [Órdenes de Trabajo (OTs)](#3-órdenes-de-trabajo-ots)
4. [Gestión de Proyectos](#4-gestión-de-proyectos)
5. [Seguridad en Faena (HPT y Charlas)](#5-seguridad-en-faena-hpt-y-charlas)
6. [Control de Herramientas e Inventario](#6-control-de-herramientas-e-inventario)
7. [Administración (Solo Administradores)](#7-administración-solo-administradores)
8. [Mejores Prácticas y Consejos](#8-mejores-prácticas-y-consejos)

---

## 1. Roles y Acceso al Sistema

El portal está diseñado y adaptado para su uso principal en dispositivos móviles (celulares/tablets) y computadoras de escritorio. Existen tres directrices de roles dentro de la plataforma:

### Tipos de Roles en el Sistema
*   **Administrador:** Tiene **acceso total y global**. Puede ver y editar todas las OTs, todos los Proyectos, y tiene permisos exclusivos para agregar nuevos Clientes, Personal y registrar nuevas Herramientas en el sistema.
*   **Supervisor:** Orientado al liderazgo en terreno. **Solo puede ver y gestionar lo que él mismo crea** o a los proyectos/órdenes a las que ha sido explícitamente asignado. El supervisor **no tiene permisos** para crear o eliminar Herramientas, Clientes ni Personal.
*   **Técnico:** **NO tiene acceso a la plataforma.** Los técnicos son registrados en el sistema por el Administrador únicamente para que figuren en la base de datos y puedan ser *asignados* a los proyectos u Órdenes de Trabajo, pero no poseen credenciales virtuales para iniciar sesión.

### Iniciar Sesión (Login)
1. Para ingresar al portal, dirígete a la página de inicio.
2. Ingresa tu correo electrónico asignado por la empresa (ej: `tu.nombre@icsa.com`) y tu contraseña.
3. Presiona el botón de **Entrar al Portal**.
4. En caso de no poder ingresar, comunícate con un Administrador para que restablezca tu clave o active tu perfil.

---

## 2. Navegación y Panel Principal

Dependiendo del dispositivo que uses, la plataforma se adapta para brindarte la mejor experiencia.

### En Computadora (Escritorio)
Verás una barra lateral izquierda con todo el menú de secciones. Hacer clic en cualquier sección te llevará directamente a ese apartado y cargará su contenido en el centro de la pantalla.

### En Dispositivos Móviles (Celular)
Al estar en terreno, ganarás agilidad usando la barra de navegación inferior (Panel Flotante):
*   **Panel:** Te lleva a la pantalla de resumen (Dashboard general).
*   **Proyectos:** Acceso rápido a los proyectos activos en los que participas.
*   **Nueva (Botón central \+):** Te permite crear rápidamente una nueva Orden de Trabajo.
*   **Órdenes:** Listado de OTs no finalizadas en las que estás asignado.
*   **Más (Menú):** Se despliega una hoja hacia arriba con todos los apartados adicionales a los que tienes permiso.

---

## 3. Órdenes de Trabajo (OTs)

El corazón operativo de ICSA recae en el registro de los trabajos realizados en las Órdenes de Trabajo.

### ¿Cómo crear una nueva OT?
1. Dirígete al botón central **"Nueva"** en tu celular, o elige "Crear OT" desde el Dashboard.
2. Completa los **Datos Generales**: Elige si esta OT pertenece a un *Proyecto Activo* existente o si es un *Cliente* independiente. Selecciona el Tipo de Trabajo.
3. Completa el **Detalle Técnico**: Puedes agregar ítem por ítem el material utilizado o inspeccionado (Ej. Cable UTP, Módulos, etc.).
4. Si construiste Puntos de Red, tienes una sección dedicada para marcar sus mediciones y si fueron certificados o etiquetados.
5. **Fotos del Trabajo / Evidencia:** Usa el botón de la cámara para adjuntar fotografías. El sistema automáticamente **comprimirá y optimizará** estas imágenes para no consumir tu plan de datos y asegurar una carga ultra-rápida.
6. Guardar la OT: Puedes guardar el borrador si aún no está lista, o avanzar a la firma.

### Firmar y Completar OTs
Toda OT requiere la firma de un responsable ICSA (Supervisor) y la del Cliente receptor. Hay dos formas de hacerlo:
*   **Firma en Terreno:** Si el cliente está físicamente contigo, puedes pedirle que firme dibujando en la pantalla de tu teléfono (Tablet / Celular).
*   **Firma Remota:** Si el cliente no está en el sitio, debes ingresar su correo electrónico y el sistema le enviará un aviso automático a su bandeja de entrada. El cliente abrirá el enlace seguro desde su propio correo, firmará remotamente, y la orden pasará al instante al historial de órdenes completadas.

*Una vez la orden se encuentra debidamente completada y cerrada, si se ingresó el correo electrónico del cliente receptor, el sistema le **enviará automáticamente un correo final de respaldo adjuntando el documento PDF** completo de la OT.*

---

## 4. Gestión de Proyectos

Los Proyectos agrupan a múltiples trabajadores y a muchas Órdenes de Trabajo (OTs) bajo un solo gran objetivo, por lo que facilitan tener toda la documentación en un solo lugar.

### Funcionamiento Básico:
*   **Creación:** Al registrar un proyecto, puedes asignarle a un cliente y elegir qué Supervisores y Técnicos estarán involucrados (Equipo Técnico). Automáticamente los supervisores asignados podrán visualizar y agregar OTs a dicho proyecto.
*   **Supervisión:** En la tabla de proyectos activos, la barra de progreso indicará un avance aproximado basado en la cantidad de OTs en curso y finalizadas.
*   **Cierre de Proyecto (Acta Final):** Cuando se culminan todas las tareas de un proyecto, se debe "Cerrar el Proyecto". Esto generará automáticamente una **Acta de Cierre Final (OT Consolidada)**, que compila y agrupa todo el material utilizado, los componentes técnicos y descripciones de las pequeñas OTs, generando un único documento sumatorio para entregárselo al cliente.

---

## 5. Seguridad en Faena (HPT y Charlas)

El portal permite digitalizar los registros de seguridad obligatorios, asegurando que se cumplan las normativas antes de iniciar cualquier labor técnica.

### Hoja de Planificación del Trabajo (HPT)
La HPT es obligatoria y debe realizarse **antes** de comenzar los trabajos en terreno.
1. **Creación**: Disponible desde el menú principal o directamente desde la sección "HPT".
2. **Registro de Riesgos**: Se deben identificar los riesgos (atrapamiento, caídas, eléctricos, etc.) y las medidas de control que se aplicarán.
3. **Equipo de Trabajo**: Permite registrar a todos los trabajadores involucrados en la tarea específica.
4. **Firma y Validación**:
    * **Supervisor**: El supervisor a cargo firma directamente en el dispositivo.
    * **Prevención de Riesgos**: El sistema permite enviar una **Solicitud de Firma Remota** al Departamento de Prevención. Una vez que Prevención firma digitalmente desde su correo, el documento se considera Completado.
5. **Respaldo Automático**: Al completarse la firma de Prevención, el sistema enviará automáticamente un correo con el **documento PDF oficial** adjunto al responsable de seguridad.

### Charlas de Seguridad (Capacitación)
Permite dejar registro de las inducciones diarias o específicas realizadas al equipo.
1. **Temario**: Se registra el tema tratado en la charla.
2. **Asistencia**: Se agregan los asistentes y se recolecta su firma directamente en la pantalla del dispositivo.
3. **Validación**: Al igual que la HPT, el registro de charla genera un PDF oficial con todas las firmas recolectadas para respaldo de la obra.

---

## 6. Control de Herramientas e Inventario

Para evitar la pérdida o el mal manejo de los activos de la empresa, el portal cuenta con un sistema rápido de asignación en terreno.

### Ciclo de vida de una Herramienta
1.  **Disponible:** Cuando inicias el apartado de Herramientas, verás la pestaña "Herramientas Disponibles". Estas herramientas están actualmente guardadas en la bodega lista para ser tomadas.
    *   *Toma de Equipo:* Puedes seleccionar las herramientas que necesitas llevar a faena y presionar **"Tomar Seleccionadas"**. Estas pasarán instantáneamente a estar como asignadas bajo tu nombre.
2.  **En Terreno (Mis Herramientas):** Un panel dedicado te mostrará todas las máquinas o elementos que tienes actualmente asignados y por los que eres responsable temporalmente.
3.  **Devolución:** Cuando regreses el material a bodega, seleccionas tus herramientas y las devuelves. Aquí se te permitirá agregar un mensaje u observación obligatoria si hubo un problema (Ej: "La broca está desgastada", "El enchufe hace falso contacto", "Sin novedades"). **Al finalizar, el usuario deberá firmar el acta digital de devolución en pantalla**, asegurando de que tiene total conocimiento de qué herramientas entregó y en qué estado lo ha hecho.
4.  La herramienta regresa a estado **Disponible**.

### Actas y Reportes *(Administradores)*
Cada asignación ("Retiro") y Devolución genera un registro histórico inmutable conocido como el "Acta de Movimiento".
*   Las **Actas** registran quién tomó qué herramienta, a qué fecha y hora precisas, sus condiciones de devolución y **la firma del técnico responsable** garantizando la validez jurídica del proceso en todo momento.
*   El Administrador puede descargar un **Reporte General Combinado PDF** eligiendo fechas, y tener así el control logístico absoluto a mano.

---

## 7. Administración (Solo Administradores)

Si tu rol es Administrador, tendrás menús exclusivos para llevar el pilar de la plataforma:

*   **Gestión de Clientes:** Añade empresas o personas particulares a las cuales ICSA presta servicios. Estos datos alimentarán la creación posterior de OTs y Proyectos para que los supervisores en terreno no deban rellenar la dirección o RUT del cliente a mano cada vez.
*   **Control Personal:** Aquí es donde creas usuarios. Debes rellenar los datos técnicos de un nuevo trabajador. Si lo configuras como Administrador o Supervisor, el sistema automáticamente le creará su cuenta de acceso. Si lo configuras como Técnico, solo quedará en la grilla para asignaciones.
*   **Inventario Maestro:** Solamente el administrador posee el botón en Herramientas para **"Nueva Herramienta"** o editar las características, series internas y descripciones del equipamiento ya existente.

---

## 8. Mejores Prácticas y Consejos

*   **Internet Móvil:** El portal comprime fuertemente las imágenes de forma automática antes de intentar subirlas (ahorrando tiempo y plan de datos). Sin embargo, siempre intenta subir tus evidencias cuando poseas una señal 3G/4G/5G estable.
*   **Descargas PDF:** Si vas a compartir múltiples Actas o reportes a través de WhatsApp, te recomendamos descargarlos primero en tu dispositivo, revisarlos y luego enviarlos como Archivo Externo.
*   **Logística de Equipos:** Si necesitas un taladro y sabes que alguien más lo tiene y el sistema dice que está en estado "En Terreno", coordina con él para que procese su Devolución por sistema. El Administrador o el propio usuario debe liberar la herramienta digitalmente primero. De lo contrario, los inventarios podrían generar conflictos si hay saltos manuales.
*   **Navegación Táctil Móvil:** Usa con confianza la aplicación móvil como si fuera una app nativa. Cada toque a la barra inferior está optimizado para responder instantáneamente al dedo en terreno.

---
*ICSA - Ingeniería Comunicaciones S.A.*
*Manual oficial de manejo operativo de plataforma web técnica.*
