using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public class ArchiveItemSchedulerProcessor(IEventStore eventStore, 
    ChangedPricesProjector changedPricesProjector, 
    ILogger<ArchiveItemSchedulerProcessor> logger)
{
    private readonly SemaphoreSlim semaphore = new(1, 1);
    
    public async Task RunAsync()
    {
        try
        {
            await semaphore.WaitAsync();
            
            object[] pricingStream = await eventStore.ReadStream("pricing");
            IDictionary<Guid, ChangedPrice> productsToArchive = changedPricesProjector.Project(pricingStream);
            object[] all = await eventStore.ReadAll();
            IList<ProductInCart> productsInCarts = CartsWithProductsProjector.Project(all);
            
            LogItemsToArchive(productsToArchive);
            LogProductsInCart(productsInCarts);

            foreach (KeyValuePair<Guid, ChangedPrice> changedPrice in productsToArchive)
            {
                if (productsInCarts.Any(x => x.ProductId == changedPrice.Key))
                {
                    var productsInCartToArchive = productsInCarts
                        .Where(x => x.ProductId == changedPrice.Key)
                        .ToList();

                    foreach (ProductInCart productInCartToArchive in productsInCartToArchive)
                    {
                        object[] stream = await eventStore.ReadStream(productInCartToArchive.CartId.ToString());
                        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
                        
                        var uncommittedEvents = ArchiveItemDecider.Handle(state, new ArchiveItemCommand(CartId: productInCartToArchive.CartId, ProductId: changedPrice.Key));
                        
                        await eventStore.AppendToStream(productInCartToArchive.CartId.ToString(), uncommittedEvents);
                    }
                } 
            }
            
            logger.LogInformation("ArchiveItemSchedulerProcessor executed");
        }
        finally
        {
            this.semaphore.Release();
        }
    }

    private void LogProductsInCart(IList<ProductInCart> productsInCarts)
    {
        var productsInCartsLog = string.Join(Environment.NewLine, productsInCarts.Select(p =>
            $"CartId: {p.CartId}, ProductId: {p.ProductId}"));
        logger.LogInformation("Products in Carts: {ProductsInCarts}", productsInCartsLog);
    }

    private void LogItemsToArchive(IDictionary<Guid, ChangedPrice> todoList)
    {
        var todoListLog = string.Join(Environment.NewLine, todoList.Select(kvp =>
            $"ProductId: {kvp.Key}, NewPrice: {kvp.Value.NewPrice}, OldPrice: {kvp.Value.OldPrice}"));
        logger.LogInformation("Todo List of Changed Prices: {TodoList}", todoListLog);
    }
}