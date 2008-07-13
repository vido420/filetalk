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
	}	
}) ;
