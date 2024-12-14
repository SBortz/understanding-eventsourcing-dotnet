using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class ChangeInventoryTranslationTests
{
    private InMemoryEventStore inMemoryEventStore;

    [SetUp]
    public void Setup()
    {
        inMemoryEventStore = new InMemoryEventStore(new EventSerializer(new EventTypeMapping()));
    }
    
    [Test]
    public async Task Test()
    {
        ChangeInventoryCommandHandler changeInventoryCommandHandler = new ChangeInventoryCommandHandler(inMemoryEventStore);
        await changeInventoryCommandHandler.HandleAsync(new InventoryChangedExternal(new Guid("00000000-0000-0000-0000-000000000001"), 1));

        object[] result = await inMemoryEventStore.ReadStream("inventories");
        Assert.That(result.First(), Is.TypeOf<InventoryChanged>());
        Assert.That((result[0] as InventoryChanged).ProductId, Is.EqualTo(new Guid("00000000-0000-0000-0000-000000000001")));
        Assert.That((result[0] as InventoryChanged).Inventory, Is.EqualTo(1));
    }
}