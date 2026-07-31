using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CONEIC.API.Models
{
    [Table("cola_correos")]
    public class ColaCorreo
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("destinatario")]
        public string Destinatario { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("asunto")]
        public string Asunto { get; set; } = string.Empty;

        [Required]
        [Column("cuerpo_html", TypeName = "text")]
        public string CuerpoHtml { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("estado")]
        public string Estado { get; set; } = "PENDIENTE"; // PENDIENTE, ENVIADO, ERROR

        [Column("intentos")]
        public int Intentos { get; set; } = 0;

        [Column("fecha_creacion")]
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        [Column("fecha_envio")]
        public DateTime? FechaEnvio { get; set; }
    }
}
