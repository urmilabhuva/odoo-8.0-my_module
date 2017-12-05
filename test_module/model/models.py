# -*- coding: utf-8 -*-

from openerp import models, fields, api, _
# from openerp.exceptions import Warning, ValidationError
from datetime import datetime

class PickingOrder(models.Model):
    _name = 'picking.order'

    _rec_name = 'number'

    # number = fields.Char(string="Name")
    number = fields.Char(string="Number",  readonly=True)
    reference = fields.Char(string="Reference")
    state = fields.Selection([('pending', 'Pending'), ('picked', 'Picked'), ('cancel', 'Cancelled')], string='Status', default='pending', required=True,  copy=False)
    date = fields.Date(string='Date', default=lambda self: datetime.today().date())
    picking_order_line_ids = fields.One2many(comodel_name='picking.order.line', inverse_name='picking_order_id', string='Picking Ids', copy=False)
    # report_id = fields.One2many(comodel_name='picking.wizard', inverse_name='pick_id')

    
    @api.model
    def create(self, vals):

		'''
			Create Or assign auto sequence to number field.
		'''
		vals['number'] = self.env['ir.sequence'].next_by_code('picking.order.sequence')
		return super(PickingOrder, self).create(vals)

    @api.multi
    def button_cancel(self):
        ''' Update status of current record when click on cancel button '''
        self.state = 'cancel'
        stock_ids = self.env['stock.picking'].search([('picking_order_id', '=', self.id)])
        for stock_id in stock_ids:
            stock_id.picking_order_id = None

    @api.multi
    def open_barcode_interface(self):
        final_url="/picking_order/barcode/web/#action=picking_order.ui&picking_id="+str(self.ids[0])
        return {'type': 'ir.actions.act_url', 'url':final_url, 'target': 'self',}

    @api.model
    def create_picking_order(self, vals):
        if vals.get('picking_order_line_ids'):
            vals_data = {
                'picking_order_line_ids': vals.get('picking_order_line_ids')
                }
            vals.pop('picking_order_line_ids')
            picking_id = self.create(vals)
            picking_id.picking_order_line_ids = vals_data.get('picking_order_line_ids')
        picking_id = self.search([('number','=', vals.get('reference'))])
        picking_id.state= 'picked'
        return True





class PickingOrderLine(models.Model):
    _name = 'picking.order.line'

    qty = fields.Float(string='Quantity')
    product_id = fields.Many2one(comodel_name='product.product', string='Product')
    picking_order_id = fields.Many2one(comodel_name='picking.order', string='Picking Order')
    location_id = fields.Many2one(comodel_name="stock.location", string="Source Location")
    location_dest_id = fields.Many2one(comodel_name="stock.location", string="Destination Location")

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: