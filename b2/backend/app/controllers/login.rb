require 'digest/md5'
class Login < Application
  
  def index
    return invalid_params if params['name'].nil? or params['pass'].nil?
    host = @app_config['hotline_host']
    port = @app_config['hotline_port']
    key = Digest::MD5.hexdigest(rand().to_s)
    headers['File-Talk-Key'] = key
    hlc = Hotline::login(key, host, port, params['name'], params['pass'])
    return render('Invalid login.', :status => 500) if hlc.nil?
    render hlc.nick
  end
  
  def logout
    Hotline::disconnect(client_key)
    render 'Good Bye.'
  end
  
end
