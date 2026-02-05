using GeoUrp.Api.Data;
using GeoUrp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GeoUrp.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class EventsController : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("public/events")]
    public ActionResult<ApiResponse<IEnumerable<Event>>> GetPublic([FromServices] InMemoryStore store)
    {
        var data = store.Events.Where(x => x.IsPublic).OrderBy(x => x.StartAt).ToList();
        return Ok(ApiResponse<IEnumerable<Event>>.Ok(data));
    }

    [AllowAnonymous]
    [HttpGet("public/events/calendar")]
    public ActionResult<ApiResponse<IEnumerable<CalendarItemResponse>>> Calendar(
        [FromQuery] int month,
        [FromQuery] int year,
        [FromServices] InMemoryStore store)
    {
        if (month is < 1 or > 12 || year < 2000)
        {
            return BadRequest(ApiResponse<IEnumerable<CalendarItemResponse>>.Fail("Parámetros inválidos"));
        }

        var data = store.Events
            .Where(x => x.IsPublic && x.StartAt.Month == month && x.StartAt.Year == year)
            .OrderBy(x => x.StartAt)
            .Select(x => new CalendarItemResponse
            {
                Id = x.Id,
                Title = x.Title,
                StartAt = x.StartAt,
                EndAt = x.EndAt,
                Location = x.Location
            })
            .ToList();

        return Ok(ApiResponse<IEnumerable<CalendarItemResponse>>.Ok(data));
    }

    [Authorize(Roles = "Admin,Editor")]
    [HttpGet("admin/events")]
    public ActionResult<ApiResponse<IEnumerable<Event>>> GetAdmin([FromServices] InMemoryStore store)
        => Ok(ApiResponse<IEnumerable<Event>>.Ok(store.Events.OrderBy(x => x.StartAt)));

    [Authorize(Roles = "Admin,Editor")]
    [HttpPost("admin/events")]
    public ActionResult<ApiResponse<Event>> Create([FromBody] Event request, [FromServices] InMemoryStore store)
    {
        request.Id = store.Events.Count == 0 ? 1 : store.Events.Max(x => x.Id) + 1;
        store.Events.Add(request);
        return CreatedAtAction(nameof(GetAdmin), ApiResponse<Event>.Ok(request, "Evento creado"));
    }
}
