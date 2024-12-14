using System.Text.Json;

namespace Shopping.Cart.EventStore;

public class EventSerializer(
    EventTypeMapping mapping
)
{
    public SerializedEvent Serialize(long position, object @event) =>
        new(position, mapping.ToName(@event.GetType()), JsonSerializer.Serialize(@event));

    public object? Deserialize(SerializedEvent serializedEvent) =>
            mapping.ToType(serializedEvent.EventType) is { } eventType
                ? JsonSerializer.Deserialize(serializedEvent.Data, eventType)
                : null;

    public List<object?> Deserialize(List<SerializedEvent> events) =>
        events
            .Select(Deserialize)
            .ToList();
}
