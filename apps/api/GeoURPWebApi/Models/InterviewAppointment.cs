namespace GeoURPWebApi.Models
{
    public sealed class InterviewAppointment
    {
        public int Id { get; set; }
        public int SlotId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string Cycle { get; set; } = string.Empty;
        public string Status { get; set; } = "Registrada";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public InterviewSlot Slot { get; set; } = null!;
    }
}
