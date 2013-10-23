#!/usr/bin/python
#-*- coding: utf-8 -*-

from __future__ import unicode_literals
__author__ = "Maxwell Morais github.com/MaxMorais"

###############################################################################
# 																			  #
# Copyright (C) 2013 Maxwell Morais (i.am.maxy)								  #
#																			  #	
# For license information, please see license.txt							  #
###############################################################################

import os
import webnotes
from webnotes import translate
from webnotes.utils import get_base_path
from webnotes.modules import get_doctype_module, get_doc_path
from json import loads

@webnotes.whitelist(allow_roles=['System Manager', 'Administrator'])
def get_all_languages():
	return translate.get_all_languages()

@webnotes.whitelist(allow_roles=['System Manager', 'Administrator'])
def get_lang_dict():
	return translate.get_lang_dict()

@webnotes.whitelist(allow_roles=['System Manager', 'Administrator'])
def get_lang_namespace():
	namespace = webnotes._dict({
		'modules': [],
		'doctypes': {},
	})
	modules_list =  webnotes.conn.sql('SELECT module_name from `tabModule Def` ORDER BY module_name ASC', as_dict=True)
	for module in modules_list:
		module = module['module_name']
		namespace.modules.append(module)		
		namespace.doctypes[module] = []
		doctypes = webnotes.conn.sql('SELECT name FROM `tabDocType` where module="%s"'%module, as_dict=True)
		for doctype in doctypes:
			namespace.doctypes[module].append(doctype['name'])

	return namespace

@webnotes.whitelist(allow_roles=['System Manager', 'Administrator'])
def get_filtered_messages(language, doctype=None):
	out_file = os.path.join(get_base_path(), "%s_temp"%language)
	if not doctype:
		translate.export_messages(language, out_file)
	else:
		module = get_doctype_module(doctype);
		basedir = get_doc_path(module, 'DocType', doctype)
		translate.export_messages(language, out_file, basedir)

	messages = translate.get_all_messages_from_file(out_file)
	os.unlink(out_file)
	return messages;

@webnotes.whitelist(allow_roles=['System Manager', 'Administrator'])
def build_message_files():
	translate.build_message_files()

@webnotes.whitelist(allow_roles=['System Manager', 'Administrator'])
def import_message_file(language, message, doctype=None):
	outfile = os.path.join(get_base_path(), "%s_temp"%language)
	message = loads(message)
	def write_file():
		from csv import writer
		with open(outfile, 'w') as msgfile:
			w = writer(msgfile)
			keys = message.keys()
			keys.sort()
			for m in keys:
				w.writerow([m.encode('utf-8'), message.get(m, '').encode('utf-8')])

	write_file()

	if doctype is not None:
		module = get_doctype_module(doctype)
		basedir = get_doc_path(module, 'DocType', doctype);
		translate.import_messages(language, outfile, basedir)
	else:
		translate.import_messages(language, outfile)

	os.unlink(outfile)
