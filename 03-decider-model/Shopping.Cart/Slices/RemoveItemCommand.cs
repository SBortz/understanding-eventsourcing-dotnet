using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record RemoveItemCommand(Guid ItemId, Guid CartId);

public class RemoveItemCommandHandler : ICommandHandler<RemoveItemCommand>
{
    public IList<object> Handle(object[] stream, RemoveItemCommand command)
    {
        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);

        if (!state.CartItems.ContainsKey(command.ItemId))
        {
            throw new ItemCanNotBeRemovedException(command.ItemId);
        }

        return [new ItemRemoved(command.ItemId, command.CartId)];
    }
}

public class ItemCanNotBeRemovedException(Guid itemId)
    : Exception($"Item {itemId} can not be removed, since it is not part of the list.");

public record ItemRemoved(
    Guid ItemId,
    Guid CartId);