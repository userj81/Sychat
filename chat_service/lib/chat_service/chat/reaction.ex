defmodule ChatService.Chat.Reaction do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "message_reactions" do
    field :emoji, :string

    belongs_to :message, ChatService.Chat.Message
    belongs_to :user, ChatService.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(reaction, attrs) do
    reaction
    |> cast(attrs, [:emoji, :message_id, :user_id])
    |> validate_required([:emoji, :message_id, :user_id])
    |> unique_constraint([:message_id, :user_id, :emoji], name: :message_reactions_message_id_user_id_emoji_index)
  end
end
