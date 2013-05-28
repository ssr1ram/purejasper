t = require('./threecol.jade')

window.Paradoc._para =
    data: {hello: 'world'}
    html: (data) ->
        return t({data: this.data})
    showview: Backbone.View.extend
        initialize: ->
            if not this.model
                this.model = new Backbone.Model(this.data)
            @render()
        render: ->
            $(this.el).html(t({
                data: this.model.toJSON()
            }))
            $(this.options.parent).html(this.el)

    editview: Backbone.View.extend
        initialize: ->
            if not this.model
                this.model = new Backbone.Model(this.data)
            @render()
        render: ->
            $(this.el).html(t({
                data: this.model.toJSON()
            }))
        getModel: (contents) ->
            this.model.set("contents", contents)
            return this.model


