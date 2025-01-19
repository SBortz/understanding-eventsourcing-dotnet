using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record AddItemCommand(
    Guid CartId,
    string? Description,
    string? Image,
    double Price,
    double TotalPrice,
    Guid ItemId,
    Guid ProductId
);

public class AddItemCommandHandler : ICommandHandler<AddItemCommand>
{
    public IList<object> Handle(object[] stream, AddItemCommand removeItemCommand)
    {
        IList<object> events = new List<object>();
        
        Domain.Cart state = stream.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);

        if (state.CartId == null)
        {
            events.Add(new CartCreated(removeItemCommand.CartId));
        }

        if (state.CartItems.Count >= 3)
        {
            throw new TooManyItemsInCartException(state.CartId, removeItemCommand.ItemId);
        }
        
        events.Add(new ItemAdded(
            CartId: removeItemCommand.CartId,
            Description: removeItemCommand.Description,
            Image: removeItemCommand.Image,
            Price: removeItemCommand.Price,
            ItemId: removeItemCommand.ItemId,
            ProductId: removeItemCommand.ProductId));

        return events;
    }
}

public class TooManyItemsInCartException(Guid? cartId, Guid itemId)
    : Exception($"Can only add 3 items to cart {cartId}. Item {itemId} could not be added.");

public record CartCreated(
    Guid CartId
    );

public record ItemAdded(
    Guid CartId,
    string? Description,
    string? Image,
    double Price,
    Guid ItemId,
    Guid ProductId);