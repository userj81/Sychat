defmodule ChatService.Tenants.Membership do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @roles ~w(owner admin member)

  schema "memberships" do
    field(:role, :string, default: "member")

    belongs_to(:tenant, ChatService.Tenants.Tenant)
    belongs_to(:user, ChatService.Accounts.User)

    timestamps()
  end

  def changeset(membership, attrs) do
    membership
    |> cast(attrs, [:tenant_id, :user_id, :role])
    |> validate_required([:tenant_id, :user_id])
    |> validate_inclusion(:role, @roles)
    |> unique_constraint([:tenant_id, :user_id])
  end

  def roles, do: @roles
end
