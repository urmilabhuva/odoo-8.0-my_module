
from openerp import models, fields, api, _



class PickedreportWizard(models.Model):
    _name = 'pick.wizard'
    _description = "Picked Order Wizard"

    # picking_order = fields.Many2many(comodel_name='picking.order')
    start_date = fields.Date(string='From')
    end_date = fields.Date(string='To')
    state = fields.Selection([('pending', 'Pending'), ('picked', 'Picked'), ('cancel', 'Cancelled')], string='Status', default='pending', required=True,  copy=False)

    
    @api.multi
    def print_product_detail(self):
        datas = {}
        data = self.read(['start_date', 'end_date', 'state'])
            
        start_date = data[0]['start_date']
        print start_date 
        end_date = data[0]['end_date']
        print end_date
        state = data[0]['state']

        print data

        obj = self.env['picking.order']
        print "======================",obj
        ids = obj.search([('state', '=', state), ('date', '>=', start_date), ('date', '<=', end_date)])
        print ids, ids.ids

        datas = {         
                    'ids': ids.ids,
                    'model': 'picking.order',
                    'form': data
                }
        print datas
        return{
            'type': 'ir.actions.report.xml',
            'report_name' : 'test_module.picking_order_action_wizard_report_template',
            'datas':datas,
        }
        
        