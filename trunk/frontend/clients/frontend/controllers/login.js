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
		var loginName = SC.page.getPath('loginView.loginForm.loginName');
		var loginPassword = SC.page.getPath('loginView.loginForm.loginPassword');
		var username = loginName.get('value');
		var password = loginPassword.get('value');
		Frontend.chatController.set('userNick', (username && username.length > 0 ? username : 'Guest'));
		loginName.rootElement.blur();
		loginPassword.rootElement.blur();
		Frontend.appController.set('clientKey', null);
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
				var key = response.getResponseHeader('File-Talk-Key');
				if (key) {
					Frontend.appController.set('clientKey', key);
					Frontend.appController.set('tab', 'chat');
				} else {
					Frontend.errorMessageController.showErrorDialog("Login_Failed".loc(), "Login_Failed_Message".loc(), null);
				}
			},
		   	onFailure: function() {
				SC.page.get('loginProgresDialog').set('isVisible', false);
				Frontend.errorMessageController.showErrorDialog("Login_Failed".loc(), "Login_Failed_Message".loc(), null);
			}
		});
	},
}) ;
