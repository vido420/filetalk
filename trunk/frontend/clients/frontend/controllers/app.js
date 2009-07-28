// ==========================================================================
// Frontend.AppController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.appController = SC.Object.create(
/** @scope Frontend.appController */ {
	clientKey: null,
	buildHeaders: function() {
		return { 'File-Talk-Key': Frontend.appController.get('clientKey') };
	},
	notImplemented: function() {
		Frontend.errorMessageController.showErrorDialog("NotImplemented_Title".loc(), "NotImplemented_Message".loc(), null);
	},
	linkify: function(text) {
		// TODO: need better regex
		var regex = /((https?)|(ftp))\:\/\/[^\s]*[^.,">\s\)\]]/g;
		return text.replace(regex, function(m) {
			return '<a href="' + m + '" target="_blank">' + m + '</a>';
		});
	},
	isPolling: false,
	startPolling: function() {
		this.set('isPolling', true);
		Frontend.appController.poll();
	},
	getChatHistoryView: function() {
		return SC.page.getPath('chatView.chatSplitView.chatMain.chatHistoryScrollView.chatHistoryView');
	},
	getChatHistoryViewScrollView: function() {
		return SC.page.getPath('chatView.chatSplitView.chatMain.chatHistoryScrollView');
	},
	playSound: function(name) {
		var snd = document.getElementById('snd_'+name);
		if (snd) {
			snd.play();
			return true;
		}
		return false;
	},
	poll: function() {
		var request = new Ajax.Request('/backend/update', {
			method: 'post',
			requestHeaders: Frontend.appController.buildHeaders(),
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
			try {
				var json = '' + response.transport.responseText;
				json = eval(json);
				if (json) {
					var users = Frontend.User.findAll();
					var hadMessages = false;
					var chatMessages = {};
					var appendChat = function(chatMessages, msg, cid) {
						if (!cid) {
							cid = 'default';
						}
						if (chatMessages[cid]) {
							chatMessages[cid] += msg;
							console.log("append msg: ", chatMessages[cid]);
						} else {
							Frontend.chatController.getConversation(cid);
							chatMessages[cid] = msg;
						}
					}
					for (var j = 0; j < json.length; j++) {
						var record = json[j];
						if (record.recordType == 'clear_userlist') {
							Frontend.User.removeAll();
						} else if (record.recordType == 'chat_invite') {
							var user = Frontend.User.find(record.user);
							var conversation = Frontend.Conversation.find(record.conversationId);
							if (user && !conversation) {
								Frontend.chatController.showChatInvitationDialog(record.conversationId, user);
								Frontend.appController.playSound('invite');
							}
						} else if (record.recordType == 'user') {
							var user = Frontend.User.find(record.guid);
							if (!user) {
								SC.Store.addRecord(Frontend.User.create({ guid: record.guid }));
								user = Frontend.User.find(record.guid);
								var msg = '<<< ' + record.nick + ' has joined >>>';
								msg = '<div class="info">&nbsp;' + msg.escapeHTML() + '</div>';
								appendChat(chatMessages, msg);
								var conversation = Frontend.Conversation.find('default');
								conversation.get('userlist').push(user);
							} else {
								if (user.get('nick') != record.nick) {
									var msg = '<<< ' + user.get('nick') + ' is now known as ' + record.nick + ' >>>';
									msg = '<div class="info">&nbsp;' + msg.escapeHTML() + '</div>';
									var conversations = Frontend.Conversation.findAll();
									for (var i = 0; i < conversations.length; i++) {
										var c = conversations[i];
										if (c.get('userlist').indexOf(user) != -1) {
											appendChat(chatMessages, msg, c.get('guid'));
										}
									}
								}
							}
							user.set('nick', record.nick);
							user.set('status', record.status);
							user.set('icon', ((record.status & 2) == 2 ? '/images/adminuser.png' : '/images/reguser.png'));								
							if (record.conversationId) {
								var msg = '<<< ' + record.nick + ' has joined >>>';
								msg = '<div class="info">&nbsp;' + msg.escapeHTML() + '</div>';
								appendChat(chatMessages, msg, record.conversationId);
								var conversation = Frontend.Conversation.find(record.conversationId);
								conversation.get('userlist').push(user);
							}
						} else if (record.recordType == 'user_left') {
							var user = Frontend.User.find(record.guid);
							if (user != null) {
								var msg = '<<< ' + user.get('nick') + ' has left >>>';
								msg = '<div class="info">&nbsp;' + msg.escapeHTML() + '</div>';
								appendChat(chatMessages, msg, record.conversationId);
								var cid = (record.conversationId ? record.conversationId : 'default');
								var conversation = Frontend.Conversation.find(cid);
								var userIndex = conversation.get('userlist').indexOf(user);
								if (userIndex != -1) {
									conversation.get('userlist').slice(userIndex);
								}
								if (cid == 'default') {
									SC.Store.removeRecord(user);
								}
							}
						} else if (record.recordType == 'chat') {
							var msg = record.message.escapeHTML();
							for (var i = 0; i < msg.length; i++) {
								if (msg.charAt(i) != ' ') {
									msg = msg.substring(i);
									for (; i > 0; i--) {
										msg = '&nbsp;' + msg;
									}
									break;
								}
							}
							msg = msg.replace(new RegExp("\\n ", "g"), "<br />&nbsp;");
							msg = msg.replace(new RegExp("\\n", "g"), "<br />");
							msg = Frontend.appController.linkify(msg);
							msg = '<div class="msg">' + msg + '</div>';
							appendChat(chatMessages, msg, record.conversationId);
							Frontend.appController.playSound('chat');
						} else if (record.recordType == 'error') {
							Frontend.errorMessageController.showErrorDialog("Server_Error".loc(), record.message, null);
						} else if (record.recordType == 'pm') {
							var msg = [	'<div class="pm">',
											'<div class="head">',
												'Private Message from ', record.nick.escapeHTML(), ':',
											'</div>',
											'<div class="msg">',
												Frontend.appController.linkify(record.message.escapeHTML()),
											'</div>',
										'</div>'].join('');
										appendChat(chatMessages, msg, record.conversationId);
							var conversations = Frontend.Conversation.findAll();
							for (var i = 0; i < conversations.length; i++) {
								appendChat(chatMessages, msg, conversations[i].guid);
							}
							Frontend.appController.playSound('pm');
						} else if (record.recordType == 'user_info') {
							Frontend.userlistController.showUserInfoDialog(record.message.escapeHTML());
						} else if (record.recordType == 'news') {
							var newsText = record.message.escapeHTML();
							newsText = newsText.replace(new RegExp("  ", "g"), "&nbsp; ");
							newsText = newsText.replace(new RegExp("\t", "g"), "&nbsp; &nbsp; ");
							newsText = Frontend.appController.linkify(newsText);
							newsText = newsText.replace(new RegExp("\\n ", "g"), "<br />&nbsp;");
							newsText = newsText.replace(new RegExp("\\n", "g"), "<br />");
							Frontend.newsController.set('news', newsText);
						} else {
							alert("Error: Unhandled record " + record.toString());
						}
					}
					Frontend.userlistController.refresh();
					var currentConversation = Frontend.chatController.get('currentConversation');
					var conversations = Frontend.Conversation.findAll();
					for (var cid in chatMessages) {
						var c = Frontend.chatController.getConversation(cid);
						c.set('chatHTML', c.get('chatHTML') + chatMessages[cid]);
						if (c == currentConversation) {
							hadMessages = true;
						}
					}
					if (hadMessages) {
						/* Scroll to the bottom or keep same position... */
						var shouldScroll = false;
						var scrollView = Frontend.appController.getChatHistoryViewScrollView().rootElement;
						var currentHeight = 0;

						if (scrollView.scrollHeight > 0) {
							currentHeight = scrollView.scrollHeight;
						} else if (scrollView.offsetHeight > 0) {
							currentHeight = scrollView.offsetHeight;
						}

						var height = ((scrollView.style.pixelHeight) ? scrollView.style.pixelHeight : scrollView.offsetHeight);
				    	if (currentHeight - scrollView.scrollTop - height < 5) {
				        	shouldScroll = true;
						}
						Frontend.chatController.updateChatView();
						if (shouldScroll) {
							if (scrollView.scrollHeight > 0) {
								currentHeight = scrollView.scrollHeight;
							} else if (scrollView.offsetHeight > 0) {
								currentHeight = scrollView.offsetHeight;
							}
				        	scrollView.scrollTop = currentHeight;
						}
					}
				}
				var isPolling = Frontend.appController.get('isPolling');
				if (isPolling) {
					var timer = SC.Timer.schedule({ target: Frontend.appController, action: 'poll', interval: 500 });
				}
			} catch (err) {
			//	alert(err);
			//	alert(err.stack);
				Frontend.appController.set('isPolling', false);
				Frontend.errorMessageController.showErrorDialog("Connection_Lost".loc(),
					"Connection_Lost_Message".loc(), Frontend.appController.get('disconnectAction'));
			}
			},
		   	onFailure: function() {
				Frontend.appController.set('isPolling', false);
				Frontend.errorMessageController.showErrorDialog("Connection_Lost".loc(),
					"Connection_Lost_Message".loc(), Frontend.appController.get('disconnectAction'));
			}
		});	
	},
	disconnectAction: function() {
		Frontend.navController.set('tab', 'connection');
		Frontend.appController.getChatHistoryView().set('innerHTML', '');
		Frontend.User.removeAll();	
		Frontend.newsController.set('news', '');
	},
	disconnect: function() {
		var confirmed = confirm("Are you sure you want to disconnect?");
		if (!confirmed) { return; }
		Frontend.appController.set('isPolling', false);
		var request = new Ajax.Request('/backend/close', {
			method: 'get',
			requestHeaders: Frontend.appController.buildHeaders(),
			evalJS: false,
			evalJSON: false,
			onComplete: this.get('disconnectAction')
		});
	},
}) ;
