/*
Marionette.Viewtag
Enhance Marionette.js with a declarative way to instantiate views
*/


// By default, Underscore uses ERB-style template delimiters, change the
// following template settings to use alternative delimiters.
_.templateSettings = {
  evaluate    : /<%([\s\S]+?)%>/g,
  interpolate : /<%=([\s\S]+?)%>/g,
  escape      : /<%-([\s\S]+?)%>/g,
  component   : /<cp-([\w-]+)([\s\w='"-]*)\/>|<cp-([\w-]+)([\s\w='"-]*)>([\w\W]*)<\/cp-([\w-]+?)>/g
};

// When customizing `templateSettings`, if you don't want to define an
// interpolation, evaluation or escaping regex, we need one that is
// guaranteed not to match.
var noMatch = /(.)^/;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var escapes = {
  "'":      "'",
  '\\':     '\\',
  '\r':     'r',
  '\n':     'n',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

var escapeChar = function(match) {
  return '\\' + escapes[match];
};

// JavaScript micro-templating, similar to John Resig's implementation.
// Underscore templating handles arbitrary delimiters, preserves whitespace,
// and correctly escapes quotes within interpolated code.
// NB: `oldSettings` only exists for backwards compatibility.
_.template = function(text, settings, oldSettings) {
  if (!settings && oldSettings) settings = oldSettings;
  settings = _.defaults({}, settings, _.templateSettings);

  // Combine delimiters into one regular expression via alternation.
  var matcher = RegExp([
    (settings.escape || noMatch).source,
    (settings.interpolate || noMatch).source,
    (settings.evaluate || noMatch).source,
    (settings.component || noMatch).source
  ].join('|') + '|$', 'g');

  // Compile the template source, escaping string literals appropriately.
  var index = 0;
  var source = "__p+='";
  text.replace(matcher, function(match, escape, interpolate, evaluate, component, componentAttr, componentOpen, componentAttr2, componentGuts, componentClose) {

    var args = Array.prototype.slice.call(arguments);
    var offset = args[args.length-2];

    source += text.slice(index, offset).replace(escaper, escapeChar);
    index = offset + match.length;

    if (escape) {
      source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
    } else if (interpolate) {
      source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
    } else if (evaluate) {
      source += "';\n" + evaluate + "\n__p+='";
    } else if (component != undefined) {
      source += injectComponent(component, componentAttr);
    } else if (!_.isUndefined(componentOpen) && componentOpen==componentClose) {
      source += injectComponent(componentOpen, componentAttr2, componentGuts);
    }

    // Adobe VMs need the match returned to produce the correct offest.
    return match;
  });
  source += "';\n";

  // If a variable is not specified, place data values in local scope.
  if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

  source = "var __t,__p='',__j=Array.prototype.join," +
    "print=function(){__p+=__j.call(arguments,'');};\n" +
    source + 'return __p;\n';

  try {
    var render = new Function(settings.variable || 'obj', '_', source);
  } catch (e) {
    e.source = source;
    throw e;
  }

  var template = function(data) {
    return render.call(this, data, _);
  };

  // Provide the compiled source as a convenience for precompilation.
  var argument = settings.variable || 'obj';
  template.source = 'function(' + argument + '){\n' + source + '}';

  return template;
};


var injectComponent = function(component, attributes, transclusion){
  var transclusion = transclusion || ""
    , id           = "data-component-tmp-"+_.uniqueId('component');

  return  "<cp-"+component+" "+id+" "+attributes+">".replace(escaper, escapeChar)
        + "';\n " +  "componentLoader(this, '"+component+"', '"+id+"', '"+transclusion+"');" + "\n__p+='"
        + "</cp-"+component+">".replace(escaper, escapeChar);
}

var componentLoader = function(view, tagName, uniqueAttr, transclusion, scope) {
  if (scope == null) {
    scope = window;
  }
  return _.delay(function() {
    var $el, classArr, component, componentClass, e, obj;
    classArr = _.map(tagName.split('-'), function(name) {
      return name.charAt(0).toUpperCase() + name.substring(1);
    });
    try {
      componentClass = _.reduce(classArr, function(memo, item) {
        return memo[item];
      }, scope);
    } catch (_error) {
      e = _error;
      throw 'Fail to find class "' + classArr.join('.') + '"';
    }

    $el = view.$el.find('[' + uniqueAttr + ']');
    obj = _.reduce($el.data(), function(memo, string, key) {
      memo[key] = view[string];
      return memo;
    }, {});

    component = new componentClass(_.extend(obj, {
      el           : $el,
      parentView   : view,
      transclusion : transclusion
    }));

    $el.data('component', component);

    $el.on('remove', function() {
      component.destroy();
    });

    component.on('render', function() {
      component.$el.find('cp-transclude').replaceWith(_.template(transclusion).call(component));
      return component.$el.removeAttr(uniqueAttr);
    });

    return component.render();
  }, 0);
}

Marionette.Renderer.render = function(template, data, view) {
  if (!template) {
    throw new Marionette.Error({
      name: 'TemplateNotFoundError',
      message: 'Cannot render the template since its false, null or undefined.'
    });
  }

  var templateFunc = _.isFunction(template) ? template : Marionette.TemplateCache.get(template);

  return templateFunc.call(view, data);
};
