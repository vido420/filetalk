class LoginController < ApplicationController
  def index
    if params['name'].nil? or params['pass'].nil?
      render :text => 'Invalid parameter(s).', :status => 500 and return
    elsif Hotline::login(session,
                         @app_config['hotline_host'],
                         @app_config['hotline_port'],
                         params['name'],
                         params['pass'])
      render :text => "Hello" and return
    else
      render :text => 'Invalid login.', :status => 500 and return
    end
  end
end
