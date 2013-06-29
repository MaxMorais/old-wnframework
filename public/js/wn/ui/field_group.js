// Copyright (c) 2012 Web Notes Technologies Pvt Ltd (http://erpnext.com)
// 
// MIT License (MIT)
// 
// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

wn.provide('wn.ui');

wn.ui.FieldGroup = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
	},
	make: function() {
		if(this.fields) {
			this.make_fields();
			if(!this.no_submit_on_enter)
				this.catch_enter_as_submit();
		}
	},
	first_button: false,
	make_fields: function() {
		$(this.body).css({padding:'25px'});
		this.fields_dict = {}; // reset
		for(var i=0; i< this.fields.length; i++) {
			var df = this.fields[i];
			if(!df.fieldname && df.label) {
				df.fieldname = df.label.replace(/ /g, '_').toLowerCase();
			}
			if(!df.fieldtype) df.fieldtype="Data";
			
			var div = $a(this.body, 'div', '', {margin:'6px 0px'})
			f = make_field(df, null, div, null);
			f.not_in_form = 1;
			f.dialog_wrapper = this.wrapper || null;
			this.fields_dict[df.fieldname] = f
			f.refresh();
			
			// first button primary ?
			if(df.fieldtype=='Button' && !this.first_button) {
				$(f.input).addClass('btn-info');
				this.first_button = true;
			}
		}
	},
	catch_enter_as_submit: function() {
		var me = this;
		$(this.body).find(':input[type="text"], :input[type="password"]').keypress(function(e) {
			if(e.which==13) {
				$(me.body).find('.btn-info:first').click();
			}
		})
	},
	get_input: function(fieldname) {
		var field = this.fields_dict[fieldname];
		return $(field.txt ? field.txt : field.input);
	},
	get_values: function() {
		var ret = {};
		var errors = [];
		for(var key in this.fields_dict) {
			var f = this.fields_dict[key];
			var v = f.get_parsed_value();

			if(f.df.reqd && !v) 
				errors.push(f.df.label + ' is mandatory');

			if(v) ret[f.df.fieldname] = v;
		}
		if(errors.length) {
			msgprint('<b>Please check the following Errors</b>\n' + errors.join('\n'));
			return null;
		}
		return ret;
	},
	get_value: function(key) {
		var f = this.fields_dict[key];
		return f && (f.get_parsed_value ? f.get_parsed_value() : null);
	},
	set_value: function(key, val){
		var f = this.fields_dict[key];
		if(f) {
			f.set_input(val);
		}
	},
	set_values: function(dict) {	
		for(var key in dict) {
			if(this.fields_dict[key]) {
				this.set_value(key, dict[key]);
			}
		}
	},
	clear: function() {
		for(key in this.fields_dict) {
			var f = this.fields_dict[key];
			if(f) {
				f.set_input(f.df['default'] || '');				
			}
		}
	},
});