defmodule ChatService.Tenants do
  import Ecto.Query
  alias ChatService.{Repo, Audit}
  alias ChatService.Tenants.{Tenant, Membership, Invite}
  alias ChatService.Accounts.User

  def get_tenant(id), do: Repo.get(Tenant, id)

  def get_tenant_by_slug(slug), do: Repo.get_by(Tenant, slug: slug)

  def list_tenants do
    from(t in Tenant, order_by: [asc: t.name])
    |> Repo.all()
  end

  def list_user_tenants(user_id) do
    from(t in Tenant,
      join: m in Membership,
      on: m.tenant_id == t.id,
      where: m.user_id == ^user_id,
      select: t
    )
    |> Repo.all()
  end

  def create_tenant(attrs, owner_id) do
    result =
      Ecto.Multi.new()
      |> Ecto.Multi.insert(:tenant, fn _ ->
        %Tenant{}
        |> Tenant.create_changeset(Map.put(attrs, :owner_id, owner_id))
      end)
      |> Ecto.Multi.insert(:membership, fn %{tenant: tenant} ->
        %Membership{}
        |> Membership.changeset(%{
          tenant_id: tenant.id,
          user_id: owner_id,
          role: "owner"
        })
      end)
      |> Repo.transaction()

    case result do
      {:ok, %{tenant: tenant}} ->
        Audit.log("tenant_created", tenant.id, owner_id, %{name: tenant.name})
        {:ok, tenant}

      {:error, _op, changeset, _changes} ->
        {:error, changeset}
    end
  end

  def update_tenant(%Tenant{} = tenant, attrs) do
    tenant
    |> Tenant.update_changeset(attrs)
    |> Repo.update()
  end

  def get_membership(tenant_id, user_id) do
    Repo.get_by(Membership, tenant_id: tenant_id, user_id: user_id)
  end

  def list_tenant_members(tenant_id) do
    from(m in Membership,
      where: m.tenant_id == ^tenant_id,
      join: u in User,
      on: u.id == m.user_id,
      where: is_nil(u.deactivated_at),
      select: %{user: u, role: m.role, joined_at: m.inserted_at}
    )
    |> Repo.all()
  end

  def member?(tenant_id, user_id) do
    get_membership(tenant_id, user_id) != nil
  end

  def admin_or_owner?(tenant_id, user_id) do
    case get_membership(tenant_id, user_id) do
      %Membership{role: role} when role in ["owner", "admin"] -> true
      _ -> false
    end
  end

  def owner?(tenant_id, user_id) do
    case get_membership(tenant_id, user_id) do
      %Membership{role: "owner"} -> true
      _ -> false
    end
  end

  def system_admin?(%User{system_role: "system_admin"}), do: true
  def system_admin?(_), do: false

  def can_manage_members?(tenant_id, user) do
    system_admin?(user) or admin_or_owner?(tenant_id, user.id)
  end

  def can_create_channels?(tenant_id, user) do
    system_admin?(user) or admin_or_owner?(tenant_id, user.id)
  end

  def can_update_roles?(tenant_id, user) do
    system_admin?(user) or owner?(tenant_id, user.id)
  end

  def create_invite(tenant_id, email, role, invited_by_id) do
    expires_at = NaiveDateTime.add(NaiveDateTime.utc_now(), 60 * 60 * 24 * 7, :second)

    %Invite{}
    |> Invite.create_changeset(%{
      tenant_id: tenant_id,
      email: email,
      role: role,
      invited_by_id: invited_by_id,
      expires_at: expires_at
    })
    |> Repo.insert()
    |> case do
      {:ok, invite} ->
        Audit.log("invite_sent", tenant_id, invited_by_id, %{email: email, role: role})
        {:ok, invite}

      error ->
        error
    end
  end

  def get_invite_by_code(code), do: Repo.get_by(Invite, code: code)

  def list_tenant_invites(tenant_id) do
    from(i in Invite,
      where: i.tenant_id == ^tenant_id and is_nil(i.accepted_at),
      order_by: [desc: i.inserted_at]
    )
    |> Repo.all()
  end

  def accept_invite(code, user_id) do
    with %Invite{} = invite <- get_invite_by_code(code),
         true <- Invite.valid?(invite),
         {:ok, _} <- add_member(invite.tenant_id, user_id, invite.role) do
      invite
      |> Invite.accept_changeset(%{})
      |> Repo.update()
      |> case do
        {:ok, _} ->
          Audit.log("invite_accepted", invite.tenant_id, user_id, %{email: invite.email})
          :ok

        error ->
          error
      end
    else
      nil -> {:error, :invite_not_found}
      false -> {:error, :invite_expired}
      {:error, _} = error -> error
    end
  end

  def add_member(tenant_id, user_id, role \\ "member") do
    %Membership{}
    |> Membership.changeset(%{tenant_id: tenant_id, user_id: user_id, role: role})
    |> Repo.insert()
  end

  def remove_member(tenant_id, user_id, removed_by_id) do
    case get_membership(tenant_id, user_id) do
      %Membership{role: "owner"} ->
        {:error, :cannot_remove_owner}

      %Membership{} = membership ->
        Repo.delete(membership)
        Audit.log("member_removed", tenant_id, removed_by_id, %{removed_user_id: user_id})
        :ok

      nil ->
        {:error, :not_found}
    end
  end

  def update_member_role(tenant_id, user_id, new_role, updated_by_id) do
    with %Membership{} = membership <- get_membership(tenant_id, user_id),
         false <- membership.role == "owner",
         true <- new_role in Membership.roles() do
      membership
      |> Membership.changeset(%{role: new_role})
      |> Repo.update()
      |> case do
        {:ok, _} ->
          Audit.log("member_role_updated", tenant_id, updated_by_id, %{
            user_id: user_id,
            new_role: new_role
          })

          :ok

        error ->
          error
      end
    else
      nil -> {:error, :not_found}
      true -> {:error, :cannot_change_owner_role}
      false -> {:error, :invalid_role}
    end
  end
end
