defmodule ChatServiceWeb.TenantChannel do
  use Phoenix.Channel
  alias ChatServiceWeb.Presence

  def join("tenant:" <> tenant_id, _params, socket) do
    _user_id = socket.assigns.user_id

    # Add tenant authorization here if needed
    send(self(), :after_join)
    {:ok, assign(socket, :tenant_id, tenant_id)}
  end

  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.user_id, %{
      online_at: inspect(System.system_time(:second))
    })

    push(socket, "presence_state", Presence.list(socket))

    {:noreply, socket}
  end
end
