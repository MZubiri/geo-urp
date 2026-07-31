using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using CONEIC.API.Models;

namespace CONEIC.API.Data
{
    public static class DbSeeder
    {
        public static void Seed(ConeicDbContext context)
        {
            context.Database.EnsureCreated();

            if (!context.Usuarios.Any())
            {
                var admin = new Usuario
                {
                    Nombre = "Administrador CONEIC",
                    Correo = "admin@coneic.org",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Rol = "ADMIN",
                    FechaRegistro = DateTime.UtcNow
                };

                var demoUser = new Usuario
                {
                    Nombre = "Usuario Demo",
                    Correo = "demo@coneic.org",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User123!"),
                    Rol = "USER",
                    FechaRegistro = DateTime.UtcNow
                };

                context.Usuarios.AddRange(admin, demoUser);
                context.SaveChanges();
            }

            if (!context.Apartados.Any())
            {
                var apartados = new List<Apartado>
                {
                    new Apartado { Id = 1, Nombre = "Concursos Académicos", Descripcion = "Competencias técnicas y académicas de la ingeniería civil", Orden = 1, Activo = true },
                    new Apartado { Id = 2, Nombre = "Visitas Turísticas", Descripcion = "Recorridos por atractivos culturales y turísticos de Cusco", Orden = 2, Activo = true },
                    new Apartado { Id = 3, Nombre = "Concursos Socioculturales", Descripcion = "Eventos artísticos, culturales y de confraternización", Orden = 3, Activo = true }
                };

                context.Apartados.AddRange(apartados);
                context.SaveChanges();

                var actividades = new List<Actividad>
                {
                    // --- APARTADO 1: ACADÉMICOS ---
                    new Actividad {
                        ApartadoId = 1, Nombre = "Amauta Calculista", Descripcion = "Desafío de cálculo diferencial e integral aplicado.",
                        HoraInicio = DateTime.Parse("2026-08-10 14:00:00"), HoraFin = DateTime.Parse("2026-08-10 19:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Laboratorio 1\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Saberes del Tawantinsuyo", Descripcion = "Trivia de historia de la ingeniería inca e ingeniería civil.",
                        HoraInicio = DateTime.Parse("2026-08-10 14:00:00"), HoraFin = DateTime.Parse("2026-08-10 19:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Auditorio B\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Cátedra Civil - Bloque I", Descripcion = "Exposición técnica preliminar.",
                        HoraInicio = DateTime.Parse("2026-08-11 07:00:00"), HoraFin = DateTime.Parse("2026-08-11 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque I\",\"modalidad\":\"Presencial\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Civil Taks - Bloque I", Descripcion = "Competencia de resolución de problemas estructurales.",
                        HoraInicio = DateTime.Parse("2026-08-11 07:00:00"), HoraFin = DateTime.Parse("2026-08-11 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque I\",\"modalidad\":\"Presencial\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Bim Experience - Fase I", Descripcion = "Modelado y coordinación BIM en tiempo real.",
                        HoraInicio = DateTime.Parse("2026-08-11 08:00:00"), HoraFin = DateTime.Parse("2026-08-11 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Fase I\",\"modalidad\":\"Virtual/Presencial\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Qhapaq Ñan Topográfico - Bloque I", Descripcion = "Levantamiento topográfico con estación total.",
                        HoraInicio = DateTime.Parse("2026-08-11 07:00:00"), HoraFin = DateTime.Parse("2026-08-11 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque I\",\"lugar\":\"Campo Universitario\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Qosqo Estructural Challenge - Bloque I", Descripcion = "Diseño de estructuras sismorresistentes.",
                        HoraInicio = DateTime.Parse("2026-08-11 07:00:00"), HoraFin = DateTime.Parse("2026-08-11 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque I\",\"lugar\":\"Laboratorio de Estructuras\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Rotura de esferas aligeradas", Descripcion = "Prueba de resistencia a compresión de mortero con agregados livianos.",
                        HoraInicio = DateTime.Parse("2026-08-11 07:00:00"), HoraFin = DateTime.Parse("2026-08-11 13:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"lugar\":\"Prensa Hidráulica Lab\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Cátedra Civil - Bloque II", Descripcion = "Segunda etapa de exposiciones técnicas.",
                        HoraInicio = DateTime.Parse("2026-08-11 14:00:00"), HoraFin = DateTime.Parse("2026-08-11 17:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Civil Taks - Bloque II", Descripcion = "Segunda ronda de resolución.",
                        HoraInicio = DateTime.Parse("2026-08-11 14:00:00"), HoraFin = DateTime.Parse("2026-08-11 17:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Bim Experience - Fase II", Descripcion = "Optimización y detección de interferencias BIM.",
                        HoraInicio = DateTime.Parse("2026-08-11 14:00:00"), HoraFin = DateTime.Parse("2026-08-11 20:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Fase II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Qhapaq Ñan Topográfico - Bloque II", Descripcion = "Procesamiento de datos topográficos.",
                        HoraInicio = DateTime.Parse("2026-08-11 14:00:00"), HoraFin = DateTime.Parse("2026-08-11 18:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Qosqo Estructural Challenge - Bloque II", Descripcion = "Ensayos dinámicos en mesa vibratoria.",
                        HoraInicio = DateTime.Parse("2026-08-11 14:00:00"), HoraFin = DateTime.Parse("2026-08-11 20:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Geomuros", Descripcion = "Diseño y construcción de muros de contención a escala.",
                        HoraInicio = DateTime.Parse("2026-08-12 07:00:00"), HoraFin = DateTime.Parse("2026-08-12 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"lugar\":\"Patio de Geotecnia\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Puentes incaicos de Spaghetti", Descripcion = "Prueba de carga puntual en estructuras de pasta.",
                        HoraInicio = DateTime.Parse("2026-08-12 07:00:00"), HoraFin = DateTime.Parse("2026-08-12 13:00:00"), UrpParticipa = true,
                        CamposExtra = "{\"lugar\":\"Auditorio Central\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Bim Experience - Fase III", Descripcion = "Presentación del modelo BIM ante el jurado.",
                        HoraInicio = DateTime.Parse("2026-08-12 08:00:00"), HoraFin = DateTime.Parse("2026-08-12 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Fase III\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Barcazas del Vilcanota", Descripcion = "Modelado y ensayo de flotabilidad e hidrodinámica.",
                        HoraInicio = DateTime.Parse("2026-08-12 07:00:00"), HoraFin = DateTime.Parse("2026-08-12 13:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"lugar\":\"Piscina / Tanque de Ensayos\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Khipu Saya (torres de madera) - Bloque I", Descripcion = "Montaje de estructuras verticales de madera.",
                        HoraInicio = DateTime.Parse("2026-08-13 07:00:00"), HoraFin = DateTime.Parse("2026-08-13 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque I\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Khipu Saya (torres de madera) - Bloque II", Descripcion = "Ensayo sísmico y rotura de torres.",
                        HoraInicio = DateTime.Parse("2026-08-13 14:00:00"), HoraFin = DateTime.Parse("2026-08-13 18:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Rotura de probetas 245 - Bloque I", Descripcion = "Ensayo a compresión axial de cilindros de concreto.",
                        HoraInicio = DateTime.Parse("2026-08-13 07:00:00"), HoraFin = DateTime.Parse("2026-08-13 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque I\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Rotura de probetas 245 - Bloque II", Descripcion = "Segunda tanda de ensayos de rotura.",
                        HoraInicio = DateTime.Parse("2026-08-13 13:00:00"), HoraFin = DateTime.Parse("2026-08-13 17:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Metrados - Bloque I", Descripcion = "Examen de cuantificación de materiales y presupuestos.",
                        HoraInicio = DateTime.Parse("2026-08-13 07:00:00"), HoraFin = DateTime.Parse("2026-08-13 12:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque I\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "Metrados - Bloque II", Descripcion = "Resolución de expedientes técnicos.",
                        HoraInicio = DateTime.Parse("2026-08-13 13:00:00"), HoraFin = DateTime.Parse("2026-08-13 19:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"fase_bloque\":\"Bloque II\"}"
                    },
                    new Actividad {
                        ApartadoId = 1, Nombre = "FINAL Concursos Académicos", Descripcion = "Evaluación final y desempate en vivo.",
                        HoraInicio = DateTime.Parse("2026-08-14 07:00:00"), HoraFin = DateTime.Parse("2026-08-14 10:00:00"), UrpParticipa = true,
                        CamposExtra = "{\"lugar\":\"Coliseo Universitario\",\"notas\":\"En caso surja algún empate en cualquiera de los concursos, se definirá al ganador en esta etapa\"}"
                    },

                    // --- APARTADO 2: TURÍSTICAS ---
                    new Actividad {
                        ApartadoId = 2, Nombre = "Machu Picchu - Full Day (Delegados)", Descripcion = "Visita guiada a la Ciudadela Inca de Machu Picchu.",
                        HoraInicio = DateTime.Parse("2026-08-09 06:00:00"), HoraFin = DateTime.Parse("2026-08-09 20:00:00"), UrpParticipa = true,
                        CamposExtra = "{\"etapa\":\"Etapa Delegados\",\"punto_encuentro\":\"Plaza Regocijo\",\"recomendaciones\":\"Llevar DNI/Pasaporte, bloqueador y zapatillas de trekking\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "Moray - Salineras de Maras (Grupo I)", Descripcion = "Recorrido por los andenes circulares y pozas de sal.",
                        HoraInicio = DateTime.Parse("2026-08-11 08:00:00"), HoraFin = DateTime.Parse("2026-08-11 15:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Primera Etapa\",\"grupo\":\"Grupo I\",\"punto_encuentro\":\"Puerta Principal URP\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "Tour Valle Sur Tipon Andahuaylillas (Grupo I)", Descripcion = "Visita al complejo hidráulico inca de Tipón.",
                        HoraInicio = DateTime.Parse("2026-08-11 08:00:00"), HoraFin = DateTime.Parse("2026-08-11 15:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Segunda Etapa\",\"grupo\":\"Grupo I\",\"punto_encuentro\":\"Puerta Principal URP\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "City Tours Cusco (Grupo I)", Descripcion = "Recorrido por Sacsayhuamán, Qenqo, Puka Pukara y Tambomachay.",
                        HoraInicio = DateTime.Parse("2026-08-11 08:00:00"), HoraFin = DateTime.Parse("2026-08-11 13:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Tercera Etapa\",\"grupo\":\"Grupo I\",\"punto_encuentro\":\"Plaza de Armas\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "Moray - Salineras de Maras (Grupo II)", Descripcion = "Recorrido por los andenes circulares y pozas de sal.",
                        HoraInicio = DateTime.Parse("2026-08-12 08:00:00"), HoraFin = DateTime.Parse("2026-08-12 15:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Primera Etapa\",\"grupo\":\"Grupo II\",\"punto_encuentro\":\"Puerta Principal URP\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "Tour Valle Sur Tipon Andahuaylillas (Grupo II)", Descripcion = "Visita al complejo hidráulico inca de Tipón.",
                        HoraInicio = DateTime.Parse("2026-08-12 08:00:00"), HoraFin = DateTime.Parse("2026-08-12 15:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Segunda Etapa\",\"grupo\":\"Grupo II\",\"punto_encuentro\":\"Puerta Principal URP\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "City Tours Cusco (Grupo II)", Descripcion = "Recorrido histórico por la ciudad imperial.",
                        HoraInicio = DateTime.Parse("2026-08-12 08:00:00"), HoraFin = DateTime.Parse("2026-08-12 13:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Tercera Etapa\",\"grupo\":\"Grupo II\",\"punto_encuentro\":\"Plaza de Armas\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "Moray - Salineras de Maras (Grupo III)", Descripcion = "Recorrido guiado.",
                        HoraInicio = DateTime.Parse("2026-08-13 08:00:00"), HoraFin = DateTime.Parse("2026-08-13 15:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Primera Etapa\",\"grupo\":\"Grupo III\",\"punto_encuentro\":\"Puerta Principal URP\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "Tour Valle Sur Tipon Andahuaylillas (Grupo III)", Descripcion = "Circuito arqueológico y cultural.",
                        HoraInicio = DateTime.Parse("2026-08-13 08:00:00"), HoraFin = DateTime.Parse("2026-08-13 15:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Segunda Etapa\",\"grupo\":\"Grupo III\",\"punto_encuentro\":\"Puerta Principal URP\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "City Tours Cusco (Grupo III)", Descripcion = "Visita a templos e infraestructura inca.",
                        HoraInicio = DateTime.Parse("2026-08-13 08:00:00"), HoraFin = DateTime.Parse("2026-08-13 13:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Tercera Etapa\",\"grupo\":\"Grupo III\",\"punto_encuentro\":\"Plaza de Armas\"}"
                    },
                    new Actividad {
                        ApartadoId = 2, Nombre = "Machu Picchu - Full Day (Preventa)", Descripcion = "Excursión a la Maravilla del Mundo.",
                        HoraInicio = DateTime.Parse("2026-08-13 06:00:00"), HoraFin = DateTime.Parse("2026-08-13 20:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"etapa\":\"Etapa Preventa\",\"punto_encuentro\":\"Plaza Regocijo\"}"
                    },

                    // --- APARTADO 3: SOCIOCULTURALES ---
                    new Actividad {
                        ApartadoId = 3, Nombre = "Pasacalle Inaugural CONEIC", Descripcion = "Gran desfile de delegaciones por el centro histórico.",
                        HoraInicio = DateTime.Parse("2026-08-10 10:00:00"), HoraFin = DateTime.Parse("2026-08-10 13:30:00"), UrpParticipa = true,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Plaza de Armas Cusco\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Diseña tu traje", Descripcion = "Concurso de diseño de trajes reciclados con temática de ingeniería.",
                        HoraInicio = DateTime.Parse("2026-08-10 19:00:00"), HoraFin = DateTime.Parse("2026-08-10 21:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Coliseo Universitario\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Miss y Mister CONEIC 2026", Descripcion = "Certamen de simpatía, talento e identidad de la delegación.",
                        HoraInicio = DateTime.Parse("2026-08-10 21:00:00"), HoraFin = DateTime.Parse("2026-08-10 23:00:00"), UrpParticipa = true,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Coliseo Universitario\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Concurso Minecraft", Descripcion = "Reconstrucción de maravillas arquitectónicas incas en Minecraft.",
                        HoraInicio = DateTime.Parse("2026-08-11 10:00:00"), HoraFin = DateTime.Parse("2026-08-11 13:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Virtual\",\"plataforma\":\"Servidor Oficial CONEIC Discord/Minecraft\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Concurso de Danza Folclórica", Descripcion = "Presentaciones de bailes típicos del Perú por delegaciones.",
                        HoraInicio = DateTime.Parse("2026-08-11 15:30:00"), HoraFin = DateTime.Parse("2026-08-11 20:30:00"), UrpParticipa = true,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Teatro Municipal del Cusco\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Agilidad Mental", Descripcion = "Juegos de ajedrez rápido, rubik y trivias de cultura general.",
                        HoraInicio = DateTime.Parse("2026-08-12 11:00:00"), HoraFin = DateTime.Parse("2026-08-12 13:30:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Pabellón A\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Gymkana / Warachicuy", Descripcion = "Juegos tradicionales de destreza física y trabajo en equipo.",
                        HoraInicio = DateTime.Parse("2026-08-12 14:30:00"), HoraFin = DateTime.Parse("2026-08-12 17:30:00"), UrpParticipa = true,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Campo Deportivo URP\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Esta Noche Soy", Descripcion = "Concurso de imitación y talento de canto.",
                        HoraInicio = DateTime.Parse("2026-08-12 18:30:00"), HoraFin = DateTime.Parse("2026-08-12 22:30:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Escenario Principal\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Construye tu huatia", Descripcion = "Concurso gastronómico tradicional andino.",
                        HoraInicio = DateTime.Parse("2026-08-13 10:00:00"), HoraFin = DateTime.Parse("2026-08-13 13:30:00"), UrpParticipa = true,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Zona de Campo\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Físico culturismo", Descripcion = "Exhibición y juzgamiento de atletismo y fisicoculturismo.",
                        HoraInicio = DateTime.Parse("2026-08-13 17:30:00"), HoraFin = DateTime.Parse("2026-08-13 19:30:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Gimnasio Universitario\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Juegos florales (Relatos Andinos)", Descripcion = "Concurso de poesía, declamación y narrativa.",
                        HoraInicio = DateTime.Parse("2026-08-13 19:30:00"), HoraFin = DateTime.Parse("2026-08-13 21:30:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Auditorio de Humanidades\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Tik Tok / Fotografía", Descripcion = "Premiación del contenido multimedia con mayor interacción del evento.",
                        HoraInicio = DateTime.Parse("2026-08-13 21:30:00"), HoraFin = DateTime.Parse("2026-08-13 23:00:00"), UrpParticipa = false,
                        CamposExtra = "{\"modalidad\":\"Híbrida\",\"plataforma\":\"TikTok & Instagram\"}"
                    },
                    new Actividad {
                        ApartadoId = 3, Nombre = "Concurso de bandas / Mascotas", Descripcion = "Presentación de bandas musicales interuniversitarias y desfile de mascotas de delegaciones.",
                        HoraInicio = DateTime.Parse("2026-08-14 11:00:00"), HoraFin = DateTime.Parse("2026-08-14 13:30:00"), UrpParticipa = true,
                        CamposExtra = "{\"modalidad\":\"Presencial\",\"lugar\":\"Escenario Principal de Cierre\"}"
                    }
                };

                context.Actividades.AddRange(actividades);
                context.SaveChanges();
            }
        }
    }
}
