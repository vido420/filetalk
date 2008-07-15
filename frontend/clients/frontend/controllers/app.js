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
				var clearUsers = -1;
				var records = [];
				for (var i = 0; i < json.length; i++) {
					var record = json[i];
					if (record.recordType == 'clear_userlist') {
						Frontend.User.removeAll();
					} else if (record.recordType == 'user_left') {
						var user = Frontend.User.find(record.guid);
						if (user != null) {
							SC.Store.removeRecord(user);
						}
					} else {
						if (record.recordType == 'chat') {
							record.recordType = Frontend.ChatMessage;
							var msg = record.message;
							for (var i = 0; i < msg.length; i++) {
								if (msg.charAt(i) != ' ') {
									msg = msg.substring(i);
									for (; i > 0; i--) {
										msg = '&nbsp;' + msg;
									}
									record.message = msg;
									break;
								}
							}
						} else if (record.recordType == 'user') {
							record.recordType = Frontend.User;
							if (record.status > 1) {
								record.icon = '/images/adminuser.png';								
							} else {
								record.icon = '/images/reguser.png';
							}
						}
						records.push(record);
					}
				}
				SC.Store.updateRecords(records);
				Frontend.chatHistoryController.set('content', Frontend.ChatMessage.collection().refresh());
			  	Frontend.userlistController.set('content', Frontend.User.collection().refresh());
			},
		   	onFailure: function() {
				Frontend.appController.get('_timer').set('isPaused', true);
				var closeAction = function() {
					Frontend.appController.set('tab', 'connection');
					Frontend.ChatMessage.removeAll();
					Frontend.User.removeAll();
				}
				Frontend.errorMessageController.showErrorDialog("Connection_Lost".loc(), "Connection_Lost_Message".loc(), closeAction);
			}
		});	
	},
}) ;
