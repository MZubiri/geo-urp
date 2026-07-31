-- Script de creación de base de datos e inserción inicial de datos CONEIC (UTF-8)
CREATE DATABASE IF NOT EXISTS coneic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coneic_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Estructura de Tablas
DROP TABLE IF EXISTS agenda_usuario;
DROP TABLE IF EXISTS actividades;
DROP TABLE IF EXISTS apartados;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'USER') DEFAULT 'USER',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE apartados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE actividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartado_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    hora_inicio DATETIME NOT NULL,
    hora_fin DATETIME NOT NULL,
    urp_participa BOOLEAN DEFAULT FALSE,
    campos_extra JSON NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartado_id) REFERENCES apartados(id) ON DELETE CASCADE,
    INDEX idx_apartado_fechas (apartado_id, hora_inicio, hora_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agenda_usuario (
    usuario_id INT NOT NULL,
    actividad_id INT NOT NULL,
    fecha_guardado DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, actividad_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Inserción de Usuarios Iniciales
INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
('Administrador CONEIC', 'admin@coneic.org', '$2b$12$fraWNEDxR7480zGiaSITnusdT8ROFYmkeyN0SPeDJcEHtOp9D9c8i', 'ADMIN'),
('Usuario Demo', 'demo@coneic.org', '$2b$12$ejiWSJACo5qgCtOJK7aLUe2J4V0mNO0BPrRm13dV59ESn7coC1VWW', 'USER');

-- 3. Inserción de Apartados
INSERT INTO apartados (id, nombre, descripcion, orden) VALUES
(1, 'Concursos Académicos', 'Competencias técnicas y académicas de la ingeniería civil', 1),
(2, 'Visitas Turísticas', 'Recorridos por atractivos culturales y turísticos de Cusco', 2),
(3, 'Concursos Socioculturales', 'Eventos artísticos, culturales y de confraternización', 3);

-- 4. Inserción de Actividades (Semana CONEIC Cusco 2026: 09 al 14 de Agosto)

-- --- APARTADO 1: CONCURSOS ACADÉMICOS ---
INSERT INTO actividades (apartado_id, nombre, descripcion, hora_inicio, hora_fin, urp_participa, campos_extra) VALUES
(1, 'Amauta Calculista', 'Desafío de cálculo diferencial e integral aplicado a problemas estructurales.', '2026-08-10 14:00:00', '2026-08-10 19:00:00', FALSE, '{"modalidad": "Presencial", "lugar": "Laboratorio 1"}'),
(1, 'Saberes del Tawantinsuyo', 'Trivia de historia de la ingeniería inca e ingeniería civil ancestral.', '2026-08-10 14:00:00', '2026-08-10 19:00:00', FALSE, '{"modalidad": "Presencial", "lugar": "Auditorio B"}'),
(1, 'Cátedra Civil - Bloque I', 'Exposición técnica preliminar de proyectos universitarios.', '2026-08-11 07:00:00', '2026-08-11 12:00:00', FALSE, '{"fase_bloque": "Bloque I", "modalidad": "Presencial"}'),
(1, 'Civil Taks - Bloque I', 'Competencia de resolución de problemas estructurales y geotécnicos.', '2026-08-11 07:00:00', '2026-08-11 12:00:00', FALSE, '{"fase_bloque": "Bloque I", "modalidad": "Presencial"}'),
(1, 'Bim Experience - Fase I', 'Modelado y coordinación BIM en tiempo real.', '2026-08-11 08:00:00', '2026-08-11 12:00:00', FALSE, '{"fase_bloque": "Fase I", "modalidad": "Virtual/Presencial"}'),
(1, 'Qhapaq Ñan Topográfico - Bloque I', 'Levantamiento topográfico con estación total y dron.', '2026-08-11 07:00:00', '2026-08-11 12:00:00', FALSE, '{"fase_bloque": "Bloque I", "lugar": "Campo Universitario"}'),
(1, 'Qosqo Estructural Challenge - Bloque I', 'Diseño de estructuras sismorresistentes.', '2026-08-11 07:00:00', '2026-08-11 12:00:00', FALSE, '{"fase_bloque": "Bloque I", "lugar": "Laboratorio de Estructuras"}'),
(1, 'Rotura de esferas aligeradas', 'Prueba de resistencia a compresión de mortero con agregados livianos.', '2026-08-11 07:00:00', '2026-08-11 13:00:00', FALSE, '{"lugar": "Prensa Hidráulica Lab"}'),
(1, 'Cátedra Civil - Bloque II', 'Segunda etapa de exposiciones técnicas.', '2026-08-11 14:00:00', '2026-08-11 17:00:00', FALSE, '{"fase_bloque": "Bloque II"}'),
(1, 'Civil Taks - Bloque II', 'Segunda ronda de resolución.', '2026-08-11 14:00:00', '2026-08-11 17:00:00', FALSE, '{"fase_bloque": "Bloque II"}'),
(1, 'Bim Experience - Fase II', 'Optimización y detección de interferencias BIM.', '2026-08-11 14:00:00', '2026-08-11 20:00:00', FALSE, '{"fase_bloque": "Fase II"}'),
(1, 'Qhapaq Ñan Topográfico - Bloque II', 'Procesamiento de datos topográficos.', '2026-08-11 14:00:00', '2026-08-11 18:00:00', FALSE, '{"fase_bloque": "Bloque II"}'),
(1, 'Qosqo Estructural Challenge - Bloque II', 'Ensayos dinámicos en mesa vibratoria.', '2026-08-11 14:00:00', '2026-08-11 20:00:00', FALSE, '{"fase_bloque": "Bloque II"}'),
(1, 'Geomuros', 'Diseño y construcción de muros de contención a escala.', '2026-08-12 07:00:00', '2026-08-12 12:00:00', FALSE, '{"lugar": "Patio de Geotecnia"}'),
(1, 'Puentes incaicos de Spaghetti', 'Prueba de carga puntual en estructuras de pasta.', '2026-08-12 07:00:00', '2026-08-12 13:00:00', TRUE, '{"lugar": "Auditorio Central"}'),
(1, 'Bim Experience - Fase III', 'Presentación del modelo BIM ante el jurado.', '2026-08-12 08:00:00', '2026-08-12 12:00:00', FALSE, '{"fase_bloque": "Fase III"}'),
(1, 'Barcazas del Vilcanota', 'Modelado y ensayo de flotabilidad e hidrodinámica.', '2026-08-12 07:00:00', '2026-08-12 13:00:00', FALSE, '{"lugar": "Piscina / Tanque de Ensayos"}'),
(1, 'Khipu Saya (torres de madera) - Bloque I', 'Montaje de estructuras verticales de madera.', '2026-08-13 07:00:00', '2026-08-13 12:00:00', FALSE, '{"fase_bloque": "Bloque I"}'),
(1, 'Khipu Saya (torres de madera) - Bloque II', 'Ensayo sísmico y rotura de torres.', '2026-08-13 14:00:00', '2026-08-13 18:00:00', FALSE, '{"fase_bloque": "Bloque II"}'),
(1, 'Rotura de probetas 245 - Bloque I', 'Ensayo a compresión axial de cilindros de concreto.', '2026-08-13 07:00:00', '2026-08-13 12:00:00', FALSE, '{"fase_bloque": "Bloque I"}'),
(1, 'Rotura de probetas 245 - Bloque II', 'Segunda tanda de ensayos de rotura.', '2026-08-13 13:00:00', '2026-08-13 17:00:00', FALSE, '{"fase_bloque": "Bloque II"}'),
(1, 'Metrados - Bloque I', 'Examen de cuantificación de materiales y presupuestos.', '2026-08-13 07:00:00', '2026-08-13 12:00:00', FALSE, '{"fase_bloque": "Bloque I"}'),
(1, 'Metrados - Bloque II', 'Resolución de expedientes técnicos.', '2026-08-13 13:00:00', '2026-08-13 19:00:00', FALSE, '{"fase_bloque": "Bloque II"}'),
(1, 'FINAL Concursos Académicos', 'Evaluación final y desempate en vivo.', '2026-08-14 07:00:00', '2026-08-14 10:00:00', TRUE, '{"lugar": "Coliseo Universitario", "notas": "En caso surja algún empate en cualquiera de los concursos, se definirá al ganador en esta etapa"}');

-- --- APARTADO 2: VISITAS TURÍSTICAS ---
INSERT INTO actividades (apartado_id, nombre, descripcion, hora_inicio, hora_fin, urp_participa, campos_extra) VALUES
(2, 'Machu Picchu - Full Day (Delegados)', 'Visita guiada a la Ciudadela Inca de Machu Picchu.', '2026-08-09 06:00:00', '2026-08-09 20:00:00', TRUE, '{"etapa": "Etapa Delegados", "punto_encuentro": "Plaza Regocijo", "recomendaciones": "Llevar DNI/Pasaporte, bloqueador y zapatillas de trekking"}'),
(2, 'Moray - Salineras de Maras (Grupo I)', 'Recorrido por los andenes circulares y pozas de sal.', '2026-08-11 08:00:00', '2026-08-11 15:00:00', FALSE, '{"etapa": "Primera Etapa", "grupo": "Grupo I", "punto_encuentro": "Puerta Principal URP"}'),
(2, 'Tour Valle Sur Tipon Andahuaylillas (Grupo I)', 'Visita al complejo hidráulico inca de Tipón y capilla Sixtina de América.', '2026-08-11 08:00:00', '2026-08-11 15:00:00', FALSE, '{"etapa": "Segunda Etapa", "grupo": "Grupo I", "punto_encuentro": "Puerta Principal URP"}'),
(2, 'City Tours Cusco (Grupo I)', 'Recorrido por Sacsayhuamán, Qenqo, Puka Pukara y Tambomachay.', '2026-08-11 08:00:00', '2026-08-11 13:00:00', FALSE, '{"etapa": "Tercera Etapa", "grupo": "Grupo I", "punto_encuentro": "Plaza de Armas"}'),
(2, 'Moray - Salineras de Maras (Grupo II)', 'Recorrido por los andenes circulares y pozas de sal.', '2026-08-12 08:00:00', '2026-08-12 15:00:00', FALSE, '{"etapa": "Primera Etapa", "grupo": "Grupo II", "punto_encuentro": "Puerta Principal URP"}'),
(2, 'Tour Valle Sur Tipon Andahuaylillas (Grupo II)', 'Visita al complejo hidráulico inca de Tipón.', '2026-08-12 08:00:00', '2026-08-12 15:00:00', FALSE, '{"etapa": "Segunda Etapa", "grupo": "Grupo II", "punto_encuentro": "Puerta Principal URP"}'),
(2, 'City Tours Cusco (Grupo II)', 'Recorrido histórico por la ciudad imperial.', '2026-08-12 08:00:00', '2026-08-12 13:00:00', FALSE, '{"etapa": "Tercera Etapa", "grupo": "Grupo II", "punto_encuentro": "Plaza de Armas"}'),
(2, 'Moray - Salineras de Maras (Grupo III)', 'Recorrido guiado.', '2026-08-13 08:00:00', '2026-08-13 15:00:00', FALSE, '{"etapa": "Primera Etapa", "grupo": "Grupo III", "punto_encuentro": "Puerta Principal URP"}'),
(2, 'Tour Valle Sur Tipon Andahuaylillas (Grupo III)', 'Circuito arqueológico y cultural.', '2026-08-13 08:00:00', '2026-08-13 15:00:00', FALSE, '{"etapa": "Segunda Etapa", "grupo": "Grupo III", "punto_encuentro": "Puerta Principal URP"}'),
(2, 'City Tours Cusco (Grupo III)', 'Visita a templos e infraestructura inca.', '2026-08-13 08:00:00', '2026-08-13 13:00:00', FALSE, '{"etapa": "Tercera Etapa", "grupo": "Grupo III", "punto_encuentro": "Plaza de Armas"}'),
(2, 'Machu Picchu - Full Day (Preventa)', 'Excursión a la Maravilla del Mundo.', '2026-08-13 06:00:00', '2026-08-13 20:00:00', FALSE, '{"etapa": "Etapa Preventa", "punto_encuentro": "Plaza Regocijo"}');

-- --- APARTADO 3: SOCIOCULTURALES ---
INSERT INTO actividades (apartado_id, nombre, descripcion, hora_inicio, hora_fin, urp_participa, campos_extra) VALUES
(3, 'Pasacalle Inaugural CONEIC', 'Gran desfile de delegaciones por el centro histórico.', '2026-08-10 10:00:00', '2026-08-10 13:30:00', TRUE, '{"modalidad": "Presencial", "lugar": "Plaza de Armas Cusco"}'),
(3, 'Diseña tu traje', 'Concurso de diseño de trajes reciclados con temática de ingeniería.', '2026-08-10 19:00:00', '2026-08-10 21:00:00', FALSE, '{"modalidad": "Presencial", "lugar": "Coliseo Universitario"}'),
(3, 'Miss y Mister CONEIC 2026', 'Certamen de simpatía, talento e identidad de la delegación.', '2026-08-10 21:00:00', '2026-08-10 23:00:00', TRUE, '{"modalidad": "Presencial", "lugar": "Coliseo Universitario"}'),
(3, 'Concurso Minecraft', 'Reconstrucción de maravillas arquitectónicas incas en Minecraft.', '2026-08-11 10:00:00', '2026-08-11 13:00:00', FALSE, '{"modalidad": "Virtual", "plataforma": "Servidor Oficial CONEIC Discord/Minecraft"}'),
(3, 'Concurso de Danza Folclórica', 'Presentaciones de bailes típicos del Perú por delegaciones.', '2026-08-11 15:30:00', '2026-08-11 20:30:00', TRUE, '{"modalidad": "Presencial", "lugar": "Teatro Municipal del Cusco"}'),
(3, 'Agilidad Mental', 'Juegos de ajedrez rápido, rubik y trivias de cultura general.', '2026-08-12 11:00:00', '2026-08-12 13:30:00', FALSE, '{"modalidad": "Presencial", "lugar": "Pabellón A"}'),
(3, 'Gymkana / Warachicuy', 'Juegos tradicionales de destreza física y trabajo en equipo.', '2026-08-12 14:30:00', '2026-08-12 17:30:00', TRUE, '{"modalidad": "Presencial", "lugar": "Campo Deportivo URP"}'),
(3, 'Esta Noche Soy', 'Concurso de imitación y talento de canto.', '2026-08-12 18:30:00', '2026-08-12 22:30:00', FALSE, '{"modalidad": "Presencial", "lugar": "Escenario Principal"}'),
(3, 'Construye tu huatia', 'Concurso gastronómico tradicional andino.', '2026-08-13 10:00:00', '2026-08-13 13:30:00', TRUE, '{"modalidad": "Presencial", "lugar": "Zona de Campo"}'),
(3, 'Físico culturismo', 'Exhibición y juzgamiento de atletismo y fisicoculturismo.', '2026-08-13 17:30:00', '2026-08-13 19:30:00', FALSE, '{"modalidad": "Presencial", "lugar": "Gimnasio Universitario"}'),
(3, 'Juegos florales (Relatos Andinos)', 'Concurso de poesía, declamación y narrativa.', '2026-08-13 19:30:00', '2026-08-13 21:30:00', FALSE, '{"modalidad": "Presencial", "lugar": "Auditorio de Humanidades"}'),
(3, 'Tik Tok / Fotografía', 'Premiación del contenido multimedia con mayor interacción del evento.', '2026-08-13 21:30:00', '2026-08-13 23:00:00', FALSE, '{"modalidad": "Híbrida", "plataforma": "TikTok & Instagram"}'),
(3, 'Concurso de bandas / Mascotas', 'Presentación de bandas musicales interuniversitarias y desfile de mascotas de delegaciones.', '2026-08-14 11:00:00', '2026-08-14 13:30:00', TRUE, '{"modalidad": "Presencial", "lugar": "Escenario Principal de Cierre"}');
