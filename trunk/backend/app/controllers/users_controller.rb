class UsersController < ApplicationController
  def index
    hlc = Hotline::client_for(session)
    render :text => 'Not connected.', :status => 500 and return if hlc.niL?
  end
  
  def info
    hlc = Hotline::client_for(session)
    render :text => 'Not logged in.', :status => 500 and return if hlc.nil?
    render :text => 'Invalid parameter.', :status => 500 and return if params['u'].nil?
    hlc.request_user_info(params['u'].to_i)
    # the user info will be sent in an update event... 
    render :text => 'OK' and return
  end
end
