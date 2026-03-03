defmodule ChatService.Audit.AuditLog do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @actions ~w(login logout tenant_created invite_sent invite_accepted channel_created channel_joined channel_left message_sent message_edited message_deleted member_removed)

  schema "audit_logs" do
    field(:action, :string)
    field(:entity_type, :string)
    field(:entity_id, :binary_id)
    field(:metadata, :map, default: %{})

    belongs_to(:tenant, ChatService.Tenants.Tenant)
    belongs_to(:user, ChatService.Accounts.User)

    timestamps()
  end

  def create_changeset(audit_log, attrs) do
    audit_log
    |> cast(attrs, [:tenant_id, :user_id, :action, :entity_type, :entity_id, :metadata])
    |> validate_required([:action])
    |> validate_inclusion(:action, @actions)
  end

  def actions, do: @actions
end
