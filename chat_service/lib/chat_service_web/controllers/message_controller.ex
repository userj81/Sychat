defmodule ChatServiceWeb.MessageController do
  use ChatServiceWeb, :controller
  alias ChatService.Chat

  action_fallback(ChatServiceWeb.FallbackController)

  def list_messages(conn, %{"channel_id" => channel_id}) do
    user_id = conn.assigns.current_user.id

    unless Chat.can_access_channel?(channel_id, user_id) do
      raise ChatServiceWeb.ForbiddenError
    end

    cursor = conn.query_params["cursor"]
    limit = String.to_integer(conn.query_params["limit"] || "50")

    messages = Chat.list_messages(channel_id, cursor: cursor, limit: limit)

    json(conn, %{
      messages: Enum.map(messages, &message_to_map/1)
    })
  end

  def list_thread_messages(conn, %{"channel_id" => channel_id, "parent_id" => parent_id}) do
    user_id = conn.assigns.current_user.id

    unless Chat.can_access_channel?(channel_id, user_id) do
      raise ChatServiceWeb.ForbiddenError
    end

    cursor = conn.query_params["cursor"]
    limit = String.to_integer(conn.query_params["limit"] || "50")

    messages = Chat.list_thread_messages(parent_id, cursor: cursor, limit: limit)

    json(conn, %{
      messages: Enum.map(messages, &message_to_map/1)
    })
  end

  def create_message(conn, %{"channel_id" => channel_id, "body" => body, "client_id" => client_id} = params) do
    user_id = conn.assigns.current_user.id
    tenant_id = conn.assigns.current_tenant_id

    unless Chat.can_access_channel?(channel_id, user_id) do
      raise ChatServiceWeb.ForbiddenError
    end

    opts = if params["parent_id"], do: [parent_id: params["parent_id"]], else: []

    case Chat.create_message(tenant_id, channel_id, user_id, body, client_id, opts) do
      {:ok, message} ->
        # Broadcast via Endpoint to emulate socket message:new, like attachment endpoint does
        ChatServiceWeb.Endpoint.broadcast!(
          "channel:#{channel_id}",
          "message:new",
          %{message: message_to_map(message)}
        )
      
        conn
        |> put_status(:created)
        |> json(message_to_map(message))

      {:error, :duplicate_message} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "Duplicate message"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: format_errors(changeset)})
    end
  end
  
  def create_message_with_attachment(conn, %{"channel_id" => channel_id, "file" => %Plug.Upload{} = upload} = params) do
    user_id = conn.assigns.current_user.id
    tenant_id = conn.assigns.current_tenant_id

    unless Chat.can_access_channel?(channel_id, user_id) do
      raise ChatServiceWeb.ForbiddenError
    end

    # Handle file upload locally in priv/static/uploads
    filename = "#{Ecto.UUID.generate()}-#{upload.filename}"
    uploads_dir = Path.join(:code.priv_dir(:chat_service), "static/uploads")
    File.mkdir_p!(uploads_dir)
    dest_path = Path.join(uploads_dir, filename)
    File.cp!(upload.path, dest_path)
    
    # Generate attachment URL (assume local endpoint for MVP)
    attachment_url = "/uploads/#{filename}"
    
    body = Map.get(params, "body", "")
    client_id = Map.get(params, "client_id", Ecto.UUID.generate())
    
    opts = [
      parent_id: Map.get(params, "parent_id"),
      attachment_url: attachment_url,
      attachment_type: upload.content_type,
      attachment_name: upload.filename
    ] |> Enum.reject(fn {_, v} -> is_nil(v) end)

    case Chat.create_message(tenant_id, channel_id, user_id, body, client_id, opts) do
      {:ok, message} ->
        # Broadcast via Endpoint to emulate socket message:new
        ChatServiceWeb.Endpoint.broadcast!(
          "channel:#{channel_id}",
          "message:new",
          %{message: message_to_map(message)}
        )
      
        conn
        |> put_status(:created)
        |> json(message_to_map(message))

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: format_errors(changeset)})
    end
  end

  def update_message(conn, %{"message_id" => message_id, "body" => body}) do
    user_id = conn.assigns.current_user.id

    case Chat.update_message(message_id, user_id, body) do
      {:ok, message} ->
        json(conn, message_to_map(message))

      {:error, :not_found} ->
        {:error, :not_found}

      {:error, :unauthorized} ->
        {:error, :forbidden}
    end
  end

  def delete_message(conn, %{"message_id" => message_id}) do
    user_id = conn.assigns.current_user.id

    case Chat.delete_message(message_id, user_id) do
      :ok ->
        json(conn, %{message: "Message deleted"})

      {:error, :not_found} ->
        {:error, :not_found}

      {:error, :unauthorized} ->
        {:error, :forbidden}
    end
  end

  defp message_to_map(message) do
    user = if Ecto.assoc_loaded?(message.user) && message.user, do: message.user, else: nil
    reactions = if Ecto.assoc_loaded?(message.reactions) && message.reactions, do: message.reactions, else: []

    %{
      id: message.id,
      body: message.body,
      client_id: message.client_id,
      user: if(user, do: %{
        id: user.id, 
        name: user.name, 
        avatar_url: user.avatar_url,
        deactivated_at: user.deactivated_at
      }, else: %{id: nil, name: "Unknown"}),
      reactions: Enum.map(reactions, fn r ->
        r_user = if Ecto.assoc_loaded?(r.user) && r.user, do: r.user, else: nil
        %{
          id: r.id,
          emoji: r.emoji,
          user: if(r_user, do: %{id: r_user.id, name: r_user.name}, else: %{id: nil, name: "Unknown"})
        }
      end),
      parent_id: message.parent_id,
      reply_count: message.reply_count,
      attachment_url: message.attachment_url,
      attachment_type: message.attachment_type,
      attachment_name: message.attachment_name,
      edited_at: message.edited_at,
      deleted_at: message.deleted_at,
      inserted_at: message.inserted_at
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
