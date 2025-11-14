using Shopping.Cart.Domain;

namespace Shopping.Cart.Slices;

public record CartClearedCommand(Guid CartId);

public static class ClearCartDecider
{
    public static IList<object> Handle(Domain.Cart state, CartClearedCommand command)
    {
        return [new CartCleared(state.CartId.Value)];
    }
}

public record CartCleared(Guid CartId);