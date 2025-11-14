using Shopping.Cart.Domain;

namespace Shopping.Cart.Slices;

public record ArchiveItemCommand(Guid CartId, Guid ProductId);

public static class ArchiveItemDecider
{
    public static IList<object> Handle(Domain.Cart state, ArchiveItemCommand command)
    {
        return [
            new ItemArchived(CartId: state.CartId.Value, ItemId: command.ProductId)
        ];
    }
}

public record ItemArchived(Guid CartId, Guid ItemId);