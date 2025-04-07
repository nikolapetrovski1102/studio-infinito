using studio_infinito.DTOs.AppointmentsDTOs;
using System.Diagnostics;  // Ensure this is imported
using System.Net;
using System.Net.Mail;
using System.Text;
using studio_infinito.Events.AppointmentCancellation;

namespace studio_infinito.Events.AppointmentReminder
{
    public class AppointmentCancellationEvent
    {
        private readonly AppointmentCancellationService _appointmentCancellationService;
        private readonly IConfiguration _configuration;

        public AppointmentCancellationEvent(AppointmentCancellationService appointmentCancellationService, IConfiguration configuration)
        {
            _appointmentCancellationService = appointmentCancellationService;
            _configuration = configuration;
            _appointmentCancellationService.AppointmentCancelled += HandleAppointmentCancelled;
        }

        private async void HandleAppointmentCancelled(object sender, AppointmentCancellationEventArgs e)
        {
            try
            {
                if (!string.IsNullOrEmpty(e.CancelAppointmentDto.UserEmail))
                {
                    await SendCancellationEmail(e.CancelAppointmentDto);
                }

                if (!string.IsNullOrEmpty(e.CancelAppointmentDto.firebaseToken))
                {
                    await SendCancellationFirebaseMessage(e.CancelAppointmentDto);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error in handler: {ex}");
            }
        }
    private async Task SendCancellationEmail(AppointmentDto appointmentDto)
    {
        try
        {
            var bodyBuilder = new StringBuilder();
            bodyBuilder.AppendLine("<html>");
            bodyBuilder.AppendLine("<head>");
            bodyBuilder.AppendLine("<style>");
            bodyBuilder.AppendLine("body { font-family: Arial, sans-serif; color: #333; }");
            bodyBuilder.AppendLine(".container { max-width: 600px; padding: 20px; background-color: #f9f9f9; border-radius: 10px; }");
            bodyBuilder.AppendLine(".cancellation-header { background-color: #ffecec; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #ff5252; }");
            bodyBuilder.AppendLine(".details-table { width: 100%; border-collapse: collapse; margin-top: 10px; }");
            bodyBuilder.AppendLine(".details-table td { padding: 8px; border-bottom: 1px solid #ddd; }");
            bodyBuilder.AppendLine(".details-table td:first-child { font-weight: bold; }");
            bodyBuilder.AppendLine("</style>");
            bodyBuilder.AppendLine("</head>");
            bodyBuilder.AppendLine("<body>");
            bodyBuilder.AppendLine("<div class='container'>");
            
            bodyBuilder.AppendLine("<div class='cancellation-header'>");
            bodyBuilder.AppendLine($"<h2>Известување за откажан термин</h2>");
            bodyBuilder.AppendLine($"<p>Почитуван(а) {appointmentDto.UserName},</p>");
            bodyBuilder.AppendLine("<p>Ве информираме дека вашиот закажан термин е <strong>откажан</strong>.</p>");
            bodyBuilder.AppendLine("</div>");

            bodyBuilder.AppendLine("<p><strong>Детали за откажаниот термин:</strong></p>");
            bodyBuilder.AppendLine("<table class='details-table'>");
            bodyBuilder.AppendLine($"<tr><td>📅 Датум:</td><td>{appointmentDto.Event.Date}</td></tr>");
            bodyBuilder.AppendLine($"<tr><td>⏰ Време:</td><td>{DateTime.Parse(appointmentDto.Event.Time).ToString("HH:mm")}</td></tr>");
            bodyBuilder.AppendLine($"<tr><td>💇‍♂️ Фризер:</td><td>{appointmentDto.AppointmentData.Hairstylist.Hairstylist}</td></tr>");
            bodyBuilder.AppendLine($"<tr><td>🔹 Услуга:</td><td>{appointmentDto.AppointmentData.ServiceType.Name}</td></tr>");
            bodyBuilder.AppendLine($"<tr><td>💰 Цена:</td><td>{appointmentDto.AppointmentData.ServiceType.Price} ден.</td></tr>");
            bodyBuilder.AppendLine($"<tr><td>⏳ Времетраење:</td><td>{appointmentDto.AppointmentData.ServiceType.Duration} мин.</td></tr>");
            bodyBuilder.AppendLine("</table>");

            bodyBuilder.AppendLine("<p>Се извинуваме за непријатностите. Доколку сакате да закажете нов термин, можете да го направите тоа преку нашата апликација или да не контактирате директно.</p>");
            bodyBuilder.AppendLine("<p>За додатни информации или помош, слободно контактирајте нѐ.</p>");

            bodyBuilder.AppendLine("<p>Со почит,</p>");
            bodyBuilder.AppendLine("<p><strong>Тимот на Studio Infinito</strong></p>");
            bodyBuilder.AppendLine("<p>📞 078 300 047 | 📍 Hristo Smirnenski 37, Skopje, Republic of Macedonia, 1000</p>");
            bodyBuilder.AppendLine("</div>");
            bodyBuilder.AppendLine("</body></html>");

            var plainTextBody = $"Известување за откажан термин - Studio Infinito\n\n" +
                              $"Почитуван(а) {appointmentDto.UserName},\n\n" +
                              "Ве информираме дека вашиот закажан термин е откажан.\n\n" +
                              $"Датум: {appointmentDto.Event.Date}\n" +
                              $"Време: {DateTime.Parse(appointmentDto.Event.Time).ToString("HH:mm")}\n" +
                              $"Фризер: {appointmentDto.AppointmentData.Hairstylist.Hairstylist}\n" +
                              $"Услуга: {appointmentDto.AppointmentData.ServiceType.Name}\n" +
                              $"Цена: {appointmentDto.AppointmentData.ServiceType.Price} ден.\n" +
                              $"Времетраење: {appointmentDto.AppointmentData.ServiceType.Duration} мин.\n\n" +
                              "Се извинуваме за непријатностите. Доколку сакате да закажете нов термин, можете да го направите тоа преку нашата апликација или да не контактирате директно.\n\n" +
                              "За додатни информации или помош, слободно контактирајте нѐ.\n\n" +
                              "Со почит,\n" +
                              "Тимот на Studio Infinito\n" +
                              "📞 078 300 047 | 📍 Hristo Smirnenski 37, Skopje, Republic of Macedonia, 1000";

            var htmlBody = bodyBuilder.ToString();

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(_configuration["MailSettings:Mail"], "Studio Infinito"),
                Subject = "Известување: Вашиот термин е откажан - Studio Infinito",
                IsBodyHtml = true
            };

            mailMessage.To.Add(appointmentDto.UserEmail);
            mailMessage.ReplyToList.Add(new MailAddress(_configuration["MailSettings:Mail"]));
            mailMessage.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(plainTextBody, Encoding.UTF8, "text/plain"));
            mailMessage.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, "text/html"));

