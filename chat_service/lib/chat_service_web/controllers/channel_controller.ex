defmodule ChatServiceWeb.ChannelController do
  use ChatServiceWeb, :controller
  alias ChatService.Chat
  alias ChatService.Tenants

  action_fallback(ChatServiceWeb.FallbackController)

  def list_channels(conn, %{"tenant_id" => tenant_id}) do
    user_id = conn.assigns.current_user.id
    channels = Chat.list_user_channels(tenant_id, user_id)

    json(conn, %{
      public: Enum.map(channels.public, &channel_to_map/1),
      private: Enum.map(channels.private, &channel_to_map/1),
      dms: Enum.map(channels.dms, &channel_to_map/1)
    })
  end

  def create_channel(conn, %{"tenant_id" => tenant_id, "name" => name, "type" => type}) do
    user_id = conn.assigns.current_user.id
    user = conn.assigns.current_user

    if Tenants.can_create_channels?(tenant_id, user) do
      case Chat.create_channel(tenant_id, %{name: name, type: type}, user_id) do
        {:ok, channel} ->
          conn
          |> put_status(:created)
          |> json(channel_to_map(channel))

        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: format_errors(changeset)})
      end
    else
      {:error, :forbidden}
    end
  end

  def get_channel(conn, %{"channel_id" => channel_id}) do
    user_id = conn.assigns.current_user.id

    case Chat.get_channel(channel_id) do
      nil ->
        {:error, :not_found}

      channel ->
        if Chat.can_access_channel?(channel_id, user_id) do
          json(conn, channel_to_map(channel))
        else
          {:error, :forbidden}
        end
    end
  end

  def join_channel(conn, %{"tenant_id" => tenant_id, "channel_id" => channel_id}) do
    user_id = conn.assigns.current_user.id

    case Chat.join_channel(channel_id, user_id, tenant_id) do
      {:ok, _} -> json(conn, %{message: "Joined channel"})
      {:error, reason} -> {:error, reason}
    end
  end

  def leave_channel(conn, %{"tenant_id" => tenant_id, "channel_id" => channel_id}) do
    user_id = conn.assigns.current_user.id

    case Chat.leave_channel(channel_id, user_id, tenant_id) do
      :ok -> json(conn, %{message: "Left channel"})
      {:error, reason} -> {:error, reason}
    end
  end

  def create_dm(conn, %{"tenant_id" => tenant_id, "user_id" => other_user_id}) do
    user_id = conn.assigns.current_user.id

    case Chat.get_or_create_dm(tenant_id, user_id, other_user_id) do
      {:ok, channel} ->
        conn
        |> put_status(:created)
        |> json(channel_to_map(channel))

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp channel_to_map(channel) do
    %{
      id: channel.id,
      name: channel.name,
      type: channel.type,
      is_private: channel.is_private
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
