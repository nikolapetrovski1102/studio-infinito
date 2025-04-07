using studio_infinito.DTOs.AuthorizationDTOs;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using studio_infinito.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using studio_infinito.Events;
using studio_infinito.Events.Authorization;

namespace studio_infinito.Services.Implementation
{
    public class AuthService : IAuthService
    {
        DbContext _context;
        private readonly IConfiguration _configuration;
        private readonly  CodeCreatedService _codeCreatedService;

        public AuthService(DbContext context, IConfiguration configuration, CodeCreatedService codeCreatedService)
        {
            _context = context;
            _configuration = configuration;
            _codeCreatedService = codeCreatedService;
        }

        public async Task<Dictionary<string, string>> Login(UserLoginDTO user)
        {
            try
            {
                List<Dictionary<string, object>> result = await _context.ExecuteSqlQuery("SELECT * FROM users WHERE phone = @EmailOrPhone" +
                    " OR email = @EmailOrPhone",
                    new MySqlParameter[] { new MySqlParameter("@EmailOrPhone", MySqlDbType.String) { Value = user.EmailOrPhone },
                                   new MySqlParameter("@password", MySqlDbType.String) { Value = user.Password } });

                if (result.Count > 0 && result[0].ContainsKey("error") || result.Count == 0)
                {
                    return new Dictionary<string, string> { { "status", "error" }, { "message", $"Корисничката сметка не е пронајдена" } };
                }
                else if (!VerifyPassword(user.Password, result[0]["password_hash"].ToString()))
                {
                    return new Dictionary<string, string> { { "status", "warning" }, { "message", $"Внесена е погрешена лозинка" } };
                }

                var old_firebase_token_raw = result[0]["firebase_token"].ToString() ?? "";
                var new_firebase_token = user.firebase_token;

                var old_firebase_tokens = old_firebase_token_raw
                    .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(token => token.Trim())
                    .ToList();
                
                if (!string.IsNullOrEmpty(new_firebase_token) && !old_firebase_tokens.Contains(new_firebase_token))
                {
                    var firebase_tokens = "";

                    if (!string.IsNullOrEmpty(old_firebase_token_raw))
                    {
                        firebase_tokens = old_firebase_token_raw + "," + new_firebase_token;
                    }
                    else
                    {
                        firebase_tokens = new_firebase_token;
                    }
                    
                    await _context.ExecuteSqlQuery(
                        "UPDATE users SET firebase_token = @FirebaseToken WHERE user_id = @UserId",
                        new MySqlParameter[]
                        {
                            new MySqlParameter("@FirebaseToken", MySqlDbType.String) { Value = firebase_tokens },
                            new MySqlParameter("@UserId", MySqlDbType.String) { Value = result[0]["user_id"] }
                        }
                    );
                }
                
                var user_details = new 
                {
                    user_id = result.First()["user_id"].ToString(),
                    user_image = result.First()["user_image"].ToString(),
                    user_role = result.First()["role"].ToString()
                };
                
                if (result.First()["role"].ToString() != null && result.First()["role"].ToString() == "admin")
                    return new Dictionary<string, string> { { "status", "success" }, { "message", $"{GenerateJwtToken(user, JsonSerializer.Serialize(user_details))}" }, { "redirect", "/admin" } };
                else
                    return new Dictionary<string, string> { { "status", "success" }, { "message", $"{GenerateJwtToken(user, JsonSerializer.Serialize(user_details))}" }, { "redirect", "/home" } };}
            
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        private string GenerateJwtToken(UserLoginDTO loginRequest, string user_details)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var expirationTime = loginRequest.rememberMe ? DateTime.Now.AddDays(30) : DateTime.Now.AddMinutes(120);

            var Sectoken = new JwtSecurityToken(_configuration["Jwt:Issuer"],
              _configuration["Jwt:Issuer"],
              null,
              expires: expirationTime,
              signingCredentials: credentials);

            var access_token = new JwtSecurityTokenHandler().WriteToken(Sectoken);

            Dictionary<string, string> response_token = new Dictionary<string, string>
            {
                { "access_token", access_token },
                { "token_type", "Bearer" },
                { "valid_to", Sectoken.ValidTo.ToString("O") },
                { "user_details", user_details }
            };

            return JsonSerializer.Serialize(response_token);
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string enteredPassword, string storedPassword)
        {
            return HashPassword(enteredPassword) == storedPassword;
        }

