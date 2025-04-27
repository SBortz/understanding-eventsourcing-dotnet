using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class CartClearedTests
{
    [Test]
    public void ClearCartTest()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid itemId = new Guid("00000000-0000-0000-0000-000000000002");
        
        object[] given = [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10,  itemId, Guid.NewGuid()),
        ];
        ClearCartCommandHandler clearCartCommandHandler = new ClearCartCommandHandler();
        IList<object> uncommittedEvents = clearCartCommandHandler.Handle(given, new CartClearedCommand(
            cartId
        ));        
        
        Assert.That(uncommittedEvents[0], Is.TypeOf<CartCleared>());
    }
}