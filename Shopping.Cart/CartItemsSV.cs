using Shopping.Cart.EventStore;

namespace Shopping.Cart;

public class CartItemsStateView
{
    public Guid AggregateId { get; set; }
    public double TotalPrice { get; set; }
    
    public IList<CartItems> CartItems { get; set; }  = new List<CartItems>();
}

public class CartItems
{
    public Guid AggregateId { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public double Price { get; set; }
    public Guid ItemId { get; set; }
    public Guid ProductId { get; set; }
}

public class CartItemsStateViewHandler(IEventStore eventStore)
{
    public async Task<CartItemsStateView> Handle(string aggregateId)
    {
        object[] events = await eventStore.ReadStream(aggregateId);
        return events.Aggregate(new CartItemsStateView(), (sv, @event) =>
        {
            switch (@event)
            {
                case CartCreated cartCreated:
                    sv.AggregateId = cartCreated.AggregateId;
                    break;
                case ItemAdded itemAdded:
                    sv.CartItems.Add(new CartItems()
                    {
                        ItemId = itemAdded.ItemId,
                        AggregateId = itemAdded.AggregateId,
                        Description = itemAdded.Description,
                        Image = itemAdded.Image,
                        Price = itemAdded.Price,
                        ProductId = itemAdded.ProductId
                    });
                    break;
            }

            return sv;
        });
    }
}