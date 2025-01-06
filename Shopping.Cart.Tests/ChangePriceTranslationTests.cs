using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class ChangePriceTranslationTests
{
    [Test]
    public async Task Test()
    {
        ChangePriceCommandHandler changePriceCommandHandler = new ChangePriceCommandHandler();
        var uncommittedEvents = changePriceCommandHandler.Handle(new PriceChangedExternal(new Guid("00000000-0000-0000-0000-000000000001"), 20, 25));

        Assert.That(uncommittedEvents[0], Is.TypeOf<PriceChanged>());
        Assert.That((uncommittedEvents[0] as PriceChanged).ProductId, Is.EqualTo(new Guid("00000000-0000-0000-0000-000000000001")));
        Assert.That((uncommittedEvents[0] as PriceChanged).OldPrice, Is.EqualTo(20));
        Assert.That((uncommittedEvents[0] as PriceChanged).NewPrice, Is.EqualTo(25));
    }
}