using studio_infinito.DTOs.AuthorizationDTOs;

namespace studio_infinito.Services
{
    public interface IAuthService
    {
        Task<Dictionary<string, string>> Login(UserLoginDTO user);
        Task<bool> RegisterUserAsync(UserRegisterDto user);
        Task<Dictionary<string,string>> ForgotPasswordAsync(string user_email, string phone_number);
        Task<Dictionary<string, string>> VerifyTokenAsync(string user_email, string user_phone, string token);
        Task<Dictionary<string, string>> ResetPasswordAsync(string user_email, string user_phone, string password);
    }
}
