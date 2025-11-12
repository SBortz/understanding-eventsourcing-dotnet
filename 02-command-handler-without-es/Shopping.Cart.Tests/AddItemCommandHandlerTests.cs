using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class AddItemCommandHandlerTests
{
    [Test]
    public void CartSessionCreatedAutomatically()
    {
        AddItemCommandHandler commandHandler = new AddItemCommandHandler();
        
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");

        object[] stream = [];
        var uncommittedEvents = commandHandler.Handle(stream, new AddItemCommand(
            cartId,
            "Description",
            "Image",
            10,
            Guid.NewGuid(),
            Guid.NewGuid()));

        Assert.That(uncommittedEvents.ElementAt(0), Is.TypeOf<CartCreated>());
        Assert.That(uncommittedEvents.ElementAt(1), Is.TypeOf<ItemAdded>());
    }
    
    [Test]
    public void AddsMaximum3Items()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");

        object[] stream = new object[]
        {
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
        };
        
        AddItemCommandHandler commandHandler = new AddItemCommandHandler();

        Assert.Throws<TooManyItemsInCartException>(() =>
        {
            commandHandler.Handle(stream, new AddItemCommand(
                cartId,
                "Description",
                "Image",
                10,
                Guid.NewGuid(),
                Guid.NewGuid()));
        });
    }
}