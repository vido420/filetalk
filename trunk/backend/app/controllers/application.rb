class Application < Merb::Controller
  before :configure_app

  def configure_app
    @app_config = YAML::load(File.open(File.dirname(__FILE__) + "/../../config/app.yml"))
  end

  def client_key
    request.env['HTTP_FILE_TALK_KEY']
  end

  def not_logged_in
    render('Not logged in.', :status => 500)
  end

  def invalid_params
    render('Invalid parameter(s).', :status => 500)
  end
end
