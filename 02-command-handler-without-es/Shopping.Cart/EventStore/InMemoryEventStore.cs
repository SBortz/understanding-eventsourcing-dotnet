namespace Shopping.Cart.EventStore;

public class InMemoryEventStore(EventSerializer eventSerializer) : IEventStore
{
    private readonly Dictionary<string, List<SerializedEvent>> events = new();

    private long globalSequence = 0;

    public ValueTask AppendToStream(
        string streamId,
        IEnumerable<object> newEvents
    )
    {
        if (!events.ContainsKey(streamId))
            events[streamId] = new List<SerializedEvent>();

        var appendedEvents = newEvents
            .Select(e =>
            {
                var position = Interlocked.Increment(ref globalSequence);
                
                var serialized = eventSerializer.Serialize(position, e);

                return serialized with { GlobalPosition = position };
            })
            .ToList();

        // An den bestehenden Stream anhängen
        events[streamId].AddRange(appendedEvents);

        return ValueTask.CompletedTask;
    }

    public ValueTask<object[]> ReadAll()
    {
        var allEvents = events.Values
            .SelectMany(stream => stream)
            .OrderBy(e => e.GlobalPosition)
            .ToList();

        var deserialized = eventSerializer
            .Deserialize(allEvents)
            .Where(e => e != null)
            .ToArray();

        return ValueTask.FromResult(deserialized);
    }

    public ValueTask<object[]> ReadStream(string streamId)
    {
        if (!events.TryGetValue(streamId, out var stream))
            return ValueTask.FromResult(Array.Empty<object>());

        var sorted = stream.OrderBy(e => e.GlobalPosition).ToList();

        var deserialized = eventSerializer
            .Deserialize(sorted)
            .Where(e => e != null)
            .ToArray();

        return ValueTask.FromResult(deserialized);
    }
}