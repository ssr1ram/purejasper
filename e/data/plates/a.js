function paradocJson(data) {
    console.log('x ' + JSON.stringify(data));
}

paradocJson({
    "plates": [
        {"label": "Two column", "source": "/data/plates/twocol.js"},
        {"label": "Three column", "source": "/data/plates/threecol.js"}
    ]
})

