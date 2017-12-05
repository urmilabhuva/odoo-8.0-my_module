
from openerp import models, fields, api, _
from openerp.exceptions import Warning

class DoPick(models.Model):
	_name = 'dopick.wizard'




	pick_ids = fields.Many2many(comodel_name='stock.picking', domain=[('state', '=', 'assigned')])

	# ref = fields.Many2one('stock.picking', 'name', )
	# partner = fields.Many2one('stock.picking', 'partner_id',)
	# status = fields.Many2one('stock.picking', 'state', )

	@api.multi
	def get_pick(self):
		
		picking_order_obj = self.env['picking.order']
		ref = ''
		vals = {}
		if not self.pick_ids:
			raise Warning(_('Please Select atleast one Picking'))
		for picking_id in self.pick_ids:
			picking_order_id = picking_order_obj.search([('id', '=', self._context.get('active_id', False))])
			ref = picking_order_id.reference and (str(picking_order_id.reference or '') + ', ' + picking_id.name) or picking_id.name
			if picking_order_id.picking_order_line_ids:
				for move in picking_id.move_lines:
					move.picking_id.picking_order_id = picking_order_id.id
					order_line_ids = self.env['picking.order.line'].search([('product_id','=',move.product_id.id), ('location_id','=',move.location_id.id), ('location_dest_id','=',move.location_dest_id.id), ('picking_order_id','=',picking_order_id.id)])
					if not order_line_ids:
						picking_order_id.write({'picking_order_line_ids' :  [(0, 0, {'product_id' : move.product_id.id, 'qty':  move.product_uom_qty, 'location_id': move.location_id.id,  'location_dest_id': move.location_dest_id.id})]})
					else:
						for line_id in order_line_ids:
							picking_order_id.write({'picking_order_line_ids' :  [(1, line_id.id, {'qty': line_id.qty + move.product_uom_qty}) ] })
			else:
				for move in picking_id.move_lines:
					move.picking_id.picking_order_id = picking_order_id.id
					picking_order_id.write({'picking_order_line_ids' :  [(0, 0, {'product_id' : move.product_id.id, 'qty':  move.product_uom_qty, 'location_id': move.location_id.id,  'location_dest_id': move.location_dest_id.id})]})
			picking_order_id.write({'reference':str(ref)})