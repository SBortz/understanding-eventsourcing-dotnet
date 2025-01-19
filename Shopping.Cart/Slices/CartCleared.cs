using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record CartClearedCommand(Guid CartId);

public class ClearCartCommandHandler : ICommandHandler<CartCleared>
{
    public IList<object> Handle(object[] stream, CartCleared removeItemCommand)
    {
        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        
        return [new CartClearedCommand(state.CartId.Value)];
    }
}

public record CartCleared(Guid CartId);