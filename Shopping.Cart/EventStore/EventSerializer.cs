using System.Text.Json;

namespace Shopping.Cart.EventStore;

public interface IEventSerializer
{
    SerializedEvent Serialize(object @event);
    object? Deserialize(SerializedEvent serializedEvent);
    List<object?> Deserialize(List<SerializedEvent> events);
}

public class EventSerializer(
    EventTypeMapping mapping
): IEventSerializer
{
    public SerializedEvent Serialize(object @event) =>
        new(mapping.ToName(@event.GetType()), JsonSerializer.Serialize(@event));

    public object? Deserialize(SerializedEvent serializedEvent) =>
            mapping.ToType(serializedEvent.EventType) is { } eventType
                ? JsonSerializer.Deserialize(serializedEvent.Data, eventType)
                : null;

    public List<object?> Deserialize(List<SerializedEvent> events) =>
        events
            .Select(Deserialize)
            .ToList();
}
