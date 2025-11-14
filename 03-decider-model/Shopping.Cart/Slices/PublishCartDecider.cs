using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;
using Shopping.Cart.Infrastructure;

namespace Shopping.Cart.Slices;

public record PublishCartCommand(Guid CartId, IEnumerable<PublishCartCommand.OrderedProduct> OrderedProducts, double TotalPrice)
{
    public record OrderedProduct(Guid ProductId, double Price);
};

public class PublishCartCommandHandler(IKafkaPublisher kafkaPublisher) : IAsyncCommandHandler<PublishCartCommand, Domain.Cart>
{
    public async Task<IList<object>> HandleAsync(Domain.Cart state, PublishCartCommand command)
    {
        try
        {
            await kafkaPublisher.PublishAsync("published_carts", new ExternalCartPublished(command.CartId,
                command.OrderedProducts
                    .Select(x =>
                        new ExternalCartPublished.OrderedProduct(x.ProductId, x.Price)),
                command.TotalPrice));
            
            if (!state.isSubmitted)
            {
                throw new CannotPublishUnsubmittedCartException();
            }

            if (state.isPublished)
            {
                throw new CartCannotBePublishedTwiceException();
            }

            return [new CartPublished(command.CartId)];
        }
        catch
        {
            return [new CartPublicationFailed(command.CartId)];
        }
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