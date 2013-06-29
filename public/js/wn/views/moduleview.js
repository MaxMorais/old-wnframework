// Copyright 2013 Web Notes Technologies Pvt Ltd
// MIT Licensed. See license.txt

wn.provide("wn.views.moduleview");
wn.provide("wn.module_page");
wn.home_page = "desktop";

wn.views.moduleview.make = function(wrapper, module) {
	wrapper.module_view = new wn.views.moduleview.ModuleView(wrapper, module);

	wrapper.refresh = function() {
		// remake on refresh
		if((new Date() - wrapper.module_view.created_on) > (180 * 1000)) {
			wrapper.module_view = new wn.views.moduleview.ModuleView(wrapper, module);
		}
	}
}

wn.views.show_open_count_list = function(element) {
	var doctype = $(element).attr("data-doctype");
	var condition = wn.boot.notification_info.conditions[doctype];
	if(condition) {
		wn.route_options = condition;
		var route = wn.get_route()
		if(route[0]==="List" && route[1]===doctype) {
			wn.pages["List/" + doctype].doclistview.refresh();
		} else {
			wn.set_route("List", doctype);
		}
	}
}

wn.views.moduleview.ModuleView = Class.extend({
	init: function(wrapper, module) {
		this.doctypes = [];
		$(wrapper).empty();
		wn.ui.make_app_page({
			parent: wrapper,
			single_column: true,
			title: wn._(wn.modules[module].label || module)
		});
		wrapper.appframe.add_module_icon(module);
		this.wrapper = wrapper;
		this.module = module;
		this.make_body();
		this.render_static();
		this.render_dynamic();
		this.created_on = new Date();

		var me = this;
		$(document).on("notification-update", function() {
			me.update_open_count();
		});
	},
	make_body: function() {
		var wrapper = this.wrapper;
		// make columns
		$(wrapper).find(".layout-main").html("<div class='row'>\
			<div class='col col-lg-6 main-section'></div>\
			<div class='col col-lg-6 side-section'></div>\
		</div>")

		$(wrapper).on("click", ".badge-important", function() {
			wn.views.show_open_count_list(this);
		});

		$(wrapper).on("click", ".badge-count", function() {
			var doctype = $(this).attr("data-doctype-count");
			wn.set_route("List", doctype);
		});		
	},
	add_section: function(section) {
		section._title = wn._(section.title);
		var list_group = $('<ul class="list-group">\
			<li class="list-group-item">\
				<h4 class="list-group-item-heading"><i class="'
					+ section.icon+'"></i> '
					+ wn._(section.title) +'</h4>\
			</li>\
		</ul>"').appendTo(section.right 
			? $(this.wrapper).find(".side-section")
			: $(this.wrapper).find(".main-section"));
		section.list_group = list_group;
	},
	add_item: function(item, section) {
		if(!item.description) item.description = "";
		if(item.count==null) item.count = "";
				
		$(repl('<li class="list-group-item">\
			<span' +
				((item.doctype && item.description) 
					? " data-doctype='"+item.doctype+"'" 
					: "") + ">%(link)s</span>"
				+ (item.description 
					? " <span class='text-muted small'>%(description)s</span>" 
					: "")
			+ ((section.right || !item.doctype) 
				? ''
				: '<span data-doctype-count="%(doctype)s" style="margin-left: 2px;"></span>\
					<span class="clearfix"></span>')
			+ "</li>", item))
		.appendTo(section.list_group);
	},
	render_static: function() {
		// render sections
		var me = this;
		$.each(wn.module_page[this.module], function(i, section) {
			me.add_section(section);
			$.each(section.items, function(i, item) {
				if(item.doctype) 
					me.doctypes.push(item.doctype);
				if(item.doctype && !item.route) {
					item.route = "List/" + encodeURIComponent(item.doctype);
				}
				if(item.page && !item.route) {
					item.route = item.page;
				}

				// link
				item.link = repl("<a href='#%(route)s'>%(label)s</a>", item);

				// doctype permissions
				if(item.doctype && !wn.model.can_read(item.doctype)) {
					//item.link = item.label;
					return;
				}

				// page permissions
				if(item.page && !in_list(wn.boot.allowed_pages, item.page)) {
					//item.link = item.label;
					return;
				}

				if((item.country && wn.boot.control_panel.country==item.country) 
					|| !item.country)
					me.add_item(item, section)
			});
			if(section.list_group.find("li").length==1) {
				section.list_group.toggle(false);
			}
		});
	},
	render_dynamic: function() {
		// render reports
		var me = this;
		wn.call({
			method: "webnotes.widgets.moduleview.get_data",
			args: {
				module: me.module,
				doctypes: me.doctypes
			},
			callback: function(r) {
				if(r.message) {
					// reports
					if(r.message.reports.length) {
						var section = {
							title: wn._("Custom Reports"),
							right: true,
							icon: "icon-list",
						}
						me.add_section(section);
						$.each(r.message.reports, function(i, item) {
							if(wn.model.can_read(item.doctype)) {
								if(item.is_query_report) {
									item.link = repl("<a href=\"#query-report/%(name)s\">%(name)s</a>",
										item);
								} else {
									item.link = repl("<a href=\"#Report/%(doctype)s/%(name)s\">\
										%(name)s</a>", item);
								}
								me.add_item(item, section);
							}
						})
					}
					// counts
					if(r.message.item_count) {
						$.each(r.message.item_count, function(doctype, count) {
							$(me.wrapper).find("[data-doctype-count='"+doctype+"']")
								.html(count)
								.addClass("badge badge-count")
								.css({cursor:"pointer"});
						})
					}

					// open-counts
					me.update_open_count();
				}
			}
		});	
	},
	update_open_count: function() {
		var me = this;
		$(me.wrapper).find(".badge-important").remove();
		if(wn.boot.notification_info.open_count_doctype) {
			$.each(wn.boot.notification_info.open_count_doctype, function(doctype, count) {
				if(in_list(me.doctypes, doctype)) {
					$('<span>')
						.css({
							"cursor": "pointer",
							"margin-right": "0px"
						})
						.addClass("badge badge-important")
						.html(count)
						.attr("data-doctype", doctype)
						.insertAfter($(me.wrapper)
							.find("[data-doctype-count='"+doctype+"']"));
				}
			})
		}
	}
});
