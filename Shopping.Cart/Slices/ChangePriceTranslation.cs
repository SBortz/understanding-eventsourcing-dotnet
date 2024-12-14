using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record PriceChangedExternal(Guid ProductId, double OldPrice, double NewPrice);

public class ChangePriceCommandHandler(IEventStore eventStore)
{
    public async Task HandleAsync(PriceChangedExternal priceChangedExternal)
    {
        PriceChanged translatedEvent = new PriceChanged(ProductId: priceChangedExternal.ProductId,
            OldPrice: priceChangedExternal.OldPrice,
            NewPrice: priceChangedExternal.NewPrice);

        await eventStore.AppendToStream("pricing", [translatedEvent]);
    }
}

public record PriceChanged(Guid ProductId, double OldPrice, double NewPrice);