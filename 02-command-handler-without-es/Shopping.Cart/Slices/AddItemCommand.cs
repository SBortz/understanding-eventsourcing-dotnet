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
    public IList<object> Handle(object[] stream, AddItemCommand command)
    {
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.AddItem(command);
        
        return cartAggregate.UncommittedEvents;
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