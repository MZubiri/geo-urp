using System;
using System.Collections.Generic;

namespace CONEIC.API.DTOs
{
    public class ActividadDto
    {
        public int Id { get; set; }
        public int ApartadoId { get; set; }
        public string ApartadoNombre { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public DateTime HoraInicio { get; set; }
        public DateTime HoraFin { get; set; }
        public bool UrpParticipa { get; set; }
        public string? CamposExtra { get; set; }
    }

    public class ApartadoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int Orden { get; set; }
        public List<ActividadDto> Actividades { get; set; } = new List<ActividadDto>();
    }

    public class AgendaRequestDto
    {
        public int ActividadId { get; set; }
        public bool ForceReplace { get; set; } = false; // For soft warning replacement
    }

    public class AgendaCheckConflictResponseDto
    {
        public bool HasConflict { get; set; }
        public ActividadDto? ConflictingActivity { get; set; }
    }

    public class CreateActividadDto
    {
        public int ApartadoId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public DateTime HoraInicio { get; set; }
        public DateTime HoraFin { get; set; }
        public bool UrpParticipa { get; set; } = false;
        public string? CamposExtra { get; set; }
    }

    public class CreateApartadoDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int Orden { get; set; } = 0;
    }
}
