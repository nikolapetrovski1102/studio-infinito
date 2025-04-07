using studio_infinito.DTOs.AppointmentsDTOs;

using studio_infinito.DTOs.AppointmentsDTOs;

namespace studio_infinito.Events.AppointmentReminder
{
    public delegate void AppointmentReminderEventHandler(object sender, AppointmentReminderEventArgs e);

    public class AppointmentReminderEventArgs : EventArgs
    {
        public List<AppointmentDto> AppointmentDetails { get; set; }

        public AppointmentReminderEventArgs(List<AppointmentDto> appointmentDetails)
        {
            AppointmentDetails = appointmentDetails;
        }
    }

    public class AppointmentReminderService
    {
        public event AppointmentReminderEventHandler AppointmentReminder;

        public void RemindAppointments(List<AppointmentDto> appointmentDetails)
        {
            OnAppointmentReminder(appointmentDetails);
        }
        
        protected virtual void OnAppointmentReminder(List<AppointmentDto> appointmentDetails)
        {
            AppointmentReminder?.Invoke(this, new AppointmentReminderEventArgs(appointmentDetails));
        }
    }
}