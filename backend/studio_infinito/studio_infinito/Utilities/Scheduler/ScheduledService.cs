using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

public class ScheduledService : BackgroundService
{
    private readonly ILogger<ScheduledService> _logger;
    private readonly TimeSpan _period = TimeSpan.FromMinutes(30);

    public ScheduledService(ILogger<ScheduledService> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using PeriodicTimer timer = new PeriodicTimer(_period);
        
        // Run once at startup
        await DoWorkAsync();

        while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoWorkAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing scheduled task");
            }
        }
    }

    private async Task DoWorkAsync()
    {
        _logger.LogInformation("Scheduled task running at: {time}", DateTimeOffset.Now);
        
        // Your code to execute every 30 minutes goes here
        await Task.Delay(1000); // Simulate work
    }
}