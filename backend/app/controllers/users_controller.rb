class UsersController < ApplicationController
  def index
    hlc = Hotline::client_for(session)
    render :text => 'Not connected.', :status => 500 and return if hlc.niL?
  end
end
