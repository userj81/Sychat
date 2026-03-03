defmodule ChatService.Accounts do
  import Ecto.Query
  alias ChatService.{Repo, Auth.JWT}
  alias ChatService.Accounts.{User, RefreshToken}

  def get_user(id), do: Repo.get(User, id)

  def get_user_by_email(email) do
    Repo.get_by(User, email: String.downcase(email))
  end

  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.update_changeset(attrs)
    |> Repo.update()
  end

  def update_system_role(%User{} = user, role) do
    user
    |> User.system_role_changeset(%{system_role: role})
    |> Repo.update()
  end

  def deactivate_user(id) do
    with %User{} = user <- Repo.get(User, id) do
      user
      |> Ecto.Changeset.change(deactivated_at: DateTime.utc_now() |> DateTime.truncate(:second))
      |> Repo.update()
    end
  end

  def system_admin?(%User{system_role: "system_admin"}), do: true
  def system_admin?(_), do: false

  def authenticate(email, password) do
    with %User{} = user <- get_user_by_email(email),
         true <- Bcrypt.verify_pass(password, user.password_hash) do
      if is_nil(user.deactivated_at) do
        {:ok, user}
      else
        {:error, :deactivated}
      end
    else
      _ -> {:error, :invalid_credentials}
    end
  end

  def login(email, password) do
    with {:ok, user} <- authenticate(email, password),
         {:ok, access_token} <- generate_access_token(user),
         {:ok, refresh_token} <- generate_refresh_token(user) do
      {:ok, %{user: user, access_token: access_token, refresh_token: refresh_token}}
    end
  end

  def refresh_session(refresh_token_str) do
    with {:ok, claims} <- JWT.verify_token(refresh_token_str),
         "refresh" <- claims["type"],
         {:ok, user} <- validate_refresh_token(refresh_token_str, claims["sub"]) do
      revoke_refresh_token(refresh_token_str)
      {:ok, access_token} = generate_access_token(user)
      {:ok, new_refresh_token} = generate_refresh_token(user)
      {:ok, %{user: user, access_token: access_token, refresh_token: new_refresh_token}}
    else
      _ -> {:error, :invalid_refresh_token}
    end
  end

  def logout(refresh_token_str) do
    revoke_refresh_token(refresh_token_str)
    :ok
  end

  defp generate_access_token(user) do
    {:ok, JWT.generate_access_token(user.id)}
  end

  defp generate_refresh_token(user) do
    token = JWT.generate_refresh_token(user.id)
    token_hash = :crypto.hash(:sha256, token) |> Base.encode64()

    expires_at = NaiveDateTime.add(NaiveDateTime.utc_now(), 60 * 60 * 24 * 30, :second)

    %RefreshToken{}
    |> RefreshToken.changeset(%{
      user_id: user.id,
      token_hash: token_hash,
      expires_at: expires_at
    })
    |> Repo.insert()

    {:ok, token}
  end

  defp validate_refresh_token(token_str, user_id) do
    token_hash = :crypto.hash(:sha256, token_str) |> Base.encode64()

    query =
      from(rt in RefreshToken,
        where: rt.token_hash == ^token_hash and rt.user_id == ^user_id,
        select: rt
      )

    case Repo.one(query) do
      %RefreshToken{} = rt ->
        if RefreshToken.valid?(rt) do
          {:ok, get_user(user_id)}
        else
          {:error, :expired}
        end

      nil ->
        {:error, :not_found}
    end
  end

  defp revoke_refresh_token(token_str) do
    token_hash = :crypto.hash(:sha256, token_str) |> Base.encode64()

    from(rt in RefreshToken, where: rt.token_hash == ^token_hash)
    |> Repo.update_all(set: [revoked_at: NaiveDateTime.utc_now()])
  end
end
