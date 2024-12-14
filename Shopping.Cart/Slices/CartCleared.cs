using Shopping.Cart.Aggregate;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record CartClearedCommand(Guid CartId);

public class ClearCartCommandHandler(IEventStore eventStore)
{
    public async Task Handle(CartCleared cleared)
    {
        object[] stream = await eventStore.ReadStream(cleared.CartId.ToString());

        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.Clear(cleared);

        await eventStore.AppendToStream(cartAggregate.CartId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }
}

public record CartCleared(Guid CartId);