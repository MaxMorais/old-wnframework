# Copyright 2013 Web Notes Technologies Pvt Ltd
# License: MIT. See license.txt

from __future__ import unicode_literals
import webnotes, json

@webnotes.whitelist()
def get_data(module, doctypes='[]'):
	doctypes = json.loads(doctypes)
	return {
		"reports": get_report_list(module),
		"item_count": get_count(doctypes)
	}
	
def get_count(doctypes):
	count = {}
	for d in doctypes:
		count[d] = get_doctype_count_from_table(d)
	return count

def get_doctype_count_from_table(doctype):
	try:
		count = webnotes.conn.sql("""select count(*) from `tab%s`""" % doctype)[0][0]
	except Exception, e:
		if e.args[0]==1146: 
			count = None
		else: 
			raise e
	return count

def get_doctype_count(doctype):
	count = webnotes.conn.get_global("item_count:" + doctype)
	if count is None:
		count = get_doctype_count_from_table(doctype)
		webnotes.conn.set_global("item_count:" + doctype, count)
	return count
	
def get_report_list(module):
	"""return list on new style reports for modules"""	
	return webnotes.conn.sql("""
		select distinct tabReport.name, tabReport.ref_doctype as doctype, 
			if((tabReport.report_type='Query Report' or 
				tabReport.report_type='Script Report'), 1, 0) as is_query_report
		from `tabReport`, `tabDocType`
		where tabDocType.module=%s
			and tabDocType.name = tabReport.ref_doctype
			and tabReport.docstatus in (0, NULL)
			and ifnull(tabReport.is_standard, "No")="No"
			and ifnull(tabReport.disabled,0) != 1
			order by tabReport.name""", module, as_dict=True)