# Manual de Usuario - ICSA Portal de Gestión Técnica

Bienvenido al **Portal de Gestión Técnica de ICSA (Ingeniería Comunicaciones S.A.)**, versión 2026. Este manual ha sido redactado para guiar paso a paso a los Administradores, Supervisores y Prevencionistas en el uso eficiente de la plataforma.

El objetivo de esta aplicación es digitalizar, agilizar y transparentar la creación de Órdenes de Trabajo (OTs), el control de proyectos, y el seguimiento de las herramientas y equipos de la empresa, asegurando que toda la documentación técnica y de seguridad esté respaldada digitalmente en tiempo real.

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
*   **Administrador:** Tiene **acceso total y global**. Puede ver, editar y eliminar todas las OTs, todos los Proyectos, y tiene permisos exclusivos para la gestión de Clientes, Personal (incluyendo creación de cuentas) e Inventario Maestro. Puede ver documentos que otros usuarios han "borrado" (ocultado).
*   **Supervisor:** Orientado al liderazgo en terreno. **Solo puede ver y gestionar lo que él mismo crea** o los proyectos/órdenes a los que ha sido explícitamente asignado. Puede crear OTs, HPTs y Charlas, pero no puede crear nuevos Clientes ni Herramientas. Tiene la capacidad de "ocultar" sus propios registros.
*   **Prevencionista:** Rol especializado en seguridad. Tiene acceso a visualizar y firmar remotamente las HPTs y Charlas de Seguridad. Su validación digital es requisito para que ciertos documentos de seguridad se consideren completados.
*   **Técnico:** **NO tiene acceso directo a la plataforma.** Los técnicos son registrados en el sistema por el Administrador para que figuren en la base de datos y puedan ser *asignados* a proyectos, OTs, o como responsables de herramientas, pero no poseen credenciales para iniciar sesión.

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
3. Completa el **Detalle Técnico**: Puedes agregar ítem por ítem el material utilizado o inspeccionado.
4. **Puntos de Red**: Si construiste Puntos de Red, tienes una sección dedicada para marcar sus mediciones, indicar si fueron **certificados** y si están debidamente **etiquetados**.
5. **Fotos del Trabajo / Evidencia**: Usa el botón de la cámara para adjuntar fotografías. El sistema automáticamente **comprimirá y optimizará** estas imágenes para no consumir tu plan de datos y asegurar una carga ultra-rápida, manteniendo la calidad necesaria para el reporte.
6. Guardar la OT: Puedes guardar el borrador si aún no está lista para ser firmada.

### Firmar y Completar OTs
Toda OT requiere la firma de un responsable ICSA (Supervisor) y la del Cliente receptor. Hay dos formas de hacerlo:
*   **Firma en Terreno:** Si el cliente está físicamente contigo, puede firmar dibujando en la pantalla de tu dispositivo.
*   **Firma Remota:** Si el cliente no está en el sitio, ingresa su correo electrónico. El sistema generará un **token de seguridad único** y le enviará un enlace por correo. El cliente podrá revisar la OT en su dispositivo y firmar digitalmente desde su ubicación. La OT se actualizará automáticamente a "Completada" en cuanto el cliente firme.

> [!IMPORTANT]
> Una vez la orden se encuentra debidamente completada (firmada por ambas partes), si se ingresó el correo del cliente, el sistema le **enviará automáticamente un correo de respaldo con el PDF oficial**.

---

## 4. Gestión de Proyectos

Los Proyectos agrupan a múltiples trabajadores y a muchas Órdenes de Trabajo (OTs) bajo un solo gran objetivo, por lo que facilitan tener toda la documentación en un solo lugar.

### Funcionamiento Básico:
*   **Creación:** Al registrar un proyecto, puedes asignar un cliente y elegir el Equipo Técnico (Supervisores y Técnicos). Los supervisores asignados podrán visualizar el proyecto en su panel y asociarle OTs.
*   **Supervisión y Avance:** El panel de proyectos muestra una barra de progreso basada en el estado de las OTs vinculadas.
*   **Cierre de Proyecto (Acta Final):** Al terminar todas las tareas, se debe "Cerrar el Proyecto". Esto genera una **Acta de Cierre Final (OT Consolidada)**, un documento único que agrupa todo el material, servicios y descripciones técnicas de todas las OTs del proyecto.
*   **Firma del Acta Final:** Al igual que una OT individual, el Acta Final permite **Firma Remota**. Esto es ideal para enviar el resumen consolidado al cliente para su validación final y cierre administrativo.

---

## 5. Seguridad en Faena (HPT y Charlas)

El portal permite digitalizar los registros de seguridad obligatorios, asegurando que se cumplan las normativas antes de iniciar cualquier labor técnica.

### Hoja de Planificación del Trabajo (HPT)
La HPT es obligatoria y debe realizarse **antes** de comenzar los trabajos en terreno.
1. **Creación**: Disponible desde el menú principal o directamente desde la sección "HPT".
2. **Registro de Riesgos**: Se deben identificar los riesgos (atrapamiento, caídas, eléctricos, etc.) y las medidas de control que se aplicarán.
3. **Equipo de Trabajo**: Permite registrar a todos los trabajadores involucrados en la tarea específica.
4. **Firma y Validación**:
    * **Supervisor**: El supervisor firma directamente en el dispositivo.
    * **Prevención de Riesgos (Firma Remota)**: El sistema permite enviar una solicitud por correo al Departamento de Prevención. Una vez que Prevención valida digitalmente desde su ubicación, el documento cambia a estado **Completado**.
