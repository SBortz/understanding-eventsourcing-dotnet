namespace Shopping.Cart.Slices;

public class ChangedPricesProjector
{
    public IDictionary<Guid, ChangedPrice> Project(object[] stream)
    {
        return stream.Aggregate(new Dictionary<Guid, ChangedPrice>(), (sv, @event) =>
        {
            switch (@event)
            {
                case PriceChanged priceChanged:
                    sv[priceChanged.ProductId] = new ChangedPrice(OldPrice: priceChanged.OldPrice, NewPrice: priceChanged.NewPrice);
                    break;
            }

            return sv;
        });
    }
}

public record ChangedPrice(double OldPrice, double NewPrice);