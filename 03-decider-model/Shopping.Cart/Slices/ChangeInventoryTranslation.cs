namespace Shopping.Cart.Slices;

public record InventoryChangedExternal(Guid ProductId, int Inventory);

public class ChangeInventoryCommandHandler
{
    public object Handle(InventoryChangedExternal inventoryChangedModel)
    {
        InventoryChanged translatedEvent = new InventoryChanged(inventoryChangedModel.Inventory, inventoryChangedModel.ProductId);
        return translatedEvent;
    }
}

public record InventoryChanged(int Inventory, Guid ProductId);