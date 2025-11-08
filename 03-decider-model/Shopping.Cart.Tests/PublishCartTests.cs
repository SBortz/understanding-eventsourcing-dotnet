using Shopping.Cart.EventStore;
using Shopping.Cart.Infrastructure;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class PublishCartTests
{
    [Test]
    public async Task PublishesCart()
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
        
        PublishCartCommandHandler publishCartCommandHandler = new PublishCartCommandHandler(new FakeKafkaPublisher(FakeKafkaPublisher.FakeType.AlwaysSucceed));
        IEnumerable<object> uncommittedEvents = await publishCartCommandHandler.HandleAsync(given, new PublishCartCommand(cartId, [
            new PublishCartCommand.OrderedProduct(productId1, 10),
            new PublishCartCommand.OrderedProduct(productId2, 5),
        ], 15));

        Assert.That(uncommittedEvents.Last(), Is.TypeOf<CartPublished>());
    }
    
    [Test]
    public async Task PublishFailesDueToKafkaError()
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
        
        PublishCartCommandHandler publishCartCommandHandler = new PublishCartCommandHandler(new FakeKafkaPublisher(FakeKafkaPublisher.FakeType.AlwaysFail));
        var uncommittedEvents = await publishCartCommandHandler.HandleAsync(given, new PublishCartCommand(cartId, [
            new PublishCartCommand.OrderedProduct(productId1, 10),
            new PublishCartCommand.OrderedProduct(productId2, 5),
        ], 15));

        Assert.That(uncommittedEvents.Last(), Is.TypeOf<CartPublicationFailed>());
    }
    
    [Test]
    public async Task CannotPublishTwice()
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
            new CartPublished(cartId)
        ];
        
        PublishCartCommandHandler publishCartCommandHandler = new PublishCartCommandHandler(new FakeKafkaPublisher(FakeKafkaPublisher.FakeType.AlwaysSucceed));
        var uncommittedEvents = await publishCartCommandHandler.HandleAsync(given, new PublishCartCommand(cartId, [
            new PublishCartCommand.OrderedProduct(productId1, 10),
            new PublishCartCommand.OrderedProduct(productId2, 5),
        ], 15));
        
        Assert.That(uncommittedEvents.Last(), Is.TypeOf<CartPublicationFailed>());
    }
}