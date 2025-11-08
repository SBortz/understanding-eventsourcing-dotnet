using Shopping.Cart.EventStore;
using Shopping.Cart.Infrastructure;
using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class PublishCartTests
{
    private InMemoryEventStore inMemoryEventStore;


    [SetUp]
    public void Setup()
    {
        inMemoryEventStore = new InMemoryEventStore(new EventSerializer(new EventTypeMapping()));
    }

    [Test]
    public async Task PublishesCart()
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
        
        PublishCartCommandHandler publishCartCommandHandler = new PublishCartCommandHandler(this.inMemoryEventStore, new FakeKafkaPublisher(FakeKafkaPublisher.FakeType.AlwaysSucceed));
        await publishCartCommandHandler.HandleAsync(new PublishCartCommand(cartId, [
            new PublishCartCommand.OrderedProduct(productId1, 10),
            new PublishCartCommand.OrderedProduct(productId2, 5),
        ], 15));

        var stream = await this.inMemoryEventStore.ReadStream(cartId.ToString());
        Assert.That(stream.Last(), Is.TypeOf<CartPublished>());
    }
    
    [Test]
    public async Task PublishFailesDueToKafkaError()
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
        
        PublishCartCommandHandler publishCartCommandHandler = new PublishCartCommandHandler(this.inMemoryEventStore, 
            new FakeKafkaPublisher(FakeKafkaPublisher.FakeType.AlwaysFail));
        await publishCartCommandHandler.HandleAsync(new PublishCartCommand(cartId, [
            new PublishCartCommand.OrderedProduct(productId1, 10),
            new PublishCartCommand.OrderedProduct(productId2, 5),
        ], 15));

        var stream = await this.inMemoryEventStore.ReadStream(cartId.ToString());
        Assert.That(stream.Last(), Is.TypeOf<CartPublicationFailed>());
    }
    
    [Test]
    public async Task CannotPublishTwice()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid productId1 = new Guid("00000000-0000-0000-0000-000000000002");
        Guid productId2 = new Guid("00000000-0000-0000-0000-000000000003");

        await this.inMemoryEventStore.AppendToStream(cartId.ToString(), [
            new CartCreated( CartId: cartId),
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId1), 
            new ItemAdded( cartId, "Description", "Image", 10, Guid.NewGuid(), productId2), 
            new CartSubmitted( cartId, [new CartSubmitted.OrderedProduct(productId1, 10), new CartSubmitted.OrderedProduct(productId2, 10)], 20), 
            new CartPublished( cartId) 
        ]);
        
        PublishCartCommandHandler publishCartCommandHandler = new PublishCartCommandHandler(this.inMemoryEventStore, 
            new FakeKafkaPublisher(FakeKafkaPublisher.FakeType.AlwaysSucceed));
        await publishCartCommandHandler.HandleAsync(new PublishCartCommand(cartId, [
            new PublishCartCommand.OrderedProduct(productId1, 10),
            new PublishCartCommand.OrderedProduct(productId2, 5),
        ], 15));
        
        var stream = await this.inMemoryEventStore.ReadStream(cartId.ToString());
        Assert.That(stream.Last(), Is.TypeOf<CartPublicationFailed>());
    }
}