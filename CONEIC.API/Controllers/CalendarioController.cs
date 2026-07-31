using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CONEIC.API.Data;
using CONEIC.API.DTOs;
using CONEIC.API.Services;

namespace CONEIC.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalendarioController : ControllerBase
    {
        private readonly ConeicDbContext _context;
        private readonly ICalendarCacheService _cacheService;

        public CalendarioController(ConeicDbContext context, ICalendarCacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        [HttpGet("general")]
        public async Task<IActionResult> GetGeneralCalendar()
        {
            // Try fetching from RAM cache first (<5ms)
            var cachedData = await _cacheService.GetCachedCalendarAsync();
            if (cachedData != null)
            {
                return Ok(cachedData);
            }

            // Fetch from MySQL if cache miss
            var apartados = await _context.Apartados
                .Where(a => a.Activo)
                .OrderBy(a => a.Orden)
                .Include(a => a.Actividades)
                .ToListAsync();

            var result = apartados.Select(a => new ApartadoDto
            {
                Id = a.Id,
                Nombre = a.Nombre,
                Descripcion = a.Descripcion,
                Orden = a.Orden,
                Actividades = a.Actividades
                    .OrderBy(act => act.HoraInicio)
                    .Select(act => new ActividadDto
                    {
                        Id = act.Id,
                        ApartadoId = act.ApartadoId,
                        ApartadoNombre = a.Nombre,
                        Nombre = act.Nombre,
                        Descripcion = act.Descripcion,
                        HoraInicio = act.HoraInicio,
                        HoraFin = act.HoraFin,
                        UrpParticipa = act.UrpParticipa,
                        CamposExtra = act.CamposExtra
                    }).ToList()
            }).ToList();

            // Store in RAM cache for subsequent concurrent users
            _cacheService.SetCachedCalendar(result);

            return Ok(result);
        }
    }
}
