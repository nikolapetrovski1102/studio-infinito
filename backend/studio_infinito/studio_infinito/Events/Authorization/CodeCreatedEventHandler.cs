using System;
using System.Diagnostics;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using FirebaseAdmin.Auth;
using Microsoft.Extensions.Configuration;
using studio_infinito.DTOs;
using studio_infinito.Services;

namespace studio_infinito.Events.Authorization
{
    public delegate void CodeCreatedEventHandler(object sender, CodeCreatedEventArgs e);

    public class CodeCreatedEventArgs : EventArgs
    {
        public string UserEmail { get; set; }
        public string Code { get; set; }
        public string FirebaseToken { get; set; }
        public string resetCode { get; set; }
    }

    public class CodeCreatedService
    {
        public event CodeCreatedEventHandler CodeCreated;

        public void CreateCode(string UserEmail, string FirebaseToken, string resetCode)
        {
            OnCodeCreated(UserEmail, FirebaseToken, resetCode);
        }
        
        // Protected method to raise the event
        protected virtual void OnCodeCreated(string UserEmail, string FirebaseToken, string resetCode)
        {
            CodeCreated?.Invoke(this, new CodeCreatedEventArgs()
            {
                UserEmail = UserEmail,
                FirebaseToken = FirebaseToken,
                resetCode = resetCode
            });
        }
        
    }
}