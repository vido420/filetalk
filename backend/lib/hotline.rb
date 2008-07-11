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
end

HotlineUser = Struct.new(:nick, :login, :socket, :color, :icon, :info)

class TransactionObject
	CHAT = 101
	NICK = 102
	ICON = 104
	LOGIN = 105
	PASSWORD = 106
	PARAMETER = 109
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

	ID_CHAT = 105
	ID_CHAT_IN = 106
	ID_LOGIN = 107
	ID_AGREE = 121
	ID_GETUSERLIST = 300
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
	attr_reader :users

	def initialize(host, port)
		@host = host
		@port = port
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

	def handle_chat_transaction(chat_transaction)
		chat_transaction.objects.each do |object|
			if object.id == TransactionObject::CHAT
				@event_queue.synchronize do
					@event_queue << object
					@event_queue_empty_cond.signal
				end
			end
		end
	end

	def handle_userlist_transaction(userlist_transaction)
		@users = []
		userlist_transaction.objects.each do |object|
			# socket, icon, status, length of nick (all shorts)
			# nick
			#parsed_data = object.data[0..7].unpack('nnnn')
			if object.id == TransactionObject::USER
			  #(:nick, :login, :socket, :color, :icon, :info)
				@users << HotlineUser.new(object.data[7..-1].strip, '', '', '', '', '')
			end
		end
	end

	def run
		loop do
			transaction = Transaction.new(0,0,0)
			transaction.read(@socket)
			if transaction.id == 0
				transaction.id = @tasks[transaction.task_number]
				@tasks[transaction.task_number] = nil
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
			elsif transaction.id == Transaction::ID_CHAT_IN
				handle_chat_transaction(transaction)
			elsif transaction.id == 109
			  transaction = Transaction.new(Transaction::REQUEST, Transaction::ID_AGREE, @task_number)
  			transaction << TransactionObject.new(TransactionObject::NICK, "testing-Myrd")
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

  def Hotline.login(session, username, password)
    hlc = HotlineClient.new("68.78.41.124", 5500)
    return nil unless hlc.connect
    return nil unless hlc.login(username, password)
    HOTLINE_CONNECTIONS[session.session_id] = hlc
    return hlc
  end

end
