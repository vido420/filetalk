class ChatController < ApplicationController
  def index
    hlc = Hotline::client_for(session)
    render :text => 'Not logged in.', :status => 500 and return if hlc.nil?
    render :text => 'Invalid parameter.', :status => 500 and return if params['m'].nil?
    hlc.send_chat(params['m'])
    render :text => 'OK' and return
  end
end