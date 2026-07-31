using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CONEIC.API.Models
{
    [Table("actividades")]
    public class Actividad
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("apartado_id")]
        public int ApartadoId { get; set; }

        [ForeignKey(nameof(ApartadoId))]
        public Apartado? Apartado { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Required]
        [Column("hora_inicio")]
        public DateTime HoraInicio { get; set; }

        [Required]
        [Column("hora_fin")]
        public DateTime HoraFin { get; set; }

        [Column("urp_participa")]
        public bool UrpParticipa { get; set; } = false;

        [Column("campos_extra", TypeName = "json")]
        public string? CamposExtra { get; set; }

        [Column("fecha_creacion")]
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    }
}
