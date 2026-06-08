using GeoURPWebApi.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GeoURPWebApi.Services;

public sealed class AccessControlService
{
    private static readonly HashSet<string> UsersViewEmails = new(StringComparer.OrdinalIgnoreCase)
    {
        "201521216@urp.edu.pe",
        "molinaz.dev@gmail.com"
    };

    private static readonly HashSet<string> OrdersAccessRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Admin",
        "Editor",
        "Administrador",
        "Administrativo"
    };

    public async Task<bool> CanAccessMembersAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken = default)
        => await CanAccessMembersAsync(GetCurrentEmail(principal), db, cancellationToken);

    public async Task<bool> CanAccessMembersAsync(
        string? email,
        AppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (normalizedEmail is null)
        {
            return false;
        }

        return await db.BoardMembers.AnyAsync(
            x => x.IsActive && x.SortOrder == 1 && x.Email.ToLower() == normalizedEmail,
            cancellationToken);
    }

    public bool CanAccessUsersView(ClaimsPrincipal principal)
        => CanAccessUsersView(GetCurrentEmail(principal));

    public bool CanAccessUsersView(string? email)
    {
        var normalizedEmail = NormalizeEmail(email);
        return normalizedEmail is not null && UsersViewEmails.Contains(normalizedEmail);
    }

    public bool CanAccessOrders(ClaimsPrincipal principal)
    {
        var roles = principal.Claims
            .Where(claim =>
                claim.Type == ClaimTypes.Role
                || claim.Type == "role"
                || claim.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
            .Select(claim => claim.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value));

        return roles.Any(role => OrdersAccessRoles.Contains(role.Trim()));
    }

    public string? GetCurrentEmail(ClaimsPrincipal principal)
        => NormalizeEmail(
            principal.FindFirstValue(ClaimTypes.Email)
            ?? principal.FindFirstValue("email")
            ?? principal.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")
            ?? principal.FindFirstValue("unique_name"));

    private static string? NormalizeEmail(string? email)
        => string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
}
