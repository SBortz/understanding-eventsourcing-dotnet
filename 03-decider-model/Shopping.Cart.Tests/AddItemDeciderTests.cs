using Shopping.Cart.Domain;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class AddItemDeciderTests
{
    [Test]
    public void CartSessionCreatedAutomatically()
    {
        AddItemDecider decider = new AddItemDecider();
        
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");

        object[] stream = [];
        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        var uncommittedEvents = decider.Handle(state, new AddItemCommand(
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
        
        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        AddItemDecider decider = new AddItemDecider();

        Assert.Throws<TooManyItemsInCartException>(() =>
        {
            decider.Handle(state, new AddItemCommand(
                cartId,
                "Description",
                "Image",
                10,
                Guid.NewGuid(),
                Guid.NewGuid()));
        });
    }
}