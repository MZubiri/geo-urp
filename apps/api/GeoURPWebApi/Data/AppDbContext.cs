using GeoURPWebApi.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoURPWebApi.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<BoardMember> BoardMembers { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<ResearchCategory> ResearchCategories { get; set; }
    public DbSet<Research> Researches { get; set; }
    public DbSet<ExamCategory> ExamCategories { get; set; }
    public DbSet<Exam> Exams { get; set; }
    public DbSet<BookCategory> BookCategories { get; set; }
    public DbSet<Book> Books { get; set; }
    public DbSet<ContactMessage> ContactMessages { get; set; }
    public DbSet<BookRequest> BookRequests { get; set; }
    public DbSet<InterviewSlot> InterviewSlots { get; set; }
    public DbSet<InterviewAppointment> InterviewAppointments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().ToTable("Users").Ignore(x => x.Roles);
        modelBuilder.Entity<Role>().ToTable("Roles");

        modelBuilder.Entity<UserRole>()
            .ToTable("UserRoles")
            .HasKey(x => new { x.UserId, x.RoleId });

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.User)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.Role)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.RoleId);

        modelBuilder.Entity<BoardMember>(entity =>
        {
            entity.ToTable("BoardMembers");
            entity.Property(x => x.FullName).HasMaxLength(200);
            entity.Property(x => x.Position).HasMaxLength(120);
            entity.Property(x => x.Email).HasMaxLength(150);
            entity.Property(x => x.Code).HasMaxLength(50);
            entity.Property(x => x.Birthday).HasMaxLength(5);
            entity.Property(x => x.PhotoUrl).HasMaxLength(500);
            entity.Property(x => x.Bio).HasMaxLength(1000);
        });
        modelBuilder.Entity<Event>().ToTable("Events");
        modelBuilder.Entity<ResearchCategory>().ToTable("ResearchCategories");
        modelBuilder.Entity<Research>().ToTable("Researches");
        modelBuilder.Entity<ExamCategory>().ToTable("ExamCategories");
        modelBuilder.Entity<Exam>().ToTable("Exams");
        modelBuilder.Entity<BookCategory>().ToTable("BookCategories");
        modelBuilder.Entity<Book>().ToTable("Books");
        modelBuilder.Entity<ContactMessage>().ToTable("ContactMessages");
        modelBuilder.Entity<InterviewSlot>().ToTable("InterviewSlots");
        modelBuilder.Entity<InterviewAppointment>().ToTable("InterviewAppointments");

        modelBuilder.Entity<InterviewSlot>(entity =>
        {
            entity.Property(x => x.Date).HasColumnType("date");
            entity.Property(x => x.StartTime).HasColumnType("time(0)");
            entity.Property(x => x.EndTime).HasColumnType("time(0)");
            entity.Property(x => x.Capacity).HasDefaultValue(1);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasIndex(x => new { x.Date, x.StartTime, x.EndTime }).IsUnique();
            entity.HasMany(x => x.Appointments)
                .WithOne(x => x.Slot)
                .HasForeignKey(x => x.SlotId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InterviewAppointment>(entity =>
        {
            entity.Property(x => x.FullName).HasMaxLength(200);
            entity.Property(x => x.Phone).HasMaxLength(50);
            entity.Property(x => x.Email).HasMaxLength(180);
            entity.Property(x => x.Major).HasMaxLength(180);
            entity.Property(x => x.Cycle).HasMaxLength(60);
            entity.Property(x => x.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Registrada");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        // Configuración de BookRequest
        modelBuilder.Entity<BookRequest>(entity =>
        {
            entity.HasOne(br => br.User)
                .WithMany()
                .HasForeignKey(br => br.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(br => br.Book)
                .WithMany()
                .HasForeignKey(br => br.BookId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(br => br.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");

            entity.Property(br => br.RequestedAt)
                .HasDefaultValueSql("GETDATE()");
        });
    }
}
