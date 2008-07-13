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
	tab: 'connection',
	tabObserver: function() {
		var tab = this.get('tab');
		SC.page.get('navigationView').set('value', tab);
		if (tab == 'chat') {
			SC.page.get('contentView').set('content', SC.page.get('chatView'));
			Frontend.appController.startPolling();
		}
	}.observes('tab'),
	startPolling: function() {
		if (!this._timer) this._timer = SC.Timer.schedule({
			target: this, action: 'poll', repeats: true, interval: 1000
		});
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
						var users = Frontend.User.findAll();
						for (var i = users.length - 1; i >= 0; i--) {
							SC.Store.removeRecord(users[i]);
						}
					} else if (record.recordType == 'user_left') {
						var user = Frontend.User.find(record.guid);
						if (user != null) {
							SC.Store.removeRecord(user);
						}
					} else {
						if (record.recordType == 'chat') {
							record.recordType = Frontend.ChatMessage;
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
			}
		});	
	},
	showChangeNickDialog: function() {
		SC.page.get('nameDialog').set('isVisible', true);
	},
	hideChangeNickDialog: function() {
		SC.page.get('nameDialog').set('isVisible', false);
	},
	changeNick: function() {
		Frontend.appController.hideChangeNickDialog();
	},
}) ;
