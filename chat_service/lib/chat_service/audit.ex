defmodule ChatService.Audit do
  alias ChatService.Repo
  alias ChatService.Audit.AuditLog

  def log(action, tenant_id, user_id, metadata \\ %{}) do
    %AuditLog{}
    |> AuditLog.create_changeset(%{
      action: action,
      tenant_id: tenant_id,
      user_id: user_id,
      metadata: metadata
    })
    |> Repo.insert()
  end

  def log_user_action(action, user_id, metadata \\ %{}) do
    %AuditLog{}
    |> AuditLog.create_changeset(%{
      action: action,
      user_id: user_id,
      metadata: metadata
    })
    |> Repo.insert()
  end
end
