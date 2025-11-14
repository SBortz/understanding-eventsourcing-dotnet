using Shopping.Cart.Domain;
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
        Domain.Cart state = given.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        IList<object> uncommittedEvents = ClearCartDecider.Handle(state, new CartClearedCommand(
            cartId
        ));        
        
        Assert.That(uncommittedEvents[0], Is.TypeOf<CartCleared>());
    }
}