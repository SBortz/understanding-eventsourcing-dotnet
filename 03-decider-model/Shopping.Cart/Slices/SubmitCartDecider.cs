using Shopping.Cart.Domain;

namespace Shopping.Cart.Slices;
public record SubmitCartCommand(Guid CartId, IList<SubmitCartCommand.OrderedProduct> OrderedProducts)
{
    public record OrderedProduct(Guid ProductId, double TotalPrice);
}

public static class SubmitCartDecider
{
    public static IList<object> Handle(Domain.Cart state, IDictionary<Guid, int> inventoriesSV, SubmitCartCommand submitCart)
    {
        CheckInventory(state, inventoriesSV);
        
        if (!state.CartItems.Any())
        {
            throw new CannotSubmitEmptyCartException();
        }

        if (state.isSubmitted)
        {
            throw new CartCannotBeSubmittedTwiceException();
        }

        return [new CartSubmitted(
            CartId: state.CartId.Value,
            OrderedProducts: state.CartItems
                .Select(cartItem =>
                    new CartSubmitted.OrderedProduct(
                        cartItem.Value,
                        state.productPrice[cartItem.Value])),
            TotalPrice: state.CartItems
                .Select(cartItem =>
                    state.productPrice[cartItem.Value])
                .Sum())];
    }

    private static void CheckInventory(Domain.Cart state, IDictionary<Guid, int> inventoriesSV)
    {
        foreach (var cartItemsProductId in state.CartItems)
        {
            if (!inventoriesSV.ContainsKey(cartItemsProductId.Value) || inventoriesSV[cartItemsProductId.Value] <= 0)
            {
                throw new NotEnoughInStockException();
            }
        }
    }
}

public record CartSubmitted(Guid CartId, IEnumerable<CartSubmitted.OrderedProduct> OrderedProducts, double TotalPrice)
{
    public record OrderedProduct(Guid ProductId, double Price);
}

public class NotEnoughInStockException : Exception;
public class CartCannotBeSubmittedTwiceException() : Exception($"Cart cannot be submitted twice.");
public class CannotSubmitEmptyCartException() : Exception($"Empty Cart cannot be submitted.");

