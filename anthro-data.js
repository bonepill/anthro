(function(window) {

    var headers = [];
    var women = [];
    var men = [];
    var loaded = false;

    function loadTextFile(filename) {
        return fetch(filename)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error(
                        "Could not load " + filename
                    );
                }
                return response.text();
            });
    }

    function parseRows(text) {
        return text.trim().split(/\r?\n/);
    }

    function loadAllData() {

        return Promise.all([
            loadTextFile("ansur_headers.txt"),
            loadTextFile("ansur_women.txt"),
            loadTextFile("ansur_men.txt")
        ]).then(function(files) {

            headers = parseHeaders(files[0]);
            women = parseRows(files[1]).slice(1);
            men = parseRows(files[2]).slice(1);

            loaded = true;

        });

    }

    function getHeaders() {
        return headers;
    }

    function getData(colX, colY, scaleX, scaleY) {

        if (!loaded) {
            throw new Error("ANSUR data not loaded");
        }

        return {
            data_1: extractData(
                women, colX, colY, scaleX, scaleY
            ),
            data_2: extractData(
                men, colX, colY, scaleX, scaleY
            )
        };

    }

    window.AnsurData = {
        load: loadAllData,
        getHeaders: getHeaders,
        getData: getData
    };

})(window);
