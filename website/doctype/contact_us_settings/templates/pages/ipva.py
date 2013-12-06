#!/usr/bin/python
#-*- coding: utf-8 -*-

from __future__ import unicode_literals

__author__ = "Maxwell Morais github.com/MaxMorais"

###############################################################################
# 																			  #
# Copyright (C) 2013 Maxwell Morais (i.am.maxy)								  #
# 																			  #
# This program is free software: you can redistribute it and/or modify        #
# it under the terms of the GNU Affero General Public License as published by #
# the Free Software Foundation, either version 3 of the License, or 		  #
# (at your option) any later version. 										  #
# 																			  #
# This program is distributed in the hope that it will be useful, 			  #
# but WITHOUT ANY WARRANTY; without even the implied warranty of 			  #
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 				  #
# GNU Affero General Public License for more details. 						  #
# 																			  #
# You should have received a copy of the GNU Affero General Public License    #
# along with this program. If not, see <http://www.gnu.org/licenses/>.        #
###############################################################################

import webnotes

territories = {
	'Barra Funda': {
		'Address Line 1': 'Av. Marquês de São Vicente, 587',
		'Address Line 2': 'Barra Funda',
		'City': 'São Paulo',
		'ZipCode': '01139-001',
		'Phones': ['(11) 3392-5850'],
		'manager': 'jose.eduardo@realizemodulados.com.br'
	},
	'City Lapa': {
		'Address Line 1': 'Av. Pio XI, 665',
		'Address Line 2': 'City da Lapa',
		'City': 'São Paulo',
		'ZipCode': '05060-000',
		'Phones': ['(11) 2738-4777'],
		'manager': 'aline.cestary@realizemodulados.com.br'
	},
	'Freguesia do Ó': {
		'Address Line 1': 'Av. Miguel Conejo, 1.137',
		'Address Line 2': 'Freguesia do Ó',
		'City': 'São Paulo',
		'ZipCode': '02731-060',
		'Phones': ['(11) 3774-1137'],
		'manager': 'catiaalvares@realizemodulados.com.br'
	},
	'Guarulhos': {
		'Address Line 1': 'Av. Timóteo Penteado, 1.673',
		'Address Line 2': 'Vila Galvão',
		'City': 'Guarulhos',
		'ZipCode': '07094-000',
		'Phones': ['(11) 2086-2489'],
		'manager': 'claudio@realizemodulados.com.br'
	}, 
	'Itaberaba': {
		'Address Line 1': 'Av. Itaberaba, 2.535',
		'Address Line 2': 'Freguesia do Ó',
		'City': 'São Paulo',
		'ZipCode': '02739-000',
		'Phones': ['(11) 2613-2535'],
		'manager': 'carlos.adriano@realizemodulados.com.br'
	},
	'Lar Center': {
		'Address Line 1': 'Av. Otto Baumgart, 500',
		'Address Line 2': 'Lj: 315A - Piso Superior - Vila Guilherme',
		'City': 'São Paulo',
		'ZipCode': '02049-000',
		'Phones': ['(11) 2221-0249', '(11) 2221-0250'],
		'manager': 'kassem.mohamad@realizemodulados.com.br'
	},
	'Limão': {
		'Address Line 1': 'Av. Inajar de Souza, 263',
		'Address Line 2': 'Bairro do Limão',
		'City': 'São Paulo',
		'ZipCode': '02717-000',
		'Phones': ['(11) 2737-1263'],
		'manager': 'natalia@realizemodulados.com.br'
	},
	'Perdizes': {
		'Address Line 1': 'Av. Pompéia, 2.021',
		'Address Line 2': 'Perdizes',
		'City': 'São Paulo',
		'ZipCode': '05023-001',
		'Phones': ['(11) 2478-0068', '(11) 2478-0048'],
		'manager': 'eduardo@realizemodulados.com.br'
	},
	'Pompéia': {
		'Address Line 1': 'Av. Pompéia, 249',
		'Address Line 2': 'Pompéia',
		'City': 'São Paulo',
		'ZipCode': '05023-000',
		'Phones': ['(11) 3467-6607'],
		'manager': 'fernando@realizemodulados.com.br'
	},
	'Santana': {
		'Address Line 1': 'Av. Nova Cantareira, 806',
		'Address Line 2': 'Santana',
		'City': 'São Paulo',
		'ZipCode': '02330-001',
		'Phones': ['(11) 2950-1046'],
		'manager': 'paolla.spadari@realizemodulados.com.br'

	}, 
	'Shopping D': {
		'Address Line 1': 'Av. Cruzeiro do Sul, 1.100',
		'Address Line 2': 'Piso: 1 - Lj: 1200 - Pari',
		'City': 'São Paulo',
		'ZipCode': '03033-020',
		'Phones': ['(11) 3227-7897'],
		'manager': 'felipe.victorino@realizemodulados.com.br'
	}
} 

def get_message(**args):
	import os
	from jinja2 import Template
	template = ''
	with open(os.path.join(os.path.dirname(__file__), 'ipva.html'), 'r') as tfile:
		template = Template(tfile.read()).render(**args)
	return template

def create_subscription(args):
	d = webnotes.new_bean('Campaign Subscriber')
	d.doc.fields.update({
		'subscriber_name': args.get('name'),
		'phone': args.get('phone'),
		'email': args.get('email'),
		'territory': args.get('territory'),
		'parent': 'IPVA 2014',
		'parenttype': 'Campaign',
		'parentfield': 'subscribers_list'
	})
	d.save()

@webnotes.whitelist(allow_guest=True)
def subscribe(args):
	args = webnotes.load_json(args);
	tinfo = territories.get(args.get('territory'), {})
	recipientes = [
		args.get('email'),
		'andre@gruporealizemoveis.com.br',
		tinfo.get('manager'),
	]

	create_subscription(args)

	message = get_message(tinfo=tinfo, **args)
	from webnotes.utils.email_lib import sendmail
	sendmail(
		recipientes,
		msg=message,
		subject='Cupom IPVA 2014',
	)

	webnotes.response.status = 'Okay'

	return "Cupom Enviado!"