using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;
public record SubmitCartCommand(Guid CartId, IList<SubmitCartCommand.OrderedProduct> OrderedProducts)
{
    public record OrderedProduct(Guid ProductId, double TotalPrice);
}

public class SubmitCartCommandHandler(IEventStore eventStore, InventoriesProjector inventoriesProjector)
{
    public async Task Handle(SubmitCartCommand submitCart)
    {
        object[] stream = await eventStore.ReadStream(submitCart.CartId.ToString());
        
        CartAggregate cartAggregate = new CartAggregate(stream);

        IDictionary<Guid, int> inventoriesSV = await inventoriesProjector.ProjectAsync();
        CheckInventory(cartAggregate, inventoriesSV);
        
        cartAggregate.SubmitCart(submitCart);
        
        await eventStore.AppendToStream(cartAggregate.CartId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }

    private static void CheckInventory(CartAggregate cartAggregate, IDictionary<Guid, int> inventoriesSV)
    {
        foreach (var cartItemsProductId in cartAggregate.CartItemsProductIds)
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

