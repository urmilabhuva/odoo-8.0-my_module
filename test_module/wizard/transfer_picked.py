from openerp import models, fields, api, _

class PickTransfer(models.Model):
    _name = 'pick.transfer'

    qty = fields.Float(string='Quantity')
    original_qty = fields.Float(string='Quantity')
    product_id = fields.Many2one(comodel_name='product.product', string='Product')
    location_id = fields.Many2one(comodel_name="stock.location", string="Source Location")
    location_dest_id = fields.Many2one(comodel_name="stock.location", string="Destination Location")    
    picking_order_id = fields.Many2one(comodel_name='picking.order', string='Picking Order')
    transfer_id = fields.Many2one(comodel_name='order.transfer.details.wizard', string='Transfer ID')


class TransferPick(models.Model):
    _name='order.transfer.details.wizard'

    picking_order_detail_line_ids = fields.One2many(comodel_name='pick.transfer', inverse_name='transfer_id', string='Picking Order Detail')

    @api.model
    def default_get(self, fields):
        res = super(TransferPick, self).default_get(fields)
        picking_order_ids = self._context.get('active_ids', [])
        active_model = self._context.get('active_model')
        assert active_model in ('picking.order'), 'Bad context propagation'
        picking_order_ids = self.env['picking.order'].browse(picking_order_ids)
        items = []
        for op in picking_order_ids.picking_order_line_ids:
            items.append({'product_id': op.product_id.id, 'qty': op.qty, 'original_qty':op.qty, 'location_id': op.location_id.id, 'location_dest_id': op.location_dest_id.id})
        res.update(picking_order_detail_line_ids=items)
        return res

    @api.multi
    def transfer_order_products(self):
        ''' 
            Transfer selected picking order.
            Suppose picking order is not transfer with all quantity then create new picking order with remaining quantity. 
        '''
        picking_order_obj = self.env['picking.order']
        picking_id = picking_order_obj.browse(self._context.get('active_id'))
        if not self.picking_order_detail_line_ids:
            raise Warning(_('Without Order line you can not transfer.'))
        if picking_id:
            picking_order_dict = {}
            picking_order_line_list = []
            for product in self.picking_order_detail_line_ids:
                if product.qty > product.original_qty:
                    raise Warning(_("Transferred quantity should not be greater than original quantity."))
                if product.qty == product.original_qty:
                    picking_id.state = 'picked'
                else:
                    remaining_qty = product.original_qty - product.qty
                    picking_order_line_list.append((0,0,{'product_id':product.product_id.id, 'location_id': product.location_id.id, 'location_dest_id':product.location_dest_id.id, 'qty': remaining_qty or 1}))
                    picking_order_dict.update({
                        'state':'pending',
                        'reference' : picking_id.number + ', ',
                        'picking_order_line_ids': picking_order_line_list,
                        })
                    picking_id.write({'state':'picked'})
                    if picking_order_line_list and picking_order_dict:
                        picking_order_obj.create(picking_order_dict)

        
        





