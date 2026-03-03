defmodule ChatService.Repo.Migrations.InitSchema do
  use Ecto.Migration

  def change do
    create table(:tenants, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:name, :string, null: false)
      add(:slug, :string, null: false)
      timestamps()
    end

    create(unique_index(:tenants, [:slug]))

    create table(:users, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:email, :string, null: false)
      add(:name, :string, null: false)
      add(:password_hash, :string, null: false)
      timestamps()
    end

    create(unique_index(:users, [:email]))

    create table(:memberships, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:tenant_id, references(:tenants, type: :binary_id, on_delete: :delete_all))
      add(:user_id, references(:users, type: :binary_id, on_delete: :delete_all))
      add(:role, :string, default: "member")
      timestamps()
    end

    create(unique_index(:memberships, [:tenant_id, :user_id]))

    create table(:channels, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:tenant_id, references(:tenants, type: :binary_id, on_delete: :delete_all))
      add(:type, :string, default: "public")
      add(:name, :string, null: false)
      add(:is_private, :boolean, default: false)
      timestamps()
    end

    create(index(:channels, [:tenant_id]))

    create table(:messages, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:tenant_id, references(:tenants, type: :binary_id))
      add(:channel_id, references(:channels, type: :binary_id))
      add(:user_id, references(:users, type: :binary_id))
      add(:body, :text)
      add(:client_id, :string)
      timestamps()
    end

    create(unique_index(:messages, [:tenant_id, :client_id]))
    create(index(:messages, [:tenant_id, :channel_id, :inserted_at]))
  end
end