            using var smtpClient = new SmtpClient("smtp.gmail.com")
            {
                Port = 587,
                Credentials = new NetworkCredential(
                    _configuration["MailSettings:Mail"],
                    _configuration["MailSettings:Password"]),
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            await smtpClient.SendMailAsync(mailMessage);
            Debug.WriteLine($"Cancellation email sent to {appointmentDto.UserEmail} successfully");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cancellation Email Error] {ex.Message}");
            throw; // Re-throw to be caught by the calling method
        }
    }

    private async Task SendCancellationFirebaseMessage(AppointmentDto appointmentDetails)
    {
        try
        {
            var firebaseService = new FirebaseService();
            string title = "Откажан термин - Studio Infinito";
            string body = $"Здраво {appointmentDetails.UserName}, ве известуваме дека вашиот термин закажан за {appointmentDetails.Event.Date} во {DateTime.Parse(appointmentDetails.Event.Time).ToString("HH:mm")} кај {appointmentDetails.AppointmentData.Hairstylist.Hairstylist} е откажан.";
            string imageUrl = "https://ts1k5rzt-3001.euw.devtunnels.ms/static/media/Logo_4K_Transparent.f8358b45d0ac78650da4.png";

            if (string.IsNullOrEmpty(appointmentDetails.firebaseToken))
                return;

            if (!appointmentDetails.firebaseToken.Contains(','))
            {
                await firebaseService.SendNotification(
                    appointmentDetails.firebaseToken, 
                    title, 
                    body, 
                    imageUrl
                );
            }
            else
            {
                var firebaseTokens = appointmentDetails.firebaseToken.Split(',')
                    .Where(t => !string.IsNullOrWhiteSpace(t))
                    .ToList();
                
                var notificationTasks = firebaseTokens.Select(token => 
                    firebaseService.SendNotification(
                        token.Trim(), 
                        title, 
                        body, 
                        imageUrl
                    ));
                
                await Task.WhenAll(notificationTasks);
            }
            
            Debug.WriteLine($"Cancellation push notification sent successfully for appointment on {appointmentDetails.Event.Date}");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Cancellation Firebase Error] {ex}");
            throw; // Re-throw to be caught by the calling method
        }
    }
    }
}