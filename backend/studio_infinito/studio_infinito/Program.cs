
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using studio_infinito.Events.Appointments;
using studio_infinito.Services;
using studio_infinito.Services.Implementation;
using System.Diagnostics;
using System.Text;
using Quartz;
using studio_infinito.Events.AppointmentCancellation;
using studio_infinito.Events.AppointmentReminder;
using studio_infinito.Events.Authorization;

var builder = WebApplication.CreateBuilder(args);

IConfiguration configuration = (new ConfigurationBuilder().SetBasePath(Directory.GetCurrentDirectory()).AddJsonFile("appsettings.json").Build());
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtIssuers = builder.Configuration.GetSection("Jwt:Issuer").Get<string[]>();
var jwtAudiences = builder.Configuration.GetSection("Jwt:Audience").Get<string[]>();
var jwtKey = builder.Configuration.GetSection("Jwt:Key").Get<string>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
 .AddJwtBearer(options =>
 {
     options.TokenValidationParameters = new TokenValidationParameters
     {
         ValidateIssuer = false,
         ValidateAudience = false,
         ValidateLifetime = true,
         ValidateIssuerSigningKey = true,
         ValidIssuers = jwtIssuers,
         ValidAudiences = jwtAudiences,
         IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
     };

     options.Events = new JwtBearerEvents
     {
         OnTokenValidated = context =>
         {
             Debug.WriteLine($"Token validated successfully for {context.Principal.Identity.Name}");
             return Task.CompletedTask;
         },
         OnAuthenticationFailed = context =>
         {
             Debug.WriteLine($"Authentication failed: {context.Exception}");
             return Task.CompletedTask;
         }
     };

 });

builder.Services.AddScoped<studio_infinito.Data.DbContext>();

builder.Services.AddScoped<ICalendarService, CalendarService>();
builder.Services.AddScoped<IAppointmentsService, AppointmentsService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserDetailsService, UserDetailsService>();

builder.Services.AddHostedService<ScheduledService>();

builder.Services.AddSingleton<AppointmentService>();

builder.Services.AddSingleton<AppointmentReminderService>();
builder.Services.AddSingleton<AppointmentReminderEvent>();

builder.Services.AddSingleton<AppointmentCancellationService>();
builder.Services.AddSingleton<AppointmentCancellationEvent>();

var codeCreatedService = new CodeCreatedService();
var codeCreatedEvent = new CodeCreatedEvent(builder.Configuration, new FirebaseService());

codeCreatedService.CodeCreated += codeCreatedEvent.OnCodeCreated;

builder.Services.AddSingleton(codeCreatedService);
builder.Services.AddSingleton(codeCreatedEvent);

var allowedOrigins = builder.Configuration.GetSection("AllowedHosts").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
        });
});

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", limiterOptions =>
    {
        limiterOptions.PermitLimit = 30;
        limiterOptions.Window = TimeSpan.FromMinutes(3);
    });

    options.AddSlidingWindowLimiter("sliding", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromSeconds(10);
        limiterOptions.SegmentsPerWindow = 2;
    });

    options.AddConcurrencyLimiter("concurrent", limiterOptions =>
    {
        limiterOptions.PermitLimit = 2;
        limiterOptions.QueueLimit = 5;
    });
});

builder.Services.AddQuartz(q =>
{
    // Create a "key" for the job
    var jobKey = new JobKey("ScheduledJob");

    q.AddJob<ScheduledJob>(opts => opts.WithIdentity(jobKey));

    // Create a trigger with cron expression for every 30 minutes
    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("ScheduledJob-trigger")
        .WithCronSchedule("0 0 14 * * ?")); // every day at 14:00
});

// Add the Quartz hosted service
builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

var app = builder.Build();

app.UseRateLimiter();

var appointmentReminderEvent = app.Services.GetRequiredService<AppointmentReminderEvent>();
var appointmentService = app.Services.GetRequiredService<AppointmentService>();

var appointmentCancellationEvent = app.Services.GetRequiredService<AppointmentCancellationEvent>();
var appointmentCancellationService = app.Services.GetRequiredService<AppointmentCancellationService>();

var appointmentCreatedEvent = new AppointmentCreatedEvent(appointmentService);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();