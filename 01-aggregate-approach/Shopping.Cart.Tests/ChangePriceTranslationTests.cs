using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class ChangePriceTranslationTests
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
        ChangePriceCommandHandler changePriceCommandHandler = new ChangePriceCommandHandler(inMemoryEventStore);
        await changePriceCommandHandler.HandleAsync(new PriceChangedExternal(new Guid("00000000-0000-0000-0000-000000000001"), 20, 25));

        object[] result = await inMemoryEventStore.ReadStream("pricing");
        Assert.That(result[0], Is.TypeOf<PriceChanged>());
        Assert.That((result[0] as PriceChanged).ProductId, Is.EqualTo(new Guid("00000000-0000-0000-0000-000000000001")));
        Assert.That((result[0] as PriceChanged).OldPrice, Is.EqualTo(20));
        Assert.That((result[0] as PriceChanged).NewPrice, Is.EqualTo(25));
    }
}