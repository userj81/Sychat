defmodule ChatService.Tenants.Invite do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @roles ~w(admin member)

  schema "invites" do
    field(:email, :string)
    field(:code, :string)
    field(:role, :string, default: "member")
    field(:accepted_at, :naive_datetime)
    field(:expires_at, :naive_datetime)

    belongs_to(:tenant, ChatService.Tenants.Tenant)
    belongs_to(:invited_by, ChatService.Accounts.User)

    timestamps()
  end

  def create_changeset(invite, attrs) do
    invite
    |> cast(attrs, [:tenant_id, :email, :role, :invited_by_id, :expires_at])
    |> validate_required([:tenant_id, :email, :expires_at])
    |> validate_inclusion(:role, @roles)
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    |> put_code()
    |> unique_constraint([:tenant_id, :email])
  end

  def accept_changeset(invite, _attrs) do
    change(invite, accepted_at: NaiveDateTime.utc_now())
  end

  def valid?(invite) do
    invite.accepted_at == nil and
      NaiveDateTime.compare(invite.expires_at, NaiveDateTime.utc_now()) == :gt
  end

  defp put_code(%Ecto.Changeset{valid?: true} = changeset) do
    code = :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
    change(changeset, code: code)
  end

  defp put_code(changeset), do: changeset
end
