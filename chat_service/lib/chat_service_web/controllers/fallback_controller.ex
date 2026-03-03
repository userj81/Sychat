defmodule ChatServiceWeb.FallbackController do
  use ChatServiceWeb, :controller

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> json(%{error: "Not found"})
  end

  def call(conn, {:error, :forbidden}) do
    conn
    |> put_status(:forbidden)
    |> json(%{error: "Forbidden"})
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "Unauthorized"})
  end

  def call(conn, {:error, reason}) when is_atom(reason) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: reason})
  end

  def call(conn, %ChatServiceWeb.ForbiddenError{}) do
    conn
    |> put_status(:forbidden)
    |> json(%{error: "Forbidden"})
  end
end
