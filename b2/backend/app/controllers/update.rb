require 'json'

class Update < Application
  
  def index
    headers["Content-Type"] = "text/plain; charset=utf-8"
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    text = '['
    done = !hlc.has_next_event?
    while not done
      event = hlc.next_event
      if event.type == TransactionObject::MESSAGE
        text += { :recordType => 'chat', :message => event.data }.to_json
      elsif event.type == 'UserList'
        text += { :recordType => 'clear_userlist' }.to_json
      elsif event.type == TransactionObject::USER
        text += { :recordType => 'user', :guid => event.data.socket,
                  :nick => event.data.nick, :status => event.data.status }.to_json
      elsif event.type == TransactionObject::USER_LEFT
        text += { :recordType => 'user_left', :guid => event.data.socket }.to_json
      elsif event.type == TransactionObject::PRIVATE_MESSAGE
        obj = event.data
        text += { :recordType => 'pm', :socket => obj[0], :nick => obj[1], :message => obj[2] }.to_json
      elsif event.type == TransactionObject::USER_INFO
        text += { :recordType => 'user_info', :message => event.data }.to_json        
      elsif event.type == TransactionObject::ERROR_MSG
        text += { :recordType => 'error', :message => event.data }.to_json        
      end
      text += ','
      done = !hlc.has_next_event?
    end
    text += ']'
    render text
  end
  
end
