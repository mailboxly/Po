import os;
import bottle;

### Constants ::::::::::::::::::::::::::::::::::::::::::::::

IS_PA = True if "PA_REPO_DIR" in os.environ else False;
REPO_DIR = os.environ.get("PA_REPO_DIR", os.path.abspath("."));


### Globals ::::::::::::::::::::::::::::::::::::::::::::::::

request = bottle.request;
response = bottle.response;
staticFile = bottle.static_file;

app = bottle.Bottle();

### Routes :::::::::::::::::::::::::::::::::::::::::::::::::

@app.get("/")
def get_slash():
    return staticFile("index.html", REPO_DIR);

@app.get("/api/ping")
def get_api_ping():
    response.content_type = "application/json";
    response.set_header("Access-Control-Allow-Origin", "*");
    return {"status": "success"};

# Running on PA ::::::::::::::::::::::::::::::::::::::::::::
application = app;

# Running locally ::::::::::::::::::::::::::::::::::::::::::
if not IS_PA and __name__ == "__main__":
    app.run(port=8000, debug=True, reloader=True);
