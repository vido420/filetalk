class Users < Application
  
  def index
    hlc = Hotline::client_for(cookies[:_i_hate_u])
    return render 'Not connected.', :status => 500 if hlc.niL?
    render 'Not implemented.'
  end
  
  def info
    hlc = Hotline::client_for(cookies[:_i_hate_u])
    return render 'Not logged in.', :status => 500 if hlc.nil?
    return render 'Invalid parameter.', :status => 500 if params['u'].nil?
    hlc.request_user_info(params['u'].to_i)
    # the user info will be sent in an update event... 
    render 'OK'
  end
  
end
