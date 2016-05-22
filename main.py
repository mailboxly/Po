"""
    Po: Password organizer, from Mailboxly.
    Copyright (C) 2016 CrispQ Information Technologies Pvt. Ltd.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
"""

import os;
import functools;
import bottle;

### Constants ::::::::::::::::::::::::::::::::::::::::::::::

IS_PA = True if "PA_REPO_DIR" in os.environ else False;
REPO_DIR = os.environ.get("PA_REPO_DIR", os.path.abspath("."));

### Globals ::::::::::::::::::::::::::::::::::::::::::::::::

request = bottle.request;
response = bottle.response;
abort = bottle.abort;
redirect = bottle.redirect;
staticFile = bottle.static_file;

app = bottle.Bottle();

### Plugins ::::::::::::::::::::::::::::::::::::::::::::::::

def plugin_forceHTTPS(oldFunc):
    def newFunc(*args, **kwargs):
        scheme = request.urlparts.scheme;
        path = request.urlparts.path;
        if IS_PA and scheme != "https":
            return abort(404, "Please connect securely over HTTPS.");
        return oldFunc(*args, **kwargs);
    return functools.update_wrapper(newFunc, oldFunc);
app.install(plugin_forceHTTPS);

def plugin_allowCORS(oldFunc):
    def newFunc(*args, **kwargs):
        response.set_header("Access-Control-Allow-Origin", "*");
        return oldFunc(*args, **kwargs);
    return functools.update_wrapper(newFunc, oldFunc);
app.install(plugin_allowCORS);

### Routes :::::::::::::::::::::::::::::::::::::::::::::::::

@app.get("/")
def index():
    if IS_PA:
        return redirect("https://po.mailboxly.com/");
    return staticFile("index.html", REPO_DIR);

@app.get('/static/<filepath:path>')
def serveStatic(filepath):
    if IS_PA:
        return abort(404, "File does not exist.");
    return staticFile("static/" + filepath, REPO_DIR);

@app.get("/api/ping")
@app.post("/api/ping")
def ping():
    return {"status": "success"};

# Running on PA ::::::::::::::::::::::::::::::::::::::::::::
application = app;

# Running locally ::::::::::::::::::::::::::::::::::::::::::
if not IS_PA and __name__ == "__main__":
    app.run(port=8000, debug=True, reloader=True);
