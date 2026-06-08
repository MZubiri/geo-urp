using Microsoft.EntityFrameworkCore;

namespace GeoURPWebApi.Data
{
    public static class BoardMembersSchemaInitializer
    {
        public static async Task EnsureCreatedAsync(AppDbContext db, CancellationToken cancellationToken = default)
        {
            const string sql = """
                IF COL_LENGTH('dbo.BoardMembers', 'Code') IS NULL
                BEGIN
                    ALTER TABLE dbo.BoardMembers
                    ADD Code NVARCHAR(50) NULL;
                END;

                IF COL_LENGTH('dbo.BoardMembers', 'Birthday') IS NULL
                BEGIN
                    ALTER TABLE dbo.BoardMembers
                    ADD Birthday NVARCHAR(5) NULL;
                END;
                """;

            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
    }
}
