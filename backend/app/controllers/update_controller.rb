require 'json'

class UpdateController < ApplicationController
  def index
    headers["Content-Type"] = "text/plain; charset=utf-8"
    hlc = Hotline::client_for(session)
    render :text => 'Not logged in.', :status => 500 and return if hlc.nil?
    text = '['
    while hlc.has_next_event?
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
      end
      text += ','
    end
    text += ']'
    render :text => text and return
  end
end
