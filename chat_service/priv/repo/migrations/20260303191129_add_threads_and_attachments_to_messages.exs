defmodule ChatService.Repo.Migrations.AddThreadsAndAttachmentsToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      # Threading
      add :parent_id, references(:messages, on_delete: :delete_all, type: :binary_id), null: true
      add :reply_count, :integer, default: 0

      # Attachments
      add :attachment_url, :string, null: true
      add :attachment_type, :string, null: true
      add :attachment_name, :string, null: true
    end

    create index(:messages, [:parent_id])
  end
end
