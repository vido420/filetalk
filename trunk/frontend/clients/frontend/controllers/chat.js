// ==========================================================================
// Frontend.ChatController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.chatController = SC.Object.create(
/** @scope Frontend.chatController */ {

	send: function() {
		var msg = SC.page.getPath('chatView.chatForm.chatMessage.value');
		if (msg != null) {
			var request = new Ajax.Request('/backend/chat', {
				method: 'GET',
				parameters: {
					m: msg,
				},
				evalJS: false,
				evalJSON: false,
				onSuccess: function(response) {
				},
			   	onFailure: function() {
				}
			});
			SC.page.getPath('chatView.chatForm.chatMessage').rootElement.select();
		}
	},
	showChangeNickDialog: function() {
		SC.page.get('nameDialog').set('isVisible', true);
	},
	hideChangeNickDialog: function() {
		SC.page.get('nameDialog').set('isVisible', false);
	},
	changeNick: function() {
		var nick = SC.page.getPath('nameDialog.nameForm.nameField.value');
		if (nick != null) {
			var request = new Ajax.Request('/backend/chat/set_nick', {
				method: 'GET',
				parameters: {
					n: nick,
				},
				evalJS: false,
				evalJSON: false,
				onSuccess: function(response) {
					Frontend.chatController.hideChangeNickDialog();
				},
			   	onFailure: function() {
				}
			});
		}
	},
}) ;
