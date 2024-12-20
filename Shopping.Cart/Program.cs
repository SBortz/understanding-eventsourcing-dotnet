using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Shopping.Cart;
using Shopping.Cart.EventStore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddTransient<AddItemCommandHandler>();
builder.Services.AddTransient<CartItemsStateViewHandler>();
builder.Services.AddSingleton<IEventStore, InMemoryEventStore>();
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
app.MapPost("/additem", async ([FromBody] AddItemCommand request, [FromServices] AddItemCommandHandler addItemCommandHandler) =>
    {
        await addItemCommandHandler.Handle(request);
    })
    .WithName("AddItem");
app.MapGet("/{cartId}/cartitems", async (string cartId, [FromServices] CartItemsStateViewHandler stateViewHandler) => await stateViewHandler.Handle(cartId));
app.Run();