5. **Borrado (Ocultar) de HPT**: Si un supervisor desea eliminar un registro de su lista, puede usar el botón **"Borrar"**. El documento se ocultará de su vista, pero se mantendrá en la base de datos para auditorías de Administración.
6. **Respaldo Automático**: Al completarse la firma de Prevención, el sistema enviará automáticamente un correo con el **documento PDF oficial** adjunto al responsable de seguridad.

### Charlas de Seguridad (Capacitación)
Permite dejar registro de las inducciones diarias o específicas realizadas al equipo.
1. **Temario**: Se registra el tema tratado en la charla.
2. **Asistencia**: Se agregan los asistentes y se recolecta su firma directamente en la pantalla del dispositivo.
3. **Firma de Asistencia**: Los técnicos asistentes firman en el dispositivo para confirmar su participación.
4. **Validación y Respaldo**: Al igual que el HPT, genera un PDF oficial con las firmas y permite ser "borrado" (ocultado) de la lista principal por el supervisor.

---

## 6. Control de Herramientas e Inventario

Para evitar la pérdida o el mal manejo de los activos de la empresa, el portal cuenta con un sistema rápido de asignación en terreno.

### Ciclo de vida de una Herramienta
1.  **Disponible:** Todas las herramientas en bodega aparecen en la pestaña **"Herramientas Disponibles"**. Aquí verás la **Categoría** (ej: Altura, Eléctrica, Comunicación) para facilitar la búsqueda.
    *   *Retiro de Equipo:* Selecciona las herramientas que llevarás y presiona **"Tomar Seleccionadas"**.
2.  **En Terreno (Mis Herramientas):** Muestra los equipos bajo tu responsabilidad directa.
3.  **Devolución:** Al regresar el material, selecciona tus herramientas y notifica su estado.
    *   **Observación Obligatoria:** Se debe indicar si hay fallos o desgaste.
    *   **Firma de Devolución:** El usuario firma digitalmente en pantalla para validar que está entregando los equipos declarados.
4.  El estado cambia automáticamente de vuelta a **Disponible**.

### Actas y Reportes *(Administradores)*
Cada asignación ("Retiro") y Devolución genera un registro histórico inmutable conocido como el "Acta de Movimiento".
*   Las **Actas** registran quién tomó qué herramienta, a qué fecha y hora precisas, sus condiciones de devolución y **la firma del técnico responsable** garantizando la validez jurídica del proceso en todo momento.
*   El Administrador puede descargar un **Reporte General Combinado PDF** eligiendo fechas, y tener así el control logístico absoluto a mano.

---

## 7. Administración (Solo Administradores)

Si tu rol es Administrador, tendrás menús exclusivos para llevar el pilar de la plataforma:

*   **Gestión de Clientes:** Permite registrar empresas (RUT/Razón Social) o personas naturales. Estos datos se usan para agilizar la creación de OTs y Proyectos.
*   **Gestión de Personal:** Crea usuarios y asigna roles. Al configurar a alguien como "Administrador" o "Supervisor", el sistema sincroniza automáticamente su **Cuenta de Acceso** para que pueda iniciar sesión con su correo y contraseña inicial. Si es "Técnico", solo quedará en la lista para asignaciones sin acceso a login.
*   **Inventario Maestro (Botón "Nueva"):** Solo el administrador puede dar de alta equipos, asignarles un **Código Interno**, marca, modelo y su **Categoría** específica.

---

## 8. Mejores Prácticas y Consejos

*   **Internet Móvil:** El portal utiliza algoritmos de **compresión inteligente**. Todas las fotografías se optimizan localmente en tu teléfono antes de subirse. Esto permite cargar hasta 10 fotos en pocos segundos incluso con señal débil (3G/4G). Solo asegúrate de no cerrar la aplicación mientras la barra de carga esté activa.
*   **Descargas PDF:** Todos los documentos generados (OT, HPT, Acta de Devolución) están diseñados para ser visualizados en móviles. Si necesitas enviarlos por WhatsApp, usa la opción "Compartir" desde el visor de PDF de tu teléfono.
*   **Logística de Equipos:** Si necesitas una herramienta que figura como "En Terreno", coordina con el responsable actual para que procese su **Devolución Digital**. Hasta que no se firme la devolución, el sistema no permitirá que otro usuario la tome, asegurando la trazabilidad.
*   **Seguridad:** Recuerda que la HPT debe estar firmada **antes** de marcar el inicio de la OT.
*   **Navegación Táctil Móvil:** Usa con confianza la aplicación móvil como si fuera una app nativa. Cada toque a la barra inferior está optimizado para responder instantáneamente al dedo en terreno.

---
*ICSA - Ingeniería Comunicaciones S.A.*
*Manual oficial de manejo operativo de plataforma web técnica.*
