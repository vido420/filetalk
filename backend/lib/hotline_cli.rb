#!/usr/bin/ruby

require 'socket'
require 'thread'
require 'monitor'

Thread.abort_on_exception = true

require 'hotline'


client = HotlineClient.new("halberd.dyndns.org", 5500)
if client.connect
	puts "Connected"
	if client.login("test","test")
	  puts "Login Success"
	else
	  puts "Login Failure"
	  exit
	end
else
  puts "Could not connect"
  exit
end

Thread.new do
	loop do
		obj = client.next_event
		if obj && obj.type == TransactionObject::MESSAGE
		  puts obj.data.to_s
		end
		p obj
	end
end

print "> "
$stdin.each_line do |input|
	input.chomp!
	if input == "/users"
		puts "Users List:"
		client.users.each do |user|
			puts " #{user.socket} #{user.nick} #{user.status}" unless user.nil?
		end
	elsif input == "/quit"
		break
	elsif input == '/pm'
	  client.send_pm(247, 'Hi')
	elsif input[0..3] == "/me "
		client.send_emote(input[4..-1])
	elsif input[0..2] == "/me"
		client.send_emote(input[3..-1])
	elsif input[0..5] == "/nick "
		client.set_nick(input[6..-1].to_macroman)
	elsif input[0..5] == "/pc"
		client.create_pchat_with_user(1)
	elsif !input.empty?
		client.send_chat(input)
	end
	print "> "
end
