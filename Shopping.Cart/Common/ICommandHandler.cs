namespace Shopping.Cart.Common;

public interface ICommandHandler<Cmd>
{
    IList<object> Handle(object[] stream, Cmd command);
}

public interface IAsyncCommandHandler<Cmd>
{
    Task<IList<object>> HandleAsync(object[] stream, Cmd command);
}