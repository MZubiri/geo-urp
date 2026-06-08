using Microsoft.EntityFrameworkCore;

namespace GeoURPWebApi.Data
{
    public static class InterviewSchemaInitializer
    {
        public static async Task EnsureCreatedAsync(AppDbContext db, CancellationToken cancellationToken = default)
        {
            const string sql = """
                IF OBJECT_ID('dbo.InterviewSlots', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.InterviewSlots
                    (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        [Date] DATE NOT NULL,
                        StartTime TIME(0) NOT NULL,
                        EndTime TIME(0) NOT NULL,
                        Capacity INT NOT NULL CONSTRAINT DF_InterviewSlots_Capacity DEFAULT (1),
                        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_InterviewSlots_CreatedAt DEFAULT (SYSUTCDATETIME()),
                        CONSTRAINT CK_InterviewSlots_Capacity CHECK (Capacity > 0),
                        CONSTRAINT CK_InterviewSlots_StartEnd CHECK (EndTime > StartTime)
                    );

                    CREATE UNIQUE INDEX UX_InterviewSlots_Date_Start_End
                        ON dbo.InterviewSlots([Date], StartTime, EndTime);
                END;

                IF OBJECT_ID('dbo.InterviewAppointments', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.InterviewAppointments
                    (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        SlotId INT NOT NULL,
                        FullName NVARCHAR(200) NOT NULL,
                        Phone NVARCHAR(50) NOT NULL,
                        Email NVARCHAR(180) NOT NULL,
                        Major NVARCHAR(180) NOT NULL,
                        Cycle NVARCHAR(60) NOT NULL,
                        Status NVARCHAR(50) NOT NULL CONSTRAINT DF_InterviewAppointments_Status DEFAULT (N'Registrada'),
                        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_InterviewAppointments_CreatedAt DEFAULT (SYSUTCDATETIME()),
                        CONSTRAINT FK_InterviewAppointments_InterviewSlots FOREIGN KEY (SlotId)
                            REFERENCES dbo.InterviewSlots(Id) ON DELETE CASCADE
                    );

                    CREATE INDEX IX_InterviewAppointments_SlotId
                        ON dbo.InterviewAppointments(SlotId);

                    CREATE INDEX IX_InterviewAppointments_Email
                        ON dbo.InterviewAppointments(Email);
                END;
                """;

            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
    }
}
