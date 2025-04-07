using studio_infinito.DTOs;
using System.Diagnostics;  // Ensure this is imported
using System.Net;
using System.Net.Mail;
using System.Text;

namespace studio_infinito.Events.Authorization
{
    public class CodeCreatedEvent
    {
        public event CodeCreatedEventHandler CodeCreated;

        private readonly IConfiguration _configuration;
        private readonly FirebaseService _firebaseService;

        public CodeCreatedEvent(IConfiguration configuration, FirebaseService firebaseService)
        {
            _configuration = configuration;
            _firebaseService = firebaseService;
        }

        public void OnCodeCreated(object sender, CodeCreatedEventArgs e)
        {
            Debug.WriteLine($"Event Triggered! Email: {e.UserEmail}, Code: {e.Code}, FirebaseToken: {e.FirebaseToken}");

            if (!string.IsNullOrEmpty(e.UserEmail))
            {
                Task.Run(() => SendEmail(e.UserEmail, e.resetCode));
            }
            if (!string.IsNullOrEmpty(e.FirebaseToken))
            {
                Task.Run(() => SendFirebaseMessage(e.resetCode, e.FirebaseToken));
            }
        }


        protected virtual void OnCodeCreated(string userEmail, string code, string firebaseToken)
        {
            CodeCreated?.Invoke(this, new CodeCreatedEventArgs()
            {
                UserEmail = userEmail,
                Code = code,
                FirebaseToken = firebaseToken
            });
        }

        private string GenerateResetCode()
        {
            return new Random().Next(100000, 999999).ToString(); // 6-digit code
        }

        private async Task SendEmail(string userEmail, string resetCode)
        {
            try
            {
                var bodyBuilder = new StringBuilder();
                bodyBuilder.AppendLine("<html><body>");
                bodyBuilder.AppendLine("<p>Вашиот код за ресетирање на лозинката е:</p>");
                bodyBuilder.AppendLine($"<h2>{resetCode}</h2>");
                bodyBuilder.AppendLine("<p>Овој код важи 10 минути.</p>");
                bodyBuilder.AppendLine("</body></html>");

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_configuration["MailSettings:Mail"], "Studio Infinito"),
                    Subject = "Код за ресетирање на лозинката",
                    Body = bodyBuilder.ToString(),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(userEmail);

                using var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential(
                        _configuration["MailSettings:Mail"],
                        _configuration["MailSettings:Password"]),
                    EnableSsl = true,
                };

                await smtpClient.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Email Error] {ex.Message}");
            }
        }

        private async Task SendFirebaseMessage(string resetCode, string firebaseToken)
        {
            try
            {
                string title = "Код за ресетирање на лозинката";
                string body = $"Вашиот код за ресетирање е {resetCode}. Кодот важи 10 минути.";

                if (!firebaseToken.Contains(','))
                {
                    await _firebaseService.SendNotification(firebaseToken, title, body, null);
                }else if (firebaseToken.Contains(','))
                {
                    List<string> tokens = firebaseToken.Split(',').ToList();
                    foreach (string token in tokens)
                    {
                        await _firebaseService.SendNotification(token, title, body, null);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Firebase Error] {ex.Message}");
            }
        }
    }
}
