using Shopping.Cart.Domain;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class SubmitCartCommandHandlerTests
{
    [Test]
    public void CantSubmitNoProductsInStock()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        object[] given =
        [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId1),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId2),
        ];
        object[] givenInventoriesStream = [];
        var inventoriesProjector = new InventoriesProjector();
        IDictionary<Guid, int> inventoriesSV = inventoriesProjector.Project(givenInventoriesStream);
        
        Domain.Cart state = given.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler();
        Assert.Throws<NotEnoughInStockException>(() =>
        {
            submitCartCommandHandler.Handle(state,
                inventoriesSV,
                new SubmitCartCommand(cartId,
                    [
                        new SubmitCartCommand.OrderedProduct(productId1, 10),
                        new SubmitCartCommand.OrderedProduct(productId2, 5)
                    ]
                ));
        });
    }
    
    [Test]
    public void CantSubmitNoQuantity()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        object[] given =
        [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId1),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId2),
        ];
        object[] givenInventoriesStream = [
            new InventoryChanged(0, productId1),
            new InventoryChanged(0, productId2),
        ];
        
        var inventoriesProjector = new InventoriesProjector();
        IDictionary<Guid, int> inventoriesSV = inventoriesProjector.Project(givenInventoriesStream);
        
        Domain.Cart state = given.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler();
        Assert.Throws<NotEnoughInStockException>(() =>
        {
            submitCartCommandHandler.Handle(state, inventoriesSV,
                new SubmitCartCommand(cartId,
                    [
                        new SubmitCartCommand.OrderedProduct(productId1, 10),
                        new SubmitCartCommand.OrderedProduct(productId2, 5)
                    ]
                ));
        });
    }
    
    [Test]
    public void CantSubmitCartTwice()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        object[] given =
        [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId1),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId2),
            new CartSubmitted(cartId,
                [new CartSubmitted.OrderedProduct(productId1, 10), new CartSubmitted.OrderedProduct(productId2, 10)],
                20),
        ];
        object[] givenInventoriesStream =
        [
            new InventoryChanged(1, productId1),
            new InventoryChanged(1, productId2),
        ];
        
        var inventoriesProjector = new InventoriesProjector();
        IDictionary<Guid, int> inventoriesSV = inventoriesProjector.Project(givenInventoriesStream);
        
        Domain.Cart state = given.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler();
        Assert.Throws<CartCannotBeSubmittedTwiceException>(() =>
        {
            submitCartCommandHandler.Handle(state, inventoriesSV,
                new SubmitCartCommand(cartId,
                    [
                        new SubmitCartCommand.OrderedProduct(productId1, 10),
                        new SubmitCartCommand.OrderedProduct(productId2, 5)
                    ]
                ));
        });
    }
    
    [Test]
    public void ShouldSubmit()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        object[] given =
        [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId1),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId2),
        ];

        object[] givenInventoriesStream =
        [
            new InventoryChanged(1, productId1),
            new InventoryChanged(2, productId2),
        ];
        var inventoriesProjector = new InventoriesProjector();
        IDictionary<Guid, int> inventoriesSV = inventoriesProjector.Project(givenInventoriesStream);
        
        Domain.Cart state = given.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler();
        var uncommittedEvents = submitCartCommandHandler.Handle(
            state, inventoriesSV,
            new SubmitCartCommand(cartId,
                [
                    new SubmitCartCommand.OrderedProduct(productId1, 10),
                    new SubmitCartCommand.OrderedProduct(productId2, 5)
                ]
            ));

        Assert.That(uncommittedEvents.Last(), Is.TypeOf<CartSubmitted>());
    }
    
    [Test]
    public void SubmitEmptyCartFails()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        object[] given = [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId1),
            new ItemAdded(cartId, "Description", "Image", 10, Guid.NewGuid(), productId2),
            new CartCleared(cartId)
        ];
        object[] givenInventoriesStream =
        [
            new InventoryChanged(1, productId1),
            new InventoryChanged(2, productId2),
        ];
        var inventoriesProjector = new InventoriesProjector();
        IDictionary<Guid, int> inventoriesSV = inventoriesProjector.Project(givenInventoriesStream);
        
        Domain.Cart state = given.Aggregate(Domain.Cart.Initial, Domain.Cart.Evolve);
        SubmitCartCommandHandler submitCartCommandHandler = new SubmitCartCommandHandler();
        Assert.Throws<CannotSubmitEmptyCartException>(() =>
        {
            submitCartCommandHandler.Handle(state, inventoriesSV,
                new SubmitCartCommand(cartId,
                    []
                ));
        });
    }
}