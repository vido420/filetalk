require 'iconv'
require 'monitor'

class String
  def encode
    str = self.dup
    str.length.times do |i|
      str[i] = (255 - str[i])
    end
    return str
  end

  def encode!
    self.length.times do |i|
      self[i] = (255 - self[i])
    end
    return self
  end

  def piped_gen_convert(from, to)
    out_text = ''
    conv = IO.popen("iconv -f #{from} -t #{to}", 'r+')
    str = self.tr("\r","\n")
    str.each_line { |line| conv.write line }
    conv.close_write
    outlines = conv.readlines
    outlines.each { |line| out_text += line }
    conv.close
    return out_text
  end

  def gen_convert(from, to)
    out_text = ''
    self.tr("\r","\n").each_line { |line| out_text += Iconv.conv(to, from, line) }
    return out_text
  end

  def to_macroman
    gen_convert('UTF-8', 'MACROMAN')
  end

  def to_utf8
    gen_convert('MACROMAN', 'UTF-8')
  end
end

HotlineUser = Struct.new(:socket, :nick, :icon, :status)

HotlineChatEvent = Struct.new(:message, :conversation_id)
HotlineUserUpdateEvent = Struct.new(:user)
HotlineUserJoinedEvent = Struct.new(:user, :conversation_id)
HotlineUserLeftEvent = Struct.new(:user, :conversation_id)
HotlinePrivateMessageEvent = Struct.new(:user, :message)
HotlineInvitedToChatEvent = Struct.new(:conversation_id, :user)
HotlineUserInfoEvent = Struct.new(:info_message)
HotlineNewsEvent = Struct.new(:news_message)
HotlineErrorEvent = Struct.new(:error_message)

class TransactionObject
  ERROR_MSG = 100
  MESSAGE = 101
  NICK = 102
  SOCKET = 103
  ICON = 104
  LOGIN = 105
  PASSWORD = 106
  PARAMETER = 109
  STATUS = 112
  STATUS_FLAGS = 113
  CHATWINDOW = 114
  VERSION = 160
  SERVER_NAME = 162
  USER = 300

  attr_reader :id, :data

  def initialize(id, data)
    @id = id
    @data = data
  end

  def pack
    return [id, data.length].pack('nn') + data.to_s
  end
end

class Transaction
  REQUEST = 0
  REPLY = 1

  ID_GETNEWS = 101
  ID_PRIVATE_MESSAGE = 104
  ID_SEND_CHAT = 105
  ID_CHAT = 106
  ID_LOGIN = 107
  ID_SEND_PM = 108

  ID_CREATE_PCHAT = 112
  ID_INVITE_TO_PCHAT = 113
  ID_REJECT_PCHAT = 114
  ID_JOIN_PCHAT = 115
  ID_LEAVING_PCHAT = 116
  ID_JOINED_PCHAT = 117
  ID_LEFT_PCHAT = 118
  ID_CHANGED_SUBJECT = 119
  ID_REQUEST_CHANGE_SUBJECT = 120

  ID_AGREE = 121
  ID_GETUSERLIST = 300
  ID_USERCHANGE = 301
  ID_USERLEAVE = 302
  ID_GETUSERINFO = 303
  ID_CHANGE_NICK = 304
  ID_USERLIST = 354

  attr_reader :type, :id, :task_number, :is_error, :objects
  attr_writer :id, :task_number

  def initialize(type, id)
    @type = type
    @id = id
    @task_number = 0
    @is_error = false
    @objects = []
  end

  def read(io)
    @type = io.read(2).unpack('n')[0]
    @id = io.read(2).unpack('n')[0]
    @task_number = io.read(4).unpack('N')[0]
    @is_error = (io.read(4).unpack('N')[0]!=0)
    len1 = io.read(4).unpack('N')[0]
    len2 = io.read(4).unpack('N')[0]
    if len1 != len2
      raise "invalid transaction header read"
    end
    if len1 != 0
      nobjs = io.read(2).unpack('n')[0]
      nobjs.times do |i|
        objtype = io.read(2).unpack('n')[0]
        objlen = io.read(2).unpack('n')[0]
        data = io.read(objlen)
        if (objtype == TransactionObject::ERROR_MSG)
				  puts "Error: " + data.to_s
				end
        @objects << TransactionObject.new(objtype, data)
      end
    end
  end

  def <<(obj)
    @objects << obj
  end

  def pack
    bytes = ""
    data_length = 0
    @objects.each do |object|
      obj_data = object.pack
      data_length += obj_data.length
      bytes += obj_data
    end
    packed_data = [@type, @id, @task_number, 0, data_length + 2, data_length + 2, @objects.size].pack('nnNNNNn') + bytes
    return packed_data
  end
