class LoginController < ApplicationController
  def index
    if params['name'].nil? or params['pass'].nil?
      render :text => 'Invalid parameter(s).', :status => 500 and return
    else
      host = @app_config['hotline_host']
      port = @app_config['hotline_port']
      hlc = Hotline::login(session, host, port, params['name'], params['pass'])
      render :text => 'Invalid login.', :status => 500 and return if hlc.nil?
      render :text => hlc.nick and return
    end
  end
end
