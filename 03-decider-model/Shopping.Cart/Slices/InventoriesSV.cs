using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public class InventoriesProjector
{
    public IDictionary<Guid, int> Project(object[] stream)
    {
        return stream.Aggregate(new Dictionary<Guid, int>(), (sv, @event) =>
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