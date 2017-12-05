function openerp_picking_order_widgets(instance){

    var module = instance.test_module;
    var _t     = instance.web._t;
    var QWeb   = instance.web.qweb;

    module.MobileWidget = instance.web.Widget.extend({
        start: function(){
            if(!$('#oe-mobilewidget-viewport').length){
                $('head').append('<meta id="oe-mobilewidget-viewport" name="viewport" content="initial-scale=1.0; maximum-scale=1.0; user-scalable=0;">');
            }
            return this._super();
        },
        destroy: function(){
            $('#oe-mobilewidget-viewport').remove();
            return this._super();
        },
    });

    module.PickingOrderEditorWidget = instance.web.Widget.extend({
        template: 'PickingOrderEditorWidget',
        init: function(parent,options){
            this._super(parent,options);
            var self = this;
            this.rows = [];
            this.search_filter = "";
            jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
                return function( elem ) {
                    return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
                };
            });
        },
        get_rows: function(){
            var model = this.getParent();
            console.log(this.getParent());
            this.rows = [];
            var self = this;
            _.each( model.picking_order_line_ids, function(line_id){
                    self.rows.push({
                        cols: { 
                            // product: line_id.product_id,
                            product_id : line_id.product_id,
                            location_id : line_id.location_id[0],
                            location_dest_id : line_id.location_dest_id[0],
                            picking_line_id : line_id.id,
                            qty: line_id.qty,
                            container : '',
                            uom : line_id.product_id.product_uom_id,
                        },
                        classes: true,
                        picking_number : model.picking_order_ids[0].number,
                        picking_order_id : model.picking_order_ids[0].id,
                    });
            });
            //sort element by things to do, then things done, then grouped by packages
            group_by_container = _.groupBy(self.rows, function(row){
                return row.cols.container;
            });
            var sorted_row = [];
            if (group_by_container.undefined !== undefined){
                group_by_container.undefined.sort(function(a,b){return (b.classes === '') - (a.classes === '');});
                $.each(group_by_container.undefined, function(key, value){
                    sorted_row.push(value);
                });
            }

            $.each(group_by_container, function(key, value){
                if (key !== 'undefined'){
                    $.each(value, function(k,v){
                        sorted_row.push(v);
                    });
                }
            });

            return sorted_row;
        },
        renderElement: function(){
            var self = this;
            this._super();
            this.$('.oe_searchbox').keyup(function(event){
                self.on_searchbox($(this).val());
            });
            this.$('.oe_searchbox').focus(function(){
                self.getParent().barcode_scanner.disconnect();
            });
            this.$('.oe_searchbox').blur(function(){
                self.getParent().barcode_scanner.connect(function(ean){
                });
            })
            this.$('#js_select').change(function(){
                var selection = self.$('#js_select option:selected').attr('value');
                if (selection === "ToDo"){
                    self.getParent().$('.js_pick_pack').removeClass('hidden')
                    self.$('.js_pack_op_line.processed').addClass('hidden')
                    self.$('.js_pack_op_line:not(.processed)').removeClass('hidden')
                }
                else{
                    self.getParent().$('.js_pick_pack').addClass('hidden')
                    self.$('.js_pack_op_line.processed').removeClass('hidden')
                    self.$('.js_pack_op_line:not(.processed)').addClass('hidden')
                }
                self.on_searchbox(self.search_filter);
            });
            this.$('.js_plus').click(function(){
                var line_id = $(this).parent().find('.js_qty');
                if (line_id.val()){
                    line_id.val(parseInt(line_id.val()) + 1)
                }
                else{
                    line_id.val(1) 
                }
            });
            this.$('.js_minus').click(function(){
                var line_id = $(this).parent().find('.js_qty');
                if (line_id.val()  && line_id.val() > 0 ){
                    line_id.val(line_id.val() - 1)
                }
            });

            this.$('.js-picked-button').click(function(){
                var table_record = $('.js_op_table_todo').find('tbody').find('tr');
                var picking_order_data= []
                var qty_flag = true;
                if ( $('.js_qty').val() == 0){
                    alert('Transferred quantity can not greater then Zero');
                }
                _.each( table_record, function(tr_record){
                    if ($(tr_record).find('.original-qty').data('original-qty')  <  $(tr_record).find('.js_qty').val()){
                        qty_flag = false
                        alert("Transferred quantity can not greater then original quantity.");
                        return false;
                    }
                    else if($(tr_record).find('.original-qty').data('original-qty')  >  $(tr_record).find('.js_qty').val() ){
                        picking_order_data.push({
                            'location_dest_id':parseInt($(tr_record).find('.input_location_dest_id').data('location_dest-id')),
                            'location_id':parseInt($(tr_record).find('.input_location_id').data('location-id')),
                            'product_id':parseInt($(tr_record).find('.product-data-id').data('product_id-id')),
                            'qty' : parseInt($(tr_record).find('.original-qty').data('original-qty')  - $(tr_record).find('.js_qty').val()),
                        });
                    }
                });
                if(qty_flag){
                    var picking_order_data_dict = {
                        'reference': $('.picking_order_name').data('picking-number'),
                        'state':'pending',
                        'picking_order_line_ids': picking_order_data,
                    }
                    return new instance.web.Model('picking.order').call('create_picking_order', [picking_order_data_dict]).then(function(result_id){
                        $('.js_qty').val(0);
                    });
                }
            });
        },
        on_searchbox: function(query){
            //hide line that has no location matching the query and highlight location that match the query
            this.search_filter = query;
            var processed = ".processed";
            if (this.$('#js_select option:selected').attr('value') == "ToDo"){
                processed = ":not(.processed)";
            }
            if (query !== '') {
                this.$('.js_loc:not(.js_loc:Contains('+query+'))').removeClass('info');
                this.$('.js_loc:Contains('+query+')').addClass('info');
                this.$('.js_pack_op_line'+processed+':not(.js_pack_op_line:has(.js_loc:Contains('+query+')))').addClass('hidden');
                this.$('.js_pack_op_line'+processed+':has(.js_loc:Contains('+query+'))').removeClass('hidden');
            }
            //if no query specified, then show everything
            if (query === '') {
                this.$('.js_loc').removeClass('info');
                this.$('.js_pack_op_line'+processed+'.hidden').removeClass('hidden');
            }
            this.check_content_screen();
        },
        remove_blink: function(){
            this.$('.js_pack_op_line.blink_me').removeClass('blink_me');
        },
        blink: function(op_id){
            this.$('.js_pack_op_line[data-id="'+op_id+'"]').addClass('blink_me');
        },
        check_done: function(){
            var model = this.getParent();
            var self = this;
            var done = true;
            _.each( model.packoplines, function(packopline){
                if (packopline.processed === "false"){
                    done = false;
                    return done;
                }
            });
            return done;
        },
    });

    module.PickingOrderMenuWidget = module.MobileWidget.extend({
        template: 'PickingOrderMenuWidget',
        init: function(parent, params){
            this._super(parent,params);
            var self = this;
            $(window).bind('hashchange', function(){
                var states = $.bbq.getState();
                if (states.action === "stock.ui"){
                    self.do_action({
                        type:   'ir.actions.client',
                        tag:    'stock.ui',
                        target: 'current',
                    },{
                        clear_breadcrumbs: true,
                    });
                }
            });
            this.picking_types = [];
            this.loaded = this.load();
            this.scanning_type = 0;
            this.barcode_scanner = new module.BarcodeScanner();
            this.pickings_by_type = {};
            this.pickings_by_id = {};
            this.picking_search_string = "";
        },
        renderElement: function(){
            this._super();
            var self = this;
            this.$('.js_pick_quit').click(function(){ self.quit(); });
        },
        start: function(){
            this._super();
            var self = this;
            instance.webclient.set_content_full_screen(true);
            this.loaded.then(function(){
                self.renderElement();
            });
        },
        quit: function(){
            return new instance.web.Model("ir.model.data").get_func("search_read")([['name', '=', 'action_picking_type_form']], ['res_id']).pipe(function(res) {
                    window.location = '/web#action=' + res[0]['res_id'];
                });
        },
        destroy: function(){
            this._super();
            this.barcode_scanner.disconnect();
            instance.webclient.set_content_full_screen(false);
        },
    });
    openerp.web.client_actions.add('picking_order.menu', 'instance.test_module.PickingOrderMenuWidget');

    module.PickingOrderMainWidget = module.MobileWidget.extend({
        template: 'PickingOrderMainWidget',
        init: function(parent,params){
            this._super(parent,params);
            var self = this;
            $(window).bind('hashchange', function(){
                var states = $.bbq.getState();
                if (states.action === "stock.menu"){
                    self.do_action({
                        type:   'ir.actions.client',
                        tag:    'stock.menu',
                        target: 'current',
                    },{
                        clear_breadcrumbs: true,
                    });
                }
            });
            init_hash = $.bbq.getState();
            this.picking_type_id = init_hash.picking_type_id ? init_hash.picking_type_id:0;
            this.picking_id = init_hash.picking_id ? init_hash.picking_id:undefined;
            this.picking = null;
            this.pickings = [];
            this.packoplines = null;
            this.selected_operation = { id: null, picking_id: null};
            this.packages = null;
            this.barcode_scanner = new module.BarcodeScanner();
            this.locations = [];
            this.uls = [];
            if(this.picking_id){
                this.loaded =  this.load(this.picking_id);
            }else{
                this.loaded =  this.load();
            }

        },

        // load the picking data from the server. If picking_id is undefined, it will take the first picking
        // belonging to the category
        load: function(picking_id){
            var self = this;


            return new instance.web.Model('picking.order').call('read',[[parseInt(picking_id)], [], new instance.web.CompoundContext()]).then(function(result){
                self.picking_order_ids = result;
                self.picking = result; 
                var line =  self.picking_order_ids[0].picking_order_line_ids
                return new instance.web.Model('picking.order.line').call('read',[line, []]).then(function(result){
                    self.picking_order_line_ids = result
                });
            });

        },
        start: function(){
            this._super();
            var self = this;
            instance.webclient.set_content_full_screen(true);
            this.barcode_scanner.connect(function(ean){
                self.scan(ean);
            });

            this.$('.js_pick_quit').click(function(){ self.quit(); });
            this.$('.js_pick_prev').click(function(){ self.picking_prev(); });
            this.$('.js_pick_next').click(function(){ self.picking_next(); });
            this.$('.js_pick_menu').click(function(){ self.menu(); });
            // this.$('.js_reload_op').click(function(){ self.reload_pack_operation();});

            $.when(this.loaded).done(function(){
                self.picking_editor = new module.PickingOrderEditorWidget(self);
                self.picking_editor.replace(self.$('.oe_placeholder_picking_editor'));

                if( self.picking.id === self.pickings[0]){
                    self.$('.js_pick_prev').addClass('disabled');
                }else{
                    self.$('.js_pick_prev').removeClass('disabled');
                }

                if( self.picking.id === self.pickings[self.pickings.length-1] ){
                    self.$('.js_pick_next').addClass('disabled');
                }else{
                    self.$('.js_pick_next').removeClass('disabled');
                }
                if (self.picking.recompute_pack_op){
                    self.$('.oe_reload_op').removeClass('hidden');
                }
                else {
                    self.$('.oe_reload_op').addClass('hidden');
                }
                if (!self.show_pack){
                    self.$('.js_pick_pack').addClass('hidden');
                }

            }).fail(function(error) {console.log(error);});

        },
        refresh_ui: function(picking_id){
            var self = this;
            var remove_search_filter = "";
            if (self.picking.id === picking_id){
                remove_search_filter = self.$('.oe_searchbox').val();
            }
            return this.load(picking_id)
                .then(function(){
                    self.picking_editor.remove_blink();
                    self.picking_editor.renderElement();
                    if( self.picking.id === self.pickings[0]){
                        self.$('.js_pick_prev').addClass('disabled');
                    }else{
                        self.$('.js_pick_prev').removeClass('disabled');
                    }

                    if( self.picking.id === self.pickings[self.pickings.length-1] ){
                        self.$('.js_pick_next').addClass('disabled');
                    }else{
                        self.$('.js_pick_next').removeClass('disabled');
                    }
                });
        },
        menu: function(){
            $.bbq.pushState('#action=stock.menu');
            $(window).trigger('hashchange');
        },
        done: function(){
            var self = this;
            return new instance.web.Model('stock.picking')
                .call('action_done_from_ui',[self.picking.id, {'default_picking_type_id': self.picking_type_id}])
                .then(function(new_picking_ids){
                    if (new_picking_ids){
                        return self.refresh_ui(new_picking_ids[0]);
                    }
                    else {
                        return 0;
                    }
                });
        },
        picking_next: function(){
            for(var i = 0; i < this.pickings.length; i++){
                if(this.pickings[i] === this.picking.id){
                    if(i < this.pickings.length -1){
                        $.bbq.pushState('picking_id='+this.pickings[i+1]);
                        this.refresh_ui(this.pickings[i+1]);
                        return;
                    }
                }
            }
        },
        picking_prev: function(){
            for(var i = 0; i < this.pickings.length; i++){
                if(this.pickings[i] === this.picking.id){
                    if(i > 0){
                        $.bbq.pushState('picking_id='+this.pickings[i-1]);
                        this.refresh_ui(this.pickings[i-1]);
                        return;
                    }
                }
            }
        },
        quit: function(){
            this.destroy();
            return new instance.web.Model("ir.model.data").get_func("search_read")([['name', '=', 'action_picking_type_form']], ['res_id']).pipe(function(res) {
                    window.location = '/web#action=' + res[0]['res_id'];
                });
        },
        destroy: function(){
            this._super();
            // this.disconnect_numpad();
            this.barcode_scanner.disconnect();
            instance.webclient.set_content_full_screen(false);
        },
    });
    openerp.web.client_actions.add('picking_order.ui', 'instance.test_module.PickingOrderMainWidget');

    module.BarcodeScanner = instance.web.Class.extend({
        connect: function(callback){
            var code = "";
            var timeStamp = 0;
            var timeout = null;

            this.handler = function(e){
                if(e.which === 13){ //ignore returns
                    return;
                }

                if(timeStamp + 50 < new Date().getTime()){
                    code = "";
                }

                timeStamp = new Date().getTime();
                clearTimeout(timeout);

                code += String.fromCharCode(e.which);

                timeout = setTimeout(function(){
                    if(code.length >= 3){
                        callback(code);
                    }
                    code = "";
                },100);
            };

            $('body').on('keypress', this.handler);

        },
        disconnect: function(){
            $('body').off('keypress', this.handler);
        },
    });

}

openerp.test_module = function(openerp) {
    openerp.test_module = openerp.test_module || {};
    openerp_picking_order_widgets(openerp);
}