end

class HotlineClient

  attr_reader :users, :nick
  attr_accessor :last_update

  def initialize(host, port)
    @host = host
    @port = port
    @nick = nil
    @task_number = 1
    @tasks = []
    @task_data = []
    @tasks.extend(MonitorMixin)
    @task_cond = @tasks.new_cond
    @server_version = 0
    @users = []
    @event_queue = []
    @event_queue.extend(MonitorMixin)
    @event_queue_empty_cond = @event_queue.new_cond
    @thread = nil
    @last_update = Time.now.to_i
  end
  
  def connect
    @socket = TCPSocket.new(@host, @port)
    @socket.write('TRTPHOTL')
    @socket.write([1,2].pack('nn'))
    resp = @socket.read(4)
    if resp == 'TRTP'
      result = @socket.read(4).unpack('N')[0]
      if result == 0
        @thread = Thread.new { run }
        return true
      end
    end
    close
    return false
  end

  def handle_login_transaction(transaction)
    transaction.objects.each do |object|
      if object.id == TransactionObject::VERSION
        @server_version = object.data.unpack("n")[0]
      elsif object.id == TransactionObject::SERVER_NAME
        @server_name = object.data
      end
    end
  end

  def handle_chat_transaction(transaction)
    message = nil
    chatwindow = nil
    transaction.objects.each do |object|
      if object.id == TransactionObject::MESSAGE
        message = object.data[1..-1].to_s.to_utf8
      elsif object.id == TransactionObject::CHATWINDOW
        chatwindow = read_number(object.data)
      end
    end
    add_event(HotlineChatEvent.new(message, chatwindow)) if message
  end

  def handle_news_transaction(transaction)
    message = nil
    transaction.objects.each do |object|
      if object.id == TransactionObject::MESSAGE
        message = object.data.to_s
      end
    end
    add_event(HotlineNewsEvent.new(message.to_utf8)) if message
  end

  def handle_userlist_transaction(transaction)
    @users = []
    transaction.objects.each do |object|
      # socket, icon, status, length of nick (all shorts)
      # nick
      if object.id == TransactionObject::USER
        parsed_data = object.data[0..7].unpack('nnnn')
        #(:socket, :nick, :icon, :status)        
        user = HotlineUser.new(parsed_data[0], object.data[8..-1].strip.to_utf8,
                               parsed_data[1], parsed_data[2])
        add_event(HotlineUserUpdateEvent.new(user))
        @users[user.socket] = user
      end
    end
  end

  def read_number(data)
    if data.length == 2
      return data.unpack('n')[0]
    elsif data.length == 4
      return data.unpack('N')[0]
    else
      raise "Invalid number."
    end
  end

  def handle_userchange_transaction(transaction)
    socket = -1
    nick = nil
    icon = nil
    status = nil
    transaction.objects.each do |object|
      if object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      elsif object.id == TransactionObject::NICK
        nick = object.data.to_s
      elsif object.id == TransactionObject::ICON
        icon = read_number(object.data)
      elsif object.id == TransactionObject::STATUS
        status = read_number(object.data)
      end
    end
    if socket != -1
      user = @users[socket]
      if user.nil?
        user = HotlineUser.new(socket, nick, icon, status)
        @users[user.socket] = user
      else
        user.nick = nick.to_utf8 unless nick.nil?
        user.icon = icon unless icon.nil?
        user.status = status unless status.nil?
      end
      add_event(HotlineUserUpdateEvent.new(user))
    end
  end

  def handle_userleave_transaction(transaction)
    socket = nil
    transaction.objects.each do |object|
      if object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      end
    end
    if socket
      user = @users.slice!(socket)
      add_event(HotlineUserLeftEvent.new(user, nil)) if user
    end
  end

  def handle_private_message_transaction(transaction)
    socket = nil
    message = nil
    transaction.objects.each do |object|
      if object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      elsif object.id == TransactionObject::MESSAGE
        message = object.data.to_s
      end
    end
    if socket && message
      user = @users[socket]
      add_event(HotlinePrivateMessageEvent.new(user, message.to_utf8)) if user
    end
  end

  def handle_userinfo_transaction(transaction)
    message = nil
    transaction.objects.each do |object|
      if object.id == TransactionObject::MESSAGE
        message = object.data.to_s
      end
    end
    add_event(HotlineUserInfoEvent.new(message.to_utf8)) if message
  end

  def handle_create_pchat_transaction(transaction)
    chatwindow = nil
    socket = nil
    transaction.objects.each do |object|
      # also has icon, nick, status of user, but we're smart and
      # and can look that up ourselves...
      if object.id == TransactionObject::CHATWINDOW
        chatwindow = read_number(object.data)
      elsif object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      end
    end
    # started the private chat, with the first user being us
    if chatwindow && socket
      user = @users[socket]
      add_event(HotlineUserJoinedEvent.new(user, chatwindow)) if user
    end
  end

  def handle_joined_pchat_transaction(transaction)
    chatwindow = nil
    socket = nil
    transaction.objects.each do |object|
      # also has icon, nick, status of user, but we're smart and
      # and can look that up ourselves...
      if object.id == TransactionObject::CHATWINDOW
        chatwindow = read_number(object.data)
      elsif object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      end
    end
    # user joined our chat!
    if chatwindow && socket
      user = @users[socket]
      add_event(HotlineUserJoinedEvent.new(user, chatwindow)) if user
    end
  end

  def handle_left_pchat_transaction(transaction)
    chatwindow = nil
    socket = nil
    transaction.objects.each do |object|
      # also has icon, nick, status of user, but we're smart and
      # and can look that up ourselves...
      if object.id == TransactionObject::CHATWINDOW
        chatwindow = read_number(object.data)
      elsif object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      end
    end
    if chatwindow && socket
      user = @users[socket]
      add_event(HotlineUserLeftEvent.new(user, chatwindow)) if user
    end
  end

  def handle_invite_to_pchat_transaction(transaction)
    chatwindow = nil
    socket = nil
    transaction.objects.each do |object|
      # also has icon, nick, status of user, but we're smart and
      # and can look that up ourselves...
      if object.id == TransactionObject::CHATWINDOW
        chatwindow = read_number(object.data)
      elsif object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      end
    end
    if chatwindow && socket
      user = @users[socket]
      add_event(HotlineInvitedToChatEvent.new(chatwindow, user)) if user
    end
  end

  def handle_join_pchat_transaction(transaction, conversation_id)
    transaction.objects.each do |object|
      # socket, icon, status, length of nick (all shorts)
      # nick
      if object.id == TransactionObject::USER
        parsed_data = object.data[0..7].unpack('nnnn')
        #(:socket, :nick, :icon, :status)        
        user = HotlineUser.new(parsed_data[0], object.data[8..-1].strip.to_utf8,
                               parsed_data[1], parsed_data[2])
        add_event(HotlineUserJoinedEvent.new(user, conversation_id))
      end
    end
  end

  def run
    loop do
      transaction = Transaction.new(0,0)
      transaction.read(@socket)
      transaction_is_reply = (transaction.id == 0)
      if transaction_is_reply
        transaction.id = @tasks.slice!(transaction.task_number)
        should_signal = true
      end
      if transaction.is_error
        # ignore reply errors to transactions we didn't expect a reply for...
        unless transaction_is_reply and transaction.id.nil?
          transaction.objects.each do |object|
            if object.id == TransactionObject::ERROR_MSG
              add_event(HotlineErrorEvent.new(object.data.to_s.to_utf8))
            end
          end
        end
      elsif transaction.id == Transaction::ID_LOGIN
        handle_login_transaction(transaction)
      elsif transaction.id == Transaction::ID_GETNEWS
        handle_news_transaction(transaction)
      elsif transaction.id == Transaction::ID_GETUSERLIST
        handle_userlist_transaction(transaction)
      elsif transaction.id == Transaction::ID_USERLIST
        request_userlist
      elsif transaction.id == Transaction::ID_GETUSERINFO
        handle_userinfo_transaction(transaction)
      elsif transaction.id == Transaction::ID_USERCHANGE
        handle_userchange_transaction(transaction)
      elsif transaction.id == Transaction::ID_USERLEAVE
        handle_userleave_transaction(transaction)
      elsif transaction.id == Transaction::ID_CHAT
        handle_chat_transaction(transaction)
      elsif transaction.id == Transaction::ID_PRIVATE_MESSAGE
        handle_private_message_transaction(transaction)
      elsif transaction.id == Transaction::ID_CREATE_PCHAT
        handle_create_pchat_transaction(transaction)
      elsif transaction.id == Transaction::ID_JOINED_PCHAT
        handle_joined_pchat_transaction(transaction)
      elsif transaction.id == Transaction::ID_LEFT_PCHAT
        handle_left_pchat_transaction(transaction)
      elsif transaction.id == Transaction::ID_INVITE_TO_PCHAT
        handle_invite_to_pchat_transaction(transaction)
      elsif transaction.id == Transaction::ID_JOIN_PCHAT
        conversation_id = @task_data.slice!(transaction.task_number)
        handle_join_pchat_transaction(transaction, conversation_id)
      elsif transaction.id == 109
        transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_AGREE)
        transaction << TransactionObject.new(TransactionObject::NICK, @nick)
        transaction << TransactionObject.new(TransactionObject::ICON, "\0\0")
        # 1 = refuses private messages
        # 2 = refuses private chat
        transaction << TransactionObject.new(TransactionObject::STATUS_FLAGS, "\0\2")
        send_transaction(transaction)
      else
        puts "Unknown transaction (#{transaction.id}) received:"
        p transaction
      end
      @tasks.synchronize { @task_cond.signal } if should_signal
    end
  rescue Exception => e
    puts e.message
    puts e.backtrace.inspect
    @socket.close if @socket
    @socket = nil
  end

  def login(username, password)
    @nick = username
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_LOGIN)
    transaction << TransactionObject.new(TransactionObject::LOGIN, username.encode)
    transaction << TransactionObject.new(TransactionObject::PASSWORD, password.encode)
    transaction << TransactionObject.new(TransactionObject::VERSION, [150].pack('n'))
    login_task_number = send_transaction(transaction, Transaction::ID_LOGIN)
    @tasks.synchronize { @task_cond.wait_while { !@tasks[login_task_number].nil? } }
    puts "logged_in = #{connected?}"
    return connected?
  end

  def request_userlist
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_GETUSERLIST)
    send_transaction(transaction, Transaction::ID_GETUSERLIST)
  end

  def request_news
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_GETNEWS)
    send_transaction(transaction, Transaction::ID_GETNEWS)
  end

  def send_chat(message, conversation_id=nil)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_SEND_CHAT)
    transaction << TransactionObject.new(TransactionObject::MESSAGE, message.to_macroman)
    transaction << TransactionObject.new(TransactionObject::CHATWINDOW, [conversation_id].pack('N')) unless conversation_id.nil?
    send_transaction(transaction)
  end
  
  def send_emote(message, conversation_id=nil)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_SEND_CHAT)
    transaction << TransactionObject.new(TransactionObject::MESSAGE, message.to_macroman)
    transaction << TransactionObject.new(TransactionObject::CHATWINDOW, [conversation_id].pack('N')) unless conversation_id.nil?
    transaction << TransactionObject.new(TransactionObject::PARAMETER, [1].pack('n'))
    send_transaction(transaction)
  end

  def send_pm(to_socket, message)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_SEND_PM)
    transaction << TransactionObject.new(TransactionObject::SOCKET, [to_socket].pack('N'))
    transaction << TransactionObject.new(TransactionObject::MESSAGE, message.to_macroman)
    send_transaction(transaction)
  end

  def set_nick(nick)
    @nick = nick
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_CHANGE_NICK)
    transaction << TransactionObject.new(TransactionObject::NICK, nick.to_macroman)
    transaction << TransactionObject.new(TransactionObject::ICON, "\0\0")
    send_transaction(transaction)
  end
  
  def request_user_info(socket)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_GETUSERINFO)
    transaction << TransactionObject.new(TransactionObject::SOCKET, [socket].pack('N'))
    send_transaction(transaction, Transaction::ID_GETUSERINFO)
  end

  def create_pchat_with_user(socket)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_CREATE_PCHAT)
    transaction << TransactionObject.new(TransactionObject::SOCKET, [socket].pack('N'))
    send_transaction(transaction, Transaction::ID_CREATE_PCHAT)
  end

  def invite_user_to_pchat(socket, conversation_id)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_INVITE_TO_PCHAT)
    transaction << TransactionObject.new(TransactionObject::SOCKET, [socket].pack('N'))
    transaction << TransactionObject.new(TransactionObject::CHATWINDOW, [conversation_id].pack('N'))
    send_transaction(transaction)
  end

  def reject_pchat(conversation_id)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_REJECT_PCHAT)
    transaction << TransactionObject.new(TransactionObject::CHATWINDOW, [conversation_id].pack('N'))
    send_transaction(transaction)
  end

  def join_pchat(conversation_id)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_JOIN_PCHAT)
    transaction << TransactionObject.new(TransactionObject::CHATWINDOW, [conversation_id].pack('N'))
    task_number = send_transaction(transaction, Transaction::ID_JOIN_PCHAT)
    @task_data[task_number] = conversation_id
  end

  def send_transaction(transaction, task_id=nil)
    transaction.task_number = @task_number
    @task_number += 1
    @socket.write(transaction.pack)
    @tasks[transaction.task_number] = task_id unless task_id.nil?
    return transaction.task_number
  end

  def add_event(event)
    @event_queue.synchronize do
      @event_queue << event
      @event_queue_empty_cond.signal
    end
  end

  def has_next_event?
    return !@event_queue.empty?
  end

  def next_event
    event = nil
    @event_queue.synchronize do
      @event_queue_empty_cond.wait_while { @event_queue.empty? }
      event = @event_queue.shift
    end
    return event
  end

  def close
    puts "close!"
    @thread.kill! if @thread
    @thread = nil
    @socket.close
    @socket = nil
  end
  
  def connected?
    !@socket.nil?
  end
