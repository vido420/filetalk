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
				SC.Store.updateRecords(eval(json));
				Frontend.chatHistoryController.set('content', Frontend.ChatMessage.collection().refresh());
			},
		   	onFailure: function() {
			}
		});	
	},
}) ;
