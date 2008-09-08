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
      if event.kind_of?(HotlineChatEvent)
        if event.conversation_id
          text += { :recordType => 'chat', :message => event.message,
                    :conversationId => event.conversation_id }.to_json
        else
          text += { :recordType => 'chat', :message => event.message }.to_json
        end
      elsif event.kind_of?(HotlineUserUpdateEvent)
        text += { :recordType => 'user', :guid => event.user.socket,
                  :nick => event.user.nick, :status => event.user.status }.to_json
      elsif event.kind_of?(HotlineUserJoinedEvent)
        if event.conversation_id
          text += { :recordType => 'user', :guid => event.user.socket,
                    :nick => event.user.nick, :status => event.user.status,
                    :conversationId => event.conversation_id }.to_json
        else
          text += { :recordType => 'user', :guid => event.user.socket,
                    :nick => event.user.nick, :status => event.user.status }.to_json
        end
      elsif event.kind_of?(HotlineUserLeftEvent)
        if event.conversation_id
          text += { :recordType => 'user_left', :guid => event.user.sockey,
                    :conversationId => event.conversation_id }.to_json
        else
          text += { :recordType => 'user_left', :guid => event.user.socket }.to_json
        end
      elsif event.kind_of?(HotlinePrivateMessageEvent)
        text += { :recordType => 'pm', :socket => event.user.socket,
                  :nick => event.user.nick, :message => event.message }.to_json
      elsif event.kind_of?(HotlineUserInfoEvent)
        text += { :recordType => 'user_info', :message => event.info_message }.to_json
      elsif event.kind_of?(HotlineNewsEvent)
        text += { :recordType => 'news', :message => event.news_message }.to_json
      elsif event.kind_of?(HotlineErrorEvent)
        text += { :recordType => 'error', :message => event.error_message }.to_json
      else
        puts "Unknown update event:"
        p event
      end
      text += ','
      done = !hlc.has_next_event?
    end
    text += ']'
    render text
  end
  
end