end

module Hotline

  def Hotline.client_for(key)
    hlc = HOTLINE_CONNECTIONS[key]
    if hlc && !hlc.connected?
      HOTLINE_CONNECTIONS[key] = nil
      hlc = nil
    end
    hlc.last_update = Time.now.to_i if hlc
    return hlc
  end
  
  def Hotline.disconnect(key)
    hlc = client_for(key)
    hlc.close if hlc && hlc.connected?
    HOTLINE_CONNECTIONS[key] = nil
  end

  def Hotline.start_gc_thread_if_necessary
    if $gc_thread.nil?
      $gc_thread = Thread.new do
        loop do
          Hotline.gc
          sleep 1
        end
      end
    end
  end

  def Hotline.gc
    HOTLINE_CONNECTIONS.each do |key, hlc|
      if hlc
        if Time.now.to_i - hlc.last_update > 60 # 1 minute
          hlc.close
          HOTLINE_CONNECTIONS[key] = nil
          puts "disconnected #{key} due to innactivity"
        end
      end
    end
  end

  def Hotline.login(key, host, port, username, password)
    Hotline.start_gc_thread_if_necessary
    hlc = HOTLINE_CONNECTIONS[key]
    HOTLINE_CONNECTIONS[key] = nil
    hlc.close if hlc and hlc.kind_of? HotlineClient
    hlc = HotlineClient.new(host, port)
    return nil unless hlc.connect
    return nil unless hlc.login(username, password)
    hlc.last_update = Time.now.to_i
    HOTLINE_CONNECTIONS[key] = hlc
    return hlc
  end

end
