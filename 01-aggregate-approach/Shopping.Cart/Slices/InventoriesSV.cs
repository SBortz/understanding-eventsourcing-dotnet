using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public class InventoriesProjector(IEventStore eventStore)
{
    public async Task<IDictionary<Guid, int>> ProjectAsync()
    {
        object[] events = await eventStore.ReadStream("inventories");
        return events.Aggregate(new Dictionary<Guid, int>(), (sv, @event) =>
        {
            switch (@event)
            {
                case InventoryChanged inventoryChanged:
                    sv[inventoryChanged.ProductId] = inventoryChanged.Inventory;
                    break;
            }

            return sv;
        });
    }
}