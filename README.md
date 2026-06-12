# GeoURP - Frontend Web Portal 📚

Portal web interactivo de la **Biblioteca Digital de Geotecnia (GeoURP)**, diseñado especialmente para las asociaciones estudiantiles de la **Universidad Ricardo Palma (URP)**.

Esta aplicación web actúa como la interfaz de usuario para que alumnos y profesores exploren, busquen, descarguen y soliciten préstamos de recursos académicos (tesis, normativas, exámenes, libros y documentos técnicos) del área de geotecnia.

---

## 🚀 Características Principales

*   **Búsqueda y Filtros Dinámicos:** Exploración interactiva del catálogo de recursos por categorías, autores o palabras clave.
*   **Visualizador y Descarga de Documentos:** Interfaz optimizada para leer resúmenes de investigaciones y descargar material digital autorizado.
*   **Módulo de Préstamos:** Permite a los alumnos autenticados solicitar y gestionar el estado de préstamos físicos y digitales.
*   **Perfil de Usuario & Roles:** Vistas personalizadas y paneles de administración de acuerdo a los roles de usuario (Estudiante, Administrador).
*   **Panel de Administración:** Control total sobre la carga de nuevos documentos técnicos y gestión de usuarios.

---

## 🛠️ Stack Tecnológico

*   **Framework:** Angular
*   **Lenguajes:** TypeScript, HTML5, SCSS (CSS modular)
*   **Servidor de Producción:** VPS Linux (Contabo) corriendo Nginx para servir el build estático optimizado.

---

## 🔗 Repositorio del Backend (API)

Toda la persistencia de datos, lógica de negocio y seguridad está respaldada por:
👉 **[GeoURPWebApi (Backend C# / .NET)](https://github.com/MZubiri/GeoURPWebApi)**

---

## 📦 Ejecución Local

### Prerrequisitos
*   Tener instalado **Node.js** (v18 o superior) y **npm**.

### Pasos
1.  Clona el repositorio:
    ```bash
    git clone https://github.com/MZubiri/geo-urp.git
    cd geo-urp
    ```
2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo local:
    ```bash
    npm run start
    ```
    *(O abre tu navegador directamente en `http://localhost:4200/`)*

### Construcción para Producción
Para compilar y optimizar la aplicación de cara al despliegue:
```bash
npm run build
```
Los archivos optimizados resultantes se guardarán en el directorio `dist/`.
