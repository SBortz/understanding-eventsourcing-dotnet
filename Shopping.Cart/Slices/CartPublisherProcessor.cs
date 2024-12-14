namespace Shopping.Cart.Slices;

public class CartPublisherProcessor(
    SubmittedCartDataProjector submittedCartDataProjector, 
    PublishCartCommandHandler publishCartCommandHandler,
    ILogger<CartPublisherProcessor> logger)
{
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    public async Task RunAsync()
    {
        try
        {
            await this._semaphore.WaitAsync();

            IList<SubmittedCartDataSV> cartsToBePublished = await submittedCartDataProjector.ProjectAsync();

            LogTodoList(cartsToBePublished);

            foreach (SubmittedCartDataSV cartToBePublished in cartsToBePublished)
            {
                await publishCartCommandHandler.HandleAsync(new PublishCartCommand(cartToBePublished.CartId, 
                    cartToBePublished
                        .OrderedProducts
                        .Select(x => new PublishCartCommand.OrderedProduct(x.ProductId, x.Price)),
                    cartToBePublished.TotalPrice));
            }
            
            logger.LogInformation("ArchiveItemSchedulerProcessor executed");
        }
        finally
        {
            this._semaphore.Release();
        }
    }

    private void LogTodoList(IList<SubmittedCartDataSV> cartsToBePublished)
    {
        var todoListLog = string.Join(Environment.NewLine, cartsToBePublished.Select(cart =>
            $"CartId: {cart.CartId}, TotalPrice: {cart.TotalPrice}, OrderedProducts: [{string.Join(", ", cart.OrderedProducts.Select(p => $"ProductId: {p.ProductId}, Price: {p.Price}"))}]"));
        logger.LogInformation("Todo List for Publishing: {TodoList}", todoListLog);
    }
}

