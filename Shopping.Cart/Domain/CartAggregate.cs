using Shopping.Cart.Slices;

namespace Shopping.Cart.Domain;

public class CartAggregate
{
    private Guid? cartId;

    private readonly IDictionary<Guid, Guid> cartItems = new Dictionary<Guid, Guid>();
    private readonly IDictionary<Guid, double> productPrice = new Dictionary<Guid, double>();
    private bool isSubmitted = false;
    private bool isPublished = false;
    private bool publicationFailed = false;

    public Guid? CartId => cartId;

    public IDictionary<Guid, Guid> CartItemsProductIds => cartItems.AsReadOnly();
    public List<object>? UncommittedEvents { get; private set; } = [];

    public CartAggregate(object[] stream)
    {
        Hydrate(stream);
    }

    public void AddItem(AddItemCommand command)
    {
        if (this.cartId == null)
        {
            this.RaiseEvent(new CartCreated(command.CartId));
        }

        if (cartItems.Count >= 3)
        {
            throw new TooManyItemsInCartException(this.cartId, command.ItemId);
        }

        this.RaiseEvent(new ItemAdded(
            CartId: command.CartId,
            Description: command.Description,
            Image: command.Image,
            Price: command.Price,
            ItemId: command.ItemId,
            ProductId: command.ProductId,
            "not yet implemented"));
    }

    private void ApplyEvent(CartCreated cartCreated)
    {
        this.cartId = cartCreated.CartId;
    }

    private void ApplyEvent(ItemAdded itemAdded)
    {
        this.cartItems.Add(itemAdded.ItemId, itemAdded.ProductId);
        this.productPrice[itemAdded.ProductId] = itemAdded.Price;
    }

    public void RemoveItem(RemoveItemCommand removeItem)
    {
        if (!this.cartItems.ContainsKey(removeItem.ItemId))
        {
            throw new ItemCanNotBeRemovedException(removeItem.ItemId);
        }

        this.RaiseEvent(new ItemRemoved(removeItem.ItemId, removeItem.CartId));
    }

    private void ApplyEvent(ItemRemoved itemRemoved)
    {
        this.productPrice.Remove(this.cartItems[itemRemoved.ItemId]);
        this.cartItems.Remove(itemRemoved.ItemId);
    }

    public void Clear(CartCleared cleared)
    {
        this.RaiseEvent(new CartClearedCommand(this.cartId.Value));
    }

    private void ApplyEvent(CartCleared cartClearedCommand)
    {
        this.cartItems.Clear();
        this.productPrice.Clear();
    }

    public void ArchiveItem(ArchiveItemCommand archiveItemCommand)
    {
        this.RaiseEvent(new ItemArchived(CartId: archiveItemCommand.CartId, ItemId: archiveItemCommand.ProductId));
    }

    private void ApplyEvent(ItemArchived itemArchived)
    {
        this.productPrice.Remove(this.cartItems[itemArchived.ItemId]);
        this.cartItems.Remove(itemArchived.ItemId);
    }

    public void SubmitCart(SubmitCartCommand submitCart)
    {
        if (!cartItems.Any())
        {
            throw new CannotSubmitEmptyCartException();
        }

        if (isSubmitted)
        {
            throw new CartCannotBeSubmittedTwiceException();
        }

        this.RaiseEvent(new CartSubmitted(
            CartId: this.CartId.Value,
            OrderedProducts: cartItems
                .Select(cartItem =>
                    new CartSubmitted.OrderedProduct(
                        cartItem.Value,
                        this.productPrice[cartItem.Value])),
            TotalPrice: cartItems
                .Select(cartItem =>
                    this.productPrice[cartItem.Value])
                .Sum()));
    }

    private void ApplyEvent(CartSubmitted cartSubmitted)
    {
        this.isSubmitted = true;
    }

    public void Publish(PublishCartCommand command)
    {
        if (!this.isSubmitted)
        {
            throw new CannotPublishUnsubmittedCartException();
        }

        if (this.isPublished)
        {
            throw new CartCannotBePublishedTwiceException();
        }

        this.RaiseEvent(new CartPublished(command.CartId));
    }

    private void ApplyEvent(CartPublished cartPublished)
    {
        this.isPublished = true;
    }

    public void PublishFailed(PublishCartCommand command)
    {
        this.RaiseEvent(new CartPublicationFailed(command.CartId));
    }

    private void ApplyEvent(CartPublicationFailed cartPublicationFailed)
    {
        this.publicationFailed = true;
    }

    private void RaiseEvent(object @event)
    {
        this.UncommittedEvents?.Add(@event);
        this.Apply(@event);
    }

    private void Hydrate(object[] stream)
    {
        foreach (var @event in stream)
        {
            Apply(@event);
        }
    }

    private void Apply(object @event)
    {
        switch (@event)
        {
            case CartCreated cartCreated:
                this.ApplyEvent(cartCreated);
                break;
            case ItemAdded itemAdded:
                this.ApplyEvent(itemAdded);
                break;
            case ItemRemoved itemRemoved:
                this.ApplyEvent(itemRemoved);
                break;
            case ItemArchived itemArchived:
                this.ApplyEvent(itemArchived);
                break;
            case CartSubmitted cartSubmitted:
                this.ApplyEvent(cartSubmitted);
                break;
            case CartCleared cartCleared:
                this.ApplyEvent(cartCleared);
                break;
            case CartPublished published:
                this.ApplyEvent(published);
                break;
            case CartPublicationFailed publishFailed:
                this.ApplyEvent(publishFailed);
                break;
        }
    }
}