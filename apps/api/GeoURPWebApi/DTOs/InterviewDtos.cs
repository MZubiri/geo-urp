namespace GeoURPWebApi.DTOs
{
    public sealed class CreateInterviewSlotRequest
    {
        public string Date { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public int Capacity { get; set; }
    }

    public sealed class InterviewSlotResponse
    {
        public int Id { get; set; }
        public string Date { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int BookedCount { get; set; }
        public bool Available { get; set; }
    }

    public sealed class CreateInterviewAppointmentRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string Cycle { get; set; } = string.Empty;
        public int SlotId { get; set; }
    }

    public sealed class InterviewAppointmentResponse
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string Cycle { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int SlotId { get; set; }
        public string SlotDate { get; set; } = string.Empty;
        public string SlotStartTime { get; set; } = string.Empty;
        public string SlotEndTime { get; set; } = string.Empty;
    }
}
