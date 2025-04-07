using studio_infinito.DTOs.AuthorizationDTOs;
using Microsoft.AspNetCore.Mvc;
using studio_infinito.Services;

namespace studio_infinito.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : Controller
    {
        IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDTO loginRequest)
        {
            var userToken = await _authService.Login(loginRequest);

            if (userToken != null)
            {
                return Ok(userToken);
            }
            else
            {
                return BadRequest("Invalid username or password");
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto registerRequest)
        {
            try
            {
                var isUserCreated = await _authService.RegisterUserAsync(registerRequest);

                if (isUserCreated)
                    return Ok(new Dictionary<string, string>() { { "status", "success" }, { "message", "Успешно ргистрирање на корисник." } });
                else
                    return Ok(new Dictionary<string, string>() { { "status", "warning" }, { "message", "Корисникот веќе постоји." } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO forgotPasswordRequestDto)
        {
            try
            {
                return Ok(await _authService.ForgotPasswordAsync(forgotPasswordRequestDto.Email, forgotPasswordRequestDto.phoneNumber));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("verify-token")]
        public async Task<IActionResult> VerifyToken([FromBody] ForgotPasswordRequestDTO forgotPasswordRequestDto)
        {
            try
            {
                return Ok(await _authService.VerifyTokenAsync(forgotPasswordRequestDto.Email, forgotPasswordRequestDto.phoneNumber, forgotPasswordRequestDto.Token));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ForgotPasswordRequestDTO forgotPasswordRequestDto)
        {
            try
            {
                return Ok(await _authService.ResetPasswordAsync(forgotPasswordRequestDto.Email, forgotPasswordRequestDto.phoneNumber, forgotPasswordRequestDto.Password));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        
    }
}
