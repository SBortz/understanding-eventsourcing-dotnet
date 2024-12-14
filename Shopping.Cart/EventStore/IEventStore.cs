namespace Shopping.Cart.EventStore;

public interface IEventStore
{
    ValueTask AppendToStream(
        string streamId,
        IEnumerable<object> newEvents,
        CancellationToken ct = default
    );

    ValueTask<object[]> ReadAll(CancellationToken ct = default);

    ValueTask<object[]> ReadStream(
        string streamId,
        CancellationToken ct = default
    );
}

public record SerializedEvent(
    long GlobalPosition,
    string EventType,
    string Data,
    string MetaData = ""
);