using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class RemoveItemCommandTests
{
    [Test]
    public void RemoveItemTest()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000002");
        
        object[] given = [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image",  10, itemId, Guid.NewGuid()),
        ];
        RemoveItemCommandHandler removeItemCommandHandler = new RemoveItemCommandHandler();
        var uncommittedEvents = removeItemCommandHandler.Handle(given, new RemoveItemCommand(itemId, cartId));
        
        Assert.That(uncommittedEvents[0], Is.TypeOf<ItemRemoved>());
    }
    
    [Test]
    public void RemoveItemWhichWasAlreadyRemovedThrowsException()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000002");
        
        object[] given = [
            new CartCreated( CartId: cartId),
            new ItemAdded(CartId: cartId, Description: "Description", Image: "Image", Price: 10, ItemId: itemId, ProductId: Guid.NewGuid()),
            new ItemRemoved(itemId, cartId),
        ];
        RemoveItemCommandHandler removeItemCommandHandler = new RemoveItemCommandHandler();
        
        Assert.Throws<ItemCanNotBeRemovedException>(() =>
        {
            removeItemCommandHandler.Handle(given, new RemoveItemCommand(
                ItemId: itemId,
                CartId: cartId
            ));
        });
    }
}