defmodule ChatService.Repo.Migrations.AddSystemRoleToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:system_role, :string, default: "user", null: false)
    end

    create(
      constraint(:users, :users_system_role_valid,
        check: "system_role IN ('user', 'system_admin')"
      )
    )

    create(index(:users, [:system_role]))
  end
end
