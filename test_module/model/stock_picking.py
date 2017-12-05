from openerp import models, fields, api, _

class PickOrder(models.Model):
	_inherit = 'stock.picking'


	picking_order_id = fields.Many2one(comodel_name='picking.order', string='Picking Order Selected', copy=False)