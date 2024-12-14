using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record ProductInCart(Guid CartId, Guid ProductId);

public class CartsWithProductsProjector(IEventStore eventStore)
{
    public async Task<IList<ProductInCart>> ProjectAsync()
    {
        object[] events = await eventStore.ReadAll();
        IDictionary<Guid, Guid> itemIdToProductIdMap = new Dictionary<Guid, Guid>();
        
        var result = events.Aggregate(new List<ProductInCart>(), (sv, @event) =>
        {
            switch (@event)
            {
                case ItemAdded itemAdded:
                    if (!sv.Any(x => x.CartId == itemAdded.CartId && x.ProductId == itemAdded.ProductId))
                    {
                        sv.Add(new ProductInCart(CartId: itemAdded.CartId, ProductId: itemAdded.ProductId));
                    }
                    itemIdToProductIdMap[itemAdded.ItemId] = itemAdded.ProductId;
                    break;
                case ItemRemoved itemRemoved:
                    sv.RemoveAll(x => x.CartId == itemRemoved.CartId && x.ProductId == itemIdToProductIdMap[itemRemoved.ItemId]);
                    itemIdToProductIdMap.Remove(itemRemoved.ItemId);
                    break;
                case ItemArchived itemArchived:
                    sv.RemoveAll(x => x.CartId == itemArchived.CartId && x.ProductId == itemIdToProductIdMap[itemArchived.ItemId]);
                    itemIdToProductIdMap.Remove(itemArchived.ItemId);
                    break;
                case CartClearedCommand cartCleared:
                    var productIdsToRemoveFromMap = sv.Where(x => x.CartId == cartCleared.CartId).ToList();
                    sv.RemoveAll(x => x.CartId == cartCleared.CartId);
                    ClearItemIds(productIdsToRemoveFromMap, itemIdToProductIdMap);
                    break;
            }

            return sv;
        });

        return result;
    }

    private static void ClearItemIds(List<ProductInCart> productsOfCart, IDictionary<Guid, Guid> itemIdToProductIdMap)
    {
        foreach (var productInCart in productsOfCart)
        {
            var itemIdsToRemove = itemIdToProductIdMap.Where(x => x.Value == productInCart.ProductId);
            foreach (var itemIdToRemove in itemIdsToRemove)
            {
                itemIdToProductIdMap.Remove(itemIdToRemove);                            
            }
        }
    }
}