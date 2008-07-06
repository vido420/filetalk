class LoginController < ApplicationController
  def index
    if params['name'] == 'Myrd'
      render :text => "Hello" and return
    else
      render :text => 'Invalid login.', :status => 500 and return
    end
  end
end
