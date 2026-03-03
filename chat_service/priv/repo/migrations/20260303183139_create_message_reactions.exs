defmodule ChatService.Repo.Migrations.CreateMessageReactions do
  use Ecto.Migration

  def change do
    create table(:message_reactions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :emoji, :string, null: false
      add :message_id, references(:messages, on_delete: :delete_all, type: :binary_id), null: false
      add :user_id, references(:users, on_delete: :delete_all, type: :binary_id), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:message_reactions, [:message_id])
    create unique_index(:message_reactions, [:message_id, :user_id, :emoji])
  end
end
