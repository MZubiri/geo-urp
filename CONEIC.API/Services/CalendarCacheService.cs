using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using CONEIC.API.DTOs;

namespace CONEIC.API.Services
{
    public interface ICalendarCacheService
    {
        Task<List<ApartadoDto>?> GetCachedCalendarAsync();
        void SetCachedCalendar(List<ApartadoDto> calendarData);
        void InvalidateCalendarCache();
    }

    public class CalendarCacheService : ICalendarCacheService
    {
        private readonly IMemoryCache _cache;
        private const string CacheKey = "CONEIC_GENERAL_CALENDAR_CACHE";

        public CalendarCacheService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public Task<List<ApartadoDto>?> GetCachedCalendarAsync()
        {
            _cache.TryGetValue(CacheKey, out List<ApartadoDto>? cachedData);
            return Task.FromResult(cachedData);
        }

        public void SetCachedCalendar(List<ApartadoDto> calendarData)
        {
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(12)) // Cache for 12 hours unless invalidated
                .SetSlidingExpiration(TimeSpan.FromHours(2));

            _cache.Set(CacheKey, calendarData, cacheOptions);
        }

        public void InvalidateCalendarCache()
        {
            _cache.Remove(CacheKey);
        }
    }
}
