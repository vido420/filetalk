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

  def gen_convert(from, to)
    out_text = ''
    conv = IO.popen("iconv -f #{from} -t #{to}", 'r+')
    self.each do |line|
      conv.write line
    end
    conv.close_write
    outlines = conv.readlines
    outlines.each do |line|
      out_text += line
    end
    conv.close
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

class TransactionObject
  CHAT = 101
  NICK = 102
  SOCKET = 103
  ICON = 104
  LOGIN = 105
  PASSWORD = 106
  PARAMETER = 109
  STATUS = 112
  VERSION = 160
  SERVER_NAME = 162
  USER = 300
  USER_LEFT = -300 # not part of HL protocol

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

  ID_CHAT = 105
  ID_CHAT_IN = 106
  ID_LOGIN = 107
  ID_AGREE = 121
  ID_GETUSERLIST = 300
  ID_USERCHANGE = 301
  ID_USERLEAVE = 302
  ID_GET_USERINFO = 303
  ID_CHANGE_NICK = 304
  ID_USERLIST = 354

  attr_reader :type, :id, :task_number, :is_error, :objects
  attr_writer :id

  def initialize(type, id, task_number)
    @type = type
    @id = id
    @task_number = task_number
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

  HotlineEvent = Struct.new(:type, :data)

  attr_reader :users, :nick

  def initialize(host, port)
    @host = host
    @port = port
    @nick = nil
    @task_number = 1
    @tasks = []
    @tasks.extend(MonitorMixin)
    @task_cond = @tasks.new_cond
    @server_version = 0
    @users = []
    @event_queue = []
    @event_queue.extend(MonitorMixin)
    @event_queue_empty_cond = @event_queue.new_cond
  end
  
  def connect
    @socket = TCPSocket.new(@host, @port)
    @socket.write('TRTPHOTL')
    @socket.write([1,2].pack('nn'))
    resp = @socket.read(4)
    if resp == 'TRTP'
      result = @socket.read(4).unpack('N')[0]
      if result == 0
        Thread.new { run }
        return true
      end
    end
    close
    return false
  end

  def handle_login_transaction(login_transaction)
    login_transaction.objects.each do |object|
      if object.id == TransactionObject::VERSION
        @server_version = object.data.unpack("n")[0]
      elsif object.id == TransactionObject::SERVER_NAME
        @server_name = object.data
      end
    end
  end
  
  def add_event(type, data)
    @event_queue.synchronize do
      @event_queue << HotlineEvent.new(type, data)
      @event_queue_empty_cond.signal
    end
  end

  def handle_chat_transaction(chat_transaction)
    chat_transaction.objects.each do |object|
      if object.id == TransactionObject::CHAT
        add_event(TransactionObject::CHAT, object.data[1..-1].to_s.to_utf8)
      end
    end
  end

  def handle_userlist_transaction(userlist_transaction)
    @users = []
