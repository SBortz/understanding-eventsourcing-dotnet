using Shopping.Cart.Domain;

namespace Shopping.Cart.Slices;

public record RemoveItemCommand(Guid ItemId, Guid CartId);

public static class RemoveItemDecider
{
    public static IList<object> Handle(Domain.Cart state, RemoveItemCommand command)
    {
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