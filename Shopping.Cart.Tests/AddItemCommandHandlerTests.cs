using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class AddItemCommandHandlerTests
{
    private InMemoryEventStore inMemoryEventStore;

    [SetUp]
    public void Setup()
    {
        inMemoryEventStore = new InMemoryEventStore(new EventSerializer(new EventTypeMapping()));
    }
    
    [Test]
    public async Task CartSessionCreatedAutomatically()
    {
        AddItemCommandHandler commandHandler = new AddItemCommandHandler(inMemoryEventStore);
        
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        await commandHandler.Handle(new AddItemCommand(
            cartId,
            "Description",
            "Image",
            10,
            10,
            Guid.NewGuid(),
            Guid.NewGuid()));

        object[] stream = await this.inMemoryEventStore.ReadStream(cartId.ToString());
        Assert.That(stream[0], Is.TypeOf<CartCreated>());
        Assert.That(stream[1], Is.TypeOf<ItemAdded>());
    }
    
    [Test]
    public async Task AddsMaximum3Items()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        
        object[] given = [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
        ];
        
        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), given);
        
        AddItemCommandHandler commandHandler = new AddItemCommandHandler(inMemoryEventStore);
        
        Assert.ThrowsAsync<TooManyItemsInCartException>(async () =>
        {
            await commandHandler.Handle(new AddItemCommand(
                cartId,
                "Description",
                "Image",
                10,
                10,
                Guid.NewGuid(),
                Guid.NewGuid()));
        });
    }
}