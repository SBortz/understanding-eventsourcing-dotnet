using Shopping.Cart.EventStore;

namespace Shopping.Cart;


public record AddItemCommand(
    Guid AggregateId,
    string? Description,
    string? Image,
    double Price,
    double TotalPrice,
    Guid ItemId,
    Guid ProductId
);


public class AddItemCommandHandler(IEventStore eventStore)
{
    public async Task Handle(AddItemCommand command)
    {
        object[] stream = await eventStore.ReadStream(command.AggregateId.ToString());
        
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.AddItem(command);
        
        await eventStore.AppendToStream(cartAggregate.AggregateId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }
}

public class CartAggregate
{
    private Guid? aggregateId;
    private readonly IList<Guid> cartItems = new List<Guid>();

    public Guid? AggregateId => aggregateId;
    public IList<object>? UncommittedEvents { get; private set; } = new List<object>();

    public CartAggregate(object[] stream)
    {
        Hydrate(stream);
    }

    private void Hydrate(object[] stream)
    {
        foreach (var @event in stream)
        {
            switch (@event)
            {
                case CartCreated cartCreated:
                    this.ApplyEvent(cartCreated);
                    break;
                case ItemAdded itemAdded:
                    this.ApplyEvent(itemAdded);
                    break;
            }
        }

        this.UncommittedEvents = new List<object>();
    }

    public void AddItem(AddItemCommand command)
    {
        if (this.aggregateId == null)
        {
            this.ApplyEvent(new CartCreated(command.AggregateId));
        }

        if (cartItems.Count >= 3)
        {
            throw new TooManyItemsInCartException(this.aggregateId, command.ItemId);
        }
        
        this.ApplyEvent(new ItemAdded( 
            AggregateId: command.AggregateId, 
            Description: command.Description, 
            Image: command.Image, 
            Price: command.Price, 
            ItemId: command.ItemId,
            ProductId: command.ProductId));
    }

    private void ApplyEvent(CartCreated cartCreated)
    {
        this.aggregateId = cartCreated.AggregateId;

        this.UncommittedEvents?.Add(cartCreated);
    }
    
    private void ApplyEvent(ItemAdded itemAdded)
    {
        this.cartItems.Add(itemAdded.ItemId);

        this.UncommittedEvents?.Add(itemAdded);
    }
}

public class TooManyItemsInCartException(Guid? aggregateId, Guid itemId)
    : Exception($"Can only add 3 items to cart {aggregateId}. Item {itemId} could not be added.");

public record CartCreated(
    Guid AggregateId
    );

public record ItemAdded(
    Guid AggregateId,
    string? Description,
    string? Image,
    double Price,
    Guid ItemId,
    Guid ProductId);