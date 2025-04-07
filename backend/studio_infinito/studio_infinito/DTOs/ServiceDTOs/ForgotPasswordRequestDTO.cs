namespace studio_infinito.DTOs.AuthorizationDTOs
{
    public class ForgotPasswordRequestDTO
    {
        public string? Email { get; set; }
        public string? phoneNumber { get; set; }
        public string? Token { get; set; }
        public string? Password { get; set; }
    }
}