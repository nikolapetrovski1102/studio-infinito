using studio_infinito.DTOs.AppointmentsDTOs;
using studio_infinito.DTOs.ServiceDTOs;

namespace studio_infinito.Services
{
    public interface IAppointmentsService
    {
        Task<List<Dictionary<string, object>>> GetAllServices();
        Task<bool> InsertAppointment(AppointmentDto appointmentDto);
        Task<List<Dictionary<string, object>>> UserAppointments(int id);
        Task<List<Dictionary<string, object>>> FastBooking(FastBookingDto fastBookingDto);
        Task<Dictionary<string, string>> CancelAppointmentAsync (CancelAppointmentDTO cancelAppointmentDto);
        Task<List<Dictionary<string, object>>> GetAdminAppointments(string filter, string startDate, string endDate);
    }
}
