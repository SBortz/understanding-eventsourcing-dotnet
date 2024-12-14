using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Shopping.Cart;
using Shopping.Cart.EventStore;
using Shopping.Cart.Infrastructure;
using Shopping.Cart.Slices;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddTransient<AddItemCommandHandler>();
builder.Services.AddTransient<RemoveItemCommandHandler>();
builder.Services.AddTransient<CartItemsProjector>();
builder.Services.AddTransient<ClearCartCommandHandler>();
builder.Services.AddTransient<ChangeInventoryCommandHandler>();
builder.Services.AddTransient<InventoriesProjector>();
builder.Services.AddTransient<ChangePriceCommandHandler>();
builder.Services.AddSingleton<ArchiveItemSchedulerProcessor>();
builder.Services.AddTransient<CartsWithProductsProjector>();
builder.Services.AddTransient<ChangedPricesProjector>();
builder.Services.AddTransient<ArchiveItemCommandHandler>();
builder.Services.AddTransient<SubmitCartCommandHandler>();
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
    async ([FromBody] AddItemCommand request, [FromServices] AddItemCommandHandler addItemCommandHandler) =>
    {
        await addItemCommandHandler.Handle(request);
    });
app.MapGet("/{cartId}/cartitems", 
    async (string cartId, [FromServices] CartItemsProjector cartItemsStateViewHandler) => await cartItemsStateViewHandler.Projects(cartId)
    );
app.MapPost("/removeitem",
    async ([FromBody] RemoveItemCommandAggregate request, [FromServices] RemoveItemCommandHandler removeItemCommandHandler) =>
    {
        await removeItemCommandHandler.Handle(request);
    });
app.MapPost("/clearcart",
    async ([FromBody] CartCleared request, [FromServices] ClearCartCommandHandler clearCartCommandHandler) =>
    {
        await clearCartCommandHandler.Handle(request);
    });


app.MapGet("/inventories", async ([FromServices] InventoriesProjector inventoriesSVHandler ) => await inventoriesSVHandler.ProjectAsync());
app.MapPost("/submit-cart",
    async ([FromBody] SubmitCartCommand submitCart, [FromServices] SubmitCartCommandHandler submitCartCommandHandler, [FromServices] CartPublisherProcessor cartPublisher) =>
    {
        await submitCartCommandHandler.Handle(submitCart);
        await cartPublisher.RunAsync();
    });


app.MapPost("/debug/simulate-inventory-changed", async ([FromBody] InventoryChangedExternal triggerInventoryChangedModel,
    [FromServices] ChangeInventoryCommandHandler changeInventoryCommandHandler) =>
{
    await changeInventoryCommandHandler.HandleAsync(triggerInventoryChangedModel);
});
app.MapPost("/debug/simulate-price-changed", async ([FromBody] PriceChangedExternal priceChangedExternal,
    [FromServices] ChangePriceCommandHandler changePriceCommandHandler,
    [FromServices] ArchiveItemSchedulerProcessor archiveItemProcessor) =>
{
    await changePriceCommandHandler.HandleAsync(priceChangedExternal);
    await archiveItemProcessor.RunAsync();
});
app.MapGet("/debug/carts-with-products", async ([FromServices] CartsWithProductsProjector cartsWithProductsSV ) => await cartsWithProductsSV.ProjectAsync());

app.Run();