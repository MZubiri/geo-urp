using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using CONEIC.API.Data;

namespace CONEIC.API.Services
{
    public class EmailQueueBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _config;
        private readonly ILogger<EmailQueueBackgroundService> _logger;

        public EmailQueueBackgroundService(
            IServiceProvider serviceProvider,
            IConfiguration config,
            ILogger<EmailQueueBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _config = config;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Email Queue Background Worker Service is running...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessQueueBatchAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing email queue batch.");
                }

                // Check queue every 30 seconds
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        private async Task ProcessQueueBatchAsync()
        {
            var maxDailyQuotaStr = _config["Smtp:MaxDailyQuota"];
            int maxDailyQuota = int.TryParse(maxDailyQuotaStr, out var q) ? q : 280; // Default 280 per day (for Brevo free 300 limit)

            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ConeicDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var todayUtc = DateTime.UtcNow.Date;
                var sentTodayCount = await context.ColaCorreos
                    .CountAsync(c => c.Estado == "ENVIADO" && c.FechaEnvio.HasValue && c.FechaEnvio.Value.Date == todayUtc);

                if (sentTodayCount >= maxDailyQuota)
                {
                    _logger.LogInformation("Cuota diaria de correos alcanzada ({SentCount}/{Quota}). Los correos restantes continuarán mañana.", sentTodayCount, maxDailyQuota);
                    return;
                }

                int batchSize = Math.Min(10, maxDailyQuota - sentTodayCount);
                if (batchSize <= 0) return;

                var pendingEmails = await context.ColaCorreos
                    .Where(c => c.Estado == "PENDIENTE" && c.Intentos < 3)
                    .OrderBy(c => c.Id)
                    .Take(batchSize)
                    .ToListAsync();

                if (pendingEmails.Count == 0) return;

                foreach (var email in pendingEmails)
                {
                    try
                    {
                        email.Intentos++;
                        await emailService.SendEmailAsync(email.Destinatario, email.Asunto, email.CuerpoHtml);

                        // If SMTP is configured and succeeded, mark as ENVIADO
                        var smtpHost = _config["Smtp:Host"];
                        if (!string.IsNullOrWhiteSpace(smtpHost))
                        {
                            email.Estado = "ENVIADO";
                            email.FechaEnvio = DateTime.UtcNow;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error enviando correo ID {Id} a {Email}", email.Id, email.Destinatario);
                        if (email.Intentos >= 3)
                        {
                            email.Estado = "ERROR";
                        }
                    }
                }

                await context.SaveChangesAsync();
            }
        }
    }
}
