# Marionette.Viewtag

> Marionette.Component was taken...

Marionette.Viewtag exposes a declarative way to instantiate your views from your templates. All your existing views are already compatible, as long as there classes are accessible from the global scope (for now).

In a nutshell, any views are now link to a custom html tag. See for yourself:

```javascript
// Before, inside parentview.js, a common Marionette View (ItemView, CompositeView... whatever)
App.Views.ParentView = Marionette.ItemView.extend({
  template : _.template("<h1>Parent View</h1>"
  +"<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>"
  +"<div id='yoyo'></div>"),

  onRender: function() {
    (new App.Component.Yoyo({
      el       : this.$el.find('#yoyo'),
      model    : this.model,
      whatever : function() { console.log('oh yeah'); }
    })).render()
  }
});

// After, still inside parentview.js

App.Views.ParentView = Marionette.ItemView.extend({
  template : _.template("<h1>Parent View</h1>"
  +"<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>"
  +"<cp-app-views-yoyo data-model='model' data-whatever='ohYeah' />")

  ohYeah : function() {
    console.log('oh yeah');
  }
  // no more onRender, great !
```

### Declarative
The main fantastic thing is how you can by pass the boring and noisy way to create subviews. Embrace the efficiency provided by this declarative way, so much more closer to HTML.

At first, Marionette.Viewtag merely translates cp-app-views-yoyo into new App.Views.Yoyo

Note: every tags must starts with the prefix "cp-". It stands for component.

Oh, and guess what? You can play Russian Dolls with your Viewtags, nesting them inside each others.


### View - Subview relationship
The second fantastic thing is that you don't give away any of the Marionette awesomeness. This solution is tightly coupled to your favorite library, simply opening up a different way to work your templates out. The above subview gets instantiated with any data properties. This is your bridge.


### Transclusion
Marionette.Viewtag supports "transclusion". This weird title chosen by the AngularJS team lives to define the ability to nest content into your tag. The "wrapping" tag is given the responsability to pick where the nested tag will be injected.

You simply have to leave a <cp-transclude /> wherever you wish inside the Viewtag template.

```javascript
// subview.js
App.Views.SubView = Marionette.ItemView.extend({
  template : _.template("<h4>I am SubView</h1>"
  +"<p><%=someModelAttribute%></p>"
  +"<cp-transclude />")
});

App.Views.ParentView = Marionette.ItemView.extend({
  template : _.template("<h1>Parent View</h1>"
  +"<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>"
  +"<cp-app-views-yoyo data-model='model' data-whatever='ohYeah'>"
  +"<div>Just insert this wherever you want, I don't care as long as I'm inside the Yoyo.</div>"
  +"</cp-app-views-yoyo>")

  //...
});

```


### API

The Marionette Views that use tags to instantiate views can access the "Marionette view instance" through the "data-component" DOM property. For instance, from my parent view, I could do:
```javascript
var subview = this.$el.find('cp-subview').data('component');
subview.render(); // I re-render the view at will
```

Any view instantiated via a tag get access to its parent marionette view via ```@options.parentView```. Continuing our above scenario, assuming I'm executing the code below still within the parent view:
```javascript
subview.options.parentView === this; //true
```

Removing the DOM element where the component is injected triggers automatically the ```destroy``` method of the very view.
```javascript
// In order to destroy the subview, I could do subview.destroy(), or I could do:
this.$el.find('cp-subview').remove();
```

#### Next
Once feedback and thought aggregated, and curated, I'll add full tests coverage first. Then I see 2 possible ways: either it gets merged into the core Marionette.js framework, or I'll make available to the most famous Javascript package managers along with Bower (npm, components...).

Another thing I need to write down: some assets pipeline such as Sprockets (default Rails solution) uses some GEM to optimize the templates generation (it exposes a JST global variable with every matching templates compiled). The "challenge" here is that this gem(s) implements the _.template (underscore.js) into their respective language (Ruby :s in this instance). That would fairly easy to update, though anytime we wish to update our own implementation of _.template we'd need to update those related packages. We are to lazy to do that, right? So ideally we'd come up with a solution that won't require such work everytime. I wonder if there's any current strategy since Underscore is from time to time being updated...

#### Credit
We must thank [Practice Ignition](http://practiceignition.com) for initiating the work and using Marionette.Viewtag. Practice Ignition is a startup operating world wide with their dev team in Sydney, Australia.
