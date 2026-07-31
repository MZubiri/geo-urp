using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CONEIC.API.Data;
using CONEIC.API.DTOs;
using CONEIC.API.Models;
using CONEIC.API.Services;

namespace CONEIC.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ConeicDbContext _context;
        private readonly IAuthService _authService;
        private readonly IEmailService _emailService;

        public AuthController(ConeicDbContext context, IAuthService authService, IEmailService emailService)
        {
            _context = context;
            _authService = authService;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Correo) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return BadRequest(new { message = "Todos los campos son obligatorios." });
            }

            var correoLower = dto.Correo.Trim().ToLower();
            if (await _context.Usuarios.AnyAsync(u => u.Correo == correoLower))
            {
                return BadRequest(new { message = "El correo electrónico ya se encuentra registrado." });
            }

            var nuevoUsuario = new Usuario
            {
                Nombre = dto.Nombre.Trim(),
                Correo = correoLower,
                PasswordHash = _authService.HashPassword(dto.Password),
                Rol = "USER"
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            // Queue welcome email persistently into MySQL
            await _emailService.QueueWelcomeEmailAsync(_context, nuevoUsuario.Correo, nuevoUsuario.Nombre);

            var token = _authService.GenerateJwtToken(nuevoUsuario);

            return Ok(new AuthResponseDto
            {
                Id = nuevoUsuario.Id,
                Nombre = nuevoUsuario.Nombre,
                Correo = nuevoUsuario.Correo,
                Rol = nuevoUsuario.Rol,
                Token = token
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Correo) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Correo y contraseña son requeridos." });
            }

            var correoLower = dto.Correo.Trim().ToLower();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == correoLower);

            if (usuario == null || !_authService.VerifyPassword(dto.Password, usuario.PasswordHash))
            {
                return Unauthorized(new { message = "Credenciales incorrectas." });
            }

            var token = _authService.GenerateJwtToken(usuario);

            return Ok(new AuthResponseDto
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Correo = usuario.Correo,
                Rol = usuario.Rol,
                Token = token
            });
        }

        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpPost("cambiar-password")]
        public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PasswordActual) || string.IsNullOrWhiteSpace(dto.PasswordNueva))
            {
                return BadRequest(new { message = "Debes ingresar tu contraseña actual y la nueva contraseña." });
            }

            if (dto.PasswordNueva.Length < 6)
            {
                return BadRequest(new { message = "La nueva contraseña debe tener al menos 6 caracteres." });
            }

            var currentUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(currentUserIdStr, out var userId))
            {
                return Unauthorized();
            }

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null) return NotFound(new { message = "Usuario no encontrado." });

            if (!_authService.VerifyPassword(dto.PasswordActual, usuario.PasswordHash))
            {
                return BadRequest(new { message = "La contraseña actual ingresada es incorrecta." });
            }

            usuario.PasswordHash = _authService.HashPassword(dto.PasswordNueva);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tu contraseña ha sido actualizada con éxito." });
        }

        [HttpPost("recuperar-password")]
        public async Task<IActionResult> RecuperarPassword([FromBody] RecuperarPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Correo))
            {
                return BadRequest(new { message = "Por favor ingresa tu correo electrónico." });
            }

            var correoLower = dto.Correo.Trim().ToLower();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == correoLower);

            if (usuario == null)
            {
                return Ok(new { message = "Si el correo ingresado está registrado, se han enviado las instrucciones de restablecimiento." });
            }

            // Generar clave temporal de 8 caracteres
            var tempPassword = System.Guid.NewGuid().ToString("N").Substring(0, 8);
            usuario.PasswordHash = _authService.HashPassword(tempPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Se ha restablecido tu contraseña temporal a: {tempPassword}. Inicia sesión con ella y cámbiala inmediatamente.", tempPassword });
        }
    }
}
