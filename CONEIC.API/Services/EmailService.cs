using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using CONEIC.API.Data;
using CONEIC.API.Models;

namespace CONEIC.API.Services
{
    public interface IEmailService
    {
        Task QueueWelcomeEmailAsync(ConeicDbContext context, string toEmail, string userName);
        Task QueueThankYouEmailAsync(ConeicDbContext context, string toEmail, string userName);
        Task SendWelcomeEmailAsync(string toEmail, string userName);
        Task SendThankYouEmailAsync(string toEmail, string userName);
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task QueueWelcomeEmailAsync(ConeicDbContext context, string toEmail, string userName)
        {
            var subject = "¡Bienvenido a tu Agenda Digital CONEIC Cusco 2026! 🏛️ - GeoURP";
            var body = GetWelcomeHtml(userName);

            var cola = new ColaCorreo
            {
                Destinatario = toEmail,
                Asunto = subject,
                CuerpoHtml = body,
                Estado = "PENDIENTE",
                Intentos = 0,
                FechaCreacion = DateTime.UtcNow
            };

            context.ColaCorreos.Add(cola);
            await context.SaveChangesAsync();
        }

        public async Task QueueThankYouEmailAsync(ConeicDbContext context, string toEmail, string userName)
        {
            var subject = "¡Gracias por acompañarnos en CONEIC Cusco 2026! 💚 - GeoURP";
            var body = GetThankYouHtml(userName);

            var cola = new ColaCorreo
            {
                Destinatario = toEmail,
                Asunto = subject,
                CuerpoHtml = body,
                Estado = "PENDIENTE",
                Intentos = 0,
                FechaCreacion = DateTime.UtcNow
            };

            context.ColaCorreos.Add(cola);
            await context.SaveChangesAsync();
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string userName)
        {
            await SendEmailAsync(toEmail, "¡Bienvenido a tu Agenda Digital CONEIC Cusco 2026! 🏛️ - GeoURP", GetWelcomeHtml(userName));
        }

        public async Task SendThankYouEmailAsync(string toEmail, string userName)
        {
            await SendEmailAsync(toEmail, "¡Gracias por acompañarnos en CONEIC Cusco 2026! 💚 - GeoURP", GetThankYouHtml(userName));
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var smtpHost = _config["Smtp:Host"];
                var smtpPortStr = _config["Smtp:Port"];
                var smtpUser = _config["Smtp:User"];
                var smtpPass = _config["Smtp:Password"];
                var fromEmail = _config["Smtp:From"] ?? "coneic@geourp.org";

                if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(smtpUser))
                {
                    _logger.LogWarning("SMTP Host/User not configured in appsettings.json. Email to {Email} skipped.", toEmail);
                    return;
                }

                int smtpPort = int.TryParse(smtpPortStr, out var p) ? p : 587;

                using (var message = new MailMessage())
                {
                    message.From = new MailAddress(fromEmail, "GeoURP");
                    message.To.Add(new MailAddress(toEmail));
                    message.Subject = subject;
                    message.Body = htmlBody;
                    message.IsBodyHtml = true;

                    using (var client = new SmtpClient(smtpHost, smtpPort))
                    {
                        client.Credentials = new NetworkCredential(smtpUser, smtpPass);
                        client.EnableSsl = true;

                        await client.SendMailAsync(message);
                        _logger.LogInformation("Email successfully sent via Brevo to {Email}", toEmail);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email via Brevo to {Email}", toEmail);
                throw;
            }
        }

        private string GetWelcomeHtml(string userName)
        {
            return $@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Tu Agenda Digital CONEIC Cusco 2026 - GeoURP</title>
</head>
<body style='margin: 0; padding: 0; background-color: #F4F6F4; font-family: Arial, Helvetica, sans-serif;'>
    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #F4F6F4; padding: 40px 10px;'>
        <tr>
            <td align='center'>
                <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.08); border: 1px solid #E2E6E2;'>
                    
                    <!-- HERO HEADER MODERNO -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #093C23 0%, #0F5A36 60%, #177A4B 100%); padding: 40px 30px; text-align: center; position: relative;'>
                            <div style='display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); padding: 5px 16px; border-radius: 20px; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 14px;'>
                                HERRAMIENTA GRATUITA POR GEOURP
                            </div>
                            <h1 style='color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; line-height: 1.25;'>
                                XXXIII CONEIC CUSCO 2026
                            </h1>
                            <p style='color: #BEE3CC; margin-top: 8px; margin-bottom: 0; font-size: 15px; font-weight: 500;'>
                                Tu Agenda Digital e Itinerario Personalizado
                            </p>
                        </td>
                    </tr>

