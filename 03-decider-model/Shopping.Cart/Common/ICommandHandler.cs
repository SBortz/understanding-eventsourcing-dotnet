using Shopping.Cart.Infrastructure;

namespace Shopping.Cart.Common;

public interface ICommandHandler<Cmd, State>
{
    IList<object> Handle(State state, Cmd command);
}

public interface IAsyncCommandHandler<Cmd, State>
{
    Task<IList<object>> HandleAsync(State state, Cmd command);
}