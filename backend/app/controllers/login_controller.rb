class LoginController < ApplicationController
  def index
    if Hotline::login(session, params['name'], params['pass'])
      render :text => "Hello" and return
    else
      render :text => 'Invalid login.', :status => 500 and return
    end
  end
end
