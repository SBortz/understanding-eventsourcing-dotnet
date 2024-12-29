using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class CartWithProductsSVTests
{
    private InMemoryEventStore inMemoryEventStore;

    [SetUp]
    public void Setup()
    {
        inMemoryEventStore = new InMemoryEventStore(new EventSerializer(new EventTypeMapping()));
    }

    [Test]
    public async Task CartShouldContainProductIdOfAddedItem()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId = new Guid("00000000-0000-0000-0000-000000000002");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId),
        ]);
        
        CartsWithProductsProjector cartsWithProductsProjector = new CartsWithProductsProjector(inMemoryEventStore);
        IList<ProductInCart> stateView = await cartsWithProductsProjector.ProjectAsync();
        
        Assert.That(stateView.Count, Is.EqualTo(1));
        Assert.That(stateView[0].CartId, Is.EqualTo(cartId));
        Assert.That(stateView[0].ProductId, Is.EqualTo(productId));
    }
    
    [Test]
    public async Task ArchivedItemsShouldBeRemovedFromList()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId = new Guid("00000000-0000-0000-0000-000000000002");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, itemId, productId),
            new ItemArchived(cartId, itemId),
        ]);
        
        CartsWithProductsProjector cartsWithProductsProjector = new CartsWithProductsProjector(inMemoryEventStore);
        IList<ProductInCart> stateView = await cartsWithProductsProjector.ProjectAsync();
        
        Assert.That(stateView.Count, Is.EqualTo(0));
    }    
    
    [Test]
    public async Task RemovedItemsShouldBeRemovedFromList()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId = new Guid("00000000-0000-0000-0000-000000000002");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, itemId, productId),
            new ItemRemoved(itemId, cartId),
        ]);
        
        CartsWithProductsProjector cartsWithProductsProjector = new CartsWithProductsProjector(inMemoryEventStore);
        IList<ProductInCart> stateView = await cartsWithProductsProjector.ProjectAsync();
        
        Assert.That(stateView.Count, Is.EqualTo(0));
    }
    
    [Test]
    public async Task CartClearedShouldRemoveItemsFromList()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new CartClearedCommand(cartId),
        ]);
        
        CartsWithProductsProjector cartsWithProductsProjector = new CartsWithProductsProjector(inMemoryEventStore);
        IList<ProductInCart> stateView = await cartsWithProductsProjector.ProjectAsync();
        
        Assert.That(stateView.Count, Is.EqualTo(0));
    }
}