                    <!-- CUERPO PRINCIPAL -->
                    <tr>
                        <td style='padding: 36px 32px; color: #111B15;'>
                            <h2 style='font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 16px; color: #0F5A36;'>
                                ¡Hola, {userName}! 👋
                            </h2>
                            
                            <p style='font-size: 15px; line-height: 1.65; color: #3A443F; margin-bottom: 20px;'>
                                El <strong>Grupo Estudiantil de Geotecnia (GeoURP)</strong> de la Universidad Ricardo Palma ha creado esta plataforma web gratuita para ayudarte a organizar tu tiempo y aprovechar al máximo tu experiencia en el <strong>CONEIC Cusco 2026</strong>.
                            </p>

                            <!-- TARJETA ACERCA DE LA HERRAMIENTA -->
                            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #F8FAF8; border-radius: 14px; padding: 22px; border: 1.5px solid #E2E8E3; margin-bottom: 26px;'>
                                <tr>
                                    <td>
                                        <p style='margin: 0 0 12px 0; font-size: 14px; color: #0F5A36; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;'>
                                            💡 ¿Qué puedes hacer en la plataforma?
                                        </p>
                                        <table border='0' cellpadding='0' cellspacing='0' width='100%' style='font-size: 14px; color: #3A443F; line-height: 1.6;'>
                                            <tr>
                                                <td style='padding-bottom: 8px; vertical-align: top; width: 24px;'>🗓️</td>
                                                <td style='padding-bottom: 8px;'><strong>Vista Calendario (GCal):</strong> Visualiza las ponencias y eventos organizados por horas y días.</td>
                                            </tr>
                                            <tr>
                                                <td style='padding-bottom: 8px; vertical-align: top;'>⭐</td>
                                                <td style='padding-bottom: 8px;'><strong>Mi Agenda:</strong> Selecciona tus actividades favoritas para crear tu itinerario propio.</td>
                                            </tr>
                                            <tr>
                                                <td style='vertical-align: top;'>⚠️</td>
                                                <td style=''><strong>Detección de Cruces:</strong> La app te alertará si intentas agendar dos actividades en el mismo horario.</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- BOTÓN PRINCIPAL LLAMATIVO -->
                            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='margin-bottom: 28px;'>
                                <tr>
                                    <td align='center'>
                                        <a href='https://geourp.org/coneic/' target='_blank' style='display: inline-block; background: linear-gradient(135deg, #0F5A36 0%, #147346 100%); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 18px rgba(15, 90, 54, 0.28);'>
                                            🚀 Ingresar a Mi Agenda Digital
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- NOTA ACLARATORIA -->
                            <p style='font-size: 13px; line-height: 1.5; color: #6C7570; margin: 0; padding: 14px; background-color: #F4F6F4; border-radius: 8px; text-align: center;'>
                                ℹ️ <em>Nota: Esta herramienta web ha sido desarrollada de forma independiente y gratuita por GeoURP como aporte a todos los estudiantes asistentes al congreso.</em>
                            </p>
                        </td>
                    </tr>

                    <!-- REDES SOCIALES GEOURP -->
                    <tr>
                        <td style='background-color: #F8FAF8; padding: 28px 30px; border-top: 1px solid #E6E8E6; text-align: center;'>
                            <p style='margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0F5A36; text-transform: uppercase; letter-spacing: 0.8px;'>
                                Redes Oficiales de GeoURP
                            </p>
                            <table border='0' cellpadding='0' cellspacing='0' align='center' style='margin: 0 auto;'>
                                <tr>
                                    <td style='padding: 4px;'>
                                        <a href='https://geourp.org/' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #0F5A36; border-radius: 8px; padding: 8px 14px; color: #0F5A36; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            🌐 Web Oficial
                                        </a>
                                    </td>
                                    <td style='padding: 4px;'>
                                        <a href='https://www.facebook.com/geotecniaURP/' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #1877F2; border-radius: 8px; padding: 8px 14px; color: #1877F2; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            📘 Facebook
                                        </a>
                                    </td>
                                    <td style='padding: 4px;'>
                                        <a href='https://www.instagram.com/_geourp_/' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #E4405F; border-radius: 8px; padding: 8px 14px; color: #E4405F; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            📸 Instagram
                                        </a>
                                    </td>
                                    <td style='padding: 4px;'>
                                        <a href='https://pe.linkedin.com/company/geo-urp' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #0A66C2; border-radius: 8px; padding: 8px 14px; color: #0A66C2; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            💼 LinkedIn
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- FOOTER COPYRIGHT -->
                    <tr>
                        <td style='background-color: #092618; padding: 22px 30px; text-align: center; color: #829E8C; font-size: 12px; line-height: 1.5;'>
                            &copy; 2026 <strong>GeoURP</strong> &bull; Grupo Estudiantil de Geotecnia.<br/>
                            Universidad Ricardo Palma &bull; Lima / Cusco, Perú.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        private string GetThankYouHtml(string userName)
        {
            return $@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Gracias por acompañarnos - GeoURP CONEIC 2026</title>
</head>
<body style='margin: 0; padding: 0; background-color: #F4F6F4; font-family: Arial, Helvetica, sans-serif;'>
    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #F4F6F4; padding: 40px 10px;'>
        <tr>
            <td align='center'>
                <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.08); border: 1px solid #E2E6E2;'>
                    
