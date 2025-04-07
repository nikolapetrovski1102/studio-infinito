namespace studio_infinito.DTOs.AppointmentsDTOs
{
    public class CancelAppointmentDTO
    {
        public int appointment_id { get; set; }
        public int cancelled_from { get; set; }
        public string? email_to { get; set; }
        public string? firebase_token_to { get; set; }
    }
}