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
				for (var i = 0; i < json.length; i++) {
					var record = json[i];
					if (record.recordType == 'chat') {
						record.recordType = Frontend.ChatMessage;
					} else if (record.recordType == 'user') {
						record.recordType = Frontend.User;
						record.icon = '/images/reguser.png';
					} else if (record.recordType == 'clearUsers') {
						clearUsers = i;
					}
				}
				if (clearUsers >= 0) {
					var newJson = [];
					for (var i = 0; i < json.length; i++) {
						var record = json[i];
						if (record.recordType != 'clearUsers') {
							if (record.recordType != Frontend.User || i >= clearUsers) {
								newJson.push(record);
							}
						}
					}
					json = newJson;
					var users = Frontend.User.findAll();
					for (var i = users.length - 1; i >= 0; i--)
						SC.Store.removeRecord(users[i]);
				}
				SC.Store.updateRecords(json);
				Frontend.chatHistoryController.set('content', Frontend.ChatMessage.collection().refresh());
			  	Frontend.userlistController.set('content', Frontend.User.collection().refresh());
			},
		   	onFailure: function() {
			}
		});	
	},
}) ;
