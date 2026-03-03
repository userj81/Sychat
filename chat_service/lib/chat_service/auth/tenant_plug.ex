defmodule ChatService.Auth.TenantPlug do
  import Plug.Conn
  alias ChatService.Tenants

  def init(opts), do: opts

  def call(conn, _opts) do
    tenant_id = get_tenant_id(conn)
    current_user = conn.assigns.current_user

    with {:ok, tenant_id} <- tenant_id do
      cond do
        Tenants.system_admin?(current_user) ->
          conn
          |> assign(:current_tenant_id, tenant_id)
          |> assign(:current_role, "system_admin")

        Tenants.member?(tenant_id, current_user.id) ->
          membership = Tenants.get_membership(tenant_id, current_user.id)

          conn
          |> assign(:current_tenant_id, tenant_id)
          |> assign(:current_role, membership.role)

        true ->
          conn
          |> put_status(:forbidden)
          |> Phoenix.Controller.json(%{error: "Access denied to this tenant"})
          |> halt()
      end
    else
      _ ->
        conn
        |> put_status(:forbidden)
        |> Phoenix.Controller.json(%{error: "Access denied to this tenant"})
        |> halt()
    end
  end

  defp get_tenant_id(conn) do
    case conn.params["tenant_id"] || conn.path_params["tenant_id"] do
      nil -> {:error, :missing_tenant}
      id -> {:ok, id}
    end
  end
end
