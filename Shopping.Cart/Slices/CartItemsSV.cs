using Shopping.Cart.Aggregate;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public class CartItemsStateView
{
    public Guid CartId { get; set; }
    public double TotalPrice { get; set; }
    
    public IList<CartItem> CartItems { get; set; }  = new List<CartItem>();
}

public class CartItem
{
    public Guid CartId { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public double Price { get; set; }
    public Guid ItemId { get; set; }
    public Guid ProductId { get; set; }
}

public class CartItemsProjector(IEventStore eventStore)
{
    public async Task<CartItemsStateView> Projects(string cartId)
    {
        object[] events = await eventStore.ReadStream(cartId);
        return events.Aggregate(new CartItemsStateView(), (sv, @event) =>
        {
            switch (@event)
            {
                case CartCreated cartCreated:
                    sv.CartId = cartCreated.CartId;
                    break;
                case ItemAdded itemAdded:
                    sv.CartItems.Add(new CartItem()
                    {
                        ItemId = itemAdded.ItemId,
                        CartId = itemAdded.CartId,
                        Description = itemAdded.Description,
                        Image = itemAdded.Image,
                        Price = itemAdded.Price,
                        ProductId = itemAdded.ProductId
                    });
                    sv.TotalPrice += itemAdded.Price;
                    break;
                case ItemRemoved itemRemoved:
                    var itemToRemove = sv.CartItems.First(x => x.ItemId == itemRemoved.ItemId);
                    sv.TotalPrice -= itemToRemove.Price;
                    sv.CartItems.Remove(sv.CartItems.First(x => x.ItemId == itemRemoved.ItemId));
                    break;
                case CartClearedCommand:
                    sv.CartItems.Clear();
                    break;
                case ItemArchived itemArchived:
                    sv.CartItems.Remove(sv.CartItems.First(x => x.ItemId == itemArchived.ItemId));
                    break;
            }

            return sv;
        });
    }
}