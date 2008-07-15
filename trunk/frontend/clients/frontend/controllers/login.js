// ==========================================================================
// Frontend.LoginController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.loginController = SC.Object.create(
/** @scope Frontend.loginController */ {

	login: function() {
		var username = SC.page.getPath('loginView.loginForm.loginName.value');
		var password = SC.page.getPath('loginView.loginForm.loginPassword.value');
		Frontend.chatController.set('userNick', username);
		SC.page.get('loginProgresDialog').set('isVisible', true);
		var request = new Ajax.Request('/backend/login', {
			method: 'GET',
			parameters: { name: username, pass: password },
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
				var nick = ('' + response.transport.responseText);
				if (nick && nick.length > 0) {					
					Frontend.chatController.set('userNick', nick);
				}
				SC.page.get('loginProgresDialog').set('isVisible', false);
				Frontend.appController.set('tab', 'chat');
			},
		   	onFailure: function() {
				SC.page.get('loginProgresDialog').set('isVisible', false);
				Frontend.errorMessageController.showErrorDialog("Login_Failed".loc(), "Login_Failed_Message".loc(), null);
			}
		});
	},
}) ;