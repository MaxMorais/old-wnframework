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
import webnotes

sql = webnotes.conn.sql

class DocType:
	def __init__(self, doc, doclist=[]):
		self.doc = doc
		self.doclist = doclist
	
	def validate(self):
		self.set_as_default()
		
		# clear the cache so that the new letter head is uploaded
		webnotes.clear_cache()
		
	def set_as_default(self):
		from webnotes.utils import set_default
		if not self.doc.is_default:
			if not sql("""select count(*) from `tabLetter Head` where ifnull(is_default,0)=1"""):
				self.doc.is_default = 1
		if self.doc.is_default:
			sql("update `tabLetter Head` set is_default=0 where name != %s",
				self.doc.name)
			set_default('letter_head', self.doc.name)

			# update control panel - so it loads new letter directly
			webnotes.conn.set_value('Control Panel', None, 'letter_head', self.doc.content)