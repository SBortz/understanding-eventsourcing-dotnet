namespace Shopping.Cart.EventStore;

public interface IEventStore
{
    ValueTask AppendToStream(
        string streamId,
        IEnumerable<object> newEvents
    );

    ValueTask<object[]> ReadAll();

    ValueTask<object[]> ReadStream(
        string streamId
    );
}

public record SerializedEvent(
    long GlobalPosition,
    string EventType,
    string Data,
    string MetaData = ""
);