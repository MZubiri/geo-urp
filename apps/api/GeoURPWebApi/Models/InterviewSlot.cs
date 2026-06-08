namespace GeoURPWebApi.Models
{
    public sealed class InterviewSlot
    {
        public int Id { get; set; }
        public DateOnly Date { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public int Capacity { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<InterviewAppointment> Appointments { get; set; } = [];
    }
}
