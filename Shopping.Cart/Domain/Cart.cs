using Shopping.Cart.Slices;

namespace Shopping.Cart.Domain;

public record Cart(
    Guid? cartId,
    IDictionary<Guid, Guid> cartItems,
    IDictionary<Guid, double> productPrice,
    bool isSubmitted,
    bool isPublished,
    bool publicationFailed)
{
    public static Cart Evolve(Cart state, object @event)
    {
        // Local static helper that removes the item with the given itemId
        // and its associated product price (if present).
        static (Dictionary<Guid, Guid> NewCartItems, Dictionary<Guid, double> NewProductPrice)
            RemoveItem(Cart state, Guid itemId)
        {
            // Make new dictionaries based on the existing state.
            var newCartItems = new Dictionary<Guid, Guid>(state.cartItems);
            var newProductPrice = new Dictionary<Guid, double>(state.productPrice);

            // Try to get the product id corresponding to the removed item.
            if (newCartItems.TryGetValue(itemId, out var productId))
            {
                newCartItems.Remove(itemId);
                newProductPrice.Remove(productId);
            }

            return (newCartItems, newProductPrice);
        }
        
        switch(@event)
        {
            case CartCreated cartCreated:
                return state with { cartId = cartCreated.CartId };
            case ItemAdded itemAdded:
                return state with
                {
                    cartItems = new Dictionary<Guid, Guid>(state.cartItems) { [itemAdded.ProductId] = itemAdded.ProductId },
                    productPrice = new Dictionary<Guid, double>(state.productPrice) { [itemAdded.ProductId] = itemAdded.Price }
                };
            case ItemRemoved itemRemoved:
            {
                var newCartItems = new Dictionary<Guid, Guid>(state.cartItems);
                var newProductPrice = new Dictionary<Guid, double>(state.productPrice);
                
                newCartItems.Remove(itemRemoved.ItemId);
                newProductPrice.Remove(newCartItems[itemRemoved.ItemId]);
                
                return state with
                {
                    cartItems = newCartItems,
                    productPrice = newProductPrice
                };
            }
            case ItemArchived itemArchived:
            {
                var newCartItems = new Dictionary<Guid, Guid>(state.cartItems);
                var newProductPrice = new Dictionary<Guid, double>(state.productPrice);
                
                newCartItems.Remove(itemArchived.ItemId);
                newProductPrice.Remove(newCartItems[itemArchived.ItemId]);
                
                return state with
                {
                    cartItems = newCartItems,
                    productPrice = newProductPrice
                };
            }
            case CartSubmitted cartSubmitted:
                return state with { isSubmitted = true };
            case CartCleared cartCleared:
                return state with { cartItems = new Dictionary<Guid, Guid>() };
            case CartPublished cartPublished:
                return state with { isPublished = true };
            case CartPublicationFailed cartPublicationFailed:
                return state with { publicationFailed = true };
            default: 
                return state;
        };
    }
        
}