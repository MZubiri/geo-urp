using GeoURPWebApi.Data;
using GeoURPWebApi.DTOs;
using GeoURPWebApi.Models;
using GeoURPWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoURPWebApi.Controllers;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<User>>>> GetAll(
        [FromServices] AppDbContext db,
        [FromServices] AccessControlService accessControlService)
    {
        if (!accessControlService.CanAccessUsersView(User))
        {
            return ForbiddenResponse<IEnumerable<User>>("No tienes permisos para acceder a usuarios.");
        }

        var users = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .OrderBy(x => x.Id)
            .ToListAsync();

        foreach (var user in users)
        {
            user.Roles = user.UserRoles.Select(x => x.Role.Name).ToList();
        }

        return Ok(ApiResponse<IEnumerable<User>>.Ok(users));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<User>>> GetById(
        int id,
        [FromServices] AppDbContext db,
        [FromServices] AccessControlService accessControlService)
    {
        if (!accessControlService.CanAccessUsersView(User))
        {
            return ForbiddenResponse<User>("No tienes permisos para acceder a usuarios.");
        }

        var user = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (user is null)
        {
            return NotFound(ApiResponse<User>.Fail("Usuario no encontrado"));
        }

        user.Roles = user.UserRoles.Select(x => x.Role.Name).ToList();
        return Ok(ApiResponse<User>.Ok(user));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<User>>> Create(
        [FromBody] User request,
        [FromServices] AppDbContext db,
        [FromServices] PasswordService passwordService,
        [FromServices] AccessControlService accessControlService)
    {
        if (!accessControlService.CanAccessUsersView(User))
        {
            return ForbiddenResponse<User>("No tienes permisos para gestionar usuarios.");
        }

        var roleIds = await db.Roles
            .Where(r => request.Roles.Contains(r.Name))
            .Select(r => r.Id)
            .ToListAsync();

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Password = passwordService.HashPassword(request.Password),
            IsActive = request.IsActive
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        foreach (var roleId in roleIds)
        {
            db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleId });
        }

        await db.SaveChangesAsync();
        user.Roles = request.Roles;
        return CreatedAtAction(nameof(GetAll), ApiResponse<User>.Ok(user, "Usuario creado"));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<User>>> Update(
        int id,
        [FromBody] User request,
        [FromServices] AppDbContext db,
        [FromServices] PasswordService passwordService,
        [FromServices] AccessControlService accessControlService)
    {
        if (!accessControlService.CanAccessUsersView(User))
        {
            return ForbiddenResponse<User>("No tienes permisos para gestionar usuarios.");
        }

        var current = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (current is null)
        {
            return NotFound(ApiResponse<User>.Fail("No existe el usuario"));
        }

        current.Name = request.Name;
        current.Email = request.Email;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            current.Password = passwordService.HashPassword(request.Password);
        }

        current.IsActive = request.IsActive;

        db.UserRoles.RemoveRange(current.UserRoles);
        var roleIds = await db.Roles
            .Where(r => request.Roles.Contains(r.Name))
            .Select(r => r.Id)
            .ToListAsync();

        foreach (var roleId in roleIds)
        {
            db.UserRoles.Add(new UserRole { UserId = current.Id, RoleId = roleId });
        }

        await db.SaveChangesAsync();
        current.Roles = request.Roles;
        return Ok(ApiResponse<User>.Ok(current, "Usuario actualizado"));
    }

    [HttpPatch("{id:int}/roles")]
    public async Task<ActionResult<ApiResponse<User>>> UpdateRoles(
        int id,
        [FromBody] UpdateUserRolesRequest request,
        [FromServices] AppDbContext db,
        [FromServices] AccessControlService accessControlService)
    {
        if (!accessControlService.CanAccessUsersView(User))
        {
            return ForbiddenResponse<User>("No tienes permisos para gestionar usuarios.");
        }

        if (request.Roles == null || request.Roles.Count == 0)
        {
            return BadRequest(ApiResponse<User>.Fail("Debe proporcionar al menos un rol"));
        }

        var user = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (user is null)
        {
            return NotFound(ApiResponse<User>.Fail("Usuario no encontrado"));
        }

        var roleIds = await db.Roles
            .Where(r => request.Roles.Contains(r.Name))
            .Select(r => r.Id)
            .ToListAsync();

        if (roleIds.Count != request.Roles.Count)
        {
            return BadRequest(ApiResponse<User>.Fail("Uno o mas roles no existen"));
        }

        db.UserRoles.RemoveRange(user.UserRoles);

        foreach (var roleId in roleIds)
        {
            db.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = roleId
            });
        }

        await db.SaveChangesAsync();

        user = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Id == id);

        user!.Roles = user.UserRoles.Select(x => x.Role.Name).ToList();
        return Ok(ApiResponse<User>.Ok(user, "Roles actualizados exitosamente"));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(
        int id,
        [FromServices] AppDbContext db,
        [FromServices] AccessControlService accessControlService)
    {
        if (!accessControlService.CanAccessUsersView(User))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<string>.Fail("No tienes permisos para gestionar usuarios."));
        }

        var current = await db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (current is null)
        {
            return NotFound();
        }

        db.Users.Remove(current);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private ActionResult<ApiResponse<T>> ForbiddenResponse<T>(string message)
    {
        return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<T>.Fail(message));
    }
}
