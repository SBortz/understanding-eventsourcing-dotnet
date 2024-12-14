namespace Shopping.Cart.Tests;

public class Tests
{
    [Test]
    public void CartSessionCreatedAutomatically()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        
        object[] given = [];
        
        CartAggregate cartAggregate = new CartAggregate(given);
        cartAggregate.AddItem(
            new AddItem(
                cartId,
                "Description",
                "Image",
                10,
                10,
                Guid.NewGuid(),
                Guid.NewGuid()));
        
        Assert.That(cartAggregate.UncommittedEvents!.First(), Is.TypeOf<CartCreated>());
    }
    
    [Test]
    public void AddsMaximum3Items()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        
        object[] given = [
            new CartCreated( AggregateId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), Guid.NewGuid()),
        ];
        
        CartAggregate cartAggregate = new CartAggregate(given);
        Assert.Throws<TooManyItemsInCartException>(() =>
        {
            cartAggregate.AddItem(
                new AddItem(
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