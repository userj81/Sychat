defmodule ChatService.Repo.Migrations.AddReadReceiptsToChannelMembers do
  use Ecto.Migration

  def change do
    alter table(:channel_members) do
      add :last_read_message_id, references(:messages, on_delete: :nilify_all, type: :binary_id)
      add :unread_count, :integer, default: 0, null: false
    end

    create index(:channel_members, [:last_read_message_id])
  end
end
