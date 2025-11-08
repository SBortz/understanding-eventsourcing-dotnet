namespace Shopping.Cart.Infrastructure;

public interface IKafkaPublisher
{
    public Task PublishAsync(string topic, object @event);
}