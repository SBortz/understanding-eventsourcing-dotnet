using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record AddItemCommand(
    Guid CartId,
    string? Description,
    string? Image,
    double Price,
    Guid ItemId,
    Guid ProductId
);

public class AddItemCommandHandler(IEventStore eventStore)
{
    public async Task Handle(AddItemCommand command)
    {
        object[] stream = await eventStore.ReadStream(command.CartId.ToString());
        
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.AddItem(command);
        
        await eventStore.AppendToStream(cartAggregate.CartId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }
}

public class TooManyItemsInCartException(Guid? cartId, Guid itemId)
    : Exception($"Can only add 3 items to cart {cartId}. Item {itemId} could not be added.");

public record CartCreated(
    Guid CartId
    );

public record ItemAdded(
    Guid CartId,
    string? Description,
    string? Image,
    double Price,
    Guid ItemId,
    Guid ProductId);