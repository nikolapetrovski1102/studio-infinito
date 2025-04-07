using MySql.Data.MySqlClient;
using studio_infinito.Data;
using studio_infinito.DTOs.AppointmentsDTOs;
using studio_infinito.DTOs.ServiceDTOs;
using studio_infinito.Events.Appointments;

using System.Globalization;
using System.Text;
using studio_infinito.DTOs.EventDTOs;
using studio_infinito.Events.AppointmentCancellation;

namespace studio_infinito.Services.Implementation
{
    public class AppointmentsService : IAppointmentsService
    {
        DbContext _context;
        private readonly AppointmentService _appointmentService;
        private readonly AppointmentCancellationService _appointmentCancellationService;

        public AppointmentsService(DbContext context, AppointmentService appointmentService, AppointmentCancellationService appointmentCancellationService)
        {
            _context = context;
            _appointmentService = appointmentService;
            _appointmentCancellationService = appointmentCancellationService;
        }

        public async Task<List<Dictionary<string, object>>> GetAllServices()
        {
            try
            {
                return await _context.ExecuteSqlQuery("SELECT * FROM services");
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public async Task<bool> InsertAppointment(AppointmentDto appointmentDto)
        {
            try
            {
                DateTime appointmentDate = DateTime.ParseExact(appointmentDto.Event.Date, "dd-MM-yyyy", CultureInfo.InvariantCulture);
                TimeSpan appointmentTime = TimeSpan.Parse(appointmentDto.Event.Time);

                using (var transaction = await _context.BeginTransactionAsync()) // Manual transaction
                {
                    try
                    {
                        // Lock the appointment time slot
                        string lockQuery = "SELECT * FROM appointments WHERE appointment_date = @AppointmentDate AND appointment_time = @AppointmentTime AND hairstylist_id = @HairstylistId AND status NOT IN ('cancelled', 'pending') FOR UPDATE;";

                        var checkParameters = new MySqlParameter[]
                        {
                            new MySqlParameter("@AppointmentDate", MySqlDbType.DateTime) { Value = appointmentDate },
                            new MySqlParameter("@AppointmentTime", MySqlDbType.Time) { Value = appointmentTime },
                            new MySqlParameter("@HairstylistId", MySqlDbType.Int32) { Value = appointmentDto.AppointmentData.Hairstylist.hairstylist_id }
                        };

                        var existingAppointments = await _context.ExecuteSqlQuery(lockQuery, checkParameters);
                        int appointmentCount = Convert.ToInt32(existingAppointments.FirstOrDefault()?.Values.FirstOrDefault() ?? 0);

                        if (appointmentCount > 0)
                        {
                            await transaction.RollbackAsync();
                            return false;
                        }

                        // Insert the appointment
                        string insertQuery = @"INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time, status, created_at, hairstylist_id)
                                       VALUES (@UserId, @ServiceId, @AppointmentDate, @AppointmentTime, @Status, NOW(), @HairstylistId);";

                        var insertParameters = new MySqlParameter[]
                        {
                            new MySqlParameter("@UserId", MySqlDbType.Int32) { Value = appointmentDto.user_id },
                            new MySqlParameter("@ServiceId", MySqlDbType.Int32) { Value = appointmentDto.AppointmentData.ServiceType.service_id },
                            new MySqlParameter("@AppointmentDate", MySqlDbType.DateTime) { Value = appointmentDate },
                            new MySqlParameter("@AppointmentTime", MySqlDbType.Time) { Value = appointmentTime },
                            new MySqlParameter("@Status", MySqlDbType.VarChar) { Value = "confirmed" },
                            new MySqlParameter("@HairstylistId", MySqlDbType.Int32) { Value = appointmentDto.AppointmentData.Hairstylist.hairstylist_id }
                        };

                        await _context.ExecuteSqlQuery(insertQuery, insertParameters);

                        await transaction.CommitAsync();

                        var user = await _context.ExecuteSqlQuery("SELECT * FROM users WHERE user_id = @UserId", new MySqlParameter[] { new MySqlParameter("@UserId", MySqlDbType.Int32) { Value = appointmentDto.user_id } });

                        if (user.Count > 0)
                        {
                            appointmentDto.UserEmail = user[0]["email"].ToString();
                            appointmentDto.UserPhone = user[0]["phone"].ToString();
                            appointmentDto.UserName = user[0]["full_name"].ToString();
                            appointmentDto.firebaseToken = user[0]["firebase_token"].ToString();
                        }

                        _appointmentService.CreateAppointment(appointmentDto);

                        return true;
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error inserting appointment: " + ex.Message);
            }
        }

        public async Task<List<Dictionary<string, object>>> UserAppointments(int id)
        {
            try
            {
                return await _context.ExecuteSqlQuery(
                    "SELECT * FROM users AS us " +
                    "LEFT JOIN appointments AS ap ON us.user_id = ap.user_id " +
                    "LEFT JOIN services AS sr ON sr.service_id = ap.service_id " +
                    "LEFT JOIN hairstylists AS hs ON hs.hairstylist_id = ap.hairstylist_id " +
                    "WHERE us.user_id = @UserId " +
                    "ORDER BY " +
                    "   CASE " +
                    "       WHEN ap.status = 'confirmed' THEN 1 " +
                "       WHEN ap.status = 'pending' THEN 2 " + 
                "       WHEN ap.status = 'completed' THEN 3 " +
                "       WHEN ap.status = 'cancelled' THEN 4 " +
                "       ELSE 5 " + 
                "   END, " +
                    "   ap.appointment_date ASC, " +
                    "   ap.appointment_time ASC;",
                new MySqlParameter[] {
                    new MySqlParameter("@UserId", MySqlDbType.Int32) { Value = id }
                });
            }
            catch (Exception ex)
            {
                throw new Exception("Error finding user appointments: " + ex.Message);
            }
        }

        public async Task<List<Dictionary<string, object>>> FastBooking(FastBookingDto fastBookingDto)
        {
            try
            {
                var parameters = new Dictionary<string, object>();
                parameters.Add("page_number", fastBookingDto.page_number);
                parameters.Add("page_size", fastBookingDto.page_size);
                parameters.Add("service_id_param", fastBookingDto?.serviceType?.service_id ?? 0);
                parameters.Add("hairstylist_id_param", fastBookingDto?.hairstylist?.hairstylist_id ?? 1);

                return await _context.ExecuteStoredProcedure("GetFastestAppointments", parameters);
            }
            catch (Exception ex)
            {
                return new List<Dictionary<string, object>> { new Dictionary<string, object> { ["error"] = $"Error executing stored procedure GetAvailableDates: {ex.Message}" } };
            }
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
                        Hairstylist = row.ContainsKey("hairstylist_full_name") ? row["hairstylist_full_name"].ToString() : "N/A"
                    },
                    ServiceType = new ServiceTypeDto
                    {
                        service_id = Convert.ToInt32(row["service_id"]),
                        Key = Convert.ToInt32(row["service_id"]), // you can update this if needed
                        Name = Convert.ToString(row["name"]),      // Placeholder: replace with actual if available
                        Description = Convert.ToString(row["description"]), // Placeholder
                        Price = Convert.ToInt32(row["price"]),            // Placeholder: update if your query includes it
                        Duration = Convert.ToInt32(row["duration"])           // Placeholder
                    }
                },
                user_id = Convert.ToInt32(row["user_id"]),
                UserEmail = row["email"].ToString(),
                UserPhone = row["phone"].ToString(),
                UserName = row["full_name"].ToString(),
                firebaseToken = row["firebase_token"].ToString()
            };
        }
        
        public async Task<Dictionary<string, string>> CancelAppointmentAsync(CancelAppointmentDTO cancelAppointmentDto)
        {
            try
            {
                // Retrieve the appointment date and time
                var result = await _context.ExecuteSqlQuery(
                    "SELECT * FROM appointments AS ap " + 
                        "RIGHT JOIN users AS u ON ap.user_id = u.user_id " +
                        "RIGHT JOIN hairstylists AS hs ON ap.hairstylist_id = hs.hairstylist_id " +
                        "LEFT JOIN services AS sr ON ap.service_id = sr.service_id " +
                        " WHERE appointment_id = @AppointmentId ",
                    new MySqlParameter[]
                    {
                        new MySqlParameter("@AppointmentId", MySqlDbType.Int32) { Value = cancelAppointmentDto.appointment_id }
                    });

                if (result == null || result.Count == 0 || !result[0].ContainsKey("appointment_date") || !result[0].ContainsKey("appointment_time"))
                {
                    return new Dictionary<string, string> { { "status", "error"} , { "message", "Резервацијата не е најдена" } };
                }

                // Convert the retrieved date and time to DateTime
                DateTime appointmentDate = Convert.ToDateTime(result[0]["appointment_date"]);
                TimeSpan appointmentTime = TimeSpan.Parse(result[0]["appointment_time"].ToString());

                // Combine date and time into a single DateTime object
                DateTime appointmentDateTime = appointmentDate.Add(appointmentTime);

                // Check if the appointment is within the next 24 hours
                if (appointmentDateTime <= DateTime.UtcNow.AddHours(24) && result[0]["role"].ToString() != "admin")
                {
                    return new Dictionary<string, string> { { "status", "error" }, { "message", "Не може да се откаже резервацијата" } };
                }

                // Proceed to cancel the appointment
                await _context.ExecuteSqlQuery(
                    "UPDATE appointments SET status = 'cancelled' WHERE appointment_id = @AppointmentId",
                    new MySqlParameter[]
                    {
                        new MySqlParameter("@AppointmentId", MySqlDbType.Int32) { Value = cancelAppointmentDto.appointment_id }
                    });

                AppointmentDto appointment = MapToAppointmentDto(result.First());
                
                _appointmentCancellationService.CancelAppointment(appointment);
                
                return new Dictionary<string, string> { { "status", "success"} , { "message", "Резервацијата е успешно откажана" } };
            }
            catch (Exception ex)
            {
                throw new Exception("Error canceling appointment: " + ex.Message);
            }
        }

        public async Task<List<Dictionary<string, object>>> GetAdminAppointments(string filter = null, string startDate = null, string endDate = null)
        {
            try
            {
                string query = "SELECT * FROM appointments AS a " +
                               "RIGHT JOIN users AS u ON a.user_id = u.user_id " +
                               "RIGHT JOIN services AS s ON a.service_id = s.service_id " +
                               "RIGHT JOIN hairstylists AS h ON a.hairstylist_id = h.hairstylist_id ";
                string whereClause = "";
                string orderClause = " ORDER BY appointment_date ASC, appointment_time ASC";

                // Apply date filters
                if (!string.IsNullOrEmpty(filter))
                {
                    switch (filter)
                    {
                        case "today":
                            whereClause = " WHERE a.appointment_date = CURDATE()";
                            break;
                        case "tomorrow":
                            whereClause = " WHERE a.appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)";
                            break;
                        case "this_week":
                            whereClause = " WHERE YEARWEEK(a.appointment_date, 1) = YEARWEEK(CURDATE(), 1)";
                            break;
                        case "this_month":
                            whereClause = " WHERE YEAR(a.appointment_date) = YEAR(CURDATE()) AND MONTH(a.appointment_date) = MONTH(CURDATE())";
                            break;
                        default:
                            // No filter
                            break;
                    }
                }
                else if (!string.IsNullOrEmpty(startDate) && !string.IsNullOrEmpty(endDate))
                {
                    // Custom date range filter
                    whereClause = $" WHERE a.appointment_date BETWEEN '{startDate}' AND '{endDate}'";
                }

                // Combine all parts of the query
                string finalQuery = query + whereClause + orderClause;
        
                return await _context.ExecuteSqlQuery(finalQuery);
            }
            catch (Exception ex)
            {
                throw new Exception("Error getting admin appointments: " + ex.Message);
            }
        }
    }
}
