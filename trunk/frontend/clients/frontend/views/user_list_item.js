// ==========================================================================
// Frontend.UserListItemView
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.View
  @author AuthorName
  @version 0.1
*/
Frontend.UserListItemView = SC.ListItemView.extend(
/** @scope Frontend.UserListItemView.prototype */ {

	renderLabelHtml: function(label) {
		var html = [];
		var content = this.get('content');
		var status = (content && content.get) ? content.get('status') : null;
		if (status == null) {
			status = 'color0';
		} else {
			status = 'color' + status;
		}
		html.push('<span class="sc-label ' + status + '">');
		html.push(label || '');
		html.push('</span>');
		return html.join('');    
	},
}) ;
