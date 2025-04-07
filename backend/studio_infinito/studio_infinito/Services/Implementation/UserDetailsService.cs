using studio_infinito.DTOs.UserDetailsDTOs;
using System.Text.Json;
using MySql.Data.MySqlClient;
using studio_infinito.Data;
using studio_infinito.DTOs;
using System.Security.Cryptography;
using System.Text;
using System.Drawing.Imaging;
using System.Drawing;
using System.Drawing.Drawing2D;
using SkiaSharp;

namespace studio_infinito.Services.Implementation
{
    public class UserDetailsService : IUserDetailsService
    {
        DbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IAuthService _authService;

        public UserDetailsService(DbContext context, IConfiguration configuration, IAuthService authService)
        {
            _context = context;
            _configuration = configuration;
            _authService = authService;
        }


        public async Task<Dictionary<string, string>> FindUserById(int userID)
        {
            try
            {
                var user = await _context.ExecuteSqlQuery("SELECT * FROM users WHERE user_id = @Id",
                    new MySqlParameter[] {
                        new MySqlParameter("@Id", MySqlDbType.Int32) { Value = userID }
                    });
                if(user.Count == 0)
                {
                    return new Dictionary<string, string> { { "status", "error" }, { "message", "Корисникот не е пронајден" } };
                }
                 

                return new Dictionary<string, string> { { "status", "success" }, { "user",  JsonSerializer.Serialize(user[0]) } };

            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }


        public async Task<Dictionary<string, string>> UpdateUserAsync(UserDetailsDTO user)
        {
            try
            {
                //VOTRA OPCIJA AMA SO POVEKJE QUERIES I CUSTOM ERRORS. BIRAJ 
                var existingUser = await _context.ExecuteSqlQuery(
                    "SELECT * FROM users WHERE user_id = @Id", 
                    new MySqlParameter[] {
                        new MySqlParameter("@Id", MySqlDbType.Int32) { Value = user.id }
                    }
                );

                var existingEmailorPhone = await _context.ExecuteSqlQuery(
                    "SELECT * FROM users WHERE user_id != @Id AND (email = @Email OR phone = @Phone)",
                    new MySqlParameter[]
                    {
                        new MySqlParameter("@Email", MySqlDbType.VarChar) { Value = user.email },
                        new MySqlParameter("@Phone", MySqlDbType.VarChar) { Value = user.phone },
                        new MySqlParameter("@Id", MySqlDbType.Int32) { Value = existingUser.First()["user_id"] }
                    }
                );

                if (existingEmailorPhone != null && existingEmailorPhone.Any())
                {
                    return new Dictionary<string, string>() {  { "status", "warning" }, { "message", "Е-пошта или телефонот веќе постојат" } };
                }

                if (existingUser.Any() || existingUser.Count > 0)
                {
                    var updateUserQuery = "UPDATE users SET full_name = @Name, phone = @Phone, email = @Email, user_image = @Image WHERE user_id = @Id";
                    await _context.ExecuteSqlQuery(
                        updateUserQuery,
                        new MySqlParameter[] {
                            new MySqlParameter("@Name", MySqlDbType.VarChar) { Value = user.firstName + " " + user.lastName },
                            new MySqlParameter("@Phone", MySqlDbType.VarChar) { Value = user.phone },
                            new MySqlParameter("@Email", MySqlDbType.VarChar) { Value = user.email },
                            new MySqlParameter("@Id", MySqlDbType.Int32) { Value = existingUser.First()["user_id"]},
                            new MySqlParameter("@Image", MySqlDbType.String) { Value = user.userImage}
                            
                        }
                    );
                }
                else
                {
                    throw new Exception("Корисникот не може да биде ажуриран");
                }

                return new Dictionary<string, string> { { "status", "success" }, { "message", $"Корисникот е успешно ажуриран" } };
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        public async Task<Dictionary<string, string>> UpdateUserPassword(int user_id, string newPassword)
        {
            try
            {
                var existingUser = await _context.ExecuteSqlQuery("SELECT * FROM users WHERE user_id = @Id",
                    new MySqlParameter[] {
                        new MySqlParameter("@Id", MySqlDbType.Int32) { Value = user_id }});

                if (existingUser != null && existingUser.Any())
                {
                    string oldPasswordHashed = existingUser.First()["password_hash"].ToString();
                    string newPasswordHashed = HashPassword(newPassword);
                    if (oldPasswordHashed.Equals(newPasswordHashed)) 
                        return new Dictionary<string, string>() { { "status", "warning" }, { "message", "Ве молиме да внесете нова лозинка, различна од старата." } };

                    
                    var updateUserQuery = "UPDATE users SET password_hash = @Password WHERE user_id = @Id";
                    await _context.ExecuteSqlQuery(
                        updateUserQuery,
                        new MySqlParameter[] {
                            new MySqlParameter("@Password", MySqlDbType.VarChar) { Value = newPasswordHashed },
                            new MySqlParameter("@Id", MySqlDbType.Int32) { Value = existingUser.First()["user_id"]}
                        }
                    );
                }
                else 
                    return new Dictionary<string, string>() { { "status", "error" }, { "message", "Грешка при ажурирање на лозинка" } };

                return new Dictionary<string, string>() { { "status", "success" }, { "message", "Успешно ажурирање на лозинка" } };
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
        
        //public async Task<Dictionary<string, string>> UpdateUserById(int userID, UserDetailsDTO newUser)
        //{
        //    try
        //    {
        //        var userResult = await FindUserById(userID);
        //        if (userResult["status"] == "error")
        //        {
        //            return userResult;
        //        }

        //        var userData = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(userResult["user"]);
        //        int userId = Convert.ToInt32(userData["user_id"]);

        //        var existingUser = await _context.ExecuteSqlQuery(
        //            "SELECT * FROM users WHERE (phone = @Phone OR email = @Email) AND user_id != @Id",
        //            new MySqlParameter[] {
        //                new MySqlParameter("@Phone", MySqlDbType.VarChar) { Value = newUser.phone },
        //                new MySqlParameter("@Email", MySqlDbType.VarChar) { Value = newUser.email },
        //                new MySqlParameter("@Id", MySqlDbType.Int32) { Value = userId }
        //            }
        //        );

        //        if (existingUser != null && existingUser.Any())
        //        {
        //            return new Dictionary<string, string> { { "status", "error" }, { "message", "Телефонот или емаилот веќе постојат" } };
        //        }

        //        var updateUserQuery = "UPDATE users SET full_name = @Name WHERE user_id = @Id";
        //        await _context.ExecuteSqlQuery(
        //            updateUserQuery,
        //            new MySqlParameter[] {
        //                new MySqlParameter("@Name", MySqlDbType.VarChar) { Value = newUser.firstName + " " + newUser.lastName },
        //                new MySqlParameter("@Id", MySqlDbType.Int32) { Value = userId }
        //            }
        //        );

        //        return new Dictionary<string, string> { { "status", "success" }, { "message", "Корисникот е успешно ажуриран" } };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new Dictionary<string, string> { { "status", "error" }, { "message", ex.Message } };
        //    }
        //}
    }
}
