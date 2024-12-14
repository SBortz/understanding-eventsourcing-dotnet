namespace Shopping.Cart.Infrastructure;

public interface IKafkaPublisher
{
    public Task PublishAsync(string topic, object @event);
}

public class FakeKafkaPublisher : IKafkaPublisher
{
    public async Task PublishAsync(string topic, object @event)
    {
        Random random = new Random();
        double value = random.NextDouble();

        if (value < 0.5)
        {
            throw new Exception("Publish failed");
        }
    }
}