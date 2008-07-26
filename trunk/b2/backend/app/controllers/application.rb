class Application < Merb::Controller
  before :configure_app

  def configure_app
    @app_config = YAML::load(File.open(File.dirname(__FILE__) + "/../../config/app.yml"))
  end
end