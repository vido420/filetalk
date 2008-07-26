class Login < Application
  
  def index
    if params['name'].nil? or params['pass'].nil?
      return render 'Invalid parameter(s).', :status => 500
    else
      host = @app_config['hotline_host']
      port = @app_config['hotline_port']
      hlc = Hotline::login(cookies[:_i_hate_u], host, port, params['name'], params['pass'])
      return render 'Invalid login.', :status => 500 if hlc.nil?
      render hlc.nick
    end
  end
  
  def logout
    Hotline::disconnect(cookies[:_i_hate_u])
    render 'Good Bye.'
  end
  
end
