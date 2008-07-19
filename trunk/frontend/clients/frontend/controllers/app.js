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
	startPolling: function() {
		if (!this._timer) this._timer = SC.Timer.schedule({
			target: this, action: 'poll', repeats: true, interval: 1000
		});
		this._timer.set('isPaused', false);
	},
	poll: function() {
		var request = new Ajax.Request('/backend/update', {
			method: 'get',
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
				var json = '' + response.transport.responseText;
				json = eval(json);
				var records = [];
				var users = Frontend.User.findAll();
				var hadMessages = false;
				var chatView = SC.page.getPath('chatView.chatHistoryScrollView.chatHistoryView');
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
						//	record.recordType = Frontend.ChatMessage;
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
						chatHTML += '<div class="msg">' + msg + '</div>';
						hadMessages = true;
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
							} else if (users && users.length > 0) {
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
					chatView.set('innerHTML', chatHTML);
					/* Scroll to the bottom or keep same position... */
					var scrollView = SC.page.getPath('chatView.chatHistoryScrollView').rootElement;
					var currentHeight = 0;

					if (scrollView.scrollHeight > 0) {
						currentHeight = scrollView.scrollHeight;
					} else if (scrollView.offsetHeight > 0) {
						currentHeight = scrollView.offsetHeight;
					}

					var height = ((scrollView.style.pixelHeight) ? scrollView.style.pixelHeight : scrollView.offsetHeight);
				    if (currentHeight - scrollView.scrollTop - height < 25) {
				        scrollView.scrollTop = currentHeight;
					}
				}
			},
		   	onFailure: function() {
				Frontend.appController.get('_timer').set('isPaused', true);
				var closeAction = function() {
					Frontend.appController.set('tab', 'connection');
					SC.page.getPath('chatView.chatHistoryScrollView.chatHistoryView').set('innerHTML', '');
					Frontend.User.removeAll();
				}
				Frontend.errorMessageController.showErrorDialog("Connection_Lost".loc(), "Connection_Lost_Message".loc(), closeAction);
			}
		});	
	},
	disconnect: function() {
		var confirmed = confirm("Are you sure you want to disconnect?");
		if (!confirmed) { return; }
		Frontend.appController.get('_timer').set('isPaused', true);
		var request = new Ajax.Request('/backend/close', {
			method: 'get',
			evalJS: false,
			evalJSON: false,
			onComplete: function(response) {
				Frontend.appController.set('tab', 'connection');
				SC.page.getPath('chatView.chatHistoryScrollView.chatHistoryView').set('innerHTML', '');
				Frontend.User.removeAll();
			}
		});
	},
}) ;
