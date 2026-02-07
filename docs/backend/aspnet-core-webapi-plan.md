# Plan de implementación: ASP.NET Core Web API (Geo URP)

Este documento traduce tus requisitos RF-001 a RF-015 a una arquitectura backend con **ASP.NET Core Web API + EF Core + JWT**.

## 1) Alcance funcional por módulo

| RF | Módulo | Entidad principal | Endpoints sugeridos |
|---|---|---|---|
| RF-001 | Mesa directiva (lectura pública) | `BoardMember` | `GET /api/public/board-members` |
| RF-002 | CRUD directiva | `BoardMember` | `GET/POST/PUT/DELETE /api/admin/board-members` |
| RF-003 | CRUD eventos | `Event` | `GET/POST/PUT/DELETE /api/admin/events` |
| RF-004 | Calendario eventos | `Event` | `GET /api/public/events/calendar?month=&year=` |
| RF-005 | CRUD investigaciones | `Research` | `GET/POST/PUT/DELETE /api/admin/research` |
| RF-006 | CRUD exámenes | `Exam` | `GET/POST/PUT/DELETE /api/admin/exams` |
| RF-007 | CRUD libros | `Book` | `GET/POST/PUT/DELETE /api/admin/books` |
| RF-008 | CRUD usuarios | `User` | `GET/POST/PUT/DELETE /api/admin/users` |
| RF-009 | Login | `Auth` | `POST /api/auth/login` |
| RF-010 | Auth filtros | JWT + Roles | `[Authorize]`, `[Authorize(Roles="...")]` |
| RF-011 | Contacto | `ContactMessage` | `POST /api/public/contact` |
| RF-012 | CRUD roles | `Role` | `GET/POST/PUT/DELETE /api/admin/roles` |
| RF-013 | Categorías investigación | `ResearchCategory` | `GET/POST/PUT/DELETE /api/admin/research-categories` |
| RF-014 | Categorías exámenes | `ExamCategory` | `GET/POST/PUT/DELETE /api/admin/exam-categories` |
| RF-015 | Categorías libros | `BookCategory` | `GET/POST/PUT/DELETE /api/admin/book-categories` |

---

## 2) Estructura de solución recomendada

```text
backend/
  GeoUrp.sln
  src/
    GeoUrp.Api/              # Controllers, Program.cs, filtros, middlewares
    GeoUrp.Application/      # Casos de uso, DTOs, validaciones, interfaces
    GeoUrp.Domain/           # Entidades, enums, reglas de negocio
    GeoUrp.Infrastructure/   # EF Core, repositorios, auth JWT, servicios externos
  tests/
    GeoUrp.Api.Tests/        # Pruebas de integración
    GeoUrp.Application.Tests/# Pruebas unitarias
```

> Si prefieres empezar simple, usa un solo proyecto `GeoUrp.Api` y separa por carpetas (`Entities`, `DTOs`, `Controllers`, `Services`, `Data`).

---

## 3) Modelo de datos mínimo (MVP)

### Seguridad
- `User` (Id, Name, Email, PasswordHash, IsActive, CreatedAt)
- `Role` (Id, Name, Description)
- `UserRole` (UserId, RoleId)

### Contenido
- `BoardMember` (Id, FullName, Position, PhotoUrl, Bio, SortOrder, IsActive)
- `Event` (Id, Title, Description, StartAt, EndAt, Location, IsPublic, CoverImageUrl)
- `Research` (Id, Title, Summary, FileUrl, CategoryId, PublishedAt, IsActive)
- `Exam` (Id, Title, Description, Date, FileUrl, CategoryId, IsActive)
- `Book` (Id, Title, Author, Editorial, Year, FileUrl, CategoryId, IsActive)

### Categorías
- `ResearchCategory` (Id, Name, IsActive)
- `ExamCategory` (Id, Name, IsActive)
- `BookCategory` (Id, Name, IsActive)

### Contacto
- `ContactMessage` (Id, FullName, Email, Subject, Message, CreatedAt, IsRead)

---

## 4) Convenciones API

- **Versión:** `/api/v1/...`
- **Respuesta estándar:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {},
  "errors": []
}
```

- **Errores:** usa `ProblemDetails` + códigos HTTP correctos.
- **Paginación:** `?page=1&pageSize=20&search=...`.
- **Ordenamiento:** `?sortBy=createdAt&sortDir=desc`.

---

## 5) Seguridad (RF-009 y RF-010)

1. `POST /api/v1/auth/login` valida email/password.
2. Emite JWT con claims:
   - `sub` (userId)
   - `email`
   - `roles` (array)
3. Middleware `UseAuthentication(); UseAuthorization();`
4. Endpoints públicos con `[AllowAnonymous]`:
   - Directiva pública
   - Eventos/calendario
   - Contacto
5. Endpoints admin con `[Authorize(Roles = "Admin,Editor")]`.

---

## 6) Fases sugeridas

### Fase 1 (base técnica)
- Crear solución + EF Core + migración inicial.
- Implementar entidades: `User`, `Role`, `BoardMember`, `Event`, `ContactMessage`.
- Implementar login JWT.

### Fase 2 (módulos core)
- CRUD: Directiva, Eventos, Usuarios, Roles.
- Endpoint calendario de eventos.
- Endpoint contacto.

### Fase 3 (contenidos académicos)
- CRUD Investigaciones + categorías.
- CRUD Exámenes + categorías.
- CRUD Libros + categorías.

### Fase 4 (calidad)
- Swagger con `Bearer` configurado.
- Validaciones con FluentValidation.
- Pruebas de integración.
- Rate limit en endpoints públicos.

---

## 7) Comandos de arranque (cuando tengas .NET SDK)

```bash
# Crear solución
mkdir -p backend/src backend/tests
cd backend
dotnet new sln -n GeoUrp

# Proyecto API
dotnet new webapi -n GeoUrp.Api -o src/GeoUrp.Api

# Agregar a solución
dotnet sln add src/GeoUrp.Api/GeoUrp.Api.csproj

# Paquetes sugeridos
cd src/GeoUrp.Api
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Swashbuckle.AspNetCore
dotnet add package FluentValidation.AspNetCore
```

---

## 8) Definición rápida de Done

Cada RF se considera terminado cuando cumple:
1. Endpoint implementado.
2. Validación de request.
3. Seguridad correcta (público/admin según corresponda).
4. Swagger documentado.
5. Prueba automatizada (unitaria o integración).

---

## 9) Recomendación para tu caso actual

Tu repositorio actual parece frontend Angular. Para evitar mezclar responsabilidades:
- Mantén Angular en esta raíz.
- Crea backend en carpeta `backend/` (o en repo separado `geo-urp-api`).
- Define variables de entorno para conexión DB y JWT.
- Conecta Angular a `/api/v1` mediante `environment.ts`.
