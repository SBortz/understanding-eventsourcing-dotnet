using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record CartClearedCommand(Guid CartId);

public class ClearCartDecider : IDecider<CartClearedCommand, Domain.Cart>
{
    public IList<object> Handle(Domain.Cart state, CartClearedCommand command)
    {
        return [new CartCleared(state.CartId.Value)];
    }
}

public record CartCleared(Guid CartId);