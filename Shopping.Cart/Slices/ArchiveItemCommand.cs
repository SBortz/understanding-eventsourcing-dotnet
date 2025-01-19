using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record ArchiveItemCommand(Guid CartId, Guid ProductId);

public class ArchiveItemCommandHandler : ICommandHandler<ArchiveItemCommand>
{
    public IList<object> Handle(object[] stream, ArchiveItemCommand removeItemCommand)
    {
        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);

        return [
            new ItemArchived(CartId: state.CartId.Value, ItemId: removeItemCommand.ProductId)
        ];
    }
}

public record ItemArchived(Guid CartId, Guid ItemId);