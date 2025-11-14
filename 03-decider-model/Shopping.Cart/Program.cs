using Microsoft.AspNetCore.Mvc;
using Shopping.Cart.Domain;
using Shopping.Cart.EventStore;
using Shopping.Cart.Infrastructure;
using Shopping.Cart.Slices;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddTransient<CartItemsProjector>();
builder.Services.AddTransient<ChangeInventoryCommandHandler>();
builder.Services.AddTransient<InventoriesProjector>();
builder.Services.AddTransient<ChangePriceCommandHandler>();
builder.Services.AddSingleton<ArchiveItemSchedulerProcessor>();
builder.Services.AddTransient<CartsWithProductsProjector>();
builder.Services.AddTransient<ChangedPricesProjector>();
builder.Services.AddSingleton<CartPublisherProcessor>();
builder.Services.AddTransient<SubmittedCartDataProjector>();
builder.Services.AddTransient<PublishCartCommandHandler>();
builder.Services.AddSingleton<IEventStore, InMemoryEventStore>();
builder.Services.AddHostedService<RecurringProcessorBackgroundTask>();
builder.Services.AddSingleton<IKafkaPublisher, FakeKafkaPublisher>();
builder.Services.AddSingleton<EventSerializer>();
builder.Services.AddSingleton<EventTypeMapping>();
var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "v1");
        options.RoutePrefix = string.Empty; // Serve the Swagger UI at the app's root
    });
}

app.UseHttpsRedirection();
app.MapPost("/additem",
    async ([FromBody] AddItemCommand command, [FromServices] IEventStore eventStore) =>
    {
        var stream = await eventStore.ReadStream(command.CartId.ToString());
        Cart state = stream.Aggregate(Cart.Initial, Cart.Evolve);
        var uncommittedEvents = AddItemDecider.Handle(state, command);
        await eventStore.AppendToStream(command.CartId.ToString(), uncommittedEvents);
    });
app.MapGet("/{cartId}/cartitems", 
    async (string cartId, [FromServices] IEventStore eventStore, [FromServices] CartItemsProjector cartItemsStateViewHandler) =>
    {
        object[] stream = await eventStore.ReadStream(cartId);
        return cartItemsStateViewHandler.Projects(stream);
    });
app.MapPost("/removeitem",
    async ([FromBody] RemoveItemCommand request, [FromServices] IEventStore eventStore) =>
    {
        object[] stream = await eventStore.ReadStream(request.CartId.ToString());
        Cart state = stream.Aggregate(Cart.Initial, Cart.Evolve);
        var uncommittedEvents = RemoveItemDecider.Handle(state, request);
        await eventStore.AppendToStream(request.CartId.ToString(), uncommittedEvents);

    });
app.MapPost("/clearcart",
    async ([FromBody] CartClearedCommand request, [FromServices] IEventStore eventStore) =>
    {
        object[] stream = await eventStore.ReadStream(request.CartId.ToString());
        Cart state = stream.Aggregate(Cart.Initial, Cart.Evolve);
        var result = ClearCartDecider.Handle(state, request);
        await eventStore.AppendToStream(request.CartId.ToString(), result);
    });


app.MapGet("/inventories", async ([FromServices] IEventStore eventStore, [FromServices] InventoriesProjector inventoriesSVHandler ) =>
{
    object[] stream = await eventStore.ReadStream("inventories");
    return inventoriesSVHandler.Project(stream);
});
app.MapPost("/submit-cart",
    async ([FromBody] SubmitCartCommand request, [FromServices] IEventStore eventStore, [FromServices] CartPublisherProcessor cartPublisher, [FromServices] InventoriesProjector inventoriesProjector) =>
    {
        object[] cartStream = await eventStore.ReadStream(request.CartId.ToString());
        object[] inventoriesStream = await eventStore.ReadStream("inventories");
        
        Cart state = cartStream.Aggregate(Cart.Initial, Cart.Evolve);
        IDictionary<Guid, int> inventoriesSV = inventoriesProjector.Project(inventoriesStream);
        var uncommittedEvents = SubmitCartDecider.Handle(state, inventoriesSV, request);
        await eventStore.AppendToStream(request.CartId.ToString(), uncommittedEvents);
        await cartPublisher.RunAsync();
    });
app.MapPost("/debug/simulate-inventory-changed", async ([FromBody] InventoryChangedExternal triggerInventoryChangedModel,
    [FromServices] IEventStore eventStore,
    [FromServices] ChangeInventoryCommandHandler changeInventoryCommandHandler) =>
{
    var uncommittedEvent = changeInventoryCommandHandler.Handle(triggerInventoryChangedModel);
    await eventStore.AppendToStream("inventories", [uncommittedEvent]);
});
app.MapPost("/debug/simulate-price-changed", async ([FromBody] PriceChangedExternal priceChangedExternal,
    [FromServices] IEventStore eventStore,
    [FromServices] ChangePriceCommandHandler changePriceCommandHandler,
    [FromServices] ArchiveItemSchedulerProcessor archiveItemProcessor) =>
{
    var uncommittedEvent = changePriceCommandHandler.Handle(priceChangedExternal);
    await eventStore.AppendToStream("pricing", [uncommittedEvent]);
    await archiveItemProcessor.RunAsync();
});
app.MapGet("/debug/carts-with-products", async ([FromServices] IEventStore eventStore, [FromServices] CartsWithProductsProjector cartsWithProductsSV ) =>
{
    object[] all = await eventStore.ReadAll();
    return cartsWithProductsSV.Project(all);
});

app.Run();