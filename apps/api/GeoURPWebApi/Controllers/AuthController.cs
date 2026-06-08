using GeoURPWebApi.Data;
using GeoURPWebApi.DTOs;
using GeoURPWebApi.Models;
using GeoURPWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GeoURPWebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(
        [FromBody] LoginRequest request,
        [FromServices] AppDbContext db,
        [FromServices] JwtTokenService jwt,
        [FromServices] PasswordService passwordService,
        [FromServices] AccessControlService accessControlService)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Email.ToLower() == normalizedEmail && x.IsActive);

        if (user is null || !passwordService.VerifyPassword(request.Password, user.Password))
        {
            return Unauthorized(ApiResponse<LoginResponse>.Fail("Credenciales invalidas"));
        }

        user.Roles = user.UserRoles.Select(x => x.Role.Name).ToList();

        var canAccessMembers = await accessControlService.CanAccessMembersAsync(user.Email, db);
        var canAccessUsers = accessControlService.CanAccessUsersView(user.Email);

        return Ok(ApiResponse<LoginResponse>.Ok(
            jwt.Generate(user, canAccessMembers, canAccessUsers),
            "Login exitoso"));
    }

    [AllowAnonymous]
    [HttpPost("setup-admin")]
    public async Task<ActionResult<ApiResponse<User>>> SetupAdmin(
        [FromServices] AppDbContext db,
        [FromServices] PasswordService passwordService,
        [FromServices] IConfiguration configuration)
    {
        if (await db.Users.AnyAsync())
        {
            return BadRequest(ApiResponse<User>.Fail("Ya existen usuarios en el sistema"));
        }

        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        if (adminRole is null)
        {
            adminRole = new Role { Name = "Admin" };
            db.Roles.Add(adminRole);
            await db.SaveChangesAsync();
        }

        var adminPassword = configuration["InitialAdmin:Password"];
        if (string.IsNullOrWhiteSpace(adminPassword) || adminPassword == "CHANGE_THIS_INITIAL_ADMIN_PASSWORD")
        {
            return BadRequest(ApiResponse<User>.Fail("Configura InitialAdmin:Password antes de crear el administrador"));
        }

        var adminUser = new User
        {
            Name = "Administrador",
            Email = configuration["InitialAdmin:Email"] ?? "admin@geourp.local",
            Password = passwordService.HashPassword(adminPassword),
            IsActive = true
        };

        db.Users.Add(adminUser);
        await db.SaveChangesAsync();

        db.UserRoles.Add(new UserRole
        {
            UserId = adminUser.Id,
            RoleId = adminRole.Id
        });
        await db.SaveChangesAsync();

        adminUser.Roles = new List<string> { "Admin" };
        return Ok(ApiResponse<User>.Ok(adminUser, "Usuario administrador creado exitosamente"));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<string>>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] AppDbContext db,
        [FromServices] PasswordService passwordService)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
        {
            return Unauthorized(ApiResponse<string>.Fail("Usuario no autenticado"));
        }

        var currentUserId = int.Parse(userIdClaim);

        if (request.NewPassword != request.ConfirmPassword)
        {
            return BadRequest(ApiResponse<string>.Fail("Las contrasenas no coinciden"));
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(ApiResponse<string>.Fail("La contrasena debe tener al menos 6 caracteres"));
        }

        var user = await db.Users.FindAsync(currentUserId);
        if (user == null)
        {
            return NotFound(ApiResponse<string>.Fail("Usuario no encontrado"));
        }

        user.Password = passwordService.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok(string.Empty, "Nueva contrasena guardada correctamente."));
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<string>>> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        [FromServices] AppDbContext db,
        [FromServices] PasswordService passwordService,
        [FromServices] EmailService emailService)
    {
        var email = request.Email.Trim();
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(ApiResponse<string>.Fail("Ingresa tu correo registrado."));
        }

        const string recoveryMessage = "Si el correo esta registrado, recibiras una contrasena temporal.";

        var normalizedEmail = email.ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == normalizedEmail && x.IsActive);
        if (user is null)
        {
            return Ok(ApiResponse<string>.Ok(string.Empty, recoveryMessage));
        }

        var temporaryPassword = passwordService.GenerateTemporaryPassword();
        var sent = await emailService.SendPasswordRecoveryAsync(user.Email, user.Name, temporaryPassword);
        if (!sent)
        {
            return StatusCode(500, ApiResponse<string>.Fail(
                "No se pudo enviar el correo de recuperacion. Intenta nuevamente."));
        }

        user.Password = passwordService.HashPassword(temporaryPassword);
        await db.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok(string.Empty, recoveryMessage));
    }
}
