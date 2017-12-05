openerp.js_test = function(instance, local){
	var module = instance.js_test;
	var _t = instance.web._t;
		_lt = instance.web._lt;
	var Qweb = instance.web.qweb;


	console.log('Test');


	

	module.HomePage = instance.web.Widget.extend({
        start: function() {
        	console.log("pet store home page loaded");

          	var greeting = new module.GreetingsWidget(this, ["cpu", "mouse", "graphic card", "scrin", "monitor"], "#00FF00");
            greeting.appendTo(this.$el);
        },
    });

	module.GreetingsWidget = instance.web.Widget.extend({
		template: "GreetingsWidget",
		init: function(parent, products, color){
			this._super(parent);
			this.products = products;
			this.color = color;
			console.log('Test');
		},
		
	});


    instance.web.client_actions.add(
        'test.homepage', 'instance.js_test.HomePage');
}







