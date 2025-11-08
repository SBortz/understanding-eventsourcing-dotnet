using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record RemoveItemCommand(Guid ItemId, Guid CartId);

public class RemoveItemCommandHandler : ICommandHandler<RemoveItemCommand>
{
    public IList<object> Handle(object[] stream, RemoveItemCommand command)
    {
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.RemoveItem(command);

        return cartAggregate.UncommittedEvents;
    }
}

public class ItemCanNotBeRemovedException(Guid itemId)
    : Exception($"Item {itemId} can not be removed, since it is not part of the list.");

public record ItemRemoved(
    Guid ItemId,
    Guid CartId);