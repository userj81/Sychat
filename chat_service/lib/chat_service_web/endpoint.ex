defmodule ChatServiceWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :chat_service

  @session_options [
    store: :cookie,
    key: "_chat_service_key",
    signing_salt: "OpRIEWe9",
    same_site: "Lax"
  ]

  socket("/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: [connect_info: [session: @session_options]]
  )

  socket("/socket", ChatServiceWeb.UserSocket,
    websocket: true,
    longpoll: false
  )

  plug(CORSPlug, origin: ["http://localhost:3000", "http://127.0.0.1:3000"])

  plug(Plug.Static,
    at: "/",
    from: :chat_service,
    gzip: not code_reloading?,
    only: ChatServiceWeb.static_paths(),
    raise_on_missing_only: code_reloading?
  )

  if code_reloading? do
    plug(Phoenix.CodeReloader)
    plug(Phoenix.Ecto.CheckRepoStatus, otp_app: :chat_service)
  end

  plug(Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"
  )

  plug(Plug.RequestId)
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(Plug.MethodOverride)
  plug(Plug.Head)
  plug(Plug.Session, @session_options)
  plug(ChatServiceWeb.Router)
end
