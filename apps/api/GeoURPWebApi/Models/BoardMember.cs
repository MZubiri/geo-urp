namespace GeoURPWebApi.Models
{
    public sealed class BoardMember
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Birthday { get; set; }
        public string PhotoUrl { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
