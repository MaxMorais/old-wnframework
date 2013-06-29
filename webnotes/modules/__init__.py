# Copyright (c) 2012 Web Notes Technologies Pvt Ltd (http://erpnext.com)
# 
# MIT License (MIT)
# 
# Permission is hereby granted, free of charge, to any person obtaining a 
# copy of this software and associated documentation files (the "Software"), 
# to deal in the Software without restriction, including without limitation 
# the rights to use, copy, modify, merge, publish, distribute, sublicense, 
# and/or sell copies of the Software, and to permit persons to whom the 
# Software is furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in 
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
# CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
# OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
# 

from __future__ import unicode_literals
"""
	Utilities for using modules
"""
import webnotes, os, conf

lower_case_files_for = ['DocType', 'Page', 'Report', 
	"Workflow", 'Module Def', 'Desktop Item', 'Workflow State', 'Workflow Action']

def scrub(txt):
	return txt.replace(' ','_').replace('-', '_').replace('/', '_').lower()

def scrub_dt_dn(dt, dn):
	"""Returns in lowercase and code friendly names of doctype and name for certain types"""
	ndt, ndn = dt, dn
	if dt in lower_case_files_for:
		ndt, ndn = scrub(dt), scrub(dn)

	return ndt, ndn
			
def get_module_path(module):
	"""Returns path of the given module"""
	m = scrub(module)
	
	app_path = os.path.dirname(conf.__file__)
	
	if m in ('core'):
		return os.path.join(app_path, 'lib', 'core')
	else:
		return os.path.join(app_path, 'app', m)

def get_doc_path(module, doctype, name):
	dt, dn = scrub_dt_dn(doctype, name)
	return os.path.join(get_module_path(module), dt, dn)

def reload_doc(module, dt=None, dn=None, force=True):
	from webnotes.modules.import_file import import_files
	return import_files(module, dt, dn, force)

def export_doc(doctype, name, module=None):
	"""write out a doc"""
	from webnotes.modules.export_file import write_document_file
	import webnotes.model.doc

	if not module: module = webnotes.conn.get_value(doctype, name, 'module')
	write_document_file(webnotes.model.doc.get(doctype, name), module)

def get_doctype_module(doctype):
	return webnotes.conn.get_value('DocType', doctype, 'module')