using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Shopping.Cart.EventStore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddTransient<AddItemCommandHandler>();
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
app.MapPost("/additem", async ([FromBody] AddItem request, [FromServices] AddItemCommandHandler addItemCommandHandler) =>
    {
        await addItemCommandHandler.Handle(request);
    })
    .WithName("AddItem");

app.Run();

public record AddItem(
    Guid AggregateId,
    string? Description,
    string? Image,
    double Price,
    double TotalPrice,
    Guid ItemId,
    Guid ProductId
);

public class AddItemCommandHandler(IEventStore eventStore)
{
    public async Task Handle(AddItem command)
    {
        object[] stream = await eventStore.ReadStream(command.AggregateId.ToString());
        
        CartAggregate cartAggregate = new CartAggregate(stream);

        cartAggregate.AddItem(command);
        
        await eventStore.AppendToStream(cartAggregate.AggregateId!.Value.ToString(), cartAggregate.UncommittedEvents);
    }
}

public class CartAggregate
{
    private Guid? aggregateId;
    private readonly IList<Guid> cartItems = new List<Guid>();

    public Guid? AggregateId => aggregateId;
    public IList<object>? UncommittedEvents { get; private set; }

    public CartAggregate(object[] stream)
    {
        Hydrate(stream);
    }

    private void Hydrate(object[] stream)
    {
        foreach (var @event in stream)
        {
            switch (@event)
            {
                case CartCreated cartCreated:
                    this.ApplyEvent(cartCreated);
                    break;
                case ItemAdded itemAdded:
                    this.ApplyEvent(itemAdded);
                    break;
            }
        }

        this.UncommittedEvents = new List<object>();
    }

    public void AddItem(AddItem command)
    {
        if (this.aggregateId == null)
        {
            this.ApplyEvent(new CartCreated(command.AggregateId));
        }

        if (cartItems.Count >= 3)
        {
            throw new TooManyItemsInCartException(this.aggregateId, command.ItemId);
        }
        
        this.ApplyEvent(new ItemAdded( 
            AggregateId: command.AggregateId, 
            Description: command.Description, 
            Image: command.Image, 
            Price: command.Price, 
            ItemId: command.ItemId,
            ProductId: command.ProductId));
    }

    private void ApplyEvent(CartCreated cartCreated)
    {
        this.aggregateId = cartCreated.AggregateId;

        this.UncommittedEvents?.Add(cartCreated);
    }
    
    private void ApplyEvent(ItemAdded itemAdded)
    {
        this.cartItems.Add(itemAdded.ItemId);

        this.UncommittedEvents?.Add(itemAdded);
    }
}

public class TooManyItemsInCartException(Guid? aggregateId, Guid itemId)
    : Exception($"Can only add 3 items to cart {aggregateId}. Item {itemId} could not be added.");

public record CartCreated(
    Guid AggregateId
    );

public record ItemAdded(
    Guid AggregateId,
    string? Description,
    string? Image,
    double Price,
    Guid ItemId,
    Guid ProductId);