                    <!-- HERO HEADER MODERNO -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #093C23 0%, #0F5A36 60%, #177A4B 100%); padding: 40px 30px; text-align: center;'>
                            <div style='display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); padding: 5px 16px; border-radius: 20px; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 14px;'>
                                CULMINACIÓN CONEIC CUSCO 2026
                            </div>
                            <h1 style='color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; line-height: 1.25;'>
                                ¡Gracias por ser parte! 💚
                            </h1>
                            <p style='color: #BEE3CC; margin-top: 8px; margin-bottom: 0; font-size: 15px; font-weight: 500;'>
                                GeoURP &bull; Universidad Ricardo Palma
                            </p>
                        </td>
                    </tr>

                    <!-- CUERPO PRINCIPAL -->
                    <tr>
                        <td style='padding: 36px 32px; color: #111B15;'>
                            <h2 style='font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 16px; color: #0F5A36;'>
                                Estimado(a) {userName},
                            </h2>
                            <p style='font-size: 15px; line-height: 1.65; color: #3A443F; margin-bottom: 20px;'>
                                El <strong>Grupo Estudiantil de Geotecnia (GeoURP)</strong> de la Universidad Ricardo Palma te agradece por haber utilizado nuestra plataforma digital durante el <strong>CONEIC Cusco 2026</strong>.
                            </p>
                            <p style='font-size: 15px; line-height: 1.65; color: #3A443F; margin-bottom: 24px;'>
                                Esperamos que esta herramienta te haya sido de gran utilidad para organizar tu asistencia a ponencias y actividades.
                            </p>

                            <!-- TARJETA DESTACADA -->
                            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #F8FAF8; border-radius: 14px; padding: 22px; border-left: 4px solid #6F9F3A; border: 1.5px solid #E2E8E3; margin-bottom: 28px;'>
                                <tr>
                                    <td align='center'>
                                        <p style='margin: 0; font-size: 16px; color: #0F5A36; font-weight: 800; line-height: 1.4;'>
                                            ✨ ¡Fue un gusto acompañarte en la Ciudad Imperial del Cusco! ✨
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- REDES SOCIALES GEOURP -->
                    <tr>
                        <td style='background-color: #F8FAF8; padding: 28px 30px; border-top: 1px solid #E6E8E6; text-align: center;'>
                            <p style='margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0F5A36; text-transform: uppercase; letter-spacing: 0.8px;'>
                                Sigamos conectados en las redes de GeoURP
                            </p>
                            <table border='0' cellpadding='0' cellspacing='0' align='center' style='margin: 0 auto;'>
                                <tr>
                                    <td style='padding: 4px;'>
                                        <a href='https://geourp.org/' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #0F5A36; border-radius: 8px; padding: 8px 14px; color: #0F5A36; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            🌐 Web Oficial
                                        </a>
                                    </td>
                                    <td style='padding: 4px;'>
                                        <a href='https://www.facebook.com/geotecniaURP/' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #1877F2; border-radius: 8px; padding: 8px 14px; color: #1877F2; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            📘 Facebook
                                        </a>
                                    </td>
                                    <td style='padding: 4px;'>
                                        <a href='https://www.instagram.com/_geourp_/' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #E4405F; border-radius: 8px; padding: 8px 14px; color: #E4405F; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            📸 Instagram
                                        </a>
                                    </td>
                                    <td style='padding: 4px;'>
                                        <a href='https://pe.linkedin.com/company/geo-urp' target='_blank' style='display: inline-block; background-color: #ffffff; border: 1.5px solid #0A66C2; border-radius: 8px; padding: 8px 14px; color: #0A66C2; font-size: 12px; font-weight: 800; text-decoration: none;'>
                                            💼 LinkedIn
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- FOOTER COPYRIGHT -->
                    <tr>
                        <td style='background-color: #092618; padding: 22px 30px; text-align: center; color: #829E8C; font-size: 12px; line-height: 1.5;'>
                            &copy; 2026 <strong>GeoURP</strong> &bull; Grupo Estudiantil de Geotecnia.<br/>
                            Universidad Ricardo Palma &bull; Lima / Cusco, Perú.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}
