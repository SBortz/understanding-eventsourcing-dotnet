using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public class ChangedPricesProjector(IEventStore eventStore)
{
    public async Task<IDictionary<Guid, ChangedPrice>> ProjectAsync()
    {
        object[] events = await eventStore.ReadStream("pricing");
        return events.Aggregate(new Dictionary<Guid, ChangedPrice>(), (sv, @event) =>
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