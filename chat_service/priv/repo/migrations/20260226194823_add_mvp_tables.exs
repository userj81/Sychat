defmodule ChatService.Repo.Migrations.AddMvpTables do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add(:owner_id, references(:users, type: :binary_id))
    end

    alter table(:channels) do
      modify(:type, :string, default: "public")
    end

    create table(:channel_members, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:channel_id, references(:channels, type: :binary_id, on_delete: :delete_all))
      add(:user_id, references(:users, type: :binary_id, on_delete: :delete_all))
      timestamps()
    end

    create(unique_index(:channel_members, [:channel_id, :user_id]))

    create table(:invites, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:tenant_id, references(:tenants, type: :binary_id, on_delete: :delete_all))
      add(:email, :string, null: false)
      add(:code, :string, null: false)
      add(:role, :string, default: "member")
      add(:invited_by_id, references(:users, type: :binary_id))
      add(:accepted_at, :naive_datetime)
      add(:expires_at, :naive_datetime, null: false)
      timestamps()
    end

    create(unique_index(:invites, [:code]))
    create(index(:invites, [:tenant_id, :email]))

    create table(:refresh_tokens, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:user_id, references(:users, type: :binary_id, on_delete: :delete_all))
      add(:token_hash, :string, null: false)
      add(:expires_at, :naive_datetime, null: false)
      add(:revoked_at, :naive_datetime)
      timestamps()
    end

    create(index(:refresh_tokens, [:user_id]))
    create(unique_index(:refresh_tokens, [:token_hash]))

    alter table(:messages) do
      add(:deleted_at, :naive_datetime)
      add(:edited_at, :naive_datetime)
    end

    create table(:audit_logs, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:tenant_id, references(:tenants, type: :binary_id))
      add(:user_id, references(:users, type: :binary_id))
      add(:action, :string, null: false)
      add(:entity_type, :string)
      add(:entity_id, :binary_id)
      add(:metadata, :map)
      timestamps()
    end

    create(index(:audit_logs, [:tenant_id, :inserted_at]))
    create(index(:audit_logs, [:user_id]))
  end
end
