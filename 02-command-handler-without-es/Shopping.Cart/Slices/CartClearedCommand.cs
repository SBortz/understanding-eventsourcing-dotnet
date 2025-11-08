using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record CartClearedCommand(Guid CartId);

public class ClearCartCommandHandler : ICommandHandler<CartCleared>
{
    public IList<object> Handle(object[] stream, CartCleared cleared)
    {
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.Clear(cleared);

        return cartAggregate.UncommittedEvents.ToArray();
    }
}

public record CartCleared(Guid CartId);