#    add_event('UserList', nil)
    userlist_transaction.objects.each do |object|
      # socket, icon, status, length of nick (all shorts)
      # nick
      if object.id == TransactionObject::USER
        parsed_data = object.data[0..7].unpack('nnnn')
        #(:socket, :nick, :icon, :status)        
        user = HotlineUser.new(parsed_data[0], object.data[8..-1].strip.to_utf8,
                               parsed_data[1], parsed_data[2])
        add_event(TransactionObject::USER, user)
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
        user.nick = nick unless nick.nil?
        user.icon = icon unless icon.nil?
        user.status = status unless status.nil?
      end
      add_event(TransactionObject::USER, user)
    end
  end

  def handle_userleave_transaction(transaction)
    socket = -1
    transaction.objects.each do |object|
      if object.id == TransactionObject::SOCKET
        socket = read_number(object.data)
      end
    end
    if socket != -1
      user = @users.slice!(socket)
      unless user.nil?
        add_event(TransactionObject::USER_LEFT, user)
      end
    end
  end

  def run
    loop do
      transaction = Transaction.new(0,0,0)
      transaction.read(@socket)
      if transaction.id == 0
        transaction.id = @tasks.slice!(transaction.task_number)
        should_signal = true
      end
      if transaction.is_error
        close
        @tasks.synchronize { @task_cond.signal } if should_signal
        break
      elsif transaction.id == Transaction::ID_LOGIN
        handle_login_transaction(transaction)
      elsif transaction.id == Transaction::ID_GETUSERLIST
        handle_userlist_transaction(transaction)
      elsif transaction.id == Transaction::ID_USERLIST
        request_userlist
      elsif transaction.id == Transaction::ID_USERCHANGE
        handle_userchange_transaction(transaction)
      elsif transaction.id == Transaction::ID_USERLEAVE
        handle_userleave_transaction(transaction)
      elsif transaction.id == Transaction::ID_CHAT_IN
        handle_chat_transaction(transaction)
      elsif transaction.id == 109
        transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_AGREE, @task_number)
        transaction << TransactionObject.new(TransactionObject::NICK, @nick)
        transaction << TransactionObject.new(TransactionObject::ICON, "\0\0")
        transaction << TransactionObject.new(113, "\0\0")
        @socket.write(transaction.pack)
        @task_number += 1
      end
      @tasks.synchronize { @task_cond.signal } if should_signal
    end
  rescue Exception => e  
    puts e.message  
    puts e.backtrace.inspect 
  end

  def login(username, password)
    @nick = username
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_LOGIN, @task_number)
    transaction << TransactionObject.new(TransactionObject::LOGIN, username.encode)
    transaction << TransactionObject.new(TransactionObject::PASSWORD, password.encode)
    transaction << TransactionObject.new(TransactionObject::VERSION, [150].pack('n'))
    @socket.write(transaction.pack)
    @tasks[@task_number] = Transaction::ID_LOGIN
    login_task_number = @task_number
    @task_number += 1
    @tasks.synchronize { @task_cond.wait_while { !@tasks[login_task_number].nil? } }
    puts "logged_in = #{connected?}"
    return connected?
  end

  def request_userlist
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_GETUSERLIST, @task_number)
    @socket.write(transaction.pack)
    @tasks[@task_number] = Transaction::ID_GETUSERLIST
    @task_number += 1
  end
  
  def send_chat(message)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_CHAT, @task_number)
    transaction << TransactionObject.new(TransactionObject::CHAT, message)
    @socket.write(transaction.pack)
    @task_number += 1
  end
  
  def send_emote(message)
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_CHAT, @task_number)
    transaction << TransactionObject.new(TransactionObject::CHAT, message)
    transaction << TransactionObject.new(TransactionObject::PARAMETER, [1].pack('n'))
    @socket.write(transaction.pack)
    @task_number += 1
  end

  def set_nick(nick)
    @nick = nick
    transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_CHANGE_NICK, @task_number)
    transaction << TransactionObject.new(TransactionObject::NICK, nick)
    transaction << TransactionObject.new(TransactionObject::ICON, "\0\0")
    @socket.write(transaction.pack)
    @task_number += 1
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
    @socket.close
    @socket = nil
  end
  
  def connected?
    !@socket.nil?
  end
end

module Hotline

  def Hotline.client_for(session)
    hlc = HOTLINE_CONNECTIONS[session.session_id]
    if hlc && !hlc.connected?
      HOTLINE_CONNECTIONS[session.session_id] = nil
      hlc = nil
    end
    return hlc
  end

  def Hotline.login(session, host, port, username, password)
    hlc = HOTLINE_CONNECTIONS.slice!(session.session_id)
    hlc.close if hlc and hlc.kind_of? HotlineClient
    hlc = HotlineClient.new(host, port)
    return nil unless hlc.connect
    return nil unless hlc.login(username, password)
    HOTLINE_CONNECTIONS[session.session_id] = hlc
    return hlc
  end

end
