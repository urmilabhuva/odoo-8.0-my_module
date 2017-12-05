# -*- coding: utf-8 -*-
{
    'name': "test",
    'summary': """ """,

    'description': """
        
    """,
    'author': 'OpenERP SA',
    'website': 'https://www.odoo.com/page/warehouse',
    'category': 'Warehouse Management',
    'version': '0.1',
    'depends': ['base_setup','stock', 'web',],
    'data': [
        'wizard/stock_pick.xml',
        'wizard/transfer_pick_wizard.xml',
        'wizard/picked_report_wizard.xml',
        'views/picking_ord_view.xml',
        'data/picking_order_sequence.xml',
        'report/picked_order_header.xml',
        'report/picked_report_wizard_action.xml',
        'views/pick_order_barcode_template.xml',

        
    ],
    'demo': [],
    'test': [],
    'images':['img/header.png',],
    
    
    'installable': True,
    'auto_install': False,
    'qweb' : ['static/src/xml/picking.xml'],
}
