defmodule ChatService.Accounts.RefreshToken do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "refresh_tokens" do
    field(:token_hash, :string)
    field(:expires_at, :naive_datetime)
    field(:revoked_at, :naive_datetime)

    belongs_to(:user, ChatService.Accounts.User)

    timestamps()
  end

  def changeset(refresh_token, attrs) do
    refresh_token
    |> cast(attrs, [:token_hash, :expires_at, :revoked_at, :user_id])
    |> validate_required([:token_hash, :expires_at, :user_id])
    |> unique_constraint(:token_hash)
  end

  def valid?(token) do
    token.revoked_at == nil and
      NaiveDateTime.compare(token.expires_at, NaiveDateTime.utc_now()) == :gt
  end
end
