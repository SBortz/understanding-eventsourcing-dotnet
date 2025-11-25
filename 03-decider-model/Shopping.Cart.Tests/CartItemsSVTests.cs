using Shopping.Cart.Slices;

namespace Shopping.Cart.Tests;

public class CartItemsSVTests
{
    [Test]
    public void IsEmptyInBeginning()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        
        object[] given = [
            new CartCreated(CartId: cartId),
        ];
        
        CartItemsStateView state = CartItemsProjector.Project(given);
        
        Assert.That(state.CartId, Is.EqualTo(cartId));
        Assert.That(state.CartItems.Count, Is.EqualTo(0));
    }    
    
    [Test]
    public void Has1Item()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid product1Id = new Guid("10000000-0000-0000-0000-000000000001");
        Guid item1Id = new Guid("20000000-0000-0000-0000-000000000001");
        
        object[] given = [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, item1Id, product1Id),
        ];
        
        CartItemsStateView state = CartItemsProjector.Project(given);
        
        Assert.That(state.CartId, Is.EqualTo(cartId));
        Assert.That(state.CartItems.Count, Is.EqualTo(1));
        Assert.That(state.CartItems[0].ItemId, Is.EqualTo(item1Id));
        Assert.That(state.CartItems[0].ProductId, Is.EqualTo(product1Id));
    }
    
    [Test]
    public void Has2Items()
    {
        Guid cartId = new Guid("00000000-0000-0000-0000-000000000001");
        Guid product1Id = new Guid("10000000-0000-0000-0000-000000000001");
        Guid item1Id = new Guid("20000000-0000-0000-0000-000000000001");
        
        Guid product2Id = new Guid("10000000-0000-0000-0000-000000000001");
        Guid item2Id = new Guid("20000000-0000-0000-0000-000000000001");
        
        object[] given = [
            new CartCreated(CartId: cartId),
            new ItemAdded(cartId, "Description", "Image", 10, item1Id, product1Id),
            new ItemAdded(cartId, "Description", "Image", 10, item2Id, product2Id),
        ];
        
        CartItemsStateView state = CartItemsProjector.Project(given);
        
        Assert.That(state.CartId, Is.EqualTo(cartId));
        Assert.That(state.CartItems.Count, Is.EqualTo(2));
        Assert.That(state.CartItems[0].ItemId, Is.EqualTo(item1Id));
        Assert.That(state.CartItems[0].ProductId, Is.EqualTo(product1Id));
        Assert.That(state.CartItems[1].ItemId, Is.EqualTo(item2Id));
        Assert.That(state.CartItems[1].ProductId, Is.EqualTo(product2Id));
    }
}