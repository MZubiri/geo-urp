using GeoUrp.Api.Models;

namespace GeoUrp.Api.Data;

public sealed class InMemoryStore
{
    public List<User> Users { get; } =
    [
        new User
        {
            Id = 1,
            Name = "Administrador",
            Email = "admin@geourp.local",
            Password = "Admin123*",
            Roles = ["Admin"]
        },
        new User
        {
            Id = 2,
            Name = "Editor",
            Email = "editor@geourp.local",
            Password = "Editor123*",
            Roles = ["Editor"]
        }
    ];

    public List<BoardMember> BoardMembers { get; } =
    [
        new BoardMember
        {
            Id = 1,
            FullName = "Dra. Carmen Ruiz",
            Position = "Presidenta",
            PhotoUrl = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
            Bio = "Especialista en gestión universitaria.",
            SortOrder = 1,
            IsActive = true
        },
        new BoardMember
        {
            Id = 2,
            FullName = "Mg. Luis Herrera",
            Position = "Secretario",
            PhotoUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
            Bio = "Coordinador académico y de calidad.",
            SortOrder = 2,
            IsActive = true
        }
    ];

    public List<Event> Events { get; } =
    [
        new Event
        {
            Id = 1,
            Title = "Seminario de investigación",
            Description = "Presentación de avances de tesis",
            StartAt = DateTime.UtcNow.AddDays(5),
            EndAt = DateTime.UtcNow.AddDays(5).AddHours(2),
            Location = "Auditorio Principal",
            IsPublic = true
        }
    ];

    public List<ContactMessage> ContactMessages { get; } = [];
}
