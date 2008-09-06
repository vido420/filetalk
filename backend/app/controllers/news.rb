class News < Application

  def index
    hlc = Hotline::client_for(client_key)
    return not_logged_in if hlc.nil?
    hlc.request_news
    # the user info will be sent in an update event... 
    render 'OK'
  end
  
end
