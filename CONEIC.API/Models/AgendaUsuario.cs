using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace CONEIC.API.Models
{
    [Table("agenda_usuario")]
    public class AgendaUsuario
    {
        [Column("usuario_id")]
        public int UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario? Usuario { get; set; }

        [Column("actividad_id")]
        public int ActividadId { get; set; }

        [ForeignKey(nameof(ActividadId))]
        public Actividad? Actividad { get; set; }

        [Column("fecha_guardado")]
        public DateTime FechaGuardado { get; set; } = DateTime.UtcNow;
    }
}
