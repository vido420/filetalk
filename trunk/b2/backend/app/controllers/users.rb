class Users < Application
  
  def index
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    render 'Not implemented.'
  end
  
  def info
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['u'].nil?
    hlc.request_user_info(params['u'].to_i)
    # the user info will be sent in an update event... 
    render 'OK'
  end
  
end
