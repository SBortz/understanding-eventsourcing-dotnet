namespace Shopping.Cart.Slices;

public class ArchiveItemSchedulerProcessor(ChangedPricesProjector changedPricesProjector, 
    ArchiveItemCommandHandler archiveItemCommandHandler,
    CartsWithProductsProjector cartsWithProductsProjector,
    ILogger<ArchiveItemSchedulerProcessor> logger)
{
    private readonly SemaphoreSlim semaphore = new(1, 1);
    
    public async Task RunAsync()
    {
        try
        {
            await semaphore.WaitAsync();
            
            IDictionary<Guid, ChangedPrice> productsToArchive = await changedPricesProjector.ProjectAsync();
            IList<ProductInCart> productsInCarts = await cartsWithProductsProjector.ProjectAsync();
            
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
                        await archiveItemCommandHandler.HandleAsync(new ArchiveItemCommand(CartId: productInCartToArchive.CartId, ProductId: changedPrice.Key));                    
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