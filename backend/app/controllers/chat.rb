class Chat < Application
  
  def index
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['m'].nil?
    hlc.send_chat(params['m'])
    render 'OK'
  end

  def set_nick
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['n'].nil?
    hlc.set_nick(params['n'])
    render hlc.nick
  end

  def send_pm
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['m'].nil? or params['to'].nil?
    hlc.send_pm(params['to'].to_i, params['m'])
    render 'OK'
  end
  
end
