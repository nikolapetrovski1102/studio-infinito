using System.Data.Common;
using Quartz;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using studio_infinito.Data;
using studio_infinito.DTOs.AppointmentsDTOs;
using studio_infinito.Events.AppointmentReminder;
using studio_infinito.Events.Appointments;
using studio_infinito.DTOs.AppointmentsDTOs;
using studio_infinito.DTOs.EventDTOs;
using studio_infinito.DTOs.ServiceDTOs;

public class ScheduledJob : IJob
{
    private readonly ILogger<ScheduledJob> _logger;
    private readonly DbContext _context;
    private readonly AppointmentReminderService _appointmentReminderService;

    public ScheduledJob(ILogger<ScheduledJob> logger, DbContext context, AppointmentReminderService appointmentReminderService)
    {
        _logger = logger;
        _context = context;
        _appointmentReminderService = appointmentReminderService;
    }

    public AppointmentDto MapToAppointmentDto(Dictionary<string, object> row)
    {
        return new AppointmentDto
        {
            Event = new EventDto
            {
                Date = Convert.ToDateTime(row["appointment_date"]).ToString("yyyy-MM-dd"),
                Time = row["appointment_time"].ToString(),
                Title = row["status"].ToString()
            },
            AppointmentData = new AppointmentDataDto
            {
                Hairstylist = new HairstylistDto
                {
                    hairstylist_id = Convert.ToInt32(row["hairstylist_id"]),
                    Hairstylist = row.ContainsKey("full_name") ? row["full_name"].ToString() : "N/A"
                },
                ServiceType = new ServiceTypeDto
                {
                    service_id = Convert.ToInt32(row["service_id"]),
                    Key = Convert.ToInt32(row["service_id"]), // you can update this if needed
                    Name = "Haircut",      // Placeholder: replace with actual if available
                    Description = "Hair service", // Placeholder
                    Price = 0m,            // Placeholder: update if your query includes it
                    Duration = 0           // Placeholder
                }
            },
            user_id = Convert.ToInt32(row["user_id"]),
            UserEmail = row["email"].ToString(),
            UserPhone = row["phone"].ToString(),
            UserName = row["full_name"].ToString(),
            firebaseToken = row["firebase_token"].ToString()
        };
    }
    
    public async Task Execute(IJobExecutionContext context)
    {
        _logger.LogInformation("Scheduled job running at: {time}", DateTimeOffset.Now);

        var queryResults = await _context.ExecuteSqlQuery(
            "SELECT * FROM appointments AS a " +
            "LEFT JOIN users AS u ON u.user_id = a.user_id " +
            "WHERE a.status = 'confirmed' " +
            "AND DATE(a.appointment_date) = DATE(CURRENT_DATE + INTERVAL 1 DAY);");

        if (queryResults != null && queryResults.Count > 0)
        {
            List<AppointmentDto> appointments = new();

            foreach (var row in queryResults)
            {
                var dto = MapToAppointmentDto(row);
                appointments.Add(dto);
            }

            _appointmentReminderService.RemindAppointments(appointments);
        }

        await Task.CompletedTask;
    }

}