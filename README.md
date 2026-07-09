# Sistema de Gestión Humana - Coraza Seguridad CTA

Este proyecto es una aplicación web HRM (Gestión Humana) diseñada a medida para **Coraza Seguridad CTA** (Cooperativa de Vigilancia y Seguridad Privada). El sistema digitaliza la información laboral de los asociados, controla el cumplimiento normativo de cargos críticos (exámenes médicos y reentrenamientos), automatiza alertas de vencimiento y realiza encuestas de salida en procesos de retiro.

La aplicación está diseñada con una interfaz premium oscura, basada en los colores azul marino, dorado y plata provistos por la marca.

---

## Características Principales

1.  **Panel Principal (Dashboard):** Indicadores del personal (activos, retirados, suspendidos), tasa de rotación mensual de los últimos 6 meses, distribución demográfica (EPS, género, edad, estudios) y motivos comunes de retiro.
2.  **Directorio de Asociados:** Listado de alta densidad con filtros avanzados (cargos, centros de trabajo, EPS, rango de antigüedad, criticidad) y búsqueda en tiempo real.
3.  **Ficha de Asociado (Hoja de Vida Digital):**
    *   *Datos Personales:* Todos los campos sociodemográficos. Ocultamiento/enmascaramiento automático de datos sensibles (raza, religión, orientación sexual) para el rol `COORDINADOR_OPERATIVO` bajo la Ley 1581 de 2012 de Colombia.
    *   *Laboral:* Cargos anteriores, salarios e historial.
    *   *Documentos:* Carga directa de archivos PDF/Imágenes en base de datos.
    *   *Alertas:* Alertas vigentes asociadas al empleado.
4.  **Matriz de Cumplimiento Normativo (SST):** Vista cruzada interactiva que muestra de forma visual (verde, amarillo, rojo) el estado documental y vigencia de cursos de reentrenamiento, exámenes psicofísicos, psicosensométricos y pólizas.
5.  **Flujo de Retiro y Encuesta:** Desactivación lógica de asociados retirados, cálculo de edad al retiro, congelación de la antigüedad y encuesta de salida valorada de 1 a 5 estrellas con preguntas abiertas.
6.  **Importador Inteligente de Excel:** Asistente drag & drop que analiza y previsualiza los datos de la planilla Excel, reporta errores de formato y permite mapear términos libres a catálogos oficiales antes de insertar masivamente los datos.
7.  **Administración y Auditoría:**
    *   Configuración de catálogos maestros y cargos (criticidad y frecuencias de 1 o 2 años configurable).
    *   Gestión de usuarios y asignación de roles.
    *   Bitácora de auditoría detallada (control de cambios campo por campo con valor anterior y valor nuevo).
8.  **Job de Alertas Automáticas:** node-cron diario que calcula fechas de vencimiento y emite alertas críticas (faltando 60, 30, o 7 días).

---

## Requisitos de Instalación

El sistema requiere:
*   [Node.js](https://nodejs.org/) v18 o superior.
*   npm (incluido con Node.js).

---

## Configuración y Variables de Entorno

### Backend (`/backend/.env`)
El proyecto viene preconfigurado con una base de datos local SQLite para facilidad de uso y cero configuraciones en desarrollo:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="coraza-seguridad-super-secret-key-12345"
NODE_ENV="development"
```

> **Nota:** Para migrar a PostgreSQL en producción, basta con cambiar el provider en `/backend/prisma/schema.prisma` a `"postgresql"` y actualizar `DATABASE_URL` con tu cadena de conexión PostgreSQL.

---

## Instrucciones para Iniciar Localmente

### 1. Instalación de Dependencias
En la carpeta raíz del proyecto (donde se encuentra este archivo `README.md`), ejecuta el comando que instalará todas las dependencias del backend y frontend de forma simultánea:

```bash
npm run install:all
```
*(Nota: En sistemas Windows con políticas de ejecución estrictas de PowerShell, usa `npm.cmd run install:all`)*

### 2. Configuración de Base de Datos y Sembrado
Ejecuta las migraciones de base de datos para crear las tablas de SQLite y carga los datos maestros iniciales (catálogos, centros de trabajo, cargos y usuario administrador inicial):

```bash
cd backend
npm run db:setup
```

### 3. Iniciar el Proyecto en Desarrollo
Vuelve a la raíz del proyecto y ejecuta el comando para levantar el servidor Express del backend (puerto `5000`) y el servidor Vite del frontend (puerto `5173`) concurrentemente:

```bash
npm run dev
```

Una vez levantados, ingresa a http://localhost:5173 en tu navegador.

---

## Credenciales de Acceso Iniciales

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| **Administrador (Acceso Total)** | `admin@coraza.com` | `admin123` |
| **Gestión Humana** | `gh@coraza.com` | `admin123` |
| **Seguridad y Salud (SST)** | `sst@coraza.com` | `admin123` |
| **Coordinador Operativo** | `coordinador@coraza.com` | `admin123` |
| **Consulta Solo Lectura** | `consulta@coraza.com` | `admin123` |
