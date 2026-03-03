defmodule ChatServiceWeb.Router do
  use ChatServiceWeb, :router

  pipeline :api do
    plug(:accepts, ["json"])
    plug(CORSPlug, origin: ["http://localhost:3000", "http://127.0.0.1:3000"])
  end

  pipeline :authenticated do
    plug(ChatService.Auth.AuthPlug)
  end

  pipeline :tenant do
    plug(ChatService.Auth.TenantPlug)
  end

  scope "/api/v1", ChatServiceWeb do
    pipe_through(:api)

    post("/auth/login", AuthController, :login)
    post("/auth/register", AuthController, :register)
    post("/auth/refresh", AuthController, :refresh)
    post("/auth/logout", AuthController, :logout)

    pipe_through(:authenticated)

    get("/me", AuthController, :me)
    put("/me", AuthController, :update_profile)

    get("/tenants", TenantController, :list_tenants)
    post("/tenants", TenantController, :create_tenant)

    scope "/tenants/:tenant_id" do
      pipe_through(:tenant)

      get("/", TenantController, :get_tenant)
      get("/me", TenantController, :tenant_me)
      get("/members", TenantController, :list_members)
      patch("/members/:user_id/role", TenantController, :update_member_role)
      post("/invites", TenantController, :create_invite)
      get("/invites", TenantController, :list_invites)
      delete("/members/:user_id", TenantController, :remove_member)

      get("/channels", ChannelController, :list_channels)
      post("/channels", ChannelController, :create_channel)
      post("/channels/:channel_id/join", ChannelController, :join_channel)
      delete("/channels/:channel_id/leave", ChannelController, :leave_channel)
      post("/dms", ChannelController, :create_dm)

      get("/channels/:channel_id", ChannelController, :get_channel)
      get("/channels/:channel_id/messages", MessageController, :list_messages)
      get("/channels/:channel_id/messages/:parent_id/replies", MessageController, :list_thread_messages)
      post("/channels/:channel_id/messages", MessageController, :create_message)
      post("/channels/:channel_id/messages_with_attachment", MessageController, :create_message_with_attachment)
    end

    patch("/messages/:message_id", MessageController, :update_message)
    delete("/messages/:message_id", MessageController, :delete_message)
  end

  scope "/api/v1/invites" do
    pipe_through(:api)
    pipe_through(:authenticated)

    post("/:code/accept", ChatServiceWeb.TenantController, :accept_invite)
  end

  if Application.compile_env(:chat_service, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through([:fetch_session, :protect_from_forgery])

      live_dashboard("/dashboard", metrics: ChatServiceWeb.Telemetry)
    end
  end
end
