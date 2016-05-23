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
import pymongo;

### Constants ::::::::::::::::::::::::::::::::::::::::::::::

IS_PA = True if "PA_REPO_DIR" in os.environ else False;
if IS_PA:
    REPO_DIR = os.environ["PA_REPO_DIR"];
    MONGO_URL = os.environ["PA_MONGO_URL"];
else:
    REPO_DIR = os.path.abspath(".");
    MONGO_URL = "mongodb://localhost:27017/localPo"

### Globals ::::::::::::::::::::::::::::::::::::::::::::::::

request = bottle.request;
response = bottle.response;
abort = bottle.abort;
redirect = bottle.redirect;
staticFile = bottle.static_file;

app = bottle.Bottle();

dbClient = pymongo.MongoClient(MONGO_URL);
db = dbClient[MONGO_URL.split("/")[-1]];

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

### Data format validators :::::::::::::::::::::::::::::::::

def validateSignup(reqData):
    # TODO
    username = reqData.get("username");
    mHash = reqData.get("mHash");
    hint = reqData.get("hint");
    email = reqData.get("email");
    return username, mHash, hint, email;

def validateLogin(reqData):
    # TODO
    username = reqData.get("username");
    mHash = reqData.get("mHash");
    return username, mHash;

### Routes :::::::::::::::::::::::::::::::::::::::::::::::::

@app.get("/")
def index():
    if IS_PA:
        return redirect("https://po.mailboxly.com/");
    return staticFile("index.html", REPO_DIR);

@app.get("/static/<filepath:path>")
def serveStatic(filepath):
    if IS_PA:
        return abort(404, "File does not exist.");
    return staticFile("static/" + filepath, REPO_DIR);

@app.get("/api-v0/ping")
@app.post("/api-v0/ping")
def ping():
    return {"status": "success"};

@app.post("/api-v0/signup")
def v0_signup():
    username, mHash, hint, email = validateSignup(request.forms);
    if db.userCol.find_one(username):
        return {"status": "fail", "reason": "Username not available."};
    db.userCol.insert_one({
        "_id": username,
        "mHash": mHash,
        "hint": hint,
        "email": email,
        "json": "{}"
    });
    return {"status": "success"};

@app.post("/api-v0/login")
def v0_login():
    username, mHash = validateLogin(request.forms);
    user = db.userCol.find_one({
        "_id": username,
        "mHash": mHash
    });
    if not user:
        return {"status": "fail", "reason": "Incorrect username or password."};
    return {"status": "success", "user": user};

# Running on PA ::::::::::::::::::::::::::::::::::::::::::::
application = app;

# Running locally ::::::::::::::::::::::::::::::::::::::::::
if not IS_PA and __name__ == "__main__":
    app.run(debug=True, reloader=True);
