using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CONEIC.API.Data;
using CONEIC.API.DTOs;
using CONEIC.API.Models;
using CONEIC.API.Services;

namespace CONEIC.API.Controllers
{
    [Authorize(Roles = "ADMIN")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ConeicDbContext _context;
        private readonly ICalendarCacheService _cacheService;
        private readonly IAuthService _authService;

        public AdminController(ConeicDbContext context, ICalendarCacheService cacheService, IAuthService authService)
        {
            _context = context;
            _cacheService = cacheService;
            _authService = authService;
        }

        // --- USUARIOS CRUD ---
        [HttpGet("usuarios")]
        public async Task<IActionResult> GetUsuarios()
        {
            var usuarios = await _context.Usuarios
                .OrderByDescending(u => u.Id)
                .Select(u => new UserAdminDto
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Correo = u.Correo,
                    Rol = u.Rol,
                    FechaRegistro = u.FechaRegistro
                })
                .ToListAsync();

            return Ok(usuarios);
        }

        [HttpPost("usuarios")]
        public async Task<IActionResult> CreateUsuario([FromBody] CreateUserAdminDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Correo) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return BadRequest(new { message = "Todos los campos obligatorios deben ser llenados." });
            }

            var correoLower = dto.Correo.Trim().ToLower();
            if (await _context.Usuarios.AnyAsync(u => u.Correo == correoLower))
            {
                return BadRequest(new { message = "El correo ya se encuentra registrado." });
            }

            var nuevoUsuario = new Usuario
            {
                Nombre = dto.Nombre.Trim(),
                Correo = correoLower,
                PasswordHash = _authService.HashPassword(dto.Password),
                Rol = string.Equals(dto.Rol, "ADMIN", StringComparison.OrdinalIgnoreCase) ? "ADMIN" : "USER",
                FechaRegistro = DateTime.UtcNow
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new UserAdminDto
            {
                Id = nuevoUsuario.Id,
                Nombre = nuevoUsuario.Nombre,
                Correo = nuevoUsuario.Correo,
                Rol = nuevoUsuario.Rol,
                FechaRegistro = nuevoUsuario.FechaRegistro
            });
        }

        [HttpPut("usuarios/{id}")]
        public async Task<IActionResult> UpdateUsuario(int id, [FromBody] UpdateUserAdminDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            if (!string.IsNullOrWhiteSpace(dto.Correo))
            {
                var correoLower = dto.Correo.Trim().ToLower();
                if (await _context.Usuarios.AnyAsync(u => u.Correo == correoLower && u.Id != id))
                {
                    return BadRequest(new { message = "El correo ya pertenece a otro usuario." });
                }
                usuario.Correo = correoLower;
            }

            if (!string.IsNullOrWhiteSpace(dto.Nombre))
            {
                usuario.Nombre = dto.Nombre.Trim();
            }

            usuario.Rol = string.Equals(dto.Rol, "ADMIN", StringComparison.OrdinalIgnoreCase) ? "ADMIN" : "USER";

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                usuario.PasswordHash = _authService.HashPassword(dto.Password);
            }

            await _context.SaveChangesAsync();

            return Ok(new UserAdminDto
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Correo = usuario.Correo,
                Rol = usuario.Rol,
                FechaRegistro = usuario.FechaRegistro
            });
        }

        [HttpDelete("usuarios/{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(currentUserIdStr, out var currentUserId) && currentUserId == id)
            {
                return BadRequest(new { message = "No puedes eliminar tu propia cuenta de usuario administrador." });
            }

            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            // Remove user's agenda entries first
            var agendaEntries = await _context.AgendaUsuarios.Where(a => a.UsuarioId == id).ToListAsync();
            _context.AgendaUsuarios.RemoveRange(agendaEntries);

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Usuario eliminado con éxito." });
        }

        // --- APARTADOS CRUD ---
        [HttpPost("apartados")]
        public async Task<IActionResult> CreateApartado([FromBody] CreateApartadoDto dto)
        {
            var apartado = new Apartado
            {
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                Orden = dto.Orden,
                Activo = true
            };

            _context.Apartados.Add(apartado);
            await _context.SaveChangesAsync();

            _cacheService.InvalidateCalendarCache();

            return Ok(apartado);
        }

        [HttpDelete("apartados/{id}")]
        public async Task<IActionResult> DeleteApartado(int id)
        {
            var apartado = await _context.Apartados.FindAsync(id);
            if (apartado == null) return NotFound();

            _context.Apartados.Remove(apartado);
            await _context.SaveChangesAsync();

            _cacheService.InvalidateCalendarCache();

            return Ok(new { message = "Apartado eliminado con éxito." });
        }

        // --- ACTIVIDADES CRUD ---
        [HttpPost("actividades")]
        public async Task<IActionResult> CreateActividad([FromBody] CreateActividadDto dto)
        {
            var actividad = new Actividad
            {
                ApartadoId = dto.ApartadoId,
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                HoraInicio = dto.HoraInicio,
                HoraFin = dto.HoraFin,
                UrpParticipa = dto.UrpParticipa,
                CamposExtra = dto.CamposExtra
            };

            _context.Actividades.Add(actividad);
            await _context.SaveChangesAsync();

            _cacheService.InvalidateCalendarCache();

            return Ok(actividad);
        }

        [HttpPut("actividades/{id}")]
        public async Task<IActionResult> UpdateActividad(int id, [FromBody] CreateActividadDto dto)
        {
            var actividad = await _context.Actividades.FindAsync(id);
            if (actividad == null) return NotFound();

            actividad.ApartadoId = dto.ApartadoId;
            actividad.Nombre = dto.Nombre;
            actividad.Descripcion = dto.Descripcion;
            actividad.HoraInicio = dto.HoraInicio;
            actividad.HoraFin = dto.HoraFin;
            actividad.UrpParticipa = dto.UrpParticipa;
            actividad.CamposExtra = dto.CamposExtra;

            await _context.SaveChangesAsync();

            _cacheService.InvalidateCalendarCache();

            return Ok(actividad);
        }

        [HttpDelete("actividades/{id}")]
        public async Task<IActionResult> DeleteActividad(int id)
        {
            var actividad = await _context.Actividades.FindAsync(id);
            if (actividad == null) return NotFound();

            _context.Actividades.Remove(actividad);
            await _context.SaveChangesAsync();

            _cacheService.InvalidateCalendarCache();

            return Ok(new { message = "Actividad eliminada con éxito." });
        }

        // --- ENVÍO MASIVO DE CORREOS DE AGRADECIMIENTO (ÚLTIMO DÍA) ---
        [HttpPost("enviar-agradecimientos")]
        public async Task<IActionResult> SendMassThankYouEmails([FromServices] IEmailService emailService)
        {
            var usuarios = await _context.Usuarios.ToListAsync();
            int encolados = 0;

            foreach (var u in usuarios)
            {
                if (!string.IsNullOrWhiteSpace(u.Correo))
                {
                    await emailService.QueueThankYouEmailAsync(_context, u.Correo, u.Nombre);
                    encolados++;
                }
            }

            return Ok(new { message = $"Se encoló el envío de correos de agradecimiento a {encolados} usuarios registrados. El sistema los procesará respetando la cuota diaria." });
        }
    }
}
