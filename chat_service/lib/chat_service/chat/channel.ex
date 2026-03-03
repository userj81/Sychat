defmodule ChatService.Chat.Channel do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @types ~w(public private dm)

  schema "channels" do
    field(:name, :string)
    field(:type, :string, default: "public")
    field(:is_private, :boolean, default: false)

    field(:unread_count, :integer, virtual: true, default: 0)
    field(:last_read_message_id, :binary_id, virtual: true)

    belongs_to(:tenant, ChatService.Tenants.Tenant)
    has_many(:messages, ChatService.Chat.Message)
    has_many(:channel_members, ChatService.Chat.ChannelMember)

    timestamps()
  end

  def create_changeset(channel, attrs) do
    channel
    |> cast(attrs, [:tenant_id, :name, :type])
    |> validate_required([:tenant_id, :name, :type])
    |> validate_inclusion(:type, @types)
    |> put_is_private()
  end

  def update_changeset(channel, attrs) do
    channel
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end

  def public?(channel), do: channel.type == "public"
  def private?(channel), do: channel.type == "private"
  def dm?(channel), do: channel.type == "dm"

  defp put_is_private(%Ecto.Changeset{valid?: true, changes: %{type: type}} = changeset) do
    change(changeset, is_private: type in ["private", "dm"])
  end

  defp put_is_private(changeset), do: changeset
end
