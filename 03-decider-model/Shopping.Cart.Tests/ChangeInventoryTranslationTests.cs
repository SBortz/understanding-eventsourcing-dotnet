using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class ChangeInventoryTranslationTests
{
    [Test]
    public void Test()
    {
        ChangeInventoryCommandHandler changeInventoryCommandHandler = new ChangeInventoryCommandHandler();
        var uncommittedEvent = changeInventoryCommandHandler.Handle(new InventoryChangedExternal(new Guid("00000000-0000-0000-0000-000000000001"), 1));

        Assert.That(uncommittedEvent, Is.TypeOf<InventoryChanged>());
        Assert.That((uncommittedEvent as InventoryChanged)!.ProductId, Is.EqualTo(new Guid("00000000-0000-0000-0000-000000000001")));
        Assert.That((uncommittedEvent as InventoryChanged)!.Inventory, Is.EqualTo(1));
    }
}