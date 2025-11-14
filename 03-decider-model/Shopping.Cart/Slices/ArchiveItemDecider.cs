using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record ArchiveItemCommand(Guid CartId, Guid ProductId);

public class ArchiveItemDecider : IDecider<ArchiveItemCommand, Domain.Cart>
{
    public IList<object> Handle(Domain.Cart state, ArchiveItemCommand command)
    {
        return [
            new ItemArchived(CartId: state.CartId.Value, ItemId: command.ProductId)
        ];
    }
}

public record ItemArchived(Guid CartId, Guid ItemId);