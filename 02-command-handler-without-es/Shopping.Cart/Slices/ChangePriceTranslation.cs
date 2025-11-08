using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record PriceChangedExternal(Guid ProductId, double OldPrice, double NewPrice);

public class ChangePriceCommandHandler
{
    public IList<object> Handle(PriceChangedExternal priceChangedExternal)
    {
        PriceChanged translatedEvent = new PriceChanged(ProductId: priceChangedExternal.ProductId,
            OldPrice: priceChangedExternal.OldPrice,
            NewPrice: priceChangedExternal.NewPrice);

        return [translatedEvent];
    }
}

public record PriceChanged(Guid ProductId, double OldPrice, double NewPrice);