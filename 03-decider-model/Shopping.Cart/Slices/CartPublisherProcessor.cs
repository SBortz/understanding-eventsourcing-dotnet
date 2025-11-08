using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public class CartPublisherProcessor(
    IEventStore eventStore,
    SubmittedCartDataProjector submittedCartDataProjector, 
    PublishCartCommandHandler publishCartCommandHandler,
    ILogger<CartPublisherProcessor> logger)
{
    private readonly SemaphoreSlim semaphore = new(1, 1);
    public async Task RunAsync()
    {
        try
        {
            await semaphore.WaitAsync();

            object[] stream = await eventStore.ReadAll();
            IList<SubmittedCartDataSV> cartsToBePublished = submittedCartDataProjector.Project(stream);

            LogTodoList(cartsToBePublished);

            foreach (SubmittedCartDataSV cartToBePublished in cartsToBePublished)
            {
                object[] cartStream = await eventStore.ReadStream(cartToBePublished.CartId.ToString());
                
                IEnumerable<object> uncommittedEvents = await publishCartCommandHandler.HandleAsync(cartStream, new PublishCartCommand(cartToBePublished.CartId, 
                    cartToBePublished
                        .OrderedProducts
                        .Select(x => new PublishCartCommand.OrderedProduct(x.ProductId, x.Price)),
                    cartToBePublished.TotalPrice));
                
                await eventStore.AppendToStream(cartToBePublished.CartId.ToString(), uncommittedEvents);
            }
            
            logger.LogInformation("ArchiveItemSchedulerProcessor executed");
        }
        finally
        {
            semaphore.Release();
        }
    }

    private void LogTodoList(IList<SubmittedCartDataSV> cartsToBePublished)
    {
        var todoListLog = string.Join(Environment.NewLine, cartsToBePublished.Select(cart =>
            $"CartId: {cart.CartId}, TotalPrice: {cart.TotalPrice}, OrderedProducts: [{string.Join(", ", cart.OrderedProducts.Select(p => $"ProductId: {p.ProductId}, Price: {p.Price}"))}]"));
        logger.LogInformation("Todo List for Publishing: {TodoList}", todoListLog);
    }
}

