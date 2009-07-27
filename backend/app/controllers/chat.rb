class Chat < Application
  
  def index
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['m'].nil?
    if params['cid'].nil?
      hlc.send_chat(params['m'])
    else
      hlc.send_chat(params['m'], params['cid'].to_i)      
    end
    render 'OK'
  end

  def emote
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['m'].nil?
    if params['cid'].nil?
      hlc.send_emote(params['m'])
    else
      hlc.send_emote(params['m'], params['cid'].to_i)      
    end
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

  def start_pchat
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['user'].nil?
    hlc.create_pchat_with_user(params['user'].to_i)
    render 'OK'
  end

  def accept_pchat
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['cid'].nil?
    hlc.join_pchat(params['cid'].to_i)
    render 'OK'
  end

  def refuse_pchat
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    return invalid_params if params['cid'].nil?
    hlc.reject_pchat(params['cid'].to_i)
    render 'OK'
  end
end
