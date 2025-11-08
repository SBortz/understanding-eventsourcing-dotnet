namespace Shopping.Cart.Infrastructure;

public class FakeKafkaPublisher(FakeKafkaPublisher.FakeType fakeType = FakeKafkaPublisher.FakeType.AlwaysSucceed)
    : IKafkaPublisher
{
    private FakeType fakeType = fakeType;

    public enum FakeType
    {
        AlwaysSucceed,
        AlwaysFail,
        Random
    }

    public Task PublishAsync(string topic, object @event)
    {
        switch (fakeType)
        {
            case FakeType.AlwaysSucceed:
                return Task.CompletedTask;
            case FakeType.AlwaysFail:
                throw new Exception("Publish failed");
            case FakeType.Random:
                Random random = new Random();
                double value = random.NextDouble();

                if (value < 0.5)
                {
                    throw new Exception("Publish failed");
                }
                return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}