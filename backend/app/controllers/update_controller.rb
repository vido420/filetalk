require 'json'

class UpdateController < ApplicationController
  def index
    headers["Content-Type"] = "text/plain; charset=utf-8"
    hlc = Hotline::client_for(session)
    render :text => 'Not logged in.', :status => 500 and return if hlc.nil?
    text = '['
    while hlc.has_next_event?
      event = hlc.next_event
      if event.id == TransactionObject::CHAT
        text += { :recordType => 'chat', :message => event.data[1..-1].to_s }.to_json
      end
    end
    text += ']'
    render :text => text and return
  end
end
