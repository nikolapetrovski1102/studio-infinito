using studio_infinito.DTOs.AppointmentsDTOs;

using studio_infinito.DTOs.AppointmentsDTOs;

namespace studio_infinito.Events.AppointmentCancellation
{
    public delegate void AppointmentCancellationEventHandler(object sender, AppointmentCancellationEventArgs e);

    public class AppointmentCancellationEventArgs : EventArgs
    {
        public AppointmentDto CancelAppointmentDto { get; set; }

        public AppointmentCancellationEventArgs(AppointmentDto cancelAppointmentDto)
        {
            CancelAppointmentDto = cancelAppointmentDto;
        }
    }

    public class AppointmentCancellationService
    {
        public event AppointmentCancellationEventHandler? AppointmentCancelled;

        public void CancelAppointment(AppointmentDto cancelAppointmentDto)
        {
            OnAppointmentCancelled(cancelAppointmentDto);
        }
        
        protected virtual void OnAppointmentCancelled(AppointmentDto cancelAppointmentDto)
        {
            AppointmentCancelled?.Invoke(this, new AppointmentCancellationEventArgs(cancelAppointmentDto));
        }
    }
}