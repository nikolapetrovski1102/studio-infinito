namespace studio_infinito.DTOs.UserDetailsDTOs
{
    public class UserDetailsDTO
    {
        public int id { get; set; }
        public string? firstName { get; set; }
        public string? lastName { get; set; }
        public int gender { get; set; }  // 2 = Female, 1 = Male
        public string? email { get; set; }
        public string? phone { get; set; }
        public string? userImage { get; set; }
    }
}
