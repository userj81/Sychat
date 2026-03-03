defmodule ChatServiceWeb.TenantController do
  use ChatServiceWeb, :controller
  alias ChatService.Tenants

  action_fallback(ChatServiceWeb.FallbackController)

  def list_tenants(conn, _params) do
    current_user = conn.assigns.current_user

    tenants =
      if Tenants.system_admin?(current_user) do
        Tenants.list_tenants()
      else
        Tenants.list_user_tenants(current_user.id)
      end

    json(conn, %{tenants: Enum.map(tenants, fn t -> %{id: t.id, name: t.name, slug: t.slug} end)})
  end

  def create_tenant(conn, %{"name" => name, "slug" => slug}) do
    user_id = conn.assigns.current_user.id

    case Tenants.create_tenant(%{name: name, slug: slug}, user_id) do
      {:ok, tenant} ->
        conn
        |> put_status(:created)
        |> json(%{id: tenant.id, name: tenant.name, slug: tenant.slug})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: format_errors(changeset)})
    end
  end

  def get_tenant(conn, %{"tenant_id" => tenant_id}) do
    case Tenants.get_tenant(tenant_id) do
      nil -> {:error, :not_found}
      tenant -> json(conn, %{id: tenant.id, name: tenant.name, slug: tenant.slug})
    end
  end

  def list_members(conn, %{"tenant_id" => tenant_id}) do
    members = Tenants.list_tenant_members(tenant_id)

    json(conn, %{
      members:
        Enum.map(members, fn m ->
          %{
            user: %{id: m.user.id, email: m.user.email, name: m.user.name},
            role: m.role,
            joined_at: m.joined_at
          }
        end)
    })
  end

  def tenant_me(conn, %{"tenant_id" => tenant_id}) do
    user = conn.assigns.current_user

    role =
      cond do
        Tenants.system_admin?(user) -> "system_admin"
        membership = Tenants.get_membership(tenant_id, user.id) -> membership.role
        true -> nil
      end

    if role do
      json(conn, %{
        role: role,
        permissions: %{
          manage_members: Tenants.can_manage_members?(tenant_id, user),
          create_channels: Tenants.can_create_channels?(tenant_id, user),
          update_roles: Tenants.can_update_roles?(tenant_id, user)
        }
      })
    else
      {:error, :forbidden}
    end
  end

  def create_invite(conn, %{"tenant_id" => tenant_id, "email" => email, "role" => role}) do
    user = conn.assigns.current_user
    user_id = conn.assigns.current_user.id

    if Tenants.can_manage_members?(tenant_id, user) do
      case Tenants.create_invite(tenant_id, email, role, user_id) do
        {:ok, invite} ->
          conn
          |> put_status(:created)
          |> json(%{code: invite.code, expires_at: invite.expires_at})

        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: format_errors(changeset)})
      end
    else
      {:error, :forbidden}
    end
  end

  def list_invites(conn, %{"tenant_id" => tenant_id}) do
    user = conn.assigns.current_user

    if Tenants.can_manage_members?(tenant_id, user) do
      invites = Tenants.list_tenant_invites(tenant_id)

      json(conn, %{
        invites:
          Enum.map(invites, fn invite ->
            %{
              id: invite.id,
              email: invite.email,
              role: invite.role,
              code: invite.code,
              expires_at: invite.expires_at,
              accepted_at: invite.accepted_at
            }
          end)
      })
    else
      {:error, :forbidden}
    end
  end

  def accept_invite(conn, %{"code" => code}) do
    user_id = conn.assigns.current_user.id

    case Tenants.accept_invite(code, user_id) do
      :ok ->
        json(conn, %{message: "Joined successfully"})

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
    end
  end

  def remove_member(conn, %{"tenant_id" => tenant_id, "user_id" => user_id}) do
    user = conn.assigns.current_user
    removed_by_id = conn.assigns.current_user.id

    if Tenants.can_manage_members?(tenant_id, user) do
      case Tenants.remove_member(tenant_id, user_id, removed_by_id) do
        :ok -> json(conn, %{message: "Member removed"})
        {:error, reason} -> {:error, reason}
      end
    else
      {:error, :forbidden}
    end
  end

  def update_member_role(
        conn,
        %{"tenant_id" => tenant_id, "user_id" => user_id, "role" => role}
      ) do
    user = conn.assigns.current_user

    if Tenants.can_update_roles?(tenant_id, user) do
      case Tenants.update_member_role(tenant_id, user_id, role, user.id) do
        :ok -> json(conn, %{message: "Member role updated"})
        {:error, reason} -> {:error, reason}
      end
    else
      {:error, :forbidden}
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
