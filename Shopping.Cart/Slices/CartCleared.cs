using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record CartClearedCommand(Guid CartId);

public class ClearCartCommandHandler : ICommandHandler<CartClearedCommand>
{
    public IList<object> Handle(object[] stream, CartClearedCommand removeItemCommand)
    {
        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        
        return [new CartCleared(state.CartId.Value)];
    }
}

public record CartCleared(Guid CartId);