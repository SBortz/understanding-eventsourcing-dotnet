using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record RemoveItemCommand(Guid ItemId, Guid CartId);

public class RemoveItemCommandHandler(IEventStore eventStore)
{
    public async Task Handle(RemoveItemCommand command)
    {
        object[] stream = await eventStore.ReadStream(command.CartId.ToString());

        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.RemoveItem(command);

        await eventStore.AppendToStream(cartAggregate.CartId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }
}

public class ItemCanNotBeRemovedException(Guid itemId)
    : Exception($"Item {itemId} can not be removed, since it is not part of the list.");

public record ItemRemoved(
    Guid ItemId,
    Guid CartId);