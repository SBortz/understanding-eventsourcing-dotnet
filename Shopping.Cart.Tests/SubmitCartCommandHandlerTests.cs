using Shopping.Cart.EventStore;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class SubmitCartCommandHandlerTests
{
    private InMemoryEventStore inMemoryEventStore;

    [SetUp]
    public void Setup()
    {
        inMemoryEventStore = new InMemoryEventStore(new EventSerializer(new EventTypeMapping()));
    }

    [Test]
    public async Task CantSubmitNoProductsInStock()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId1), 
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId2), 
        ]);        
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler(inMemoryEventStore, new InventoriesProjector(inMemoryEventStore));
        Assert.ThrowsAsync<NotEnoughInStockException>(async () =>
        {
            await submitCartCommandHandler.Handle(
                new SubmitCartCommand(cartId,
                    [
                        new SubmitCartCommand.OrderedProduct(productId1, 10),
                        new SubmitCartCommand.OrderedProduct(productId2, 5)
                    ]
                ));
        });
    }
    
    [Test]
    public async Task CantSubmitNoQuantity()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId1), 
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId2), 
        ]);
        await this.inMemoryEventStore.AppendToStream("inventories", [
            new InventoryChanged(0, productId1),
            new InventoryChanged(0, productId2),
        ]);
        
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler(inMemoryEventStore, new InventoriesProjector(inMemoryEventStore));
        Assert.ThrowsAsync<NotEnoughInStockException>(async () =>
        {
            await submitCartCommandHandler.Handle(
                new SubmitCartCommand(cartId,
                    [
                        new SubmitCartCommand.OrderedProduct(productId1, 10),
                        new SubmitCartCommand.OrderedProduct(productId2, 5)
                    ]
                ));
        });
    }
    
    [Test]
    public async Task CantSubmitCartTwice()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId1), 
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId2), 
            new CartSubmitted( cartId, [new CartSubmitted.OrderedProduct(productId1, 10), new CartSubmitted.OrderedProduct(productId2, 10)], 20), 
        ]);
        await this.inMemoryEventStore.AppendToStream("inventories", [
            new InventoryChanged(1, productId1),
            new InventoryChanged(1, productId2),
        ]);
        
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler(inMemoryEventStore, new InventoriesProjector(inMemoryEventStore));
        Assert.ThrowsAsync<CartCannotBeSubmittedTwiceException>(async () =>
        {
            await submitCartCommandHandler.Handle(
                new SubmitCartCommand(cartId,
                    [
                        new SubmitCartCommand.OrderedProduct(productId1, 10),
                        new SubmitCartCommand.OrderedProduct(productId2, 5)
                    ]
                ));
        });
    }
    
    [Test]
    public async Task ShouldSubmit()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId1), 
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId2), 
        ]);
        await this.inMemoryEventStore.AppendToStream("inventories", [
            new InventoryChanged(1, productId1),
            new InventoryChanged(2, productId2),
        ]);
        
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler(inMemoryEventStore, new InventoriesProjector(inMemoryEventStore));
        await submitCartCommandHandler.Handle(
            new SubmitCartCommand(cartId,
                [
                    new SubmitCartCommand.OrderedProduct(productId1, 10),
                    new SubmitCartCommand.OrderedProduct(productId2, 5)
                ]
            ));

        var stream = await this.inMemoryEventStore.ReadStream(cartId.ToString());
        Assert.That(stream.Last(), Is.TypeOf<CartSubmitted>());
    }
    
    [Test]
    public async Task SubmitEmptyCartFails()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId1), 
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId2),
            new CartCleared(cartId)
        ]);
        await this.inMemoryEventStore.AppendToStream("inventories", [
            new InventoryChanged(1, productId1),
            new InventoryChanged(2, productId2),
        ]);
        
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler(inMemoryEventStore, new InventoriesProjector(inMemoryEventStore));
        Assert.ThrowsAsync<CannotSubmitEmptyCartException>(async () =>
        {
            await submitCartCommandHandler.Handle(
                new SubmitCartCommand(cartId,
                    []
                ));
        });
    }
}