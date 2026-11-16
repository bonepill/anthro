
(function(window) {

    var headers = [];
    var women = [];
    var men = [];
    var loaded = false;

    // Load a local text file.
    function loadTextFile(filename) {
        return fetch(filename)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error(
                        "Could not load " + filename +
                        " (HTTP " + response.status + ")"
                    );
                }
                return response.text();
            });
    }

    // Split a text file into lines, handling Windows and Unix endings.
    function parseRows(text) {
        var rows = text.split(/\r?\n/);
        // Remove the final empty line, if present.
        if (rows.length && rows[rows.length - 1] === "") {
            rows.pop();
        }
        return rows;
    }

    // PHP-compatible integer conversion.
    function toInteger(value) {
        var result = parseInt(value, 10);
        return isNaN(result) ? 0 : result;
    }

    // PHP-compatible floating-point conversion.
    function toFloat(value) {
        var result = parseFloat(value);
        return isNaN(result) ? 0 : result;
    }

    // CASE 1: Parse ANSUR measurement headers.
    function parseHeaders(text) {
        var lines = parseRows(text);
        var result = [];
        for (var i = 0; i < lines.length; i++) {
            if (!lines[i].trim()) {
                continue;
            }
            var fields = lines[i].split("\t");
            var label = (
                fields[4] && fields[4].trim() !== ""
            ) ? fields[4] : fields[3];
            var description = (
                fields[5] && fields[5].trim() !== ""
            ) ? fields[5] :
                "No further description available (yet).";

            result.push([
                toInteger(fields[0]),
                (label || "").trim(),
                (fields[1] || "").trim(),
                toInteger(fields[2]),
                description.trim()
            ]);
        }

        return result;
    }

    // Load all static ANSUR resources.
    function loadAllData() {
        return Promise.all([
            loadTextFile("ansur_headers.txt"),
            loadTextFile("ansur_women.txt"),
            loadTextFile("ansur_men.txt")
        ]).then(function(files) {
            headers = parseHeaders(files[0]);
            // Remove the column-header row, as PHP array_shift() does.
            women = parseRows(files[1]).slice(1);
            men = parseRows(files[2]).slice(1);
            loaded = true;
            return true;
        }).catch(function(error) {
            loaded = false;
            throw error;
        });
    }

    // Extract two selected measurements from a dataset.
    function extractData(rows, colX, colY, scaleX, scaleY) {
        var result = [];
        for (var i = 0; i < rows.length; i++) {
            var fields = rows[i].split("\t");
            var x = toInteger(fields[colX - 1]);
            var y = toInteger(fields[colY - 1]);
            // Reproduce the original PHP negative-value filtering.
            if (x < 0 || y < 0) {
                continue;
            }
            // ANSUR values are stored multiplied by their scale.
            // Divide to obtain the actual measurement.
            result.push([
                x / scaleX,
                y / scaleY
            ]);
        }
        return result;
    }

    // CASE 1: Return parsed headers.
    function getHeaders() {
        if (!loaded) {
            throw new Error("ANSUR data not loaded");
        }
        return headers;
    }

    // CASE 3: Return selected ANSUR measurements.
    function getData(colX, colY, scaleX, scaleY) {
        if (!loaded) {
            throw new Error("ANSUR data not loaded");
        }
        var startTime = Date.now();
        colX = toInteger(colX);
        colY = toInteger(colY);
        scaleX = toInteger(scaleX);
        scaleY = toInteger(scaleY);
        if (
            colX < 1 || colY < 1 ||
            scaleX === 0 || scaleY === 0
        ) {
            throw new Error("Invalid measurement columns or scales");
        }
        var data1 = extractData(
            women, colX, colY, scaleX, scaleY
        );
        var data2 = extractData(
            men, colX, colY, scaleX, scaleY
        );
        return {
            time: Date.now() - startTime,
            col_1: colX,
            col_2: colY,
            size_1: data1.length,
            size_2: data2.length,
            data_1: data1,
            data_2: data2
        };
    }

    // CASE 2: Load an individual user's measurements.
    // User files must be available as static .txt files.
    function getUserData(name) {
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            return Promise.reject(
                new Error("Invalid user data filename")
            );
        }
        return loadTextFile(name + ".txt")
            .then(function(text) {
                var lines = parseRows(text);
                var data = [];
                for (var i = 0; i < lines.length; i++) {
                    var fields = lines[i].split("\t");
                    data.push(toFloat(fields[0]));
                }
                return {
                    data: data
                };
            });
    }

    // Public API.
    window.AnsurData = {
        load: loadAllData,
        getHeaders: getHeaders,
        getData: getData,
        getUserData: getUserData
    };
})(window);
