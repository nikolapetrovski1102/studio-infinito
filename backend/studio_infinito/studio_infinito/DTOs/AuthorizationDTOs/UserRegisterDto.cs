namespace studio_infinito.DTOs.AuthorizationDTOs
{
    public class UserRegisterDto
    {
        public string firstName { get; set; }
        public string lastName { get; set; }
        public string email { get; set; }
        public int gender { get; set; }
        public string phone { get; set; }
        public string password { get; set; }
        public string confirmPassword { get; set; }
    }
}
