using studio_infinito.DTOs.UserDetailsDTOs;
using studio_infinito.DTOs;

namespace studio_infinito.Services
{
    public interface IUserDetailsService
    {
        Task<Dictionary<string, string>> UpdateUserAsync(UserDetailsDTO user);
        Task<Dictionary<string, string>> UpdateUserPassword(int user_id, string newPassword);
        Task<Dictionary<string, string>> FindUserById(int userID);

        //Task<Dictionary<string, string>> UpdateUserById(int userID, UserDetailsDTO newUser);
    }
}
