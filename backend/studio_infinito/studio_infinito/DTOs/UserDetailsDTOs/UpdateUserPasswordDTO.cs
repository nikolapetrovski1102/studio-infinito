namespace studio_infinito.DTOs.UserDetailsDTOs
{
    public class UpdateUserPasswordDTO
    {
        public int user_id { get; set; }
        public string newPassword { get; set; }
    }
}