defmodule ChatServiceWeb.ForbiddenError do
  defexception [:message, plug_status: 403]

  def exception(_), do: %__MODULE__{message: "Forbidden"}
end
