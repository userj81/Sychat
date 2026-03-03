defmodule ChatService.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @system_roles ~w(user system_admin)

  schema "users" do
    field(:email, :string)
    field(:name, :string)
    field(:avatar_url, :string)
    field(:system_role, :string, default: "user")
    field(:password, :string, virtual: true)
    field(:password_hash, :string)

    has_many(:memberships, ChatService.Tenants.Membership)
    has_many(:tenants, through: [:memberships, :tenant])
    has_many(:refresh_tokens, ChatService.Accounts.RefreshToken)

    field(:deactivated_at, :utc_datetime)

    timestamps()
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :name, :password])
    |> validate_required([:email, :name, :password])
    |> put_change(:system_role, "user")
    |> validate_email()
    |> validate_password()
    |> put_password_hash()
  end

  def update_changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :avatar_url])
    |> validate_required([:name])
  end

  def system_role_changeset(user, attrs) do
    user
    |> cast(attrs, [:system_role])
    |> validate_required([:system_role])
    |> validate_inclusion(:system_role, @system_roles)
  end

  defp validate_email(changeset) do
    changeset
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    |> unique_constraint(:email)
  end

  defp validate_password(changeset) do
    changeset
    |> validate_length(:password, min: 8, max: 72)
  end

  defp put_password_hash(
         %Ecto.Changeset{valid?: true, changes: %{password: password}} = changeset
       ) do
    change(changeset, Bcrypt.add_hash(password))
  end

  defp put_password_hash(changeset), do: changeset

  def system_roles, do: @system_roles
end
