namespace Shopping.Cart.Common;

public interface ICommandHandler<Cmd>
{
    IList<object> Handle(object[] stream, Cmd removeItemCommand);
}

public interface IAsyncCommandHandler<Cmd>
{
    Task<IList<object>> HandleAsync(object[] stream, Cmd command);
}