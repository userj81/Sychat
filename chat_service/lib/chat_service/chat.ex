defmodule ChatService.Chat do
  import Ecto.Query
  alias ChatService.{Repo, Tenants, Audit}
  alias ChatService.Chat.{Channel, ChannelMember, Message, Reaction}

  def get_channel(id), do: Repo.get(Channel, id)

  def list_tenant_channels(tenant_id) do
    from(c in Channel,
      where: c.tenant_id == ^tenant_id and c.type == "public",
      order_by: [asc: :name]
    )
    |> Repo.all()
  end

  def list_user_channels(tenant_id, user_id) do
    public_channels =
      from(c in Channel,
        left_join: cm in ChannelMember,
        on: cm.channel_id == c.id and cm.user_id == ^user_id,
        where: c.tenant_id == ^tenant_id and c.type == "public",
        select: %{c | unread_count: coalesce(cm.unread_count, 0), last_read_message_id: cm.last_read_message_id}
      )

    private_channels =
      from(c in Channel,
        join: cm in ChannelMember,
        on: cm.channel_id == c.id,
        where: c.tenant_id == ^tenant_id and c.type == "private" and cm.user_id == ^user_id,
        select: %{c | unread_count: cm.unread_count, last_read_message_id: cm.last_read_message_id}
      )

    dm_channels =
      from(c in Channel,
        join: cm in ChannelMember,
        on: cm.channel_id == c.id,
        where: c.tenant_id == ^tenant_id and c.type == "dm" and cm.user_id == ^user_id,
        select: %{c | unread_count: cm.unread_count, last_read_message_id: cm.last_read_message_id}
      )

    public = Repo.all(public_channels)
    private = Repo.all(private_channels)
    dms = Repo.all(dm_channels)

    %{public: public, private: private, dms: dms}
  end

  def create_channel(tenant_id, attrs, created_by_id) do
    attrs = Map.put(attrs, :tenant_id, tenant_id)

    result =
      Ecto.Multi.new()
      |> Ecto.Multi.insert(:channel, %Channel{} |> Channel.create_changeset(attrs))
      |> Ecto.Multi.run(:add_creator, fn _repo, %{channel: channel} ->
        if channel.type in ["private", "dm"] do
          add_channel_member(channel.id, created_by_id)
        else
          {:ok, nil}
        end
      end)
      |> Repo.transaction()

    case result do
      {:ok, %{channel: channel}} ->
        Audit.log("channel_created", tenant_id, created_by_id, %{
          name: channel.name,
          type: channel.type
        })

        {:ok, channel}

      {:error, _op, changeset, _changes} ->
        {:error, changeset}
    end
  end

  def update_channel(%Channel{} = channel, attrs) do
    channel
    |> Channel.update_changeset(attrs)
    |> Repo.update()
  end

  def delete_channel(%Channel{} = channel) do
    Repo.delete(channel)
  end

  def can_access_channel?(channel_id, user_id) do
    channel = get_channel(channel_id)

    cond do
      channel == nil -> false
      Channel.public?(channel) -> true
      true -> channel_member?(channel_id, user_id)
    end
  end

  def channel_member?(channel_id, user_id) do
    Repo.get_by(ChannelMember, channel_id: channel_id, user_id: user_id) != nil
  end

  def add_channel_member(channel_id, user_id) do
    %ChannelMember{}
    |> ChannelMember.changeset(%{channel_id: channel_id, user_id: user_id})
    |> Repo.insert()
  end

  def remove_channel_member(channel_id, user_id) do
    case Repo.get_by(ChannelMember, channel_id: channel_id, user_id: user_id) do
      %ChannelMember{} = member -> Repo.delete(member)
      nil -> {:error, :not_found}
    end
  end

  def join_channel(channel_id, user_id, tenant_id) do
    channel = get_channel(channel_id)

    cond do
      channel == nil ->
        {:error, :not_found}

      channel.tenant_id != tenant_id ->
        {:error, :unauthorized}

      Channel.public?(channel) ->
        result = add_channel_member(channel_id, user_id)
        Audit.log("channel_joined", tenant_id, user_id, %{channel_id: channel_id})
        result

      true ->
        {:error, :cannot_join_private}
    end
  end

  def leave_channel(channel_id, user_id, tenant_id) do
    case remove_channel_member(channel_id, user_id) do
      {:ok, _} ->
        Audit.log("channel_left", tenant_id, user_id, %{channel_id: channel_id})
        :ok

      error ->
        error
    end
  end

  def get_or_create_dm(tenant_id, user_id, other_user_id) do
    dm_query =
      from(c in Channel,
        join: cm1 in ChannelMember,
        on: cm1.channel_id == c.id and cm1.user_id == ^user_id,
        join: cm2 in ChannelMember,
        on: cm2.channel_id == c.id and cm2.user_id == ^other_user_id,
        where: c.tenant_id == ^tenant_id and c.type == "dm",
        select: c
      )

    case Repo.one(dm_query) do
      %Channel{} = channel ->
        {:ok, channel}

      nil ->
        create_dm(tenant_id, user_id, other_user_id)
    end
  end

  defp create_dm(tenant_id, user_id, other_user_id) do
    result =
      Ecto.Multi.new()
      |> Ecto.Multi.insert(
        :channel,
        %Channel{}
        |> Channel.create_changeset(%{
          tenant_id: tenant_id,
          name: "dm:#{user_id}:#{other_user_id}",
          type: "dm"
        })
      )
      |> Ecto.Multi.run(:member1, fn _repo, %{channel: channel} ->
        add_channel_member(channel.id, user_id)
      end)
      |> Ecto.Multi.run(:member2, fn _repo, %{channel: channel} ->
        add_channel_member(channel.id, other_user_id)
      end)
      |> Repo.transaction()

    case result do
      {:ok, %{channel: channel}} -> {:ok, channel}
      {:error, _op, changeset, _changes} -> {:error, changeset}
    end
  end

  def list_messages(channel_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    cursor = Keyword.get(opts, :cursor)

    query =
      from(m in Message,
        where: m.channel_id == ^channel_id and is_nil(m.deleted_at) and is_nil(m.parent_id),
        order_by: [desc: m.inserted_at],
        limit: ^limit,
        preload: [:user, :reactions]
      )

    query =
      if cursor do
        from(m in query, where: m.inserted_at < ^cursor)
      else
        query
      end

    Repo.all(query) |> Enum.reverse()
  end
  
  def list_thread_messages(parent_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    cursor = Keyword.get(opts, :cursor)

    query =
      from(m in Message,
        where: m.parent_id == ^parent_id and is_nil(m.deleted_at),
        order_by: [desc: m.inserted_at],
        limit: ^limit,
        preload: [:user, :reactions]
      )

    query =
      if cursor do
        from(m in query, where: m.inserted_at < ^cursor)
      else
        query
      end

    Repo.all(query) |> Enum.reverse()
  end

  def get_message(id), do: Repo.get(Message, id) |> Repo.preload([:user, :reactions])

  def create_message(tenant_id, channel_id, user_id, body, client_id, opts \\ []) do
    attrs = %{
      tenant_id: tenant_id,
      channel_id: channel_id,
      user_id: user_id,
      body: body,
      client_id: client_id,
      parent_id: Keyword.get(opts, :parent_id),
      attachment_url: Keyword.get(opts, :attachment_url),
      attachment_type: Keyword.get(opts, :attachment_type),
      attachment_name: Keyword.get(opts, :attachment_name)
    }
  
    %Message{}
    |> Message.create_changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} ->
        Audit.log("message_sent", tenant_id, user_id, %{
          channel_id: channel_id,
          client_id: client_id,
          parent_id: attrs[:parent_id]
        })

        increment_unread_counts(channel_id, user_id)
        
        # If it's a reply, increment reply count
        if attrs[:parent_id] do
           from(m in Message, where: m.id == ^attrs[:parent_id])
           |> Repo.update_all(inc: [reply_count: 1])
        end

        {:ok, Repo.preload(message, [:user, :reactions])}

      {:error, %Ecto.Changeset{errors: [tenant_id_client_id: {"has already been taken", _}]}} ->
        {:error, :duplicate_message}

      error ->
        error
    end
  end

  def update_message(message_id, user_id, body) do
    with %Message{} = message <- get_message(message_id),
         true <- message.user_id == user_id do
      message
      |> Message.update_changeset(%{body: body})
      |> Repo.update()
      |> case do
        {:ok, updated} ->
          Audit.log("message_edited", message.tenant_id, user_id, %{message_id: message_id})
          {:ok, updated}

        error ->
          error
      end
    else
      nil -> {:error, :not_found}
      false -> {:error, :unauthorized}
    end
  end

  def delete_message(message_id, user_id) do
    with %Message{} = message <- get_message(message_id),
         true <- message.user_id == user_id or Tenants.admin_or_owner?(message.tenant_id, user_id) do
      message
      |> Message.delete_changeset()
      |> Repo.update()
      |> case do
        {:ok, _} ->
          Audit.log("message_deleted", message.tenant_id, user_id, %{message_id: message_id})
          :ok

        error ->
          error
      end
    else
      nil -> {:error, :not_found}
      false -> {:error, :unauthorized}
    end
  end

  defp increment_unread_counts(channel_id, exclude_user_id) do
    from(cm in ChannelMember,
      where: cm.channel_id == ^channel_id and cm.user_id != ^exclude_user_id
    )
    |> Repo.update_all(inc: [unread_count: 1])
  end

  def mark_channel_read(channel_id, user_id, message_id) do
    from(cm in ChannelMember,
      where: cm.channel_id == ^channel_id and cm.user_id == ^user_id
    )
    |> Repo.update_all(set: [unread_count: 0, last_read_message_id: message_id])
  end

  def add_reaction(message_id, user_id, emoji) do
    %Reaction{}
    |> Reaction.changeset(%{message_id: message_id, user_id: user_id, emoji: emoji})
    |> Repo.insert()
    |> case do
      {:ok, reaction} -> {:ok, Repo.preload(reaction, [:user])}
      error -> error
    end
  end

  def remove_reaction(message_id, user_id, emoji) do
    from(r in Reaction,
      where: r.message_id == ^message_id and r.user_id == ^user_id and r.emoji == ^emoji
    )
    |> Repo.delete_all()
    |> case do
      {count, _} when count > 0 -> :ok
      _ -> {:error, :not_found}
    end
  end
end
