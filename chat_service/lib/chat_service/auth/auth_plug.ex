defmodule ChatService.Auth.AuthPlug do
  import Plug.Conn
  alias ChatService.Auth.JWT
  alias ChatService.Accounts

  def init(opts), do: opts

  def call(conn, _opts) do
    with [token] <- get_req_header(conn, "authorization"),
         {:ok, token} <- extract_token(token),
         {:ok, claims} <- JWT.verify_token(token),
         "access" <- claims["type"],
         %{} = user <- Accounts.get_user(claims["sub"]) do
      assign(conn, :current_user, user)
      |> assign(:current_system_role, user.system_role || "user")
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "Unauthorized"})
        |> halt()
    end
  end

  defp extract_token("Bearer " <> token), do: {:ok, token}
  defp extract_token(_), do: {:error, :invalid_token}
end
