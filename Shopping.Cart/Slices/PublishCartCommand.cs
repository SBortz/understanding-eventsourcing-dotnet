using Shopping.Cart.Aggregate;
using Shopping.Cart.EventStore;
using Shopping.Cart.Infrastructure;

namespace Shopping.Cart.Slices;

public record PublishCartCommand(Guid CartId, IEnumerable<PublishCartCommand.OrderedProduct> OrderedProducts, double TotalPrice)
{
    public record OrderedProduct(Guid ProductId, double Price);
};

public class PublishCartCommandHandler(IEventStore eventStore, IKafkaPublisher kafkaPublisher)
{
    public async Task HandleAsync(PublishCartCommand command)
    {
        object[] stream = await eventStore.ReadStream(command.CartId.ToString());
        
        CartAggregate cartAggregate = new CartAggregate(stream);

        try
        {
            await kafkaPublisher.PublishAsync("published_carts", new ExternalCartPublished(command.CartId,
                command.OrderedProducts
                    .Select(x =>
                        new ExternalCartPublished.OrderedProduct(x.ProductId, x.Price)),
                command.TotalPrice));
            
            cartAggregate.Publish(command);
        }
        catch
        {
            cartAggregate.PublishFailed(command);
        }
        
        await eventStore.AppendToStream(cartAggregate.CartId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }
}

public record CartPublished(Guid CartId);

public record CartPublicationFailed(Guid CommandCartId);

public class CartCannotBePublishedTwiceException() : Exception($"Cart cannot be published twice.");
public class CannotPublishUnsubmittedCartException() : Exception("Cannot submit unsubmitted cart.");

public record ExternalCartPublished(Guid CartId, IEnumerable<ExternalCartPublished.OrderedProduct> OrderedProducts, double TotalPrice)
{
    public record OrderedProduct(Guid ProductId, double Price);
};