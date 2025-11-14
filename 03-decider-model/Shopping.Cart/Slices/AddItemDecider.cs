using Shopping.Cart.Common;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;

namespace Shopping.Cart.Slices;

public record AddItemCommand(
    Guid CartId,
    string? Description,
    string? Image,
    double Price,
    Guid ItemId,
    Guid ProductId
);

public class AddItemDecider : IDecider<AddItemCommand, Domain.Cart>
{
    public IList<object> Handle(Domain.Cart state, AddItemCommand command)
    {
        IList<object> events = new List<object>();

        if (state.CartId == null)
        {
            events.Add(new CartCreated(command.CartId));
        }

        if (state.CartItems.Count >= 3)
        {
            throw new TooManyItemsInCartException(state.CartId, command.ItemId);
        }
        
        events.Add(new ItemAdded(
            CartId: command.CartId,
            Description: command.Description,
            Image: command.Image,
            Price: command.Price,
            ItemId: command.ItemId,
            ProductId: command.ProductId));

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