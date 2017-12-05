import logging
from openerp import http
from openerp.http import request
_logger = logging.getLogger(__name__)

class PickingOrderBarcodeController(http.Controller):

    # redirect on this route when clcik on barcode.
    @http.route(['/picking_order/barcode/web/'], type='http', auth='user')
    def order_barcode(self, picking_id=None, debug=False, **args):
        if not request.session.uid:
            return http.local_redirect('/web/login?redirect=/barcode/web')
        return request.render('test_module.order_barcode_index')
