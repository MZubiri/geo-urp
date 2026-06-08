# GEOURP Monorepo

Monorepo para la aplicacion GEOURP.

## Estructura

- `apps/frontend`: aplicacion Angular.
- `apps/api`: API ASP.NET Core.
- `database`: scripts SQL auxiliares.

## Desarrollo

Frontend:

```bash
cd apps/frontend
npm install
npm start
```

API:

```bash
cd apps/api
dotnet restore
dotnet run --project GeoURPWebApi/GeoURPWebApi.csproj
```

Para desarrollo local, copia `apps/api/GeoURPWebApi/appsettings.Development.example.json` como `appsettings.Development.json` y reemplaza los placeholders con credenciales locales. Ese archivo esta ignorado por Git.
