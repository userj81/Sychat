defmodule ChatServiceWeb.ChannelChannel do
  use Phoenix.Channel
  alias ChatService.Chat

  def join("channel:" <> channel_id, params, socket) do
    user_id = socket.assigns.user_id
    tenant_id = params["tenant_id"]

    cond do
      is_nil(tenant_id) ->
        :error

      not Chat.can_access_channel?(channel_id, user_id) ->
        :error

      true ->
        {:ok, assign(socket, :channel_id, channel_id) |> assign(:tenant_id, tenant_id)}
    end
  end

  def handle_in("message:send", payload, socket) do
    channel_id = socket.assigns.channel_id
    tenant_id = socket.assigns.tenant_id
    user_id = socket.assigns.user_id
    
    body = Map.get(payload, "body")
    client_id = Map.get(payload, "client_id")
    
    opts = [
      parent_id: Map.get(payload, "parent_id"),
      attachment_url: Map.get(payload, "attachment_url"),
      attachment_type: Map.get(payload, "attachment_type"),
      attachment_name: Map.get(payload, "attachment_name")
    ] |> Enum.reject(fn {_, v} -> is_nil(v) end)

    case Chat.create_message(tenant_id, channel_id, user_id, body, client_id, opts) do
      {:ok, message} ->
        broadcast!(socket, "message:new", %{
          message: %{
            id: message.id,
            body: message.body,
            client_id: message.client_id,
            user: %{
              id: message.user.id, 
              name: message.user.name,
              avatar_url: message.user.avatar_url,
              deactivated_at: message.user.deactivated_at
            },
            reactions: [],
            inserted_at: message.inserted_at,
            parent_id: message.parent_id,
            reply_count: message.reply_count,
            attachment_url: message.attachment_url,
            attachment_type: message.attachment_type,
            attachment_name: message.attachment_name
          }
        })

        {:noreply, socket}

      {:error, :duplicate_message} ->
        {:reply, {:ok, %{status: "duplicate"}}, socket}

      {:error, _} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  def handle_in("message:mark_read", %{"message_id" => message_id}, socket) do
    channel_id = socket.assigns.channel_id
    user_id = socket.assigns.user_id

    ChatService.Chat.mark_channel_read(channel_id, user_id, message_id)
    {:noreply, socket}
  end

  def handle_in("user:typing", _payload, socket) do
    broadcast_from!(socket, "user:typing", %{user_id: socket.assigns.user_id})
    {:noreply, socket}
  end

  def handle_in("reaction:add", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user_id = socket.assigns.user_id

    case Chat.add_reaction(message_id, user_id, emoji) do
      {:ok, reaction} ->
        broadcast!(socket, "reaction:added", %{
          message_id: message_id,
          reaction: %{
            id: reaction.id,
            emoji: reaction.emoji,
            user: %{id: reaction.user.id, name: reaction.user.name}
          }
        })

        {:reply, :ok, socket}

      {:error, _} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  def handle_in("reaction:remove", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user_id = socket.assigns.user_id

    case Chat.remove_reaction(message_id, user_id, emoji) do
      :ok ->
        broadcast!(socket, "reaction:removed", %{
          message_id: message_id,
          user_id: user_id,
          emoji: emoji
        })

        {:reply, :ok, socket}

      {:error, _} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end
end
