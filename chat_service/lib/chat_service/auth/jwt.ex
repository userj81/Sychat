defmodule ChatService.Auth.JWT do
  use Joken.Config

  @access_ttl 900
  @refresh_ttl 60 * 60 * 24 * 30

  add_hook(Joken.Hooks.RequiredClaims, [:sub, :type])

  def token_config do
    default_claims(skip: [:aud, :iss])
  end

  def generate_access_token(user_id) do
    claims = %{"sub" => user_id, "type" => "access", "exp" => exp(@access_ttl)}
    {:ok, token, _claims} = generate_and_sign(claims, signer())
    token
  end

  def generate_refresh_token(user_id) do
    claims = %{"sub" => user_id, "type" => "refresh", "exp" => exp(@refresh_ttl)}
    {:ok, token, _claims} = generate_and_sign(claims, signer())
    token
  end

  def verify_token(token) do
    verify_and_validate(token, signer())
  end

  defp signer do
    Joken.Signer.create("HS256", secret_key())
  end

  defp secret_key do
    Application.get_env(:chat_service, ChatServiceWeb.Endpoint)[:secret_key_base]
  end

  defp exp(ttl) do
    Joken.current_time() + ttl
  end
end
