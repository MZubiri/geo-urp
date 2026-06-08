using GeoURPWebApi.Data;
using GeoURPWebApi.DTOs;
using GeoURPWebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Globalization;

namespace GeoURPWebApi.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class InterviewsController : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("public/interview-slots")]
    public async Task<ActionResult<ApiResponse<IEnumerable<InterviewSlotResponse>>>> GetAvailableSlots(
        [FromQuery] string date,
        [FromServices] AppDbContext db)
    {
        if (!TryParseDate(date, out var slotDate))
        {
            return BadRequest(ApiResponse<IEnumerable<InterviewSlotResponse>>.Fail("La fecha es inválida"));
        }

        var slots = await db.InterviewSlots
            .Where(x => x.Date == slotDate)
            .OrderBy(x => x.StartTime)
            .Select(x => new InterviewSlotProjection
            {
                Id = x.Id,
                Date = x.Date,
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                Capacity = x.Capacity,
                BookedCount = x.Appointments.Count()
            })
            .ToListAsync();

        var response = slots
            .Select(MapSlot)
            .Where(x => x.Available)
            .ToList();

        return Ok(ApiResponse<IEnumerable<InterviewSlotResponse>>.Ok(response));
    }

    [AllowAnonymous]
    [HttpPost("public/interview-appointments")]
    public async Task<ActionResult<ApiResponse<InterviewAppointmentResponse>>> CreateAppointment(
        [FromBody] CreateInterviewAppointmentRequest request,
        [FromServices] AppDbContext db)
    {
        var fullName = request.FullName.Trim();
        var phone = request.Phone.Trim();
        var email = request.Email.Trim();
        var major = request.Major.Trim();
        var cycle = request.Cycle.Trim();

        if (string.IsNullOrWhiteSpace(fullName)
            || string.IsNullOrWhiteSpace(phone)
            || string.IsNullOrWhiteSpace(email)
            || string.IsNullOrWhiteSpace(major)
            || string.IsNullOrWhiteSpace(cycle)
            || request.SlotId <= 0)
        {
            return BadRequest(ApiResponse<InterviewAppointmentResponse>.Fail("Completa todos los campos y selecciona un turno válido"));
        }

        if (!email.EndsWith("@urp.edu.pe", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponse<InterviewAppointmentResponse>.Fail("Debes usar tu correo institucional @urp.edu.pe"));
        }

        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var slot = await db.InterviewSlots
            .FirstOrDefaultAsync(x => x.Id == request.SlotId);

        if (slot is null)
        {
            return NotFound(ApiResponse<InterviewAppointmentResponse>.Fail("El turno seleccionado no existe"));
        }

        if (GetSlotStartDateTime(slot) <= DateTime.Now)
        {
            return BadRequest(ApiResponse<InterviewAppointmentResponse>.Fail("El turno seleccionado ya no está disponible"));
        }

        var normalizedEmail = email.ToLowerInvariant();
        var alreadyRegistered = await db.InterviewAppointments
            .AnyAsync(x => x.SlotId == request.SlotId && x.Email.ToLower() == normalizedEmail);

        if (alreadyRegistered)
        {
            return Conflict(ApiResponse<InterviewAppointmentResponse>.Fail("Ya existe una cita registrada con ese correo para este turno"));
        }

        var bookedCount = await db.InterviewAppointments
            .CountAsync(x => x.SlotId == request.SlotId);

        if (bookedCount >= slot.Capacity)
        {
            return Conflict(ApiResponse<InterviewAppointmentResponse>.Fail("El turno seleccionado ya no tiene cupos disponibles"));
        }

        var appointment = new InterviewAppointment
        {
            SlotId = request.SlotId,
            FullName = fullName,
            Phone = phone,
            Email = email,
            Major = major,
            Cycle = cycle,
            Status = "Registrada",
            CreatedAt = DateTime.UtcNow
        };

        db.InterviewAppointments.Add(appointment);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        var response = MapAppointment(appointment, slot);
        return Created(string.Empty, ApiResponse<InterviewAppointmentResponse>.Ok(response, "Cita registrada exitosamente"));
    }

    [Authorize(Roles = "Admin,Editor")]
    [HttpGet("admin/interview-slots")]
    public async Task<ActionResult<ApiResponse<IEnumerable<InterviewSlotResponse>>>> GetAdminSlots(
        [FromQuery] string date,
        [FromServices] AppDbContext db)
    {
        if (!TryParseDate(date, out var slotDate))
        {
            return BadRequest(ApiResponse<IEnumerable<InterviewSlotResponse>>.Fail("La fecha es inválida"));
        }

        var slots = await db.InterviewSlots
            .Where(x => x.Date == slotDate)
            .OrderBy(x => x.StartTime)
            .Select(x => new InterviewSlotProjection
            {
                Id = x.Id,
                Date = x.Date,
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                Capacity = x.Capacity,
                BookedCount = x.Appointments.Count()
            })
            .ToListAsync();

        return Ok(ApiResponse<IEnumerable<InterviewSlotResponse>>.Ok(slots.Select(MapSlot).ToList()));
    }

    [Authorize(Roles = "Admin,Editor")]
    [HttpPost("admin/interview-slots")]
    public async Task<ActionResult<ApiResponse<InterviewSlotResponse>>> CreateSlot(
        [FromBody] CreateInterviewSlotRequest request,
        [FromServices] AppDbContext db)
    {
        if (!TryParseDate(request.Date, out var slotDate))
        {
            return BadRequest(ApiResponse<InterviewSlotResponse>.Fail("La fecha es inválida"));
        }

        if (!TryParseTime(request.StartTime, out var startTime) || !TryParseTime(request.EndTime, out var endTime))
        {
            return BadRequest(ApiResponse<InterviewSlotResponse>.Fail("Las horas del turno son inválidas"));
        }

        if (endTime <= startTime)
        {
            return BadRequest(ApiResponse<InterviewSlotResponse>.Fail("La hora de fin debe ser mayor a la hora de inicio"));
        }

        if (request.Capacity < 1)
        {
            return BadRequest(ApiResponse<InterviewSlotResponse>.Fail("La capacidad debe ser mayor a cero"));
        }

        var overlaps = await db.InterviewSlots.AnyAsync(x =>
            x.Date == slotDate &&
            startTime < x.EndTime &&
            endTime > x.StartTime);

        if (overlaps)
        {
            return Conflict(ApiResponse<InterviewSlotResponse>.Fail("Ya existe un turno que se cruza con ese horario"));
        }

        var slot = new InterviewSlot
        {
            Date = slotDate,
            StartTime = startTime,
            EndTime = endTime,
            Capacity = request.Capacity,
            CreatedAt = DateTime.UtcNow
        };

        db.InterviewSlots.Add(slot);
        await db.SaveChangesAsync();

        var response = MapSlot(slot, 0);
        return Created(string.Empty, ApiResponse<InterviewSlotResponse>.Ok(response, "Turno creado exitosamente"));
    }

    [Authorize(Roles = "Admin,Editor")]
    [HttpDelete("admin/interview-slots/{id:int}")]
    public async Task<ActionResult> DeleteSlot(int id, [FromServices] AppDbContext db)
    {
        var slot = await db.InterviewSlots
            .FirstOrDefaultAsync(x => x.Id == id);

        if (slot is null)
        {
            return NotFound(ApiResponse<string>.Fail("No existe el turno seleccionado"));
        }

        var bookedCount = await db.InterviewAppointments
            .CountAsync(x => x.SlotId == id);

        if (bookedCount > 0)
        {
            return BadRequest(ApiResponse<string>.Fail("No se puede eliminar un turno que ya tiene citas registradas"));
        }

        db.InterviewSlots.Remove(slot);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin,Editor")]
    [HttpGet("admin/interview-appointments")]
    public async Task<ActionResult<ApiResponse<IEnumerable<InterviewAppointmentResponse>>>> GetAppointments(
        [FromServices] AppDbContext db)
    {
        var appointments = await db.InterviewAppointments
            .Include(x => x.Slot)
            .OrderByDescending(x => x.Slot.Date)
            .ThenByDescending(x => x.Slot.StartTime)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync();

        var response = appointments
            .Select(x => MapAppointment(x, x.Slot))
            .ToList();

        return Ok(ApiResponse<IEnumerable<InterviewAppointmentResponse>>.Ok(response));
    }

    [Authorize(Roles = "Admin,Editor")]
    [HttpDelete("admin/interview-appointments/{id:int}")]
    public async Task<ActionResult> DeleteAppointment(int id, [FromServices] AppDbContext db)
    {
        var appointment = await db.InterviewAppointments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (appointment is null)
        {
            return NotFound(ApiResponse<string>.Fail("No existe la cita seleccionada"));
        }

        db.InterviewAppointments.Remove(appointment);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin,Editor")]
    [HttpPatch("admin/interview-appointments/{id:int}/attend")]
    public async Task<ActionResult<ApiResponse<InterviewAppointmentResponse>>> MarkAppointmentAsAttended(
        int id,
        [FromServices] AppDbContext db)
    {
        var appointment = await db.InterviewAppointments
            .Include(x => x.Slot)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (appointment is null)
        {
            return NotFound(ApiResponse<InterviewAppointmentResponse>.Fail("No existe la cita seleccionada"));
        }

        appointment.Status = "Atendida";
        await db.SaveChangesAsync();

        var response = MapAppointment(appointment, appointment.Slot);
        return Ok(ApiResponse<InterviewAppointmentResponse>.Ok(response, "Cita marcada como atendida"));
    }

    private static InterviewSlotResponse MapSlot(InterviewSlotProjection slot)
        => new()
        {
            Id = slot.Id,
            Date = slot.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            StartTime = slot.StartTime.ToString("HH':'mm", CultureInfo.InvariantCulture),
            EndTime = slot.EndTime.ToString("HH':'mm", CultureInfo.InvariantCulture),
            Capacity = slot.Capacity,
            BookedCount = slot.BookedCount,
            Available = slot.BookedCount < slot.Capacity
        };

    private static InterviewSlotResponse MapSlot(InterviewSlot slot, int bookedCount)
        => new()
        {
            Id = slot.Id,
            Date = slot.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            StartTime = slot.StartTime.ToString("HH':'mm", CultureInfo.InvariantCulture),
            EndTime = slot.EndTime.ToString("HH':'mm", CultureInfo.InvariantCulture),
            Capacity = slot.Capacity,
            BookedCount = bookedCount,
            Available = bookedCount < slot.Capacity
        };

    private static InterviewAppointmentResponse MapAppointment(InterviewAppointment appointment, InterviewSlot slot)
        => new()
        {
            Id = appointment.Id,
            FullName = appointment.FullName,
            Phone = appointment.Phone,
            Email = appointment.Email,
            Major = appointment.Major,
            Cycle = appointment.Cycle,
            Status = appointment.Status,
            CreatedAt = appointment.CreatedAt,
            SlotId = appointment.SlotId,
            SlotDate = slot.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            SlotStartTime = slot.StartTime.ToString("HH':'mm", CultureInfo.InvariantCulture),
            SlotEndTime = slot.EndTime.ToString("HH':'mm", CultureInfo.InvariantCulture)
        };

    private static bool TryParseDate(string value, out DateOnly date)
        => DateOnly.TryParseExact(value?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

    private static bool TryParseTime(string value, out TimeOnly time)
        => TimeOnly.TryParseExact(value?.Trim(), "HH':'mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);

    private static DateTime GetSlotStartDateTime(InterviewSlot slot)
        => slot.Date.ToDateTime(slot.StartTime);

    private sealed class InterviewSlotProjection
    {
        public int Id { get; init; }
        public DateOnly Date { get; init; }
        public TimeOnly StartTime { get; init; }
        public TimeOnly EndTime { get; init; }
        public int Capacity { get; init; }
        public int BookedCount { get; init; }
    }
}
