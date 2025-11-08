using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record InventoryChangedExternal(Guid ProductId, int Inventory);

public class ChangeInventoryCommandHandler(IEventStore eventStore)
{
    public async Task HandleAsync(InventoryChangedExternal inventoryChangedModel)
    {
        InventoryChanged translatedEvent = new InventoryChanged(inventoryChangedModel.Inventory, inventoryChangedModel.ProductId);

        await eventStore.AppendToStream("inventories", [translatedEvent]);
    }
}

public record InventoryChanged(int Inventory, Guid ProductId);