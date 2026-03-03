defmodule ChatServiceWeb.AuthController do
  use ChatServiceWeb, :controller
  alias ChatService.Accounts

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.login(email, password) do
      {:ok, %{user: user, access_token: token, refresh_token: refresh_token}} ->
        conn
        |> put_status(:ok)
        |> json(%{
          user: %{id: user.id, email: user.email, name: user.name, system_role: user.system_role},
          access_token: token,
          refresh_token: refresh_token
        })

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})

      {:error, :deactivated} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Your account has been deactivated. Please contact support."})
    end
  end

  def register(conn, %{"email" => email, "password" => password, "name" => name}) do
    case Accounts.register_user(%{email: email, password: password, name: name}) do
      {:ok, _created_user} ->
        {:ok, %{user: user, access_token: token, refresh_token: refresh_token}} =
          Accounts.login(email, password)

        conn
        |> put_status(:created)
        |> json(%{
          user: %{id: user.id, email: user.email, name: user.name, system_role: user.system_role},
          access_token: token,
          refresh_token: refresh_token
        })

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: format_errors(changeset)})
    end
  end

  def refresh(conn, %{"refresh_token" => refresh_token}) do
    case Accounts.refresh_session(refresh_token) do
      {:ok, %{user: user, access_token: token, refresh_token: new_refresh_token}} ->
        conn
        |> put_status(:ok)
        |> json(%{
          user: %{id: user.id, email: user.email, name: user.name, system_role: user.system_role},
          access_token: token,
          refresh_token: new_refresh_token
        })

      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid or expired refresh token"})
    end
  end

  def logout(conn, %{"refresh_token" => refresh_token}) do
    Accounts.logout(refresh_token)
    json(conn, %{message: "Logged out successfully"})
  end

  def me(conn, _params) do
    user = conn.assigns.current_user

    json(conn, %{
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      system_role: user.system_role
    })
  end

  def update_profile(conn, params) do
    user = conn.assigns.current_user
    attrs = Map.take(params, ["name", "avatar_url"])

    case Accounts.update_user(user, attrs) do
      {:ok, user} ->
        json(conn, %{id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: format_errors(changeset)})
    end
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
