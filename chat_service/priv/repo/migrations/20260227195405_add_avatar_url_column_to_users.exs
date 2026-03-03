defmodule ChatService.Repo.Migrations.AddAvatarUrlColumnToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:avatar_url, :string)
    end
  end
end
