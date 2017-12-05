import logging
from openerp import http
from openerp.http import request
_logger = logging.getLogger(__name__)

class TestController(http.Controller):

    # redirect on this route when clcik on barcode.
    @http.route(['/test/web/'], type='http', auth='user')
    def order_barcode(self, debug=False, **args):
        if not request.session.uid:
            return http.local_redirect('/web/login?redirect=/test/web/')
        return request.render('js_test.order_test_index')
