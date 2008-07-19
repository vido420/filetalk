class ChatController < ApplicationController
  def index
    hlc = Hotline::client_for(session)
    render :text => 'Not logged in.', :status => 500 and return if hlc.nil?
    render :text => 'Invalid parameter.', :status => 500 and return if params['m'].nil?
    hlc.send_chat(params['m'])
    render :text => 'OK' and return
  end

  def set_nick
    hlc = Hotline::client_for(session)
    render :text => 'Not logged in.', :status => 500 and return if hlc.nil?
    render :text => 'Invalid parameter.', :status => 500 and return if params['n'].nil?
    hlc.set_nick(params['n'])
    render :text => hlc.nick and return
  end

  def send_pm
    hlc = Hotline::client_for(session)
    render :text => 'Not logged in.', :status => 500 and return if hlc.nil?
    render :text => 'Invalid parameter.', :status => 500 and return if params['m'].nil? or params['to'].nil?
    hlc.send_pm(params['to'].to_i, params['m'])
    render :text => 'OK' and return
  end
end
