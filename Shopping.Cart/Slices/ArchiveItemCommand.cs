using Shopping.Cart.Aggregate;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record ArchiveItemCommand(Guid CartId, Guid ProductId);

public class ArchiveItemCommandHandler(IEventStore eventStore)
{
    public async Task HandleAsync(ArchiveItemCommand archiveItemCommand)
    {
        object[] stream = await eventStore.ReadStream(archiveItemCommand.CartId.ToString());
        
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.ArchiveItem(archiveItemCommand);
        
        await eventStore.AppendToStream(cartAggregate.CartId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }
}

public record ItemArchived(Guid CartId, Guid ItemId);