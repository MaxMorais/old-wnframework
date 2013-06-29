
wn.pages['modules_setup'].onload = function(wrapper) { 
	wn.ui.make_app_page({
		parent: wrapper,
		title: 'Show or Hide Modules',
		single_column: true
	});
	
	wrapper.appframe.add_button("Update", function() {
		wn.modules_setup.update();
	})
	
	$('<div class="alert">Select modules to be shown.</div>').appendTo($(wrapper).find(".layout-main"));
	$('<div id="modules-list">').appendTo($(wrapper).find(".layout-main"));
	
	wn.modules_setup.refresh_page();
}

wn.modules_setup = {
	refresh_page: function() {
		$('#modules-list').empty();

		$.each(keys(wn.modules).sort(), function(i, m) {
			if(m!="Setup") {
				var $chk = $("<input type='checkbox' data-module='"+m+"' style='margin-top: -2px'>")
					.prependTo($('<p><span> '+m+'</span></p>').appendTo("#modules-list"));
				if(!wn.boot.hidden_modules || wn.boot.hidden_modules.indexOf(m)==-1) {
					$chk.attr("checked", true);
				}
			}
		});
	},
	update: function() {
		var ml = [];
		$('#modules-list [data-module]:checkbox:not(:checked)').each(function() {
			ml.push($(this).attr('data-module'));
		});
		
		wn.call({
			method: 'core.page.modules_setup.modules_setup.update',
			args: {
				ml: ml
			},
			callback: function(r) {
				if(r.exc) msgprint("There were errors.")
			},
			btn: this
		});
	}
	
}