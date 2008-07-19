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
		/*
			TODO: Status is actually a flag field:
				1 = idle
				2 = admin
				4 = refuses private messages
				8 = refuses private chat
				16 = head admin
		*/
		if (status == null) {
			status = 'color0';
		} else {
			status&=~(4+8+16);
			status = 'color' + status;
		}
		html.push('<span class="sc-label ' + status + '">');
		html.push((label || '').escapeHTML());
		html.push('</span>');
		return html.join('');    
	},
}) ;