        public async Task<bool> RegisterUserAsync(UserRegisterDto newUser)
        {
            try
            {
                var userExists = await _context.ExecuteSqlQuery(
                    "SELECT * FROM users WHERE phone = @Phone OR email = @Email",
                    new MySqlParameter[] {
                        new MySqlParameter("@Phone", MySqlDbType.VarChar) { Value = newUser.phone },
                        new MySqlParameter("@Email", MySqlDbType.VarChar) { Value = newUser.email }
                    }
                );

                if (userExists?.Count > 0) return false;

                var hashedPassword = HashPassword(newUser.password);


                DateTime dateTimeNow = TimeZoneInfo.ConvertTime(DateTime.Now, TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time"));

                string query = "INSERT INTO users (full_name, email, phone, password_hash, role, created_at, gender, user_image) " +
                               "VALUES (@FullName, @Email, @Phone, @PasswordHash, 'customer', @DateNow, @Gender, @UserImage)";

                await _context.ExecuteSqlQuery(query,
                    new MySqlParameter[] {
                        new MySqlParameter("@FullName", MySqlDbType.VarChar, 100) { Value = $"{newUser.firstName} {newUser.lastName}" },
                        new MySqlParameter("@Email", MySqlDbType.VarChar) { Value = newUser.email },
                        new MySqlParameter("@Phone", MySqlDbType.VarChar) { Value = newUser.phone },
                        new MySqlParameter("@PasswordHash", MySqlDbType.VarChar) { Value = hashedPassword },
                        new MySqlParameter("@DateNow", MySqlDbType.DateTime) { Value = dateTimeNow },
                        new MySqlParameter("@Gender", MySqlDbType.Int16) { Value = newUser.gender },
                        new MySqlParameter("@UserImage", MySqlDbType.VarChar) { Value = "data:image/png;base64,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" }
                    }
                );

                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error registering user: {ex.Message}", ex);
            }
        }
        
        public async Task<Dictionary<string, string>> ForgotPasswordAsync(string user_email, string user_phone)
        {
            try
            {
                var user = new List<Dictionary<string, object>>();
                
                if (!string.IsNullOrEmpty(user_email))
                {
                    user = await _context.ExecuteSqlQuery("SELECT * FROM users WHERE email = @Email",
                        new MySqlParameter[] { new MySqlParameter("@Email", MySqlDbType.String) { Value = user_email } });
                }else {
                    user = await _context.ExecuteSqlQuery("SELECT * FROM users WHERE phone = @Phone",
                        new MySqlParameter[] { new MySqlParameter("@Phone", MySqlDbType.String) { Value = user_phone } });
                }
                if (user.Count == 0)
                {
                    return new Dictionary<string, string>() {  { "status", "warning" }, { "message", "Корисникот не е пронајден" } };
                }
                
                // generate 6 digi code
                Random random = new Random();
                int code = random.Next(100000, 999999);
                string codeString = code.ToString();
                
                DateTime now = DateTime.Now;
                DateTime codeValidTo = now.AddMinutes(10);
                
                await _context.ExecuteSqlQuery("UPDATE users SET code_valid_to = @CodeValidTo WHERE user_id = @UserId",
                    new MySqlParameter[] { 
                        new MySqlParameter("@CodeValidTo", MySqlDbType.DateTime) { Value = codeValidTo }, 
                        new MySqlParameter("@UserId", MySqlDbType.Int32) { Value = user[0]["user_id"] } 
                    });

                await _context.ExecuteSqlQuery("UPDATE users SET reset_code = @Code WHERE user_id = @UserId",
                    new MySqlParameter[] { 
                        new MySqlParameter("@Code", MySqlDbType.String) { Value = codeString }, 
                        new MySqlParameter("@UserId", MySqlDbType.Int32) { Value = user[0]["user_id"] } 
                    });
                
                _codeCreatedService.CreateCode(user.First()["email"].ToString(), user.First()["firebase_token"].ToString(), codeString);
                
                return new Dictionary<string, string>() { { "status", "success" }, { "message", "Кодот за промена на лозинка е изпратен на вашата е-пошта." } };
            }
            catch (Exception ex)
            {
                throw new Exception($"Error forgot password: {ex.Message}", ex);
            }
        }
        
        public async Task<Dictionary<string, string>> VerifyTokenAsync(string user_email, string user_phone, string resetCode)
        {
            try
            {
                var user = new List<Dictionary<string, object>>();
                if (!String.IsNullOrEmpty(user_email))
                {
                    user = await _context.ExecuteSqlQuery(
                        "SELECT reset_code, code_valid_to FROM users WHERE email = @Email",
                        new MySqlParameter[] { 
                            new MySqlParameter("@Email", MySqlDbType.String) { Value = user_email }
                        });
                }
                else
                {
                    user = await _context.ExecuteSqlQuery(
                        "SELECT reset_code, code_valid_to FROM users WHERE phone = @Phone",
                        new MySqlParameter[] { 
                            new MySqlParameter("@Phone", MySqlDbType.String) { Value = user_phone }
                        });
                }

                if (user.Count == 0)
                {
                    return new Dictionary<string, string>() 
                    {  
                        { "status", "warning" }, 
                        { "message", "Кодот за промена на лозинка не е пронајден" } 
                    };
                }

                var dbResetCode = user.First()["reset_code"]?.ToString() ?? "";
                var dbCodeValidTo = user.First()["code_valid_to"] is DateTime 
                    ? (DateTime)user.First()["code_valid_to"] 
                    : DateTime.Parse(user.First()["code_valid_to"].ToString());

                if (resetCode != dbResetCode)
                {
                    return new Dictionary<string, string>() 
                    {  
                        { "status", "warning" }, 
                        { "message", "Кодот за промена на лозинка не е пронајден" } 
                    };
                }

                if (dbCodeValidTo < DateTime.Now)
                {
                    return new Dictionary<string, string>() 
                    {  
                        { "status", "warning" }, 
                        { "message", "Кодот за промена на лозинка е истечен" } 
                    };
                }
        
                return new Dictionary<string, string>() 
                {  
                    { "status", "success" }, 
                    { "message", "Кодот за промена на лозинка е пронајден" } 
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Verify token exception: {ex.Message}", ex);
            }
        }
        
        public async Task<Dictionary<string, string>> ResetPasswordAsync(string user_email, string user_phone, string newPassword)
        {
            try
            {
                var user = new List<Dictionary<string, object>>();
                if (!String.IsNullOrEmpty(user_email))
                {
                    await _context.ExecuteSqlQuery("UPDATE users SET password_hash = @Password WHERE email = @Email",
                        new MySqlParameter[] {
                            new MySqlParameter("@Password", MySqlDbType.String) { Value = HashPassword(newPassword) },
                            new MySqlParameter("@Email", MySqlDbType.String) { Value = user_email }
                        });
                }
                else
                {
                    await _context.ExecuteSqlQuery("UPDATE users SET password_hash = @Password WHERE phone = @Phone",
                        new MySqlParameter[] {
                            new MySqlParameter("@Password", MySqlDbType.String) { Value = HashPassword(newPassword) },
                            new MySqlParameter("@Phone", MySqlDbType.String) { Value = user_phone }
                        });
                }
                
                return new Dictionary<string, string>() { { "status", "success" }, { "message", "Успешно промена на лозинка" } };
            }
            catch (Exception ex)
            {
                throw new Exception($"Error reset password: {ex.Message}", ex);
            }
        }
        
    }
}
