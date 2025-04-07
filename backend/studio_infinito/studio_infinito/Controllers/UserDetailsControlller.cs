using studio_infinito.DTOs.UserDetailsDTOs;
using Microsoft.AspNetCore.Mvc;
using studio_infinito.Services;

namespace studio_infinito.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserDetailsController : Controller
    {
        IUserDetailsService _userDetailsService;

        public UserDetailsController(IUserDetailsService userDetailsService)
        {
            _userDetailsService = userDetailsService;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserDetails(int userId)
        {
            try
            {
                return Ok(await _userDetailsService.FindUserById(userId));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("update-user")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateUser([FromForm] UserDetailsDTO userToUpdate)
        {
            try
            {
                return Ok(await _userDetailsService.UpdateUserAsync(userToUpdate));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("update-user-password")]
        public async Task<IActionResult> UpdateUserPassword([FromBody] UpdateUserPasswordDTO newUserPassword)
        {
            try
            {
                return Ok(await _userDetailsService.UpdateUserPassword(newUserPassword.user_id, newUserPassword.newPassword));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        
    }
}
