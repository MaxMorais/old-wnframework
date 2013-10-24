wn.pages['translation-tool'].onload = function(wrapper) { 
	wn.ui.make_app_page({
		parent: wrapper,
		title: wn._('Translate') + ' ' + wn.app.name,
		single_column: true
	});					
	
	wrapper.update_this_app = new wn.TranslateThisApp(wrapper);
};

wn.TranslateThisApp = Class.extend({
	init: function(wrapper) {
		this.wrapper = wrapper;
		this.body = $(this.wrapper).find(".layout-main");
		this.wrapper.appframe.add_home_breadcrumb();
		this.wrapper.appframe.add_module_icon("Setup");
		this.wrapper.appframe.add_breadcrumb("icon-book");
		this.langs = {};
		this.namespace = {};
		this.current_contenttype = "DocType",
		this.current_lang = wn.boot.lang;
		this.current_doctype = false;
		this.changed = false;
		this.make();
	},
	
	make: function() {
		var me = this;
		
		if(wn.boot && wn.boot.expires_on) {
			wn.utils.set_intro(this.wrapper, $("<div></div>").appendTo(this.body), 
				wn._('This feature is only applicable to self hosted instances')
			);
			
		} else {
			this.wrapper.appframe.add_button(
				wn._('Update Translations'),
				function(){
					me.update_translation_file();
				},
				'icon-rss'
			);

			this.wrapper.appframe.add_button(
				wn._('Make a new language'),
				function(){
					me.create_new_language_file();
				},
				'icon-plus'
			);
			this.wrapper.appframe.add_button(
				wn._('Save Translation'),
				function(){
					me.import_translation_file();
				}
			);

			this.wrapper.content_area = $(repl('<div class="container">'
				+ '<div class="row">'
					+ '<div class="sections-area col-sm-3">'
						+ '<label for="content_type">%(ct_label)s</label>'
						+ '<select name="content_type" class="form-control">'
							+'<option value="%(ct1)s" selected>%(ct1_label)s</option>'
							+'<option value="%(ct2)s">%(ct2_label)s</option>'
							+'<option value="%(ct3)s">%(ct3_label)s</option>'
							+'<option value="%(ct4)s">%(ct4_label)s</option>'
						+'</select>'
						+ '<div class="panel-group namespace" id="namespace"></div>'
					+ '</div>'
					+ '<div class="translation-area col-sm-9">'
						+ '<table class="table table-hover table-bordered table-grid">'
							+ '<thead>'
								+ '<tr class="active">'
									+ '<th width="50%">%(phrase)s</th>'
									+ '<th class="lang-area" width="50%"></th>'
								+ '</tr>'
							+ '</thead>'
					    	+ '<tbody></tbody>'
					    + '</table>'
					+ '</div>'
				+ '</div>'
			+ '</div>', {
				phrase: wn._('Phrase'),
				ct_label: wn._('Translate a'),
				ct1: 'DocType',
				ct1_label: wn._('DocType'),
				ct2: 'Page',
				ct2_label: wn._('Page'),
				ct3: 'Print Format',
				ct3_label: wn._('Print Format'),
				ct4: 'Report',
				ct4_label: wn._('Report')
			})).appendTo(this.body);

			this.wrapper.content_table_body = $('tbody', this.wrapper.content_area);

			this.wrapper.content_selector = $('select[name="content_type"]', this.wrapper.content_area)
				.change(function(){
					me.set_current_contenttype($(this).find('option:selected').val());
				});
			
			this.wrapper.lang_selector = $('<select name="lang" class="form-control"></select>')
				.change(function(){
					me.set_current_lang($(this).find('option:selected').val());
				})
				.appendTo($('.lang-area', this.wrapper.content_area));

			this.wrapper.sections = $('.sections-area', this.wrapper.content_area);
			this.wrapper.namespace = $('.namespace', this.wrapper.content_area);

			this.get_all_languages();
			this.get_namespace_data();
			this.get_message_data();
		}
	},
	set_current_contenttype: function(content_type){
		this.current_contenttype = content_type;
		this.current_doctype = null;
		this.get_namespace_data();
		this.get_message_data(this.current_lang, content_type);
		$('.panel-collapse.in', this.wrapper.namespace).parent().find('a.accordion-toggle').click();
	},
	set_current_lang: function(lang){
		this.current_lang = lang;
		this.current_doctype = null;
		this.get_message_data(lang, this.current_contenttype);
		$('.panel-collapse.in', this.wrapper.namespace).parent().find('a.accordion-toggle').click();
	},
	set_current_doctype: function(dt){
		this.current_doctype = dt;
		this.get_message_data(this.current_lang, this.current_contenttype, dt);
	},
	make_table_body_rows: function(rows){
		var me=this, 
			row_template = '<tr>\
			<th class="active">%(phrase)s</th>\
			<th><textarea type="text" height="100%" data-phrase="%(phrase)s" \
				class="col-md-12 input-with-feedback form-control">%(translate)s</textarea>\
			</th>\
		</tr>', i = 0, l=rows.length, row, html='';
		this.wrapper.content_table_body.html(html);
		for (; i<l; i++){
			row = rows[i];
			html += repl(row_template, {phrase: row[0], translate: row[1]});
		}
		this.wrapper.content_table_body.html(html);
		$('textarea', this.wrapper.content_table_body).change(function(){me.changed=true;})
	},
	make_namespaces: function(){
		var me=this,
			doctype, module, $namespace, $group, $group_item, i, l, j, k,
			ns = [], ds = {},
			modules = this.namespace.modules, doctypes=this.namespace.doctypes,
			ns_template = '<div class="panel panel-default">\
				<div class="panel-heading">\
					<h4 class="panel-title">\
						<a class="accordion-toggle" data-toggle="collapse" \
							data-parent="#namespace" href="#namespace_%(namespace)s">\
							%(title)s\
						</a>\
						<span class="badge pull-right">%(ndocs)s</span>\
					</h4>\
				</div>\
				<div class="panel-collapse collapse" id="namespace_%(namespace)s">\
					<div class="panel-body list-group"></div>\
				</div>\
			</div>',
			si_template = '<div class="list-group-item" data-doctype="%(doctype)s"><a>%(title)s</a></div>';

		this.wrapper.namespace.html("");

		l = modules.length

		function sort_by_translation(x,y){
			return (x[1] > y[1] ? 1 : x[1] < y[1] ? -1 : 0);
		}

		for (i=0; i<l; i++){
			module = modules[i];
			ns.push([module, wn._(module)])
			k = doctypes[module].length
			ds[module] = [];
			for (j=0; j<k; j++){
				doctype = doctypes[module][j];
				ds[module].push([doctype, wn._(doctype)]);
			}
			ds[module].sort(sort_by_translation)
		}
		ns.sort(sort_by_translation);

		l = ns.length;
		for (i=0; i<l; i++){
			module = ns[i]
			$namespace = $(repl(
				ns_template, {
					'namespace': module[0],
					'title': module[1],
					'ndocs': ds[module[0]].length
				}
			));

			$group = $('.list-group', $namespace);
			k = ds[module[0]].length;
			for (j=0; j<k; j++){
				doctype = ds[module[0]][j];
				$group_item = repl(
					si_template,
					{'doctype': doctype[0], 'title': doctype[1]}
				);
				$group.append($group_item);
			}
			this.wrapper.namespace.append($namespace);
		}
		//$('.collapse', this.wrapper.namespace).collapse();
		$('div.list-group-item a', this.wrapper.namespace).click(function(){
			me.set_current_doctype($(this).parent().data().doctype);
		});
	},
	get_all_languages: function(){
		var me = this;
		wn.call({
			module: "core",
			page: "translation_tool",
			method: "get_lang_dict",
			callback: function(r){
				me.langs = r.message ? r.message : {};
				if (me.langs){
					me.append_lang_options();
				}
			}
		});
	},
	get_namespace_data: function(){
		var me = this;
		console.log(this.current_contenttype);
		wn.call({
			module: 'core',
			page: 'translation_tool',
			method: 'get_lang_namespace',
			args: {
				content: this.current_contenttype
			},
			callback: function(r){
				me.namespace = r.message ? r.message : {};
				if (me.namespace){
					me.make_namespaces()
				}
			}
		});
	},
	get_message_data: function(lang, contenttype, doctype){
		var me = this,
			lang = lang? lang : this.current_lang,
			doctype = doctype ? doctype : false,
			args = {'language': lang, 'content': contenttype ? contenttype : this.current_contenttype};
		if (doctype){
			args['doctype'] = doctype;
		}
		console.log(args)

		if (this.changed){
			if (!confirm(wn._('You have pending changes, you want to continue?'))){
				return;
			}
		}

		wn.call({
			module: 'core',
			page: 'translation_tool',
			method: 'get_filtered_messages',
			args: args,
			callback: function(r){
				if (r.message){
					me.make_table_body_rows(r.message);
				}
			}
		});
	},
	append_lang_options: function(){
		var lang, name,
			option,
			template = $('<option></option>');
		this.wrapper.lang_selector.html('');
		for (name in this.langs){
			lang = this.langs[name];
			option = template.clone().val(lang).text(repl('[%(code)s] %(name)s', 
				{code: lang, name: name}));
			if (lang === this.current_lang){
				option.attr('selected', true);	
			}
			this.wrapper.lang_selector.append(option);
		}
	},
	update_translation_file: function(){
		wn.call({
			module: 'core',
			page: 'translation_tool',
			method: 'build_messages_files',
			callback: function(r){
				show_alert(wn._("Translation files are updated!"));
			}
		});
	},
	import_translation_file: function(){
		var args = {'language': this.current_lang, 'message': {}};
		if (this.current_doctype){
			args['doctype'] = this.current_doctype;
		}
		$('textarea', this.wrapper.content_table_body).each(function(){
			var e = $(this);
			args['message'][e.data()['phrase']] =  e.val();
		});
		console.log(args);
		wn.call({
			module: 'core',
			page: 'translation_tool',
			method: 'import_message_file',
			'args': args,
			callback: function(r){

			}
		})
	},
	create_new_language_file: function(){
		var me = this;
		if (!me.dialog){
			me.dialog = new wn.ui.Dialog({
				title: wn._('Make a new Language'),
				width: 350,
				fields: [
					{fieldtype: 'Data', fieldname: 'lang_code',
						label: wn_('Language code'), 
						description: wn._('See') +': <a href="http://pt.wikipedia.org/wiki/ISO_639">Wikipedia</a>',
						reqd: true
					},
					{fieldtype: 'Description', fieldname: 'lang_description',
						label: wn._('Description'),
						description: wn._('Describe preferably using whole native characters.'),
						reqd: true
					}
				]
			});
			me.dialog.fields_dict.add_button.input.onclick = function(){
				var lang_code = me.dialog.fields_dict.lang_code.get_value(),
					lang_description = me.dialog.fields_dict.lang_description.get_value();
				if (lang_code && lang_description){
					wn.call({
						module: 'core',
						page: 'translation_tool',
						method: 'create_new_language_file',
						args: {
							'language': lang_code, 
							'description': lang_description
						},
						callback: function(r){
							me.get_all_languages();
							show_alert(
								repl(
									wn._('New language %(lang_code)s - %(descr)s, as successful created'), 
									{lang_code: lang_code, descr: lang_description}
								)
							);
						}
					});
				}
			}
			me.dialog.clear();
			me.dialog.show();
		}
	}
});
