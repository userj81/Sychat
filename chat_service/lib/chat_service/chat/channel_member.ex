defmodule ChatService.Chat.ChannelMember do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "channel_members" do
    belongs_to(:channel, ChatService.Chat.Channel)
    belongs_to(:user, ChatService.Accounts.User)
    
    belongs_to(:last_read_message, ChatService.Chat.Message, foreign_key: :last_read_message_id)
    field(:unread_count, :integer, default: 0)

    timestamps()
  end

  def changeset(channel_member, attrs) do
    channel_member
    |> cast(attrs, [:channel_id, :user_id, :last_read_message_id, :unread_count])
    |> validate_required([:channel_id, :user_id])
    |> unique_constraint([:channel_id, :user_id])
  end
end
