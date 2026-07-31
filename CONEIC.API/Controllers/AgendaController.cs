using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CONEIC.API.Data;
using CONEIC.API.DTOs;
using CONEIC.API.Models;

namespace CONEIC.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AgendaController : ControllerBase
    {
        private readonly ConeicDbContext _context;

        public AgendaController(ConeicDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("nameid")?.Value
                        ?? User.FindFirst("sub")?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet("mis-actividades")]
        public async Task<IActionResult> GetMisActividades()
        {
            var userId = GetUserId();
            var userExists = await _context.Usuarios.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                return Unauthorized(new { message = "Sesión inválida o expirada." });
            }

            var actividades = await _context.AgendaUsuarios
                .Where(a => a.UsuarioId == userId)
                .Include(a => a.Actividad)
                .ThenInclude(act => act!.Apartado)
                .Select(a => a.Actividad)
                .Where(act => act != null)
                .OrderBy(act => act!.HoraInicio)
                .Select(act => new ActividadDto
                {
                    Id = act!.Id,
                    ApartadoId = act.ApartadoId,
                    ApartadoNombre = act.Apartado != null ? act.Apartado.Nombre : string.Empty,
                    Nombre = act.Nombre,
                    Descripcion = act.Descripcion,
                    HoraInicio = act.HoraInicio,
                    HoraFin = act.HoraFin,
                    UrpParticipa = act.UrpParticipa,
                    CamposExtra = act.CamposExtra
                })
                .ToListAsync();

            return Ok(actividades);
        }

        [HttpPost("agregar")]
        public async Task<IActionResult> AgregarActividad([FromBody] AgendaRequestDto dto)
        {
            var userId = GetUserId();
            var userExists = await _context.Usuarios.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                return Unauthorized(new { message = "Sesión inválida o expirada. Por favor vuelve a iniciar sesión." });
            }

            var actividad = await _context.Actividades.FindAsync(dto.ActividadId);
            if (actividad == null)
            {
                return NotFound(new { message = "La actividad solicitada no existe." });
            }

            var yaAgendada = await _context.AgendaUsuarios
                .AnyAsync(a => a.UsuarioId == userId && a.ActividadId == dto.ActividadId);

            if (yaAgendada)
            {
                return BadRequest(new { message = "La actividad ya se encuentra en tu calendario." });
            }

            // Check if there is an overlap just for info
            var userSavedActivities = await _context.AgendaUsuarios
                .Where(a => a.UsuarioId == userId)
                .Include(a => a.Actividad)
                .Select(a => a.Actividad)
                .Where(act => act != null)
                .ToListAsync();

            var conflictingActivity = userSavedActivities.FirstOrDefault(act =>
                (actividad.HoraInicio < act!.HoraFin && actividad.HoraFin > act.HoraInicio));

            // Add activity directly to agenda (allowing overlapping schedule items)
            _context.AgendaUsuarios.Add(new AgendaUsuario
            {
                UsuarioId = userId,
                ActividadId = dto.ActividadId
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                status = "SUCCESS",
                message = "Actividad agregada exitosamente a tu calendario.",
                hasConflict = conflictingActivity != null,
                conflictingActivityName = conflictingActivity?.Nombre
            });
        }

        [HttpDelete("quitar/{actividadId}")]
        public async Task<IActionResult> QuitarActividad(int actividadId)
        {
            var userId = GetUserId();
            var userExists = await _context.Usuarios.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                return Unauthorized(new { message = "Sesión inválida o expirada." });
            }

            var item = await _context.AgendaUsuarios
                .FirstOrDefaultAsync(a => a.UsuarioId == userId && a.ActividadId == actividadId);

            if (item == null)
            {
                return NotFound(new { message = "La actividad no estaba agendada." });
            }

            _context.AgendaUsuarios.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Actividad eliminada de tu calendario." });
        }

        [AllowAnonymous]
        [HttpGet("export/ics")]
        public async Task<IActionResult> ExportIcs([FromQuery] string? token, [FromQuery] int? userId)
        {
            int targetUserId = 0;
            if (!string.IsNullOrWhiteSpace(token))
            {
                try
                {
                    var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                    var jsonToken = handler.ReadJwtToken(token);
                    var claim = jsonToken?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid" || c.Type == "sub")?.Value;
                    int.TryParse(claim, out targetUserId);
                }
                catch { }
            }

            if (targetUserId == 0 && userId.HasValue)
            {
                targetUserId = userId.Value;
            }

            if (targetUserId == 0)
            {
                targetUserId = GetUserId();
            }

            var actividades = await _context.AgendaUsuarios
                .Where(a => a.UsuarioId == targetUserId)
                .Include(a => a.Actividad)
                .ThenInclude(act => act!.Apartado)
                .Select(a => a.Actividad)
                .Where(act => act != null)
                .OrderBy(act => act!.HoraInicio)
                .ToListAsync();

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("BEGIN:VCALENDAR");
            sb.AppendLine("VERSION:2.0");
            sb.AppendLine("PRODID:-//GEO URP//CONEIC 2026 Cusco//ES");
            sb.AppendLine("CALSCALE:GREGORIAN");
            sb.AppendLine("METHOD:PUBLISH");
            sb.AppendLine("X-WR-CALNAME:Mi Agenda CONEIC 2026 - GEO URP");
            sb.AppendLine("X-WR-TIMEZONE:America/Lima");

            foreach (var act in actividades)
            {
                if (act == null) continue;
                sb.AppendLine("BEGIN:VEVENT");
                sb.AppendLine($"UID:coneic-act-{act.Id}@geourp.org");
                sb.AppendLine($"DTSTAMP:{System.DateTime.UtcNow:yyyyMMddTHHmmssZ}");
                sb.AppendLine($"DTSTART:{act.HoraInicio:yyyyMMddTHHmmss}");
                sb.AppendLine($"DTEND:{act.HoraFin:yyyyMMddTHHmmss}");
                sb.AppendLine($"SUMMARY:{EscapeIcsText(act.Nombre)}");
                sb.AppendLine($"DESCRIPTION:{EscapeIcsText(act.Descripcion ?? "")}");
                sb.AppendLine("LOCATION:Cusco\\, Perú");
                sb.AppendLine("END:VEVENT");
            }

            sb.AppendLine("END:VCALENDAR");

            return Content(sb.ToString(), "text/calendar", System.Text.Encoding.UTF8);
        }

        private static string EscapeIcsText(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return text.Replace("\\", "\\\\").Replace(";", "\\;").Replace(",", "\\,").Replace("\n", "\\n").Replace("\r", "");
        }
    }
}
