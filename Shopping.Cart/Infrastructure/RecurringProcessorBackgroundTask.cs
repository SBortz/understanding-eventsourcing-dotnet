using Shopping.Cart.Slices;

namespace Shopping.Cart.Infrastructure;

public class RecurringProcessorBackgroundTask(
    CartPublisherProcessor cartPublisherProcessor, 
    ArchiveItemSchedulerProcessor archiveItemSchedulerProcessor) : IHostedService, IDisposable
{
    private Timer? timer;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        timer = new Timer(
            callback: async _ => 
            {
                Console.WriteLine("Recurring processor started");
                await cartPublisherProcessor.RunAsync();
                await archiveItemSchedulerProcessor.RunAsync();
            }, 
            state: null,
            dueTime: TimeSpan.Zero, 
            period: TimeSpan.FromSeconds(15));

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        timer?.Dispose();
    }
}