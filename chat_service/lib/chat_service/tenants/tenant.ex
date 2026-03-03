defmodule ChatService.Tenants.Tenant do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "tenants" do
    field(:name, :string)
    field(:slug, :string)

    belongs_to(:owner, ChatService.Accounts.User)
    has_many(:memberships, ChatService.Tenants.Membership)
    has_many(:channels, ChatService.Chat.Channel)

    timestamps()
  end

  def create_changeset(tenant, attrs) do
    tenant
    |> cast(attrs, [:name, :slug, :owner_id])
    |> validate_required([:name, :slug])
    |> validate_format(:slug, ~r/^[a-z0-9-]+$/,
      message: "apenas letras minúsculas, números e hífens"
    )
    |> unique_constraint(:slug)
  end

  def update_changeset(tenant, attrs) do
    tenant
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end
end
