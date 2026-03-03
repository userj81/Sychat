defmodule ChatService.Chat.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "messages" do
    field(:body, :string)
    field(:client_id, :string)
    field(:deleted_at, :naive_datetime)
    field(:edited_at, :naive_datetime)

    # Threading
    field(:reply_count, :integer, default: 0)
    
    # Attachments
    field(:attachment_url, :string)
    field(:attachment_type, :string)
    field(:attachment_name, :string)

    belongs_to(:parent, ChatService.Chat.Message)
    has_many(:replies, ChatService.Chat.Message, foreign_key: :parent_id)

    belongs_to(:tenant, ChatService.Tenants.Tenant)
    belongs_to(:channel, ChatService.Chat.Channel)
    belongs_to(:user, ChatService.Accounts.User)
    has_many(:reactions, ChatService.Chat.Reaction)

    timestamps()
  end

  def create_changeset(message, attrs) do
    message
    |> cast(attrs, [
      :tenant_id, :channel_id, :user_id, :body, :client_id, 
      :parent_id, :attachment_url, :attachment_type, :attachment_name
    ])
    |> validate_required([:tenant_id, :channel_id, :user_id, :body, :client_id])
    |> unique_constraint([:tenant_id, :client_id])
  end

  def update_changeset(message, attrs) do
    message
    |> cast(attrs, [:body])
    |> validate_required([:body])
    |> put_edited_at()
  end

  def delete_changeset(message) do
    change(message, deleted_at: NaiveDateTime.utc_now())
  end

  def deleted?(message), do: message.deleted_at != nil

  defp put_edited_at(%Ecto.Changeset{valid?: true} = changeset) do
    change(changeset, edited_at: NaiveDateTime.utc_now())
  end

  defp put_edited_at(changeset), do: changeset
end
