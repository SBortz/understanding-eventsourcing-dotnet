using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record SubmittedCartDataSV(Guid CartId, IEnumerable<SubmittedCartDataSV.OrderedProduct> OrderedProducts, double TotalPrice)
{
    public record OrderedProduct(Guid ProductId, double Price);
}

public class SubmittedCartDataProjector(IEventStore eventStore)
{
    public async Task<IList<SubmittedCartDataSV>> ProjectAsync()
    {
        object[] events = await eventStore.ReadAll();
        var result = events.Aggregate(new List<SubmittedCartDataSV>(), (sv, @event) =>
        {
            switch (@event)
            {
                case CartSubmitted cartSubmitted:
                    sv.Add(new SubmittedCartDataSV(cartSubmitted.CartId, 
                        cartSubmitted.OrderedProducts.Select(x => 
                            new SubmittedCartDataSV.OrderedProduct(x.ProductId, x.Price)), 
                            cartSubmitted.TotalPrice));
                    break;
                case CartPublished cartPublished:
                    sv.RemoveAll(x => x.CartId == cartPublished.CartId);
                    break;
            }

            return sv;
        });

        return result;
    }
}