# GeoUrpFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Backend roadmap (ASP.NET Core Web API)

Se agregó una propuesta inicial para construir el backend en ASP.NET Core:

- Plan de implementación por RF: `docs/backend/aspnet-core-webapi-plan.md`
- Contrato inicial OpenAPI: `docs/backend/openapi-v1.yaml`

Estos documentos sirven como base para empezar a construir la API en una carpeta `backend/` o en un repositorio separado.


## Backend API (avance inicial)

Se inició una implementación real del backend en `backend/GeoUrp.Api` con ASP.NET Core Web API:

- Autenticación JWT (`POST /api/v1/auth/login`)
- RF-001 y RF-002 (mesa directiva pública + CRUD admin)
- RF-003 y RF-004 (eventos + calendario público)
- RF-011 (contacto público + bandeja admin)
- Filtros por roles con `[Authorize]` para RF-010

> Nota: este backend usa almacenamiento **en memoria** como primera fase. El siguiente paso es migrar a EF Core + SQL Server/PostgreSQL.
