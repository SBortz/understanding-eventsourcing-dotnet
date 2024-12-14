using Shopping.Cart.Aggregate;
using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class RemoveItemCommandAggregateTests
{
    private InMemoryEventStore inMemoryEventStore;

    [SetUp]
    public void Setup()
    {
        inMemoryEventStore = new InMemoryEventStore(new EventSerializer(new EventTypeMapping()));
    }
    
    [Test]
    public async Task RemoveItemTest()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000002");
        
        object[] given = [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image",  10, itemId, Guid.NewGuid()),
        ];
        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), given);
        RemoveItemCommandHandler removeItemCommandHandler = new RemoveItemCommandHandler(inMemoryEventStore);
        await removeItemCommandHandler.Handle(new RemoveItemCommandAggregate(itemId, cartId));
        
        object[] stream = await this.inMemoryEventStore.ReadStream(cartId.ToString());
        Assert.That(stream[2], Is.TypeOf<ItemRemoved>());
    }
    
    [Test]
    public async Task RemoveItemWhichWasAlreadyRemovedThrowsException()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000002");
        
        object[] given = [
            new CartCreated( CartId: cartId),
            new ItemAdded(CartId: cartId, Description: "Description", Image: "Image", Price: 10, ItemId: itemId, ProductId: Guid.NewGuid()),
            new ItemRemoved(itemId, cartId),
        ];
        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), given);
        RemoveItemCommandHandler removeItemCommandHandler = new RemoveItemCommandHandler(inMemoryEventStore);
        
        Assert.ThrowsAsync<ItemCanNotBeRemovedException>(async () =>
        {
            await removeItemCommandHandler.Handle(new RemoveItemCommandAggregate(
                ItemId: itemId,
                CartId: cartId
            ));
        });
    }
}