using Microsoft.EntityFrameworkCore;
using CONEIC.API.Models;

namespace CONEIC.API.Data
{
    public class ConeicDbContext : DbContext
    {
        public ConeicDbContext(DbContextOptions<ConeicDbContext> options) : base(options) { }

        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Apartado> Apartados { get; set; } = null!;
        public DbSet<Actividad> Actividades { get; set; } = null!;
        public DbSet<AgendaUsuario> AgendaUsuarios { get; set; } = null!;
        public DbSet<ColaCorreo> ColaCorreos { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AgendaUsuario>()
                .HasKey(a => new { a.UsuarioId, a.ActividadId });

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Correo)
                .IsUnique();

            modelBuilder.Entity<Apartado>()
                .HasIndex(a => a.Orden);

            modelBuilder.Entity<Actividad>()
                .HasIndex(a => new { a.ApartadoId, a.HoraInicio, a.HoraFin });
        }
    }
}
