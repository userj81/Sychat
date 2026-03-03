defmodule ChatService.Auth.RequireRolePlug do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, roles) when is_list(roles) do
    if conn.assigns[:current_role] in roles do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "Insufficient permissions"})
      |> halt()
    end
  end
end
