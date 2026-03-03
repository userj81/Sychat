defmodule ChatServiceWeb.UserSocket do
  use Phoenix.Socket

  channel("channel:*", ChatServiceWeb.ChannelChannel)
  channel("tenant:*", ChatServiceWeb.TenantChannel)

  def connect(%{"token" => token}, socket, _connect_info) do
    case ChatService.Auth.JWT.verify_token(token) do
      {:ok, claims} ->
        {:ok, assign(socket, :user_id, claims["sub"])}

      _ ->
        :error
    end
  end

  def id(_socket), do: nil
end
