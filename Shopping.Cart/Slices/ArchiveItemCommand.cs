using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record ArchiveItemCommand(Guid CartId, Guid ProductId);

public class ArchiveItemCommandHandler : ICommandHandler<ArchiveItemCommand>
{
    public IList<object> Handle(object[] stream, ArchiveItemCommand archiveItemCommand)
    {
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.ArchiveItem(archiveItemCommand);
        
        return cartAggregate.UncommittedEvents;
    }
}

public record ItemArchived(Guid CartId, Guid ItemId);