using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class CartClearedTests
{
    private InMemoryEventStore inMemoryEventStore;

    [SetUp]
    public void Setup()
    {
        inMemoryEventStore = new InMemoryEventStore(new EventSerializer(new EventTypeMapping()));
    }
    
    [Test]
    public async Task ClearCartTest()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000002");
        
        object[] given = [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10,  itemId, Guid.NewGuid()),
        ];
        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), given);
        
        ClearCartCommandHandler clearCartCommandHandler = new ClearCartCommandHandler(inMemoryEventStore);
        await clearCartCommandHandler.Handle(new CartCleared(
            cartId
        ));        
        
        object[] stream = await this.inMemoryEventStore.ReadStream(cartId.ToString());
        Assert.That(stream[2], Is.TypeOf<CartClearedCommand>());
    }
}