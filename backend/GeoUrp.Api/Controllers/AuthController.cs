using GeoUrp.Api.Data;
using GeoUrp.Api.Models;
using GeoUrp.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GeoUrp.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<ApiResponse<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        [FromServices] InMemoryStore store,
        [FromServices] JwtTokenService jwtTokenService)
    {
        var user = store.Users.FirstOrDefault(x =>
            x.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)
            && x.Password == request.Password
            && x.IsActive);

        if (user is null)
        {
            return Unauthorized(ApiResponse<LoginResponse>.Fail("Credenciales inválidas"));
        }

        var token = jwtTokenService.Generate(user);
        return Ok(ApiResponse<LoginResponse>.Ok(token, "Login exitoso"));
    }
}
