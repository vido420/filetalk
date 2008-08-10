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
	tab: 'connection',
	tabObserver: function() {
		var tab = this.get('tab');
		SC.page.get('navigationView').set('value', tab);
		if (tab == 'chat') {
			SC.page.get('contentView').set('content', SC.page.get('chatView'));
			Frontend.appController.startPolling();
		} else if (tab == 'connection') {
			SC.page.get('contentView').set('content', SC.page.get('loginView'));
		}
	}.observes('tab'),
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
	poll: function() {
		var request = new Ajax.Request('/backend/update', {
			method: 'get',
			requestHeaders: Frontend.appController.buildHeaders(),
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
			try {
				var json = '' + response.transport.responseText;
				json = eval(json);
				if (json) {
					var records = [];
					var users = Frontend.User.findAll();
					var hadMessages = false;
					var chatView = SC.page.get('chatHistoryView');
					var chatHTML = chatView.get('innerHTML');
					for (var i = 0; i < json.length; i++) {
						var record = json[i];
						if (record.recordType == 'clear_userlist') {
							Frontend.User.removeAll();
						} else if (record.recordType == 'user_left') {
							var user = Frontend.User.find(record.guid);
							if (user != null) {
								var msg = '<<< ' + user.get('nick') + ' has left >>>';
								chatHTML += '<div class="info">&nbsp;' + msg.escapeHTML() + '</div>';
								hadMessages = true;
								SC.Store.removeRecord(user);
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
							msg = Frontend.appController.linkify(msg);
							chatHTML += '<div class="msg">' + msg + '</div>';
							hadMessages = true;
						} else if (record.recordType == 'error') {
							Frontend.errorMessageController.showErrorDialog("Server_Error".loc(), record.message, null);
						} else if (record.recordType == 'pm') {
							chatHTML += '<div class="pm">';
							chatHTML += '<div class="head">';
							chatHTML += 'Private Message from ' + record.nick.escapeHTML() + ':';
							chatHTML += '</div>';
							var msg = Frontend.appController.linkify(record.message.escapeHTML());
							chatHTML += '<div class="msg">' + msg + '</div>';
							chatHTML += '</div>';
							hadMessages = true;
						} else if (record.recordType == 'user_info') {
							Frontend.userlistController.showUserInfoDialog(record.message.escapeHTML());
						} else {
							if (record.recordType == 'user') {
								record.recordType = Frontend.User;
								if ((record.status & 2) == 2) {
									record.icon = '/images/adminuser.png';								
								} else {
									record.icon = '/images/reguser.png';
								}
								var user = Frontend.User.find(record.guid);
								if (user) {
									if (user.get('nick') != record.nick) {
										var msg = '<<< ' + user.get('nick') + ' is now known as ' + record.nick + ' >>>';
										chatHTML += '<div class="info">&nbsp;' + msg.escapeHTML() + '</div>';
										hadMessages = true;
									}
								} else /* if (users && users.length > 0) */ {
									/* Don't display these when users is empty => aka when just joining. */
									var msg = '<<< ' + record.nick + ' has joined >>>';
									chatHTML += '<div class="info">&nbsp;' + msg.escapeHTML() + '</div>';
									hadMessages = true;
								}
							}
							records.push(record);
						}
					}
					SC.Store.updateRecords(records);
			  		Frontend.userlistController.set('content', Frontend.User.collection().refresh());
					if (hadMessages) {
						/* Scroll to the bottom or keep same position... */
						var shouldScroll = false;
						var scrollView = SC.page.get('chatHistoryScrollView').rootElement;
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
						chatView.set('innerHTML', chatHTML);
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
		Frontend.appController.set('tab', 'connection');
		SC.page.get('chatHistoryView').set('innerHTML', '');
		Frontend.User.removeAll();	
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
