using Shopping.Cart.Slices;

namespace Shopping.Cart.Domain;

public record Cart(
    Guid? CartId,
    IDictionary<Guid, Guid> CartItems,
    IDictionary<Guid, double> productPrice,
    bool isSubmitted,
    bool isPublished,
    bool publicationFailed)
{
    public static readonly Cart Initial = new Cart(null, new Dictionary<Guid, Guid>(),
        new Dictionary<Guid, double>(), false, false, false);
    
    public static Cart Evolve(Cart state, object @event)
    {
        switch(@event)
        {
            case CartCreated cartCreated:
                return state with { CartId = cartCreated.CartId };
            case ItemAdded itemAdded:
                return state with
                {
                    CartItems = new Dictionary<Guid, Guid>(state.CartItems) { [itemAdded.ItemId] = itemAdded.ProductId },
                    productPrice = new Dictionary<Guid, double>(state.productPrice) { [itemAdded.ProductId] = itemAdded.Price }
                };
            case ItemRemoved itemRemoved:
            {
                var newCartItems = new Dictionary<Guid, Guid>(state.CartItems);
                var newProductPrice = new Dictionary<Guid, double>(state.productPrice);
                
                newProductPrice.Remove(newCartItems[itemRemoved.ItemId]);
                newCartItems.Remove(itemRemoved.ItemId);
                
                return state with
                {
                    CartItems = newCartItems,
                    productPrice = newProductPrice
                };
            }
            case ItemArchived itemArchived:
            {
                var newCartItems = new Dictionary<Guid, Guid>(state.CartItems);
                var newProductPrice = new Dictionary<Guid, double>(state.productPrice);
                
                newCartItems.Remove(itemArchived.ItemId);
                newProductPrice.Remove(newCartItems[itemArchived.ItemId]);
                
                return state with
                {
                    CartItems = newCartItems,
                    productPrice = newProductPrice
                };
            }
            case CartSubmitted cartSubmitted:
                return state with { isSubmitted = true };
            case CartCleared cartCleared:
                return state with { CartItems = new Dictionary<Guid, Guid>() };
            case CartPublished cartPublished:
                return state with { isPublished = true };
            case CartPublicationFailed cartPublicationFailed:
                return state with { publicationFailed = true };
            default: 
                return state;
        };
    }
        
}