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
    